
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await db.findUserByEmail(email) as any;
        if (!user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({ message: "If that email exists, we sent a link." }, { status: 200 });
        }

        // Generate token
        const token = randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        // Save to DB
        await db.updateUser(user.id, { resetToken: token, resetTokenExpiry: expiry });

        // Send Email using official Mail Utility
        const { sendPasswordResetEmail } = await import("@/lib/mail");
        await sendPasswordResetEmail(email, token);

        return NextResponse.json({ message: "If that email exists, we sent a password reset link." }, { status: 200 });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
