import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET() {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await db.getAllUsers();
        const posts = await db.getPosts(1, 1000);
        const registrations = await db.getRegistrations();

        return NextResponse.json({
            users,
            posts,
            registrations
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
