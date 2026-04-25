import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!status || !["approved", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
        }

        const post = await db.getPostById(id, { includeHidden: true }) as any;
        if (!post) {
            return NextResponse.json({ error: "Post not found." }, { status: 404 });
        }

        const updated = await db.updatePost(id, {
            status,
            moderatedBy: admin.email || admin.id,
            moderatedAt: new Date().toISOString(),
        });

        await db.createAuditLog({
            action: `content_${status}`,
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "post",
            details: `Post by ${post.userName || post.userId} ${status}`,
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Admin content moderation error:", error);
        return NextResponse.json({ error: "Failed to update content status." }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { id } = await params;

        const post = await db.getPostById(id, { includeHidden: true }) as any;
        if (!post) {
            return NextResponse.json({ error: "Post not found." }, { status: 404 });
        }

        await db.deletePost(id);

        await db.createAuditLog({
            action: "content_deleted",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "post",
            details: `Post by ${post.userName || post.userId} permanently deleted`,
        });

        return NextResponse.json({ message: "Content permanently deleted." }, { status: 200 });
    } catch (error) {
        console.error("Admin content delete error:", error);
        return NextResponse.json({ error: "Failed to delete content." }, { status: 500 });
    }
}
