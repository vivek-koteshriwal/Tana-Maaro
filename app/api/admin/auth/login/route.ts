import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }

        // Look up user by email in Firestore
        const user = await db.findUserByEmail(email.toLowerCase().trim()) as any;
        if (!user) {
            return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
        }

        // Must have admin role
        if (user.role !== "admin") {
            return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
        }

        // Verify password against bcrypt hash
        const valid = await verifyPassword(password, user.passwordHash || user.password || "");
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
        }

        // Issue admin JWT
        const token = signToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: "admin",
        });

        const response = NextResponse.json({ success: true, name: user.name });

        // Set HTTP-only secure cookie
        response.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
    }
}
