import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function evaluateStatus(battle: any) {
    if (!battle) return null;
    if (battle.status === "ended") return battle;
    const now   = Date.now();
    const start = new Date(battle.startTime).getTime();
    const end   = new Date(battle.endTime).getTime();
    const status = now > end ? "ended" : now >= start ? "live" : "upcoming";
    return { ...battle, status };
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const raw = await db.getBattleById(id);
        if (!raw) return NextResponse.json({ error: "Battle not found" }, { status: 404 });

        const battle = evaluateStatus(raw);

        // Auto-persist status change back to Firestore + declare winner
        if (battle && battle.status !== raw.status) {
            if (battle.status === "ended" && !battle.winnerId) {
                // Trigger winner declaration via leaderboard
                try {
                    const lbRes = await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/battles/${id}/leaderboard`
                    );
                    if (lbRes.ok) {
                        const lbData = await lbRes.json();
                        const top = lbData.leaderboard?.[0];
                        if (top?.userId) {
                            await db.declareBattleWinner(id, top.userId, top.username);
                            battle.winnerId = top.userId;
                            battle.winnerUsername = top.username;
                        } else {
                            await db.updateBattle(id, { status: "ended" });
                        }
                    }
                } catch (e) {
                    await db.updateBattle(id, { status: "ended" });
                }
            } else {
                await db.updateBattle(id, { status: battle.status });
            }
        }

        return NextResponse.json({ battle });
    } catch (err) {
        console.error("Battle fetch error:", err);
        return NextResponse.json({ error: "Failed to fetch battle" }, { status: 500 });
    }
}
