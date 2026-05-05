import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { DELETE_ACCOUNT_REASONS, hasPendingDeletionExpired } from "@/lib/account-deletion";

const ALLOWED_REASONS = new Set(DELETE_ACCOUNT_REASONS);

interface DeletionUserRecord {
    status?: string;
    scheduledDeletionAt?: string | null;
}

export async function POST(req: Request) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reason, feedback, confirmationText } = await req.json();
        const normalizedReason = String(reason || "").trim();
        const normalizedFeedback = String(feedback || "").trim();

        if (!ALLOWED_REASONS.has(normalizedReason)) {
            return NextResponse.json({ error: "Please select a valid reason." }, { status: 400 });
        }

        if (normalizedReason === "Other" && !normalizedFeedback) {
            return NextResponse.json({ error: "Please tell us why you are leaving." }, { status: 400 });
        }

        if (String(confirmationText || "").trim().toUpperCase() !== "DELETE") {
            return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
        }

        const user = await db.findUserById(authUser.id) as DeletionUserRecord | null;
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        if (hasPendingDeletionExpired(user)) {
            await db.finalizeAccountDeletion(authUser.id);
            const response = NextResponse.json({
                error: "This account has already been permanently deleted.",
            }, { status: 410 });
            response.cookies.delete("auth_token");
            return response;
        }

        if (user.status === "pending_deletion" && user.scheduledDeletionAt) {
            const response = NextResponse.json({
                message: "Account deletion is already scheduled.",
                scheduledDeletionAt: user.scheduledDeletionAt,
            }, { status: 200 });
            response.cookies.delete("auth_token");
            return response;
        }

        const updatedUser = await db.requestAccountDeletion({
            userId: authUser.id,
            reason: normalizedReason,
            feedback: normalizedFeedback,
        }) as DeletionUserRecord | null;

        const response = NextResponse.json({
            message: "Your account has been scheduled for deletion.",
            scheduledDeletionAt: updatedUser?.scheduledDeletionAt || null,
        }, { status: 200 });

        response.cookies.delete("auth_token");
        return response;
    } catch (error) {
        console.error("Account deletion request error:", error);
        return NextResponse.json({ error: "Failed to schedule account deletion." }, { status: 500 });
    }
}
