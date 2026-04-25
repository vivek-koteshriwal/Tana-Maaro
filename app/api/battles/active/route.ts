import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DURATION_MS } from "@/lib/models/battle";

const VALID_TYPES = ["college", "creator", "city", "memer", "meme"];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const host     = request.headers.get("host") || "localhost:3001";
    const protocol = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");

    if (!type || !VALID_TYPES.includes(type)) {
        return NextResponse.redirect(`${protocol}://${host}/events`);
    }

    const normalizedType = type === "meme" ? "memer" : type;

    try {
        const allBattles = await db.getBattles(normalizedType, 10);
        let activeBattle = allBattles.find((b: any) => b.status === "live" || b.status === "upcoming");

        if (!activeBattle) {
            // Auto-create a live battle for this type
            activeBattle = await db.createBattle({
                title: `${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)} Clash Arena`,
                type: normalizedType,
                status: "live",
                duration: "standard",
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + DURATION_MS.standard).toISOString(),
            });
        }

        return NextResponse.redirect(`${protocol}://${host}/battles/${activeBattle.id}`);
    } catch (err) {
        console.error("Active battle error:", err);
        return NextResponse.redirect(`${protocol}://${host}/battles`);
    }
}
