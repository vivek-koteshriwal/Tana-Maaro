import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: blockedUserId } = await params;

        if (blockedUserId === user.id)
            return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

        if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

        // Idempotent upsert — store as a document keyed by both IDs
        const docId = `${user.id}_${blockedUserId}`;
        await adminDb.collection("blocks").doc(docId).set({
            blockerId:     user.id,
            blockedUserId,
            createdAt:     new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Block user error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
