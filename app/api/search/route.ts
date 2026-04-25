import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
    isPublicAuthorVisible,
    isPublicUserVisible,
} from "@/lib/account-deletion";

const sanitizeDoc = (doc: any) => {
    if (!doc.exists) return null;
    const data = doc.data();
    const result: any = { id: doc.id, ...data };
    for (const [key, value] of Object.entries(result)) {
        if (value && typeof value === "object" && "toDate" in (value as any)) {
            result[key] = (value as any).toDate().toISOString();
        }
    }
    return result;
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim().toLowerCase();
        const type = searchParams.get("type") || "all"; // "all" | "users" | "posts"

        if (!q || q.length < 2) {
            return NextResponse.json({ users: [], posts: [] });
        }

        if (!adminDb) {
            return NextResponse.json({ users: [], posts: [] }, { status: 503 });
        }
        const db = adminDb;
        const results: { users: any[]; posts: any[] } = { users: [], posts: [] };

        // ── Users: prefix search on username field ──
        if (type === "all" || type === "users") {
            const end = q.slice(0, -1) + String.fromCharCode(q.charCodeAt(q.length - 1) + 1);
            const snap = await db
                .collection("users")
                .where("username", ">=", q)
                .where("username", "<", end)
                .limit(10)
                .get();
            results.users = snap.docs
                .map(sanitizeDoc)
                .filter(Boolean)
                .filter((u: any) => isPublicUserVisible(u.status))
                .map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    username: u.username,
                    profileImage: u.profileImage ?? null,
                    bio: u.bio ?? null,
                }));
        }

        // ── Posts: basic content prefix search ──
        if (type === "all" || type === "posts") {
            const end = q.slice(0, -1) + String.fromCharCode(q.charCodeAt(q.length - 1) + 1);
            const snap = await db
                .collection("posts")
                .orderBy("content")
                .startAt(q)
                .endBefore(end)
                .limit(15)
                .get();
            results.posts = snap.docs
                .map(sanitizeDoc)
                .filter(Boolean)
                .filter((p: any) => isPublicAuthorVisible(p.authorStatus))
                .map((p: any) => ({
                    id: p.id,
                    content: p.content,
                    userId: p.userId,
                    userName: p.userName,
                    userHandle: p.userHandle,
                    userAvatar: p.userAvatar ?? null,
                    likes: p.likes ?? 0,
                    timestamp: p.timestamp ?? p.createdAt,
                }));
        }

        return NextResponse.json(results);
    } catch (err) {
        console.error("Search error:", err);
        return NextResponse.json({ users: [], posts: [] }, { status: 500 });
    }
}
