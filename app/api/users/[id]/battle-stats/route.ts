import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const stats = await db.getUserBattleStats(id);
        if (!stats) return NextResponse.json({ error: "User not found" }, { status: 404 });
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Battle stats error:", error);
        return NextResponse.json({ error: "Failed to fetch battle stats" }, { status: 500 });
    }
}
