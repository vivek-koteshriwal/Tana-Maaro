import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPartnershipAlert } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const data = await req.json();
        
        // Basic validation
        if (!data.name || !data.email || !data.message) {
            return NextResponse.json({ error: "Missing required fields (name, email, message)" }, { status: 400 });
        }

        // 1. Save to Firestore
        const request = await db.createPartnershipRequest(data);
        
        // 2. Dispatch Email Alert to Admin
        // Note: This is fire-and-forget to ensure fast response to the user
        // But for reliability, we await it here
        try {
            await sendPartnershipAlert(request);
        } catch (mailError) {
            console.error("Email notification failed during partnership submission:", mailError);
            // We still proceed as the request was saved successfully to DB
        }

        return NextResponse.json({ 
            success: true, 
            message: "Partnership protocol initiated. Our team will contact you soon.",
            id: request.id 
        });
    } catch (error) {
        console.error("Partnership submission error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
