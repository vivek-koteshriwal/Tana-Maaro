import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

export async function generateUploadUrl(fileName: string, contentType: string) {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || "tanamaaro-uploads",
        Key: key,
        ContentType: contentType,
        // Optional: ACL: "public-read" if bucket allows it, otherwise use Cloudfront
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL valid for 5 mins
        const finalUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return {
            uploadUrl: signedUrl,
            fileUrl: finalUrl // What the client saves back to the DB after successful PUT
        };
    } catch (error) {
        console.error("Error generating presigned URL", error);
        throw error;
    }
}
