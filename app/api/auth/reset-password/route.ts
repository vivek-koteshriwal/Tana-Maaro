
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await db.findUserByResetToken(token) as any;
        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        // Update password and clear token
        await db.updateUser(user.id, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        });

        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
