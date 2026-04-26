
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        const { name, email, password, username, dateOfBirth, city, profileImage } = await req.json();

        if (!name || !email || !password || !username || !dateOfBirth) {
            return NextResponse.json({ error: "Missing required fields completely." }, { status: 400 });
        }

        // --- Age Verification Enforcer (Strict 18+) ---
        const dobDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            age--; // Subtract a year if birthday hasn't occurred yet this year
        }

        if (age < 18) {
            return NextResponse.json({ error: "Access Denied: You must be at least 18 years old to join Tana Maaro." }, { status: 403 });
        }
        // ----------------------------------------------------------------

        // --- Rate Limiting Strategy (Max 5 requests / minute per IP) ---
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const rateLimitKey = `rate-limit:register:${ip}`;
        try {
            const requestCount = await redis.incr(rateLimitKey);
            if (requestCount === 1) {
                await redis.expire(rateLimitKey, 60); // 1 minute window
            }
            if (requestCount > 5) {
                return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
            }
        } catch (redisErr) {
            console.warn("Rate limit redis failure, bypassing check:", redisErr);
        }
        // ----------------------------------------------------------------

        const existingUser = await db.findUserByEmail(email) as any;
        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        // Extract Usernames rigorously and abort if Duplicate
        // We drop the random integer fallback since User specs dictate "One username = One Profile".
        const normalizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

        const existingUsername = await db.findUserByUsername(normalizedUsername) as any;
        if (existingUsername) {
            return NextResponse.json({ error: "Username is already taken. Please choose another one." }, { status: 409 });
        }

        const newUser = await db.createUser({
            name,
            email,
            password: hashedPassword,
            username: normalizedUsername,
            profileImage: profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            dateOfBirth: dobDate.toISOString(),
            city: city || "Unknown",
            status: "active"
        });

        // Create JWT
        const token = signToken({ id: newUser.id, email: newUser.email, username: newUser.username });

        // Set Cookie
        const response = NextResponse.json({
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                profileImage: newUser.profileImage
            }
        }, { status: 201 });

        (await cookies()).set("auth_token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
