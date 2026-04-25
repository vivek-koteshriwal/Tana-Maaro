import { redis } from "@/lib/redis";

export async function invalidateFeedCache() {
    try {
        const keys = await redis.keys("feed:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.warn("Feed cache invalidation failed:", error);
    }
}
