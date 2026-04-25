import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isPublicUserVisible } from "@/lib/account-deletion";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Find the original post to extract the `likedBy` array
        const post = await db.getPostById(id) as any;

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const likedByIds = post.likedBy || [];

        if (likedByIds.length === 0) {
            return NextResponse.json([]); // Explicitly zero likes, fast exit.
        }

        // Return highly optimized minimal metadata payload
        const rawUsers = await db.getUsersByIds(likedByIds);

        const safeUsers = rawUsers
            .filter((u: any) => isPublicUserVisible(u?.status))
            .map((u: any) => ({
                id: u.id || u._id?.toString(),
                name: u.name,
                username: u.username || u.handle,
                profileImage: u.profileImage,
            }));

        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error("Failed to fetch post likers:", error);
        return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    }
}
