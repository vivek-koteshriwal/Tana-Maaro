import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const event = await db.getEventById(id) as any;
        if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

        const updated = await db.updateEvent(id, body);

        await db.createAuditLog({
            action: "event_updated",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "event",
            details: `Event "${event.title}" updated`,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Admin event update error:", error);
        return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

        const { id } = await params;

        const event = await db.getEventById(id) as any;
        if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

        await db.deleteEvent(id);

        await db.createAuditLog({
            action: "event_deleted",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "event",
            details: `Event "${event.title}" in ${event.city} permanently deleted`,
        });

        return NextResponse.json({ message: "Event deleted." });
    } catch (error) {
        console.error("Admin event delete error:", error);
        return NextResponse.json({ error: "Failed to delete event." }, { status: 500 });
    }
}
