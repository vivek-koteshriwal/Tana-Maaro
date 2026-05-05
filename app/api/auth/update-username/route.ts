import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { username, profileImage } = await req.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const normalizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        if (normalizedUsername.length < 3) {
            return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
        }

        // Check if username is already taken
        const existingUser = await db.findUserByUsername(normalizedUsername) as any;
        if (existingUser && existingUser.id !== authUser.id) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
        }

        // Update user in database
        await db.updateUser(authUser.id, {
            username: normalizedUsername,
            status: "active", // Mark as fully onboarded
            ...(profileImage ? { profileImage } : {}),
        });

        // Generate a new token with the updated username
        const appToken = signToken({
            id: authUser.id,
            email: authUser.email,
            username: normalizedUsername
        });

        // Update the auth cookie
        const cookieStore = await cookies();
        cookieStore.set("auth_token", appToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({
            success: true,
            username: normalizedUsername
        }, { status: 200 });

    } catch (error: any) {
        console.error("Update Username Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
