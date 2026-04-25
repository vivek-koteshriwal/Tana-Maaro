import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

const DEFAULT_SETTINGS = {
    siteName: "Tana Maaro Live Ecosystem",
    supportEmail: "support@tanamaaro.com",
    maintenanceMode: false,
    openRegistration: true,
    requireEmailVerification: false,
    allowAnonymousViewing: true,
    notifyOnNewPosts: true,
    maxPostLength: "500",
};

export async function GET() {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const settings = await db.getSettings();
        return NextResponse.json(settings || DEFAULT_SETTINGS);
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const body = await req.json();

        // Whitelist allowed fields
        const allowed = [
            "siteName", "supportEmail", "maintenanceMode",
            "openRegistration", "requireEmailVerification",
            "allowAnonymousViewing", "notifyOnNewPosts", "maxPostLength",
        ];
        const sanitized = Object.fromEntries(
            Object.entries(body).filter(([key]) => allowed.includes(key))
        );

        await db.saveSettings(sanitized);

        await db.createAuditLog({
            action: "settings_updated",
            adminId: admin.id,
            adminEmail: admin.email,
            targetId: "global",
            targetType: "settings",
            details: `Platform settings updated by ${admin.email}`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
    }
}
