import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/battles/[id]/vote — cast a vote for a participant
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { votedForId } = await req.json();
        if (!votedForId) return NextResponse.json({ error: "votedForId is required" }, { status: 400 });

        const battle = await db.getBattleById(id);
        if (!battle) return NextResponse.json({ error: "Battle not found" }, { status: 404 });
        if (battle.status === "ended") return NextResponse.json({ error: "Battle has ended — voting closed" }, { status: 400 });
        if (battle.status === "upcoming") return NextResponse.json({ error: "Battle hasn't started yet" }, { status: 400 });

        // Can't vote for yourself
        if (votedForId === user.id) return NextResponse.json({ error: "You cannot vote for yourself" }, { status: 400 });

        // Voted-for user must be a participant
        if (!battle.participants?.includes(votedForId)) {
            return NextResponse.json({ error: "That user is not a participant in this battle" }, { status: 400 });
        }

        const vote = await db.castBattleVote(id, user.id, votedForId);
        return NextResponse.json({ success: true, vote }, { status: 201 });
    } catch (error: any) {
        if (error.message === "Already voted in this battle") {
            return NextResponse.json({ error: "You have already voted in this battle" }, { status: 409 });
        }
        console.error("Vote error:", error);
        return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
    }
}

// GET /api/battles/[id]/vote — check if current user has voted
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ hasVoted: false, vote: null });

        const vote = await db.getBattleVote(id, user.id);
        return NextResponse.json({ hasVoted: !!vote, vote: vote || null });
    } catch (error) {
        console.error("Vote check error:", error);
        return NextResponse.json({ hasVoted: false, vote: null });
    }
}
