import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// Map legacy `type` values to canonical `role` field
function resolveRole(type?: string, role?: string): "attendee" | "performer" {
    if (role === "performer" || role === "attendee") return role;
    if (type === "Roast Battle (Participant)" || type === "performer") return "performer";
    return "attendee";
}

export async function POST(req: Request) {
    try {
        const user = await verifyAuth(req);
        const body = await req.json();
        const { eventId, eventName, name, email, phone, city, type, role,
                youtubeChannel, tanamaroHandle, contentType, contentUrl } = body;

        if (!eventId || !name || !email || !phone) {
            return NextResponse.json({ error: "Missing required fields: eventId, name, email, phone" }, { status: 400 });
        }

        const resolvedRole = resolveRole(type, role);

        const registration = await db.registerForEvent({
            eventId,
            eventName: eventName || "General Registration",
            userId: user?.id,
            userName: name,
            email,
            phone,
            city: city || "",
            role: resolvedRole,
            // Performer-specific extras
            ...(resolvedRole === "performer" ? {
                youtubeChannel: youtubeChannel || "",
                tanamaroHandle: tanamaroHandle || "",
                contentType: contentType || "",
                contentUrl: contentUrl || "",
            } : {}),
        });

        return NextResponse.json(registration, { status: 201 });
    } catch (error: any) {
        console.error("Registration error:", error);
        if (error.message === "User already registered for this event") {
            return NextResponse.json({ error: "You are already registered for this event." }, { status: 409 });
        }
        return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }
}
