import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { invalidateFeedCache } from "@/lib/feed-cache";
import { redis } from "@/lib/redis";
import {
    isBlockedLoginStatus,
    isPublicUserVisible,
} from "@/lib/account-deletion";

type PostRecord = {
    id: string;
    likedBy?: string[];
    dislikedBy?: string[];
    status?: string;
    [key: string]: unknown;
};

type UserRecord = {
    id: string;
    name?: string;
    username?: string;
    profileImage?: string;
};

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");
        const battleId = url.searchParams.get("battleId");
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const sort = url.searchParams.get("sort") === "trending" ? "trending" : "latest";

        // Get auth user for reaction status
        const authUser = await verifyAuth(req);
        const currentUserId = authUser?.id || null;

        const cacheKey = `feed:${userId || 'global'}:battle:${battleId || 'none'}:sort:${sort}:page${page}:limit${limit}`;

        let posts: PostRecord[] | null = null;
        let isFromCache = false;

        try {
            const cachedFeed = await redis.get(cacheKey);
            if (cachedFeed) {
                const parsedFeed = JSON.parse(cachedFeed);
                if (Array.isArray(parsedFeed)) {
                    posts = parsedFeed as PostRecord[];
                    isFromCache = true;
                } else {
                    console.warn("Ignoring invalid Redis feed cache shape for key:", cacheKey);
                }
            }
        } catch (redisErr) {
            console.warn("Redis Cache Miss/Error:", redisErr);
        }

        if (!posts) {
            if (userId) {
                posts = await db.getPostsByUser(userId, page, limit) as PostRecord[];
            } else if (sort === "trending") {
                posts = await db.getTrendingPosts(page, limit, battleId || undefined) as PostRecord[];
            } else {
                posts = await db.getPosts(page, limit, battleId || undefined) as PostRecord[];
            }

            // Cache raw data briefly so live updates do not lag behind new activity.
            try {
                await redis.set(cacheKey, JSON.stringify(posts), 'EX', 10);
            } catch (redisSetErr) {
                console.warn("Failed to set Redis cache:", redisSetErr);
            }
        }

        const standardizedPosts = (posts || []).map((p: PostRecord) => ({
            ...p,
            id: p.id,
            comments: typeof p.comments === "number" ? p.comments : 0,
            isLiked: currentUserId ? (p.likedBy || []).includes(currentUserId) : false,
            isDisliked: currentUserId ? (p.dislikedBy || []).includes(currentUserId) : false,
            likes: (p.likedBy || []).length,
            dislikes: (p.dislikedBy || []).length,
            shares: typeof p.shares === "number" ? p.shares : 0,
            saves: typeof p.saves === "number" ? p.saves : 0,
            views: typeof p.views === "number" ? p.views : 0,
            ctr: typeof p.ctr === "number" ? p.ctr : 0,
            status: p.status || 'pending'
        }));

        return NextResponse.json(standardizedPosts, {
            status: 200,
            headers: { 'X-Cache': isFromCache ? 'HIT-REDIS' : 'MISS-DB' }
        });
    } catch (error) {
        console.error("Fetch posts error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // Auth check
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, image, type, battleId } = await req.json();

        // Rate Limiting
        const rateLimitKey = `rate-limit:post:${authUser.id}`;
        try {
            const requestCount = await redis.incr(rateLimitKey);
            if (requestCount === 1) await redis.expire(rateLimitKey, 60);
            if (requestCount > 10) {
                return NextResponse.json({ error: "You are posting too fast! Please wait a minute." }, { status: 429 });
            }
        } catch (redisErr) {
            console.warn("Rate limit redis failure, bypassing check:", redisErr);
        }

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // Get fresh user details from Firestore to denormalize
        const user = await db.findUserById(authUser.id) as UserRecord | null;
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!isPublicUserVisible((user as any).status) || isBlockedLoginStatus((user as any).status)) {
            return NextResponse.json({
                error: "This account cannot create posts right now.",
            }, { status: 403 });
        }

        const newPostData = {
            userId: user.id,
            content,
            image: image || "",
            type: type || (image ? "mixed" : "text"),
            userName: user.name || user.username || "Anonymous",
            username: user.username || "",
            userHandle: user.username || "",
            userAvatar: user.profileImage || "",
            likes: 0,
            likedBy: [],
            dislikedBy: [],
            comments: 0,
            status: "pending",
            authorStatus: "active",
            battleId: battleId || null,
            createdAt: new Date().toISOString()
        };

        const newPost = await db.createPost(newPostData);
        await invalidateFeedCache();

        return NextResponse.json(newPost, { status: 201 });

    } catch (error) {
        console.error("Create post error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
