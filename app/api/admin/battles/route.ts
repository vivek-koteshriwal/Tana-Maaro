import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";
import { DURATION_MS } from "@/lib/models/battle";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["college", "city", "creator", "memer"];

function evaluateStatus(
    battle: { status?: string; endTime?: string; startTime?: string } | null,
) {
    if (!battle || battle.status === "ended" || !battle.endTime || !battle.startTime) return battle;
    const now = Date.now();
    const status = now > new Date(battle.endTime).getTime() ? "ended"
        : now >= new Date(battle.startTime).getTime() ? "live" : "upcoming";
    return { ...battle, status };
}

export async function GET() {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

        const raw = await db.getBattles(undefined, 100);
        const battles = raw.map(evaluateStatus);
        return NextResponse.json(battles);
    } catch (error) {
        console.error("Admin battles GET error:", error);
        return NextResponse.json({ error: "Failed to fetch battles." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

        const body = await req.json();
        const { type, title, duration = "standard", startNow = true, startTime } = body;

        if (!type || !VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const durationMs = DURATION_MS[duration as keyof typeof DURATION_MS] || DURATION_MS.standard;
        const start = startNow ? new Date() : new Date(startTime || Date.now());
        const end   = new Date(start.getTime() + durationMs);

        const battle = await db.createBattle({
            title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Clash Arena`,
            type,
            status: startNow ? "live" : "upcoming",
            duration,
            startTime: start.toISOString(),
            endTime:   end.toISOString(),
        }) as { id: string; title: string };

        await db.createAuditLog({
            action: "battle_created",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: battle.id,
            targetType: "battle",
            details: `Battle "${battle.title}" (${type}) created`,
        });

        return NextResponse.json(battle, { status: 201 });
    } catch (error) {
        console.error("Admin battle create error:", error);
        return NextResponse.json({ error: "Failed to create battle." }, { status: 500 });
    }
}
