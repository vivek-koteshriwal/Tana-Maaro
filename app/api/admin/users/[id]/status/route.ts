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

        if (!status || !["active", "deactivated", "suspended"].includes(status)) {
            return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
        }

        const user = await db.findUserById(id) as any;
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        let updated;
        if (status === "active" && user.status === "pending_deletion") {
            updated = await db.reactivateAccount(id);
        } else {
            updated = await db.updateUser(id, {
                status,
                ...(status === "active" ? { scheduledDeletionAt: null } : {}),
            });

            if (status === "deactivated") {
                await db.updateAuthoredContentStatus(id, "deactivated");
            }

            if (status === "active" && user.status === "deactivated") {
                await db.updateAuthoredContentStatus(id, "active");
            }
        }

        await db.createAuditLog({
            action: `user_status_changed_to_${status}`,
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "user",
            details: `User @${user.username} status changed from ${user.status} to ${status}`,
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Admin user status update error:", error);
        return NextResponse.json({ error: "Failed to update user status." }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { id } = await params;

        const user = await db.findUserById(id) as any;
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        await db.finalizeAccountDeletion(id);

        await db.createAuditLog({
            action: "user_deleted",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "user",
            details: `User @${user.username} (${user.email}) permanently deleted`,
        });

        return NextResponse.json({ message: "User permanently deleted." }, { status: 200 });
    } catch (error) {
        console.error("Admin user delete error:", error);
        return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
    }
}
