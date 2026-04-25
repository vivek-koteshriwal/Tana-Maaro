import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminDb } from "@/lib/firebase-admin";
import { redis } from "@/lib/redis";
import { normalizeAvatarValue } from "@/lib/avatar-config";
import {
    isBlockedLoginStatus,
    isPublicUserVisible,
} from "@/lib/account-deletion";

interface ProfileUserRecord {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    profileImage?: string;
    showRealName?: boolean;
    usernameChangeCount?: number;
    lastUsernameChange?: string;
}

async function syncPublicIdentity({
    uid,
    username,
    avatarValue,
}: {
    uid: string;
    username: string;
    avatarValue: string;
}) {
    if (!adminDb) {
        return;
    }
    const firestore = adminDb;

    const publicHandle = username.startsWith("@") ? username : `@${username}`;

    const postsPromise = firestore.collection("posts").where("userId", "==", uid).get();
    const rootCommentsPromise = firestore.collection("comments").where("userId", "==", uid).get();
    const commentsPromise = firestore.collectionGroup("comments").where("userId", "==", uid).get();
    const notificationsPromise = firestore.collection("notifications").where("actorId", "==", uid).get();

    const [postsSnapshot, rootCommentsSnapshot, commentsSnapshot, notificationsSnapshot] = await Promise.all([
        postsPromise,
        rootCommentsPromise,
        commentsPromise,
        notificationsPromise,
    ]);

    const commentRefs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    rootCommentsSnapshot.docs.forEach((doc) => commentRefs.set(doc.ref.path, doc));
    commentsSnapshot.docs.forEach((doc) => commentRefs.set(doc.ref.path, doc));

    const operations: Array<{ ref: FirebaseFirestore.DocumentReference; payload: Record<string, string> }> = [];

    postsSnapshot.docs.forEach((doc) => {
        operations.push({
            ref: doc.ref,
            payload: {
                userName: publicHandle,
                userHandle: publicHandle,
                userAvatar: avatarValue,
            },
        });
    });

    Array.from(commentRefs.values()).forEach((doc) => {
        operations.push({
            ref: doc.ref,
            payload: {
                userName: publicHandle,
                userHandle: publicHandle,
                userAvatar: avatarValue,
            },
        });
    });

    notificationsSnapshot.docs.forEach((doc) => {
        operations.push({
            ref: doc.ref,
            payload: {
                actorName: publicHandle,
                actorAvatar: avatarValue,
            },
        });
    });

    if (!operations.length) {
        return;
    }

    let batch = firestore.batch();
    let count = 0;
    const commits: Promise<FirebaseFirestore.WriteResult[]>[] = [];

    operations.forEach((operation) => {
        batch.update(operation.ref, operation.payload);
        count += 1;

        if (count === 350) {
            commits.push(batch.commit());
            batch = firestore.batch();
            count = 0;
        }
    });

    if (count > 0) {
        commits.push(batch.commit());
    }

    await Promise.all(commits);
}

async function invalidateFeedCache() {
    try {
        const keys = await redis.keys("feed:*");
        if (keys.length) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.warn("Feed cache invalidation failed:", error);
    }
}

export async function PUT(req: Request) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, bio, avatar, profileImage, username, showRealName } = await req.json();
        const fullUser = await db.findUserById(user.id) as ProfileUserRecord | null;
        if (!fullUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!isPublicUserVisible((fullUser as any).status) || isBlockedLoginStatus((fullUser as any).status)) {
            return NextResponse.json({
                error: "This account cannot update its profile right now.",
            }, { status: 403 });
        }

        const resolvedName =
            String(name ?? fullUser.name ?? "").trim() ||
            String(fullUser.username ?? username ?? "").replace(/^@/, "").trim();

        if (!resolvedName) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const normalizedAvatar = normalizeAvatarValue(
            avatar || profileImage || fullUser.profileImage || "",
            user.id || fullUser.username || fullUser.email,
        );

        const updatePayload: Record<string, unknown> = {
            name: resolvedName,
            bio: String(bio || "").trim(),
            profileImage: normalizedAvatar,
            showRealName: showRealName !== undefined ? Boolean(showRealName) : (fullUser.showRealName ?? true),
        };

        if (username && username.toLowerCase() !== fullUser.username?.toLowerCase()) {
            const cleanNew = String(username).toLowerCase().replace(/^@/, "").trim();

            if (cleanNew !== fullUser.username?.toLowerCase()) {
                const now = new Date();
                const lastChange = fullUser.lastUsernameChange ? new Date(fullUser.lastUsernameChange) : null;
                const daysSinceLast = lastChange ? (now.getTime() - lastChange.getTime()) / (1000 * 3600 * 24) : 999;

                const canChange = daysSinceLast > 30 || (fullUser.usernameChangeCount || 0) < 2;
                if (!canChange) {
                    return NextResponse.json(
                        { error: "Username change limit reached. You can only change your handle twice per month." },
                        { status: 429 },
                    );
                }

                try {
                    await db.updateUsername(user.id, fullUser.username, cleanNew);
                } catch (error: unknown) {
                    console.error("Username swap failed:", error);
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : "Username already taken" },
                        { status: 409 },
                    );
                }
            }
        }

        const updatedUser = await db.updateUser(user.id, updatePayload) as ProfileUserRecord | null;
        if (!updatedUser) {
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }

        await Promise.all([
            syncPublicIdentity({
                uid: updatedUser.id,
                username: updatedUser.username || fullUser.username || "anon",
                avatarValue: normalizedAvatar,
            }),
            invalidateFeedCache(),
        ]);

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
