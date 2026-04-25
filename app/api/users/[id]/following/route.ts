import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: targetUserId } = await params;
        
        // Get following users from Firestore, cap at 100
        const following = await db.getFollowing(targetUserId) as any[];
        const topFollowing = following.slice(0, 100);

        return NextResponse.json(topFollowing);

    } catch (error) {
        console.error("Fetch Following Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
