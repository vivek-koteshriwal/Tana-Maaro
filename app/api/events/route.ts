import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const city = req.nextUrl.searchParams.get("city") || undefined;
        const events = await db.getEvents(city ? decodeURIComponent(city) : undefined);
        return NextResponse.json(events);
    } catch (error) {
        console.error("Events fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}
