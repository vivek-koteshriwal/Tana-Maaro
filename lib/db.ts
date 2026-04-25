import { adminAuth, adminDb, FieldValue } from "./firebase-admin";
import {
    getScheduledDeletionAt,
    isPublicAuthorVisible,
    isPublicUserVisible,
    maskEmail,
} from "./account-deletion";
import { compareFeedPosts, isTrendingEligible } from "./feed-ranking";

const USERS_COLLECTION = "users";
const POSTS_COLLECTION = "posts";
const USERNAMES_COLLECTION = "usernames";
const PHONES_COLLECTION = "phones";
const FOLLOWS_COLLECTION = "follows";
const REGISTRATIONS_COLLECTION = "registrations";
const PARTNERSHIPS_COLLECTION = "partnerships";
const EVENTS_COLLECTION = "events";
const BATTLES_COLLECTION = "battles";
const BATTLE_VOTES_COLLECTION = "battle_votes";
const ACCOUNT_DELETION_RECORDS_COLLECTION = "account_deletion_records";

// Legacy exports for Admin Dashboard compatibility
export const IS_DEV = process.env.NODE_ENV === "development";
export const JsonDB = {
    read: async (key: string) => {
        // Map to Firestore for legacy calls
        if (key === "posts") return await db.getPosts(1, 1000);
        if (key === "users") return await db.getAllUsers();
        if (key === "registrations") return await db.getRegistrations();
        if (key === "partnerships") return await db.getPartnershipRequests();
        return [];
    }
};

// Strip undefined values — Firestore rejects documents containing undefined fields
const stripUndefined = (obj: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// Utility to sanitize Firestore documents for Next.js Server/Client serialization
const sanitizeDoc = (doc: any) => {
    if (!doc.exists) return null;
    const data = doc.data();
    const result = { id: doc.id, ...data };
    
    // Convert Firestore Timestamps to ISO strings
    for (const [key, value] of Object.entries(result)) {
        if (value && typeof value === 'object' && ('_seconds' in value || (value as any).toDate)) {
            try {
                result[key] = (value as any).toDate ? (value as any).toDate().toISOString() : new Date((value as any)._seconds * 1000).toISOString();
            } catch (e) {
                // Ignore conversion errors
            }
        }
    }

    // Ensure timestamp fallback (Post components prefer 'timestamp')
    if (!result.timestamp && result.createdAt) {
        result.timestamp = result.createdAt;
    }

    return result;
};

// Utility to check if DB is initialized
const checkDb = () => {
    if (!adminDb) {
        throw new Error("Firestore is not initialized. Check Firebase Admin credentials in .env.local.");
    }
    return adminDb;
};

const DEFAULT_DELETED_PROFILE = {
    userId: "deleted",
    userName: "Deleted User",
    userHandle: "deleted_user",
    userAvatar: "",
    isAnonymous: true,
    authorStatus: "deleted",
};

async function commitChunkedWrites(
    firestore: FirebaseFirestore.Firestore,
    operations: Array<(batch: FirebaseFirestore.WriteBatch) => void>,
) {
    if (!operations.length) {
        return;
    }

    let batch = firestore.batch();
    let count = 0;
    const commits: Promise<FirebaseFirestore.WriteResult[]>[] = [];

    for (const operation of operations) {
        operation(batch);
        count += 1;
        if (count >= 350) {
            commits.push(batch.commit());
            batch = firestore.batch();
            count = 0;
        }
    }

    if (count > 0) {
        commits.push(batch.commit());
    }

    await Promise.all(commits);
}

function dedupeDocsByPath(
    snapshots: Array<FirebaseFirestore.QuerySnapshot | null | undefined>,
) {
    const refs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();

    snapshots.forEach((snapshot) => {
        snapshot?.docs.forEach((doc) => {
            refs.set(doc.ref.path, doc);
        });
    });

    return Array.from(refs.values());
}

export const db = {
    // User Operations
    getAllUsers: async () => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(USERS_COLLECTION).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => sanitizeDoc(doc));
    },

    createUser: async (userData: any) => {
        const firestore = checkDb();
        const { username, email, id } = userData;
        
        // If ID is provided (from Firebase Auth UID), use it as doc ID
        const uid = id || firestore.collection(USERS_COLLECTION).doc().id;
        const userRef = firestore.collection(USERS_COLLECTION).doc(uid);
        
        const finalData = {
            ...userData,
            id: uid,
            uid,
            username: username.toLowerCase(),
            handle: userData.handle || username.toLowerCase(),
            followerCount: 0,
            followingCount: 0,
            postsCount: 0,
            likesCount: 0,
            showRealName: true, // Default to true as per spec
            usernameChangeCount: 0, // Reset for new users
            lastUsernameChange: null,
            status: userData.status || "active",
            deletionRequestedAt: null,
            scheduledDeletionAt: null,
            deletionReason: null,
            deletionFeedback: null,
            reactivatedAt: null,
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Batch write to ensure username uniqueness
        const batch = firestore.batch();
        batch.set(userRef, finalData);
        batch.set(firestore.collection(USERNAMES_COLLECTION).doc(username.toLowerCase()), { uid });
        
        await batch.commit();
        return finalData;
    },

    findUserByPhone: async (phone: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(USERS_COLLECTION).where("phone", "==", phone).limit(1).get();
        if (snapshot.empty) return null;
        return sanitizeDoc(snapshot.docs[0]);
    },

    findUserByGoogleId: async (googleId: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(USERS_COLLECTION).where("googleId", "==", googleId).limit(1).get();
        if (snapshot.empty) return null;
        return sanitizeDoc(snapshot.docs[0]);
    },

    findUserByEmail: async (email: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(USERS_COLLECTION).where("email", "==", email).limit(1).get();
        if (snapshot.empty) return null;
        return sanitizeDoc(snapshot.docs[0]);
    },

    findUserByUsername: async (username: string) => {
        if (!username) return null;
        const firestore = checkDb();
        const cleanQuery = username.trim().toLowerCase().replace(/^@/, '');

        // Use the usernames collection for O(1) lookup
        const usernameDoc = await firestore.collection(USERNAMES_COLLECTION).doc(cleanQuery).get();
        if (usernameDoc.exists) {
            const uid = usernameDoc.data()?.uid;
            return await db.findUserById(uid);
        }
        
        // Fallback: search by name field (if needed for old data migrations, but usually username is enough)
        const nameSnapshot = await firestore.collection(USERS_COLLECTION).where("name", "==", username).limit(1).get();
        if (!nameSnapshot.empty) {
            return sanitizeDoc(nameSnapshot.docs[0]);
        }
        
        return null;
    },

    findUserById: async (id: string) => {
        const firestore = checkDb();
        const doc = await firestore.collection(USERS_COLLECTION).doc(id).get();
        return sanitizeDoc(doc);
    },

    findUserByResetToken: async (token: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(USERS_COLLECTION)
            .where("resetToken", "==", token)
            .where("resetTokenExpiry", ">", new Date())
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },

    getUsersByIds: async (ids: string[]) => {
        if (!ids || ids.length === 0) return [];
        const firestore = checkDb();
        // Firestore 'in' query supports up to 10 IDs
        const chunks = [];
        for (let i = 0; i < ids.length; i += 10) {
            chunks.push(ids.slice(i, i + 10));
        }
        
        const results = [];
        for (const chunk of chunks) {
            const snapshot = await firestore.collection(USERS_COLLECTION).where("__name__", "in", chunk).get();
            results.push(...snapshot.docs.map(doc => sanitizeDoc(doc)));
        }
        return results;
    },

    updateUser: async (id: string, updates: any) => {
        const firestore = checkDb();
        const userRef = firestore.collection(USERS_COLLECTION).doc(id);
        
        // Prevent accidental username update via standard path
        // and filter out 'undefined' values which cause Firestore to crash
        const { username, ...rawSafeUpdates } = updates;
        const safeUpdates = Object.fromEntries(
            Object.entries(rawSafeUpdates).filter(([_, v]) => v !== undefined)
        );
        
        await userRef.update({ ...safeUpdates, updatedAt: new Date().toISOString() });
        const updated = await userRef.get();
        return sanitizeDoc(updated);
    },

    updateUsername: async (id: string, oldUsername: string | null | undefined, newUsername: string) => {
        const firestore = checkDb();
        const userRef = firestore.collection(USERS_COLLECTION).doc(id);
        
        const cleanNew = newUsername.toLowerCase().replace(/^@/, '').trim();
        const cleanOld = oldUsername ? oldUsername.toLowerCase().replace(/^@/, '').trim() : null;

        // Use transaction for atomic swap
        return await firestore.runTransaction(async (transaction) => {
            const newUsernameRef = firestore.collection(USERNAMES_COLLECTION).doc(cleanNew);
            
            const newDoc = await transaction.get(newUsernameRef);
            if (newDoc.exists && newDoc.data()?.uid !== id) {
                throw new Error("Username is already taken");
            }

            transaction.set(newUsernameRef, { uid: id });
            
            if (cleanOld && cleanOld !== cleanNew) {
                const oldUsernameRef = firestore.collection(USERNAMES_COLLECTION).doc(cleanOld);
                transaction.delete(oldUsernameRef);
            }

            transaction.update(userRef, { 
                username: cleanNew, 
                usernameChangeCount: FieldValue.increment(1),
                lastUsernameChange: new Date().toISOString(),
                updatedAt: new Date().toISOString() 
            } as any);

            return true;
        });
    },

    updateUserByEmail: async (email: string, updates: any) => {
        const user = await db.findUserByEmail(email);
        if (!user) return null;
        return await db.updateUser(user.id, updates);
    },

    updateLastActive: async (id: string) => {
        const firestore = checkDb();
        await firestore.collection(USERS_COLLECTION).doc(id).update({ lastActiveAt: new Date().toISOString() });
    },

    getActiveUsersCounts: async () => {
        const firestore = checkDb();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const snapshot = await firestore.collection(USERS_COLLECTION)
            .where("lastActiveAt", ">", yesterday)
            .get();
        return snapshot.size;
    },

    getRegistrations: async () => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(REGISTRATIONS_COLLECTION).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => sanitizeDoc(doc));
    },

    // Post Operations
    createPost: async (postData: any) => {
        const firestore = checkDb();
        const postRef = firestore.collection(POSTS_COLLECTION).doc();
        const finalPost = stripUndefined({
            ...postData,
            id: postRef.id,
            likes: 0,
            likedBy: [],
            dislikedBy: [],
            comments: 0,
            authorStatus: postData.authorStatus || "active",
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            lastEngagementAt: new Date().toISOString(),
        });

        await postRef.set(finalPost);

        // Increment user post count
        if (postData.userId) {
            await firestore.collection(USERS_COLLECTION).doc(postData.userId).update({
                postsCount: FieldValue.increment(1)
            } as any);
        }

        return finalPost;
    },

    getPosts: async (page = 1, limit = 20, battleId?: string) => {
        const firestore = checkDb();
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);

        if (battleId) {
            const snapshot = await firestore.collection(POSTS_COLLECTION)
                .where("battleId", "==", battleId)
                .orderBy("createdAt", "desc")
                .offset((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .get();
            return snapshot.docs
                .map(doc => sanitizeDoc(doc))
                .filter((post): post is Record<string, any> => !!post)
                .filter((post) => isPublicAuthorVisible(post.authorStatus));
        }

        const baseQuery = firestore.collection(POSTS_COLLECTION).orderBy("createdAt", "desc");
        const targetEnd = safePage * safeLimit;
        const batchSize = Math.max(safeLimit * 3, 40);
        const collected: any[] = [];
        let offset = 0;

        while (collected.length < targetEnd) {
            const snapshot = await baseQuery.offset(offset).limit(batchSize).get();
            if (snapshot.empty) {
                break;
            }

            const batch = snapshot.docs
                .map(doc => sanitizeDoc(doc))
                .filter((post): post is Record<string, any> => !!post)
                .filter((post) => !post.battleId)
                .filter((post) => isPublicAuthorVisible(post.authorStatus));

            collected.push(...batch);

            if (snapshot.docs.length < batchSize) {
                break;
            }

            offset += batchSize;
        }

        const start = (safePage - 1) * safeLimit;
        return collected.slice(start, targetEnd);
    },

    getTrendingPosts: async (page = 1, limit = 20, battleId?: string) => {
        const firestore = checkDb();
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);
        const candidateLimit = Math.min(Math.max(safePage * safeLimit * 8, 120), 320);

        const snapshot = battleId
            ? await firestore.collection(POSTS_COLLECTION)
                .where("battleId", "==", battleId)
                .orderBy("createdAt", "desc")
                .limit(candidateLimit)
                .get()
            : await firestore.collection(POSTS_COLLECTION)
                .orderBy("createdAt", "desc")
                .limit(candidateLimit)
                .get();

        const rankedPosts = snapshot.docs
            .map(doc => sanitizeDoc(doc))
            .filter((post): post is Record<string, any> => !!post)
            .filter((post) => battleId ? post.battleId === battleId : !post.battleId)
            .filter((post) => isPublicAuthorVisible(post.authorStatus))
            .filter((post) => isTrendingEligible(post))
            .sort((left, right) => compareFeedPosts(left, right, "trending"));

        const start = (safePage - 1) * safeLimit;
        return rankedPosts.slice(start, start + safeLimit);
    },

    getPendingPosts: async () => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(POSTS_COLLECTION)
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map(doc => sanitizeDoc(doc));
    },

    updatePost: async (postId: string, updates: any) => {
        const firestore = checkDb();
        await firestore.collection(POSTS_COLLECTION).doc(postId).update(updates);
        return await db.getPostById(postId);
    },

    getPostById: async (postId: string, options?: { includeHidden?: boolean }) => {
        const firestore = checkDb();
        const doc = await firestore.collection(POSTS_COLLECTION).doc(postId).get();
        const post = sanitizeDoc(doc);
        if (!post) {
            return null;
        }
        if (!options?.includeHidden && !isPublicAuthorVisible((post as any).authorStatus)) {
            return null;
        }
        return post;
    },

    getPostsByUser: async (userId: string, page = 1, limit = 20) => {
        const firestore = checkDb();
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);
        const snapshot = await firestore.collection(POSTS_COLLECTION)
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .offset((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .get();
        return snapshot.docs
            .map(doc => sanitizeDoc(doc))
            .filter((post): post is Record<string, any> => !!post)
            .filter((post) => isPublicAuthorVisible(post.authorStatus));
    },

    toggleReaction: async (postId: string, userId: string, type: 'like' | 'dislike') => {
        const firestore = checkDb();
        const postRef = firestore.collection(POSTS_COLLECTION).doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) return null;

        const post = postDoc.data()!;
        const likedBy = post.likedBy || [];
        const dislikedBy = post.dislikedBy || [];

        let updates: any = {};

        if (type === 'like') {
            if (likedBy.includes(userId)) {
                updates.likedBy = FieldValue.arrayRemove(userId);
                updates.likes = FieldValue.increment(-1);
            } else {
                updates.likedBy = FieldValue.arrayUnion(userId);
                updates.dislikedBy = FieldValue.arrayRemove(userId);
                updates.likes = FieldValue.increment(1);
            }
        } else {
            if (dislikedBy.includes(userId)) {
                updates.dislikedBy = FieldValue.arrayRemove(userId);
            } else {
                updates.dislikedBy = FieldValue.arrayUnion(userId);
                updates.likedBy = FieldValue.arrayRemove(userId);
                // If it was liked before, decrement
                if (likedBy.includes(userId)) {
                    updates.likes = FieldValue.increment(-1);
                }
            }
        }

        updates.lastEngagementAt = new Date().toISOString();

        await postRef.update(updates);
        return await db.getPostById(postId);
    },

    incrementShareCount: async (postId: string) => {
        const firestore = checkDb();
        await firestore.collection(POSTS_COLLECTION).doc(postId).update({
            shares: FieldValue.increment(1),
            lastEngagementAt: new Date().toISOString(),
        } as any);
    },

    incrementCommentCount: async (postId: string) => {
        const firestore = checkDb();
        await firestore.collection(POSTS_COLLECTION).doc(postId).update({
            comments: FieldValue.increment(1),
            lastEngagementAt: new Date().toISOString(),
        } as any);
    },

    // Notification Operations
    createNotification: async (notificationData: any) => {
        const firestore = checkDb();
        const notificationRef = firestore.collection("notifications").doc();
        const finalNotification = stripUndefined({
            ...notificationData,
            id: notificationRef.id,
            read: false,
            createdAt: new Date().toISOString(),
        });
        await notificationRef.set(finalNotification);
        return finalNotification;
    },

    getNotificationsByUser: async (userId: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection("notifications")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();
        return snapshot.docs.map(doc => sanitizeDoc(doc));
    },

    // Comment Operations
    createComment: async (commentData: any) => {
        const firestore = checkDb();
        const commentRef = firestore.collection("comments").doc();
        const finalComment = stripUndefined({
            ...commentData,
            id: commentRef.id,
            authorStatus: commentData.authorStatus || "active",
            createdAt: new Date().toISOString(),
        });
        await commentRef.set(finalComment);
        
        // Increment count on post
        await firestore.collection(POSTS_COLLECTION).doc(commentData.postId).update({
            comments: FieldValue.increment(1),
            lastEngagementAt: new Date().toISOString(),
        } as any);

        return finalComment;
    },

    getCommentsByPost: async (postId: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection("comments")
            .where("postId", "==", postId)
            .orderBy("createdAt", "asc")
            .get();
        return snapshot.docs
            .map(doc => sanitizeDoc(doc))
            .filter((comment): comment is Record<string, any> => !!comment)
            .filter((comment) => isPublicAuthorVisible(comment.authorStatus));
    },

    // Follow System
    toggleFollowUser: async (followerId: string, targetUserId: string) => {
        const firestore = checkDb();
        const followId = `${followerId}_${targetUserId}`;
        const followRef = firestore.collection(FOLLOWS_COLLECTION).doc(followId);
        const followDoc = await followRef.get();

        const batch = firestore.batch();
        let isFollowing = false;

        if (followDoc.exists) {
            // Unfollow
            batch.delete(followRef);
            batch.update(firestore.collection(USERS_COLLECTION).doc(followerId), {
                followingCount: FieldValue.increment(-1)
            } as any);
            batch.update(firestore.collection(USERS_COLLECTION).doc(targetUserId), {
                followerCount: FieldValue.increment(-1)
            } as any);
        } else {
            // Follow
            batch.set(followRef, {
                followerId,
                targetId: targetUserId,
                timestamp: new Date().toISOString()
            });
            batch.update(firestore.collection(USERS_COLLECTION).doc(followerId), {
                followingCount: FieldValue.increment(1)
            } as any);
            batch.update(firestore.collection(USERS_COLLECTION).doc(targetUserId), {
                followerCount: FieldValue.increment(1)
            } as any);
            isFollowing = true;
        }

        await batch.commit();
        
        const targetUser = await db.findUserById(targetUserId) as any;
        const followerUser = await db.findUserById(followerId) as any;

        return { 
            isFollowing, 
            followersCount: targetUser?.followerCount || 0, 
            followingCount: followerUser?.followingCount || 0 
        };
    },

    getFollowers: async (userId: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(FOLLOWS_COLLECTION).where("targetId", "==", userId).get();
        const followerIds = snapshot.docs.map(doc => doc.data().followerId);
        const followers = await db.getUsersByIds(followerIds);
        return followers.filter((user: any) => isPublicUserVisible(user?.status));
    },

    getFollowing: async (userId: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(FOLLOWS_COLLECTION).where("followerId", "==", userId).get();
        const followingIds = snapshot.docs.map(doc => doc.data().targetId);
        const following = await db.getUsersByIds(followingIds);
        return following.filter((user: any) => isPublicUserVisible(user?.status));
    },

    registerForEvent: async (registrationData: any) => {
        const firestore = checkDb();
        const { eventId, email } = registrationData;
        
        // Single registration per event per email
        const regId = `${eventId}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const regRef = firestore.collection(REGISTRATIONS_COLLECTION).doc(regId);
        const doc = await regRef.get();
        if (doc.exists) {
            throw new Error("User already registered for this event");
        }

        const finalReg = {
            ...registrationData,
            id: regId,
            createdAt: new Date().toISOString()
        };
        await regRef.set(finalReg);
        return finalReg;
    },

    deletePost: async (postId: string) => {
        const firestore = checkDb();
        const postRef = firestore.collection(POSTS_COLLECTION).doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) return;

        const postData = postDoc.data()!;
        const batch = firestore.batch();
        batch.delete(postRef);

        // Decrement user post count
        if (postData.userId) {
            const userRef = firestore.collection(USERS_COLLECTION).doc(postData.userId);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                batch.update(userRef, {
                    postsCount: FieldValue.increment(-1)
                } as any);
            }
        }

        await batch.commit();
    },

    markNotificationsAsRead: async (userId: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection("notifications")
            .where("userId", "==", userId)
            .where("read", "==", false)
            .get();
        
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
    },
    // Partnership Requests
    createPartnershipRequest: async (data: any) => {
        const firestore = checkDb();
        const ref = firestore.collection(PARTNERSHIPS_COLLECTION).doc();
        const finalData = {
            ...data,
            id: ref.id,
            status: "new",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await ref.set(finalData);
        return finalData;
    },

    getPartnershipRequests: async () => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(PARTNERSHIPS_COLLECTION).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => sanitizeDoc(doc));
    },

    updatePartnershipStatus: async (id: string, status: string) => {
        const firestore = checkDb();
        const ref = firestore.collection(PARTNERSHIPS_COLLECTION).doc(id);
        await ref.update({ status, updatedAt: new Date().toISOString() });
        return true;
    },

    getAccountDeletionRecord: async (id: string) => {
        const firestore = checkDb();
        const doc = await firestore.collection(ACCOUNT_DELETION_RECORDS_COLLECTION).doc(id).get();
        return sanitizeDoc(doc);
    },

    getAccountDeletionRecords: async (limit = 200) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(ACCOUNT_DELETION_RECORDS_COLLECTION)
            .orderBy("updatedAt", "desc")
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => sanitizeDoc(doc));
    },

    upsertAccountDeletionRecord: async (id: string, updates: Record<string, unknown>) => {
        const firestore = checkDb();
        const ref = firestore.collection(ACCOUNT_DELETION_RECORDS_COLLECTION).doc(id);
        const payload = stripUndefined({
            id,
            userId: id,
            ...updates,
            updatedAt: new Date().toISOString(),
        });
        await ref.set(payload, { merge: true });
        const updated = await ref.get();
        return sanitizeDoc(updated);
    },

    updateAuthoredContentStatus: async (userId: string, authorStatus: string) => {
        const firestore = checkDb();
        const timestamp = new Date().toISOString();
        const [postsSnapshot, rootCommentsSnapshot, commentsGroupSnapshot] = await Promise.all([
            firestore.collection(POSTS_COLLECTION).where("userId", "==", userId).get(),
            firestore.collection("comments").where("userId", "==", userId).get(),
            firestore.collectionGroup("comments").where("userId", "==", userId).get(),
        ]);
        const commentDocs = dedupeDocsByPath([rootCommentsSnapshot, commentsGroupSnapshot]);

        const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];

        postsSnapshot.docs.forEach((doc) => {
            operations.push((batch) => {
                batch.set(doc.ref, {
                    authorStatus,
                    updatedAt: timestamp,
                }, { merge: true });
            });
        });

        commentDocs.forEach((doc) => {
            operations.push((batch) => {
                batch.set(doc.ref, {
                    authorStatus,
                    updatedAt: timestamp,
                }, { merge: true });
            });
        });

        await commitChunkedWrites(firestore, operations);
    },

    requestAccountDeletion: async ({
        userId,
        reason,
        feedback,
    }: {
        userId: string;
        reason: string;
        feedback?: string;
    }) => {
        const firestore = checkDb();
        const now = new Date();
        const scheduledDeletionAt = getScheduledDeletionAt(now);
        const user = await db.findUserById(userId) as any;

        if (!user) {
            return null;
        }

        await firestore.collection(USERS_COLLECTION).doc(userId).update({
            status: "pending_deletion",
            deletionRequestedAt: now.toISOString(),
            scheduledDeletionAt: scheduledDeletionAt.toISOString(),
            deletionReason: reason,
            deletionFeedback: feedback || "",
            reactivatedAt: null,
            deletedAt: null,
            updatedAt: now.toISOString(),
        });

        await Promise.all([
            db.updateAuthoredContentStatus(userId, "pending_deletion"),
            db.upsertAccountDeletionRecord(userId, {
                status: "pending_deletion",
                username: user.username || null,
                emailMasked: maskEmail(user.email),
                requestedAt: now.toISOString(),
                scheduledDeletionAt: scheduledDeletionAt.toISOString(),
                reason,
                feedback: feedback || "",
                reactivatedAt: null,
                deletedAt: null,
            }),
        ]);

        return await db.findUserById(userId);
    },

    reactivateAccount: async (userId: string) => {
        const firestore = checkDb();
        const now = new Date().toISOString();
        const user = await db.findUserById(userId) as any;

        if (!user) {
            return null;
        }

        await firestore.collection(USERS_COLLECTION).doc(userId).update({
            status: "active",
            scheduledDeletionAt: null,
            reactivatedAt: now,
            updatedAt: now,
        });

        await Promise.all([
            db.updateAuthoredContentStatus(userId, "active"),
            db.upsertAccountDeletionRecord(userId, {
                status: "reactivated",
                username: user.username || null,
                emailMasked: maskEmail(user.email),
                reactivatedAt: now,
            }),
        ]);

        return await db.findUserById(userId);
    },

    finalizeAccountDeletion: async (userId: string) => {
        const firestore = checkDb();
        const now = new Date().toISOString();
        const user = await db.findUserById(userId) as any;

        if (!user) {
            return false;
        }

        const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
        const [
            postsSnapshot,
            rootCommentsSnapshot,
            commentsGroupSnapshot,
            actorNotificationsSnapshot,
            inboxNotificationsSnapshot,
            followsByFollowerSnapshot,
            followsByTargetSnapshot,
        ] = await Promise.all([
            firestore.collection(POSTS_COLLECTION).where("userId", "==", userId).get(),
            firestore.collection("comments").where("userId", "==", userId).get(),
            firestore.collectionGroup("comments").where("userId", "==", userId).get(),
            firestore.collection("notifications").where("actorId", "==", userId).get(),
            firestore.collection("notifications").where("userId", "==", userId).get(),
            firestore.collection(FOLLOWS_COLLECTION).where("followerId", "==", userId).get(),
            firestore.collection(FOLLOWS_COLLECTION).where("targetId", "==", userId).get(),
        ]);
        const commentDocs = dedupeDocsByPath([rootCommentsSnapshot, commentsGroupSnapshot]);

        const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];

        postsSnapshot.docs.forEach((doc) => {
            operations.push((batch) => {
                batch.set(doc.ref, {
                    ...DEFAULT_DELETED_PROFILE,
                    deletedAt: now,
                    updatedAt: now,
                }, { merge: true });
            });
        });

        commentDocs.forEach((doc) => {
            operations.push((batch) => {
                batch.set(doc.ref, {
                    ...DEFAULT_DELETED_PROFILE,
                    deletedAt: now,
                    updatedAt: now,
                }, { merge: true });
            });
        });

        actorNotificationsSnapshot.docs.forEach((doc) => {
            operations.push((batch) => {
                batch.set(doc.ref, {
                    actorId: "deleted",
                    actorName: "Deleted User",
                    actorAvatar: "",
                    actorStatus: "deleted",
                    updatedAt: now,
                }, { merge: true });
            });
        });

        inboxNotificationsSnapshot.docs.forEach((doc) => {
            operations.push((batch) => {
                batch.delete(doc.ref);
            });
        });

        followsByFollowerSnapshot.docs.forEach((doc) => {
            operations.push((batch) => {
                batch.delete(doc.ref);
            });
        });

        followsByTargetSnapshot.docs.forEach((doc) => {
            operations.push((batch) => {
                batch.delete(doc.ref);
            });
        });

        const subcollections = await userRef.listCollections();
        for (const collection of subcollections) {
            const snapshot = await collection.get();
            snapshot.docs.forEach((doc) => {
                operations.push((batch) => {
                    batch.delete(doc.ref);
                });
            });
        }

        if (user.username) {
            operations.push((batch) => {
                batch.delete(firestore.collection(USERNAMES_COLLECTION).doc(String(user.username).toLowerCase()));
            });
        }

        if (user.phone) {
            operations.push((batch) => {
                batch.delete(firestore.collection(PHONES_COLLECTION).doc(String(user.phone).replace(/[^a-zA-Z0-9]/g, "")));
            });
        }

        operations.push((batch) => {
            batch.set(
                firestore.collection(ACCOUNT_DELETION_RECORDS_COLLECTION).doc(userId),
                stripUndefined({
                    id: userId,
                    userId,
                    status: "permanently_deleted",
                    username: user.username || null,
                    emailMasked: maskEmail(user.email),
                    reason: user.deletionReason || null,
                    feedback: user.deletionFeedback || "",
                    requestedAt: user.deletionRequestedAt || null,
                    scheduledDeletionAt: user.scheduledDeletionAt || null,
                    reactivatedAt: user.reactivatedAt || null,
                    deletedAt: now,
                    updatedAt: now,
                }),
                { merge: true },
            );
        });

        operations.push((batch) => {
            batch.delete(userRef);
        });

        await commitChunkedWrites(firestore, operations);

        if (adminAuth) {
            try {
                await adminAuth.deleteUser(userId);
            } catch (error: any) {
                if (error?.code !== "auth/user-not-found") {
                    console.warn(`Failed to delete auth user ${userId}:`, error);
                }
            }
        }

        return true;
    },

    processDueAccountDeletions: async (limit = 25) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(USERS_COLLECTION)
            .where("status", "==", "pending_deletion")
            .limit(limit)
            .get();

        const dueUsers = snapshot.docs
            .map((doc) => sanitizeDoc(doc) as Record<string, any> | null)
            .filter((user): user is Record<string, any> => !!user)
            .filter((user) => {
                if (!user.scheduledDeletionAt) {
                    return false;
                }
                const scheduledTime = Date.parse(String(user.scheduledDeletionAt));
                return !Number.isNaN(scheduledTime) && scheduledTime <= Date.now();
            });

        const processedUserIds: string[] = [];
        for (const user of dueUsers) {
            const wasDeleted = await db.finalizeAccountDeletion(String(user.id));
            if (wasDeleted) {
                processedUserIds.push(String(user.id));
            }
        }

        return {
            processedCount: processedUserIds.length,
            processedUserIds,
        };
    },

    deleteUser: async (id: string) => {
        await db.finalizeAccountDeletion(id);
    },

    createAuditLog: async (log: { action: string; adminId: string; adminEmail?: string; targetId: string; targetType: string; details?: string }) => {
        const firestore = checkDb();
        const logRef = firestore.collection("admin_logs").doc();
        await logRef.set({
            ...log,
            id: logRef.id,
            createdAt: new Date().toISOString(),
        });
    },

    getSettings: async () => {
        const firestore = checkDb();
        const doc = await firestore.collection("settings").doc("global").get();
        if (!doc.exists) return null;
        return doc.data();
    },

    saveSettings: async (settings: Record<string, unknown>) => {
        const firestore = checkDb();
        await firestore.collection("settings").doc("global").set(
            { ...settings, updatedAt: new Date().toISOString() },
            { merge: true }
        );
        return true;
    },

    // ── Event Operations ─────────────────────────────────────────────────────

    createEvent: async (eventData: any) => {
        const firestore = checkDb();
        const eventRef = firestore.collection(EVENTS_COLLECTION).doc();
        const finalEvent = stripUndefined({
            ...eventData,
            id: eventRef.id,
            // Firestore Timestamp for date — mobile reads as Timestamp
            date: eventData.date ? new Date(eventData.date) : null,
            // `location` mirrors `venue` for mobile EventModel compatibility
            location: eventData.venue || eventData.location || "",
            type: eventData.type || "roast",
            isFeatured: eventData.isFeatured ?? false,
            registrationOpen: eventData.registrationOpen ?? false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        await eventRef.set(finalEvent);
        return { ...finalEvent, id: eventRef.id };
    },

    getEvents: async (city?: string) => {
        const firestore = checkDb();
        let query: any = firestore.collection(EVENTS_COLLECTION).orderBy("date", "asc");
        if (city) {
            query = firestore.collection(EVENTS_COLLECTION)
                .where("city", "==", city)
                .orderBy("date", "asc");
        }
        const snapshot = await query.get();
        return snapshot.docs.map((doc: any) => sanitizeDoc(doc));
    },

    getEventById: async (id: string) => {
        const firestore = checkDb();
        const doc = await firestore.collection(EVENTS_COLLECTION).doc(id).get();
        return sanitizeDoc(doc);
    },

    updateEvent: async (id: string, updates: any) => {
        const firestore = checkDb();
        const eventRef = firestore.collection(EVENTS_COLLECTION).doc(id);
        const finalUpdates = stripUndefined({
            ...updates,
            // Convert date string to Firestore Timestamp if provided
            ...(updates.date ? { date: new Date(updates.date) } : {}),
            // Keep location in sync with venue for mobile
            ...(updates.venue ? { location: updates.venue } : {}),
            updatedAt: new Date().toISOString(),
        });
        await eventRef.update(finalUpdates);
        return await db.getEventById(id);
    },

    deleteEvent: async (id: string) => {
        const firestore = checkDb();
        await firestore.collection(EVENTS_COLLECTION).doc(id).delete();
    },

    getEventStats: async (city: string) => {
        const firestore = checkDb();
        const snapshot = await firestore.collection(REGISTRATIONS_COLLECTION)
            .where("city", "==", city)
            .get();
        return { registrationCount: snapshot.size };
    },

    // ── Battle Operations ─────────────────────────────────────────────────────

    createBattle: async (battleData: any) => {
        const firestore = checkDb();
        const ref = firestore.collection(BATTLES_COLLECTION).doc();
        const doc = stripUndefined({
            ...battleData,
            id: ref.id,
            participants: [],
            status: "upcoming",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        await ref.set(doc);
        return { ...doc, id: ref.id };
    },

    getBattles: async (type?: string, limit = 50) => {
        const firestore = checkDb();
        let query: any = firestore.collection(BATTLES_COLLECTION)
            .orderBy("startTime", "desc")
            .limit(limit);
        if (type) {
            query = firestore.collection(BATTLES_COLLECTION)
                .where("type", "==", type)
                .orderBy("startTime", "desc")
                .limit(limit);
        }
        const snap = await query.get();
        return snap.docs.map((d: any) => sanitizeDoc(d));
    },

    getBattleById: async (id: string) => {
        const firestore = checkDb();
        const doc = await firestore.collection(BATTLES_COLLECTION).doc(id).get();
        return sanitizeDoc(doc);
    },

    updateBattle: async (id: string, updates: any) => {
        const firestore = checkDb();
        const final = stripUndefined({ ...updates, updatedAt: new Date().toISOString() });
        await firestore.collection(BATTLES_COLLECTION).doc(id).update(final);
        return await db.getBattleById(id);
    },

    joinBattle: async (battleId: string, userId: string) => {
        const firestore = checkDb();
        const ref = firestore.collection(BATTLES_COLLECTION).doc(battleId);
        await ref.update({
            participants: FieldValue.arrayUnion(userId),
            updatedAt: new Date().toISOString(),
        });
    },

    exitBattle: async (battleId: string, userId: string) => {
        const firestore = checkDb();
        const ref = firestore.collection(BATTLES_COLLECTION).doc(battleId);
        await ref.update({
            participants: FieldValue.arrayRemove(userId),
            updatedAt: new Date().toISOString(),
        });
    },

    // Voting — one vote per user per battle
    castBattleVote: async (battleId: string, voterId: string, votedForId: string) => {
        const firestore = checkDb();
        const voteId = `${battleId}_${voterId}`;
        const ref = firestore.collection(BATTLE_VOTES_COLLECTION).doc(voteId);
        const existing = await ref.get();
        if (existing.exists) {
            throw new Error("Already voted in this battle");
        }
        const vote = {
            id: voteId,
            battleId,
            voterId,
            votedForId,
            createdAt: new Date().toISOString(),
        };
        await ref.set(vote);
        return vote;
    },

    getBattleVote: async (battleId: string, voterId: string) => {
        const firestore = checkDb();
        const voteId = `${battleId}_${voterId}`;
        const doc = await firestore.collection(BATTLE_VOTES_COLLECTION).doc(voteId).get();
        if (!doc.exists) return null;
        return doc.data();
    },

    getBattleVoteCount: async (battleId: string, userId: string) => {
        const firestore = checkDb();
        const snap = await firestore.collection(BATTLE_VOTES_COLLECTION)
            .where("battleId", "==", battleId)
            .where("votedForId", "==", userId)
            .get();
        return snap.size;
    },

    getAllBattleVotes: async (battleId: string) => {
        const firestore = checkDb();
        const snap = await firestore.collection(BATTLE_VOTES_COLLECTION)
            .where("battleId", "==", battleId)
            .get();
        return snap.docs.map((d: any) => d.data());
    },

    // Declare winner when battle ends and update user battle stats
    declareBattleWinner: async (battleId: string, winnerId: string, winnerUsername: string) => {
        const firestore = checkDb();
        // Update battle document
        await firestore.collection(BATTLES_COLLECTION).doc(battleId).update({
            status: "ended",
            winnerId,
            winnerUsername,
            endedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // Get all participants to update their stats
        const battleDoc = await firestore.collection(BATTLES_COLLECTION).doc(battleId).get();
        const battle = battleDoc.data();
        if (!battle) return;

        const participants: string[] = battle.participants || [];
        const batch = firestore.batch();

        for (const userId of participants) {
            const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
            const userDoc = await userRef.get();
            if (!userDoc.exists) continue;
            const userData = userDoc.data() || {};

            const isWinner = userId === winnerId;
            const prevWins = userData.battleWins || 0;
            const prevLosses = userData.battleLosses || 0;
            const prevParticipations = userData.battleParticipations || 0;
            const prevStreak = userData.currentWinStreak || 0;
            const prevMaxStreak = userData.maxWinStreak || 0;
            const prevBestScore = userData.bestScore || 0;

            const newWins = prevWins + (isWinner ? 1 : 0);
            const newLosses = prevLosses + (isWinner ? 0 : 1);
            const newParticipations = prevParticipations + 1;
            const newStreak = isWinner ? prevStreak + 1 : 0;
            const newMaxStreak = Math.max(prevMaxStreak, newStreak);
            const totalGames = newWins + newLosses;
            const winRate = totalGames > 0 ? Math.round((newWins / totalGames) * 100) : 0;
            const eligiblePerformer = newWins >= 5;

            // Compute badges
            const { computeBadges, computeRank } = await import("@/lib/models/battle");
            const badges = computeBadges({ battleWins: newWins, battleParticipations: newParticipations, currentWinStreak: newStreak, maxWinStreak: newMaxStreak });
            const currentRank = computeRank(newWins);

            batch.update(userRef, stripUndefined({
                battleWins: newWins,
                battleLosses: newLosses,
                battleParticipations: newParticipations,
                currentWinStreak: newStreak,
                maxWinStreak: newMaxStreak,
                winRate,
                eligiblePerformer,
                badges,
                currentRank,
                updatedAt: new Date().toISOString(),
            }));
        }

        await batch.commit();
    },

    getUserBattleStats: async (userId: string) => {
        const firestore = checkDb();
        const userDoc = await firestore.collection(USERS_COLLECTION).doc(userId).get();
        if (!userDoc.exists) return null;
        const u = userDoc.data() || {};
        return {
            battleParticipations: u.battleParticipations || 0,
            battleWins: u.battleWins || 0,
            battleLosses: u.battleLosses || 0,
            winRate: u.winRate || 0,
            currentWinStreak: u.currentWinStreak || 0,
            maxWinStreak: u.maxWinStreak || 0,
            bestScore: u.bestScore || 0,
            badges: u.badges || [],
            eligiblePerformer: u.eligiblePerformer || false,
            currentRank: u.currentRank || "unranked",
        };
    },

    getUserBattleHistory: async (userId: string, limit = 20) => {
        const firestore = checkDb();
        const snap = await firestore.collection(BATTLES_COLLECTION)
            .where("participants", "array-contains", userId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();
        return snap.docs.map((d: any) => sanitizeDoc(d));
    },
};
