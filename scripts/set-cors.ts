import { admin } from "../lib/firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load local environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function setCors() {
    if (!admin) {
        console.error("❌ Firebase Admin not initialized. Check your credentials in .env");
        process.exit(1);
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        console.error("❌ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set in .env");
        process.exit(1);
    }

    console.log(`📡 Setting CORS for bucket: ${bucketName}...`);

    try {
        const bucket = admin.storage().bucket(bucketName);
        
        const corsConfig = [
            {
                origin: ["*"], // In production, narrow this to your actual domain
                method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
                maxAgeSeconds: 3600,
                responseHeader: ["Content-Type", "Access-Control-Allow-Origin", "x-goog-meta-post-id", "x-goog-meta-user-id"]
            }
        ];

        await bucket.setCorsConfiguration(corsConfig);
        console.log("✅ CORS configuration applied successfully!");
        console.log("🚀 You should now be able to upload images without the 'retry-limit-exceeded' error.");
        
    } catch (error) {
        console.error("❌ Failed to set CORS:", error);
        process.exit(1);
    }
}

setCors();
