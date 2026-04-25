
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    hasPendingDeletionExpired,
    isBlockedLoginStatus,
} from "@/lib/account-deletion";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");

        if (!token) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const payload = verifyToken(token.value);
        if (!payload) {
            // Invalid token, clear it
            const response = NextResponse.json({ user: null }, { status: 200 });
            response.cookies.delete("auth_token");
            return response;
        }

        const user = await db.findUserById(payload.id) as any;

        if (!user) {
            const response = NextResponse.json({ user: null }, { status: 200 });
            response.cookies.delete("auth_token");
            return response;
        }

        if (hasPendingDeletionExpired(user)) {
            await db.finalizeAccountDeletion(payload.id);
            const response = NextResponse.json({ user: null }, { status: 200 });
            response.cookies.delete("auth_token");
            return response;
        }

        if (isBlockedLoginStatus(user.status)) {
            const response = NextResponse.json({ user: null }, { status: 200 });
            response.cookies.delete("auth_token");
            return response;
        }

        // Fire telemetry update asynchronously to avoid blocking the auth check
        if (user.status === "active") {
            Promise.resolve(db.updateLastActive(payload.id)).catch(err => console.error("Telemetry Ping Failed", err));
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                profileImage: user.profileImage,
                bio: user.bio,
                status: user.status || "active",
                scheduledDeletionAt: user.scheduledDeletionAt || null,
                deletionRequestedAt: user.deletionRequestedAt || null,
                deletionReason: user.deletionReason || null,
                deletionFeedback: user.deletionFeedback || null,
                reactivatedAt: user.reactivatedAt || null,
                showRealName: user.showRealName ?? true,
                usernameChangeCount: user.usernameChangeCount || 0,
                lastUsernameChange: user.lastUsernameChange || null
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
