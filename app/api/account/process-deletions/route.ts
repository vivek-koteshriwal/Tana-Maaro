import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAuthorized(request: NextRequest) {
    const secret = process.env.ACCOUNT_DELETION_CRON_SECRET;

    if (!secret) {
        return process.env.NODE_ENV !== "production";
    }

    const authHeader = request.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : "";
    const headerToken = request.headers.get("x-account-deletion-secret") || "";

    return bearerToken === secret || headerToken === secret;
}

export async function POST(request: NextRequest) {
    try {
        if (!isAuthorized(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const limitValue = Number.parseInt(request.nextUrl.searchParams.get("limit") || "25", 10);
        const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 25;
        const result = await db.processDueAccountDeletions(limit);

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Account deletion processor error:", error);
        return NextResponse.json({ error: "Failed to process pending deletions." }, { status: 500 });
    }
}
