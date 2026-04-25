import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const city = req.nextUrl.searchParams.get("city");
        if (!city) {
            return NextResponse.json({ error: "city param required" }, { status: 400 });
        }
        const stats = await db.getEventStats(decodeURIComponent(city));
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Event stats error:", error);
        return NextResponse.json({ registrationCount: 0 });
    }
}
