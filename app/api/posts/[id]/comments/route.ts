import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invalidateFeedCache } from "@/lib/feed-cache";
import { verifyAuth } from "@/lib/auth";
import {
    isBlockedLoginStatus,
    isPublicUserVisible,
} from "@/lib/account-deletion";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const comments = await db.getCommentsByPost(id);

        // Enrich comments with user data if needed, but db.getCommentsByPost already returns what we stored.
        // If we stored minimal data, we might need to fetch users.
        // Current implementation of createComment (in route POST below) stores userName/Avatar directly for simplicity 
        // OR we can join. Let's see what we store.

        return NextResponse.json(comments);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await verifyAuth(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        // The JWT exclusively tracks IDs for security scaling. Retrieve rich Metadata
        // from the database so the Comment displays proper Avatars and Text.
        const dbUser = await db.findUserById(user.id) as any;
        if (!dbUser) {
            return NextResponse.json({ error: "User identity compromised" }, { status: 401 });
        }

        if (!isPublicUserVisible(dbUser.status) || isBlockedLoginStatus(dbUser.status)) {
            return NextResponse.json({
                error: "This account cannot add comments right now.",
            }, { status: 403 });
        }

        const newComment = await db.createComment({
            postId: id,
            userId: dbUser.id || dbUser._id?.toString() || "",
            userName: dbUser.name || dbUser.username || "Anonymous",
            userHandle: dbUser.username || dbUser.handle || "",
            userAvatar: dbUser.profileImage || "",
            authorStatus: "active",
            content: content.trim(),
        });

        // Fetch post to get the author
        const post = await db.getPostById(id) as any;
        if (post && post.userId !== dbUser.id) {
            await db.createNotification({
                userId: post.userId,
                type: 'REPLY',
                actorId: dbUser.id,
                actorName: dbUser.name,
                actorAvatar: dbUser.profileImage,
                postId: id,
                message: `commented on your post.`
            });
        }

        await invalidateFeedCache();

        return NextResponse.json(newComment);
    } catch (error) {
        console.error("Comment error:", error);
        return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
    }
}
