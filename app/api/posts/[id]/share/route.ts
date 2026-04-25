import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invalidateFeedCache } from "@/lib/feed-cache";
import { verifyAuth } from "@/lib/auth";
import {
    isBlockedLoginStatus,
    isPublicUserVisible,
} from "@/lib/account-deletion";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authentication gate
        const authPayload = await verifyAuth(req);
        if (!authPayload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Elevate payload natively from DB
        const user = await db.findUserById(authPayload.id) as any;
        if (!user) {
            return NextResponse.json({ error: "User identity missing" }, { status: 401 });
        }
        if (!isPublicUserVisible(user.status) || isBlockedLoginStatus(user.status)) {
            return NextResponse.json({ error: "This account cannot share posts right now." }, { status: 403 });
        }

        // Locate Original Post Target
        const originalPost = await db.getPostById(id) as any;
        if (!originalPost) {
            return NextResponse.json({ error: "Original Post not found" }, { status: 404 });
        }

        // Prevent inception (resharing a reshare drops origin metadata)
        // If they share a share, trace back to the actual origin so credit is preserved properly
        const originPostId = originalPost.sharedFromPostId || originalPost.id;
        const originUser = originalPost.sharedFromUser || {
            name: originalPost.userName || "Unknown",
            username: originalPost.username || originalPost.userHandle || "unknown", // Depending on DB payload mapping
            profileImage: originalPost.userAvatar // Best effort from denormalization if full query skipped
        };

        // Construct Reshare clone assigning it to current user
        const newShare = await db.createPost({
            userId: user.id || user._id.toString(),
            userName: user.name,
            userHandle: user.username || user.handle || "",
            userAvatar: user.profileImage || "",
            content: originalPost.content, // Cloned immutable post body
            image: originalPost.image, // Cloned multimedia payload
            authorStatus: "active",
            sharedFromPostId: originPostId,
            sharedFromUser: {
                name: originUser.name,
                username: originUser.username,
                profileImage: originUser.profileImage || null
            }
        });

        // Increment global Share statistic on source post
        await db.incrementShareCount(id);
        await invalidateFeedCache();

        return NextResponse.json(newShare);
    } catch (error) {
        console.error("Reshare error:", error);
        return NextResponse.json({ error: "Failed to process Reshare" }, { status: 500 });
    }
}
