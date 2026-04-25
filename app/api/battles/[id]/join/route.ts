import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const battle = await db.getBattleById(id);
        if (!battle) return NextResponse.json({ error: "Battle not found" }, { status: 404 });
        if (battle.status === "ended") return NextResponse.json({ error: "Cannot join an ended battle" }, { status: 400 });

        if (!battle.participants?.includes(user.id)) {
            await db.joinBattle(id, user.id);
        }

        const updated = await db.getBattleById(id);
        return NextResponse.json({ success: true, participants: updated?.participants || [] });
    } catch (error) {
        console.error("Join Battle Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
