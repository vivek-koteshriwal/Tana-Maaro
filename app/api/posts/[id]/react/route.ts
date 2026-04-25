import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { invalidateFeedCache } from "@/lib/feed-cache";
import { cookies } from "next/headers";

interface ReactedPostRecord {
    id: string;
    userId: string;
    likes: number;
    dislikes?: number;
    likedBy: string[];
    dislikedBy: string[];
}

interface ReactionUserRecord {
    id?: string;
    _id?: { toString(): string };
    name?: string;
    profileImage?: string;
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Params are now Promises in Next.js 15+
) {
    try {
        const { id } = await params;

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken(token.value);
        if (!payload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type } = await req.json(); // 'like' or 'dislike'

        if (!['like', 'dislike'].includes(type)) {
            return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
        }

        const userId = payload.id;

        // Get post
        // Note: We need a direct DB method to update arrays. 
        // Since db.ts is an abstraction over Mongoose/JSON, let's look at how to implement this.
        // For Mongoose it's straightforward with $addToSet / $pull.
        // For JSON it requires reading, modifying, writing.

        // We will implement a specific method in db.ts for this to keep it clean, 
        // OR we can do it here if we expose the models. 
        // Let's implement a 'toggleReaction' method in db.ts? 
        // Or just use 'updatePost' which we already check in db.ts.

        // Let's first fetch the post to see current state
        // Actually, let's implement a specialized method in db.ts because logic differs for JSON vs Mongo

        const updatedPost = await db.toggleReaction(id, userId, type) as ReactedPostRecord | null;

        if (!updatedPost) {
            return NextResponse.json({ error: "Post not found or update failed" }, { status: 404 });
        }

        // Generate Notification if it's a LIKE (and if the user liked it, not unliked it)
        // Since toggleReaction either adds or removes, we check if the userId is currently in likedBy
        if (type === 'like' && updatedPost.likedBy.includes(userId) && updatedPost.userId !== userId) {
            const dbUser = await db.findUserById(userId) as ReactionUserRecord | null;
            if (dbUser) {
                await db.createNotification({
                    userId: updatedPost.userId,
                    type: 'LIKE',
                    actorId: dbUser.id || dbUser._id?.toString() || userId,
                    actorName: dbUser.name,
                    actorAvatar: dbUser.profileImage,
                    postId: id,
                    message: `liked your post.`
                });
            }
        }

        await invalidateFeedCache();

        return NextResponse.json({
            success: true,
            likes: updatedPost.likes,
            dislikes: updatedPost.dislikes ?? (Array.isArray(updatedPost.dislikedBy) ? updatedPost.dislikedBy.length : 0),
            likedBy: updatedPost.likedBy,
            dislikedBy: updatedPost.dislikedBy
        }, { status: 200 });

    } catch (error) {
        console.error("Reaction error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
