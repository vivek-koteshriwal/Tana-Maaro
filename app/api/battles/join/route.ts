import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DURATION_MS } from "@/lib/models/battle";

const VALID_TYPES = ["college", "creator", "city", "memer"];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !VALID_TYPES.includes(type)) {
        return NextResponse.redirect(new URL("/events", request.url));
    }

    const callbackUrl = encodeURIComponent(`/api/battles/join?type=${type}`);

    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
    }

    try {
        const allBattles = await db.getBattles(type, 10);
        let activeBattle = allBattles.find((b: any) => b.status === "live" || b.status === "upcoming");

        if (!activeBattle) {
            activeBattle = await db.createBattle({
                title: `${type.charAt(0).toUpperCase() + type.slice(1)} Clash Arena`,
                type,
                status: "live",
                duration: "standard",
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + DURATION_MS.standard).toISOString(),
            });
        }

        // Auto-join
        if (!activeBattle.participants?.includes(user.id)) {
            await db.joinBattle(activeBattle.id, user.id);
        }

        return NextResponse.redirect(new URL(`/battles/${activeBattle.id}`, request.url));
    } catch (err) {
        console.error("Join battle redirect error:", err);
        return NextResponse.redirect(new URL("/battles", request.url));
    }
}
