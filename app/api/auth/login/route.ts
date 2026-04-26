
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import {
    hasPendingDeletionExpired,
    isBlockedLoginStatus,
} from "@/lib/account-deletion";

export async function POST(req: Request) {
    try {
        const { email: identifier, password } = await req.json();

        if (!identifier || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Try to find user by email first
        let user = await db.findUserByEmail(identifier) as any;

        // Fallback: Try to find user by username if email lookup fails
        if (!user) {
            const normalizedUsername = identifier.replace('@', '').toLowerCase();
            user = await db.findUserByUsername(normalizedUsername) as any;
        }

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (hasPendingDeletionExpired(user)) {
            await db.finalizeAccountDeletion(user.id);
            return NextResponse.json({
                error: "This account has already been permanently deleted.",
            }, { status: 410 });
        }

        if (isBlockedLoginStatus(user.status)) {
            return NextResponse.json({
                error: "This account is not available for login. Contact support if you think this is a mistake.",
            }, { status: 403 });
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = signToken({ id: user.id, email: user.email, username: user.username });

        const response = NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                profileImage: user.profileImage,
                status: user.status || "active",
                scheduledDeletionAt: user.scheduledDeletionAt || null,
            }
        }, { status: 200 });

        (await cookies()).set("auth_token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
