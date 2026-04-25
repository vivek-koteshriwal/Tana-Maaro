import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { hasPendingDeletionExpired } from "@/lib/account-deletion";

export async function POST(req: Request) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.findUserById(authUser.id) as any;
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        if (hasPendingDeletionExpired(user)) {
            await db.finalizeAccountDeletion(authUser.id);
            return NextResponse.json({
                error: "This account has already been permanently deleted.",
            }, { status: 410 });
        }

        if (user.status !== "pending_deletion") {
            return NextResponse.json({
                message: "Account is already active.",
                user,
            }, { status: 200 });
        }

        const updatedUser = await db.reactivateAccount(authUser.id);

        return NextResponse.json({
            message: "Your account has been reactivated.",
            user: updatedUser,
        }, { status: 200 });
    } catch (error) {
        console.error("Account reactivation error:", error);
        return NextResponse.json({ error: "Failed to reactivate account." }, { status: 500 });
    }
}
