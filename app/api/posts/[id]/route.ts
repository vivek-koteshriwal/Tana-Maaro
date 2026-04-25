import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invalidateFeedCache } from "@/lib/feed-cache";
import { verifyAdminAuth, verifyAuth } from "@/lib/auth";

type PostRecord = {
    id: string;
    userId?: string;
};

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const [user, adminUser] = await Promise.all([
            verifyAuth(req),
            verifyAdminAuth(),
        ]);
        if (!user && !adminUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const post = await db.getPostById(id, { includeHidden: !!adminUser }) as PostRecord | null;
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        if (!adminUser && user?.id !== post.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { content } = await req.json();

        if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

        await db.updatePost(id, { content: content.trim(), editedAt: new Date().toISOString() });
        await invalidateFeedCache();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Edit post error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const [user, adminUser] = await Promise.all([
            verifyAuth(req),
            verifyAdminAuth(),
        ]);
        if (!user && !adminUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const post = await db.getPostById(id, { includeHidden: !!adminUser }) as PostRecord | null;
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        if (!adminUser && user?.id !== post.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.deletePost(id);
        await invalidateFeedCache();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete post error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
