import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import {
    isBlockedLoginStatus,
    isPublicUserVisible,
} from "@/lib/account-deletion";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: targetUserId } = await params;

        if (authUser.id === targetUserId) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        const currentUser = await db.findUserById(authUser.id) as any;
        if (!currentUser || !isPublicUserVisible(currentUser.status) || isBlockedLoginStatus(currentUser.status)) {
            return NextResponse.json({ error: "This account cannot follow users right now." }, { status: 403 });
        }

        const targetUser = await db.findUserById(targetUserId);
        if (!targetUser || !isPublicUserVisible((targetUser as any).status)) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const result = await db.toggleFollowUser(authUser.id, targetUserId);

        return NextResponse.json({
            success: true,
            isFollowing: result.isFollowing,
            followersCount: result.followersCount,
            followingCount: result.followingCount
        });

    } catch (error: any) {
        console.error("Follow error:", error);
        return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
    }
}
