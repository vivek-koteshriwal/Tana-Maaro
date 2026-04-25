import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

        const events = await db.getEvents();
        return NextResponse.json(events);
    } catch (error) {
        console.error("Admin events GET error:", error);
        return NextResponse.json({ error: "Failed to fetch events." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

        const body = await req.json();
        const { title, city, date, venue } = body;

        if (!title || !city || !date || !venue) {
            return NextResponse.json({ error: "title, city, date and venue are required." }, { status: 400 });
        }

        const event = await db.createEvent(body);

        await db.createAuditLog({
            action: "event_created",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: event.id,
            targetType: "event",
            details: `Event "${title}" created for ${city}`,
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Admin event create error:", error);
        return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
    }
}
