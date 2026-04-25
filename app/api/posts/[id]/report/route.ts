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

        const { id } = await params;
        const { reason } = await req.json().catch(() => ({ reason: "inappropriate" }));

        if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

        await adminDb.collection("reports").add({
            postId: id,
            reportedBy: user.id,
            reason: reason || "inappropriate",
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Report post error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
