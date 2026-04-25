import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DURATION_MS } from "@/lib/models/battle";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["college", "city", "creator", "memer"];

function evaluateStatus(battle: any) {
    if (battle.status === "ended") return battle;
    const now   = Date.now();
    const start = new Date(battle.startTime).getTime();
    const end   = new Date(battle.endTime).getTime();
    const status = now > end ? "ended" : now >= start ? "live" : "upcoming";
    return { ...battle, status };
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type  = searchParams.get("type") || undefined;
        const limit = parseInt(searchParams.get("limit") || "50");

        const rawBattles = await db.getBattles(type, limit);
        const battles = rawBattles.map(evaluateStatus);

        const priority = (s: string) => s === "live" ? 0 : s === "upcoming" ? 1 : 2;
        battles.sort((a: any, b: any) => {
            const pd = priority(a.status) - priority(b.status);
            if (pd !== 0) return pd;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json(battles.slice(0, limit));
    } catch (err) {
        console.error("Battles GET error:", err);
        return NextResponse.json([], { status: 200 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, title, duration = "standard", startNow = true } = body;

        if (!type || !VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: `Invalid battle type. Must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const durationMs = DURATION_MS[duration as keyof typeof DURATION_MS] || DURATION_MS.standard;
        const startTime = startNow ? new Date() : new Date(body.startTime || Date.now());
        const endTime   = new Date(startTime.getTime() + durationMs);

        const battleData = {
            title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Clash Arena`,
            type,
            status: startNow ? "live" : "upcoming",
            duration,
            startTime: startTime.toISOString(),
            endTime:   endTime.toISOString(),
        };

        const battle = await db.createBattle(battleData);
        return NextResponse.json(battle, { status: 201 });
    } catch (err) {
        console.error("Create battle error:", err);
        return NextResponse.json({ error: "Failed to create battle" }, { status: 500 });
    }
}
