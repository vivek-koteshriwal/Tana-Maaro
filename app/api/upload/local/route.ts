import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";
import { validateUploadMetadata } from "@/lib/media-policy";

export async function POST(req: Request) {
    try {
        // Auth check
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = verifyToken(token.value);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const validationError = validateUploadMetadata({
            contentType: file.type,
            fileSize: file.size,
        });

        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: validationError.includes("100 MB") ? 413 : 400 },
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Remove spaces and special chars from filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
        const filename = `${Date.now()}-${safeName}`;
        
        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), "public/uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        
        await writeFile(filePath, buffer);

        // Return the accessible public URL path
        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({ fileUrl, url: fileUrl }, { status: 200 });
    } catch (error) {
        console.error("Local upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
