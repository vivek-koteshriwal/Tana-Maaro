import { NextResponse } from "next/server";
import { generateUploadUrl } from "@/lib/s3";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import {
    isVideoContentType,
    validateUploadMetadata,
} from "@/lib/media-policy";

export async function POST(req: Request) {
    try {
        // Must be logged in to upload files to prevent bucket spam
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = verifyToken(token.value);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { fileName, contentType, fileSize } = await req.json();

        if (!fileName || !contentType) {
            return NextResponse.json({ error: "FileName and ContentType are required" }, { status: 400 });
        }

        if (isVideoContentType(contentType) && typeof fileSize !== "number") {
            return NextResponse.json({ error: "File size is required for video uploads." }, { status: 400 });
        }

        const validationError = validateUploadMetadata({ contentType, fileSize });
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: validationError.includes("100 MB") ? 413 : 400 },
            );
        }

        const urlData = await generateUploadUrl(fileName, contentType);

        return NextResponse.json(urlData, { status: 200 });
    } catch (error) {
        console.error("Upload URL generation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
