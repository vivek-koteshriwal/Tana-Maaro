import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await db.findUserByEmail(email) as any;
        
        // Security best practice: Don't reveal if user exists
        if (!user) {
            return NextResponse.json({ message: "If an account exists, a reset link was sent." }, { status: 200 });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        // Save token to DB
        await db.updateUserByEmail(email, { resetToken, resetTokenExpiry });

        // Simulate sending email (MVP: just print the link to the terminal so we can click it)
        const host = req.headers.get("host");
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const resetUrl = `${protocol}://${host}/reset-password/${resetToken}`;
        
        console.log("\n=================================");
        console.log(`PASSWORD RESET REQUESTED FOR: ${email}`);
        console.log(`CLICK TO RESET: ${resetUrl}`);
        console.log("=================================\n");

        return NextResponse.json({ message: "If an account exists, a reset link was sent." }, { status: 200 });

    } catch (error: any) {
        console.error("Reset Password Request error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
