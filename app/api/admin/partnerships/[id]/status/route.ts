import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { status } = await req.json();
        const { id } = await params;

        if (!id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.updatePartnershipStatus(id, status);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Partnership status update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
