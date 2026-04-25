import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: targetUserId } = await params;
        const authUser = await verifyAuth(req);

        // Get followers from Firestore
        // We cap at 100 for performance and as per user request
        const followers = await db.getFollowers(targetUserId) as any[];
        const topFollowers = followers.slice(0, 100);

        // If authenticated, check for mutual followers
        let respData = topFollowers;
        if (authUser) {
            const myFollowingRaw = await db.getFollowing(authUser.id) as any[];
            const myFollowingIds = new Set(myFollowingRaw.map(u => u.id));
            
            respData = topFollowers.map(u => ({
                ...u,
                isMutual: myFollowingIds.has(u.id)
            }));
        }

        return NextResponse.json(respData);

    } catch (error) {
        console.error("Fetch Followers Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
