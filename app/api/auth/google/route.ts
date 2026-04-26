import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import {
    hasPendingDeletionExpired,
    isBlockedLoginStatus,
} from "@/lib/account-deletion";

export async function POST(req: Request) {
    try {
        const { token, user } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Missing authentication token" }, { status: 400 });
        }

        if (!adminAuth) {
            return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
        }

        // Verify Firebase Token securely on the backend
        const decodedToken = await adminAuth.verifyIdToken(token);

        if (!decodedToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const email = decodedToken.email;
        const uid = decodedToken.uid;
        const name = decodedToken.name || user?.displayName || "Google User";
        const profileImage = decodedToken.picture || user?.photoURL || "";

        if (!email) {
            return NextResponse.json({ error: "No email provided by Google" }, { status: 400 });
        }

        let needsUsername = false;
        // Retrieve or create User in Firestore by UID
        let dbUser = await db.findUserById(uid) as any;

        if (!dbUser) {
            // Check by email as fallback (if previously registered via other method)
            dbUser = await db.findUserByEmail(email) as any;
        }

        if (!dbUser) {
            // Generate a temporary unique username for new Google users
            const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;

            const newUser = {
                id: uid,
                name,
                email,
                googleId: uid,
                profileImage,
                username: username,
                bio: "Just joined Tanamaaro!",
                status: "pending_username" // Flag to prompt for username change
            };

            dbUser = await db.createUser(newUser);
            needsUsername = true;
        } else if (!dbUser.googleId) {
            // Link googleId if it wasn't linked (e.g. registered via phone but now logging with Google email)
            await db.updateUser(dbUser.id, { googleId: uid, profileImage: dbUser.profileImage || profileImage });
            dbUser = await db.findUserById(dbUser.id) as any;
        }

        if (hasPendingDeletionExpired(dbUser)) {
            await db.finalizeAccountDeletion(dbUser.id);
            return NextResponse.json({
                error: "This account has already been permanently deleted.",
            }, { status: 410 });
        }

        if (isBlockedLoginStatus(dbUser.status)) {
            return NextResponse.json({
                error: "This account is not available for login. Contact support if you think this is a mistake.",
            }, { status: 403 });
        }

        // If user status is pending, we still sign token so they are "partially" logged in to update profile
        if (dbUser.status === "pending_username") {
            needsUsername = true;
        }

        // Sign our own app JWT
        const appToken = signToken({ id: dbUser.id, email: dbUser.email, username: dbUser.username || "anon" });

        // Set secure HTTP-only cookie
        (await cookies()).set("auth_token", appToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({
            user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                username: dbUser.username,
                profileImage: dbUser.profileImage,
                status: dbUser.status || "active",
                scheduledDeletionAt: dbUser.scheduledDeletionAt || null,
            },
            needsUsername: needsUsername
        }, { status: 200 });

    } catch (error: any) {
        console.error("Google Auth Backend Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
