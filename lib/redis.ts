import { Redis } from "ioredis";

// Centralized Redis Client for 15k User Scale
// Add UPSTASH_REDIS_URL to your .env.local
const redisUrl = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
        if (times > 3) {
            console.warn("Redis connection failed. Running in degrade mode (bypassing cache).");
            return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
    }
});

redis.on("error", (err) => {
    // Suppress verbose offline errors in dev console
});

redis.on("connect", () => {
    console.log("Connected to Upstash Redis");
});
