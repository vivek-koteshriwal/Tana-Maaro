import { auth, db, storage } from "@/lib/firebase";
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export interface PostData {
    id: string;
    userId: string;
    userName: string;
    userHandle: string;
    userAvatar: string;
    content: string;
    image?: string;
    likes: number;
    comments: number;
    shares: number;
    createdAt: unknown;
    type: "text" | "image" | "video" | "mixed";
    battleId?: string | null;
}

const POSTS_COLLECTION = "posts";

export const PostService = {
    getFeed: async (page = 1, pageSize = 20, battleId?: string) => {
        const firestore = db;
        if (!firestore) return [];

        try {
            const postsRef = collection(firestore, POSTS_COLLECTION);
            const pageOffset = Math.max(0, page - 1) * pageSize;
            const feedQuery = battleId
                ? query(postsRef, where("battleId", "==", battleId), orderBy("createdAt", "desc"), limit(page * pageSize))
                : query(postsRef, orderBy("createdAt", "desc"), limit(page * pageSize));

            const snapshot = await getDocs(feedQuery);
            return snapshot.docs.slice(pageOffset).map((item) => ({
                id: item.id,
                ...item.data(),
                createdAt: item.data().createdAt?.toMillis?.() || Date.now(),
            })) as PostData[];
        } catch (error) {
            console.error("Error fetching feed:", error);
            return [];
        }
    },

    async createPost(
        user: {
            id?: string;
            uid?: string;
            name?: string;
            displayName?: string;
            handle?: string;
            username?: string;
            avatar?: string;
            profileImage?: string;
            photoURL?: string;
        },
        content: string,
        mediaFile?: File | null,
        battleId?: string,
        mediaType?: "image" | "video",
    ) {
        const firestore = db;
        const bucket = storage;
        if (!firestore || !bucket) throw new Error("Firebase not initialized");

        try {
            let imageUrl = "";
            const resolvedMediaType =
                mediaType ||
                (mediaFile?.type?.startsWith("video/") ? "video" : mediaFile ? "image" : "text");

            if (mediaFile) {
                const storageRef = ref(
                    bucket,
                    `posts/${user.id || user.uid}/${Date.now()}_${mediaFile.name}`,
                );
                const snapshot = await uploadBytes(storageRef, mediaFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(firestore, POSTS_COLLECTION), {
                userId: user.id || user.uid,
                userName: user.name || user.displayName || "Anonymous",
                userHandle: user.handle || user.username || "@anon",
                userAvatar: user.avatar || user.profileImage || user.photoURL || "",
                content,
                image: imageUrl || null,
                likes: 0,
                comments: 0,
                shares: 0,
                likedBy: [],
                dislikedBy: [],
                type: imageUrl ? resolvedMediaType : "text",
                battleId: battleId || null,
                createdAt: serverTimestamp(),
            });

            return true;
        } catch (error) {
            console.error("Error creating post:", error);
            throw error;
        }
    },

    async reactToPost(postId: string, type: "like" | "dislike") {
        const firestore = db;
        const currentUser = auth?.currentUser;
        if (!firestore || !currentUser) return null;

        const postRef = doc(firestore, POSTS_COLLECTION, postId);

        await runTransaction(firestore, async (transaction) => {
            const snapshot = await transaction.get(postRef);
            if (!snapshot.exists()) throw new Error("Post not found");

            const data = snapshot.data();
            const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
            const dislikedBy = Array.isArray(data.dislikedBy) ? data.dislikedBy : [];
            const hasLiked = likedBy.includes(currentUser.uid);
            const hasDisliked = dislikedBy.includes(currentUser.uid);

            if (type === "like") {
                if (hasLiked) {
                    transaction.update(postRef, {
                        likedBy: arrayRemove(currentUser.uid),
                        likes: increment(-1),
                    });
                    return;
                }

                const updates: Record<string, unknown> = {
                    likedBy: arrayUnion(currentUser.uid),
                    likes: increment(1),
                };

                if (hasDisliked) {
                    updates.dislikedBy = arrayRemove(currentUser.uid);
                    updates.dislikes = increment(-1);
                }

                transaction.update(postRef, updates);
                return;
            }

            if (hasDisliked) {
                transaction.update(postRef, {
                    dislikedBy: arrayRemove(currentUser.uid),
                    dislikes: increment(-1),
                });
                return;
            }

            const updates: Record<string, unknown> = {
                dislikedBy: arrayUnion(currentUser.uid),
                dislikes: increment(1),
            };

            if (hasLiked) {
                updates.likedBy = arrayRemove(currentUser.uid);
                updates.likes = increment(-1);
            }

            transaction.update(postRef, updates);
        });

        const updated = await getDoc(postRef);
        const data = updated.data();
        if (!data) return null;

        return {
            ...data,
            id: updated.id,
            likes: Array.isArray(data.likedBy) ? data.likedBy.length : (data.likes || 0),
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            dislikedBy: Array.isArray(data.dislikedBy) ? data.dislikedBy : [],
            createdAt: data.createdAt?.toMillis?.() || Date.now(),
        };
    },

    async sharePost(postId: string) {
        const firestore = db;
        if (!firestore) return;

        const postRef = doc(firestore, POSTS_COLLECTION, postId);
        await updateDoc(postRef, {
            shares: increment(1),
        });
    },

    async addComment(postId: string, user: {
        id?: string;
        uid?: string;
        name?: string;
        username?: string;
        handle?: string;
        avatar?: string;
        profileImage?: string;
    }, text: string) {
        const firestore = db;
        if (!firestore) return false;

        try {
            const commentsRef = collection(firestore, POSTS_COLLECTION, postId, "comments");
            await addDoc(commentsRef, {
                userId: user.id || user.uid,
                userName: user.name || "Anonymous",
                userHandle: user.username || user.handle || "anon",
                userAvatar: user.avatar || user.profileImage || "",
                content: text,
                createdAt: serverTimestamp(),
            });

            const postRef = doc(firestore, POSTS_COLLECTION, postId);
            await updateDoc(postRef, {
                comments: increment(1),
            });

            return true;
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    },

    async getComments(postId: string) {
        const firestore = db;
        if (!firestore) return [];

        try {
            const commentsRef = collection(firestore, POSTS_COLLECTION, postId, "comments");
            const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"), limit(50));
            const snapshot = await getDocs(commentsQuery);

            return snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
                createdAt: item.data().createdAt?.toMillis?.() || Date.now(),
            }));
        } catch (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
    },

    async getHiddenPostIds(userId: string) {
        const firestore = db;
        if (!firestore || !userId) return [];

        try {
            const snapshot = await getDocs(collection(firestore, "users", userId, "hiddenPosts"));
            return snapshot.docs.map((item) => item.id);
        } catch (error) {
            console.error("Error fetching hidden posts:", error);
            return [];
        }
    },

    async hidePost(postId: string) {
        const firestore = db;
        const currentUser = auth?.currentUser;
        if (!firestore || !currentUser) return false;

        try {
            await setDoc(doc(firestore, "users", currentUser.uid, "hiddenPosts", postId), {
                postId,
                createdAt: serverTimestamp(),
            });
            return true;
        } catch (error) {
            console.error("Error hiding post:", error);
            return false;
        }
    },
};
