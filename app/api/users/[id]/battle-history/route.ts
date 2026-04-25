import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const battles = await db.getUserBattleHistory(id, 20);
        return NextResponse.json(battles);
    } catch (error) {
        console.error("Battle history error:", error);
        return NextResponse.json([], { status: 500 });
    }
}
