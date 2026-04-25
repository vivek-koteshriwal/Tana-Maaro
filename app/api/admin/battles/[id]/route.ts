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

        const battle = await db.getBattleById(id);
        if (!battle) return NextResponse.json({ error: "Battle not found." }, { status: 404 });

        // If ending the battle, trigger winner declaration
        if (body.status === "ended" && !battle.winnerId) {
            try {
                const lbRes = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/battles/${id}/leaderboard`
                );
                if (lbRes.ok) {
                    const lbData = await lbRes.json();
                    const top = lbData.leaderboard?.[0];
                    if (top?.userId) {
                        await db.declareBattleWinner(id, top.userId, top.username);
                        await db.createAuditLog({
                            action: "battle_ended",
                            adminId: admin.id,
                            adminEmail: admin.email,
                            targetId: id,
                            targetType: "battle",
                            details: `Battle "${battle.title}" ended. Winner: ${top.username}`,
                        });
                        return NextResponse.json(await db.getBattleById(id));
                    }
                }
            } catch (e) { /* fall through to normal update */ }
        }

        const updated = await db.updateBattle(id, body);

        await db.createAuditLog({
            action: "battle_updated",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "battle",
            details: `Battle "${battle.title}" updated: ${JSON.stringify(body)}`,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Admin battle update error:", error);
        return NextResponse.json({ error: "Failed to update battle." }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

        const { id } = await params;
        const battle = await db.getBattleById(id);
        if (!battle) return NextResponse.json({ error: "Battle not found." }, { status: 404 });

        // We can reuse deleteEvent-style: Firestore delete
        const firestore = (db as any).getBattleById; // Just call updateBattle to mark deleted
        await db.updateBattle(id, { status: "ended", deletedAt: new Date().toISOString() });

        await db.createAuditLog({
            action: "battle_deleted",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: id,
            targetType: "battle",
            details: `Battle "${battle.title}" marked as ended/deleted`,
        });

        return NextResponse.json({ message: "Battle ended." });
    } catch (error) {
        console.error("Admin battle delete error:", error);
        return NextResponse.json({ error: "Failed to delete battle." }, { status: 500 });
    }
}
