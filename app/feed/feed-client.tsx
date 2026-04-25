"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Flame, X, Zap, TrendingUp } from "lucide-react";
import { collection, limit as firestoreLimit, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { FeedCard } from "@/components/feed/feed-card";
import { CreatePost } from "@/components/feed/create-post";
import { useAuth } from "@/components/auth/auth-provider";
import { sortFeedPosts } from "@/lib/feed-ranking";
import { db as firebaseDb } from "@/lib/firebase";
import { Post } from "@/types/feed";
import { PostService } from "@/lib/services/post-service";
import { cn } from "@/lib/utils";

type FeedTab = "latest" | "trending";

const PAGE_SIZE = 10;
const HIDDEN_POSTS_STORAGE_KEY = "tanamaaro:hidden-posts";

type RawFeedPost = {
    id: string;
    content?: string;
    image?: string;
    mediaUrl?: string;
    videoUrl?: string;
    likes?: number;
    dislikes?: number;
    likedBy?: string[];
    dislikedBy?: string[];
    comments?: number | Post["comments"];
    shares?: number;
    saves?: number;
    views?: number;
    ctr?: number;
    lastEngagementAt?: string | number | Date | { toDate?: () => Date } | null;
    createdAt?: string | number | Date | { toDate?: () => Date } | null;
    timestamp?: string | number | Date | { toDate?: () => Date } | null;
    type?: Post["type"];
    mediaType?: Post["type"];
    battleId?: string | null;
    sharedFromPostId?: string;
    sharedFromUser?: Post["sharedFromUser"];
    status?: string;
    isLiked?: boolean;
    isDisliked?: boolean;
    userId: string;
    userName?: string;
    username?: string;
    userHandle?: string;
    userAvatar?: string;
};

function toIsoTimestamp(value: RawFeedPost["createdAt"] | RawFeedPost["timestamp"]) {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === "number") {
        return new Date(value).toISOString();
    }

    if (typeof value === "string") {
        return value;
    }

    if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
        return value.toDate().toISOString();
    }

    return new Date().toISOString();
}

function normalizePost(raw: RawFeedPost, viewerId?: string): Post {
    const likedBy = Array.isArray(raw.likedBy) ? raw.likedBy : [];
    const dislikedBy = Array.isArray(raw.dislikedBy) ? raw.dislikedBy : [];
    const commentsValue = typeof raw.comments === "number"
        ? raw.comments
        : Array.isArray(raw.comments)
            ? raw.comments
            : [];
    const timestampValue = toIsoTimestamp(raw.createdAt ?? raw.timestamp);

    return {
        id: raw.id,
        content: raw.content || "",
        image: raw.image || raw.mediaUrl || raw.videoUrl,
        likes: typeof raw.likes === "number" ? raw.likes : likedBy.length,
        dislikes: typeof raw.dislikes === "number" ? raw.dislikes : dislikedBy.length,
        comments: commentsValue,
        commentsCount: typeof raw.comments === "number"
            ? raw.comments
            : Array.isArray(raw.comments)
                ? raw.comments.length
                : 0,
        shares: raw.shares || 0,
        saves: raw.saves || 0,
        views: raw.views || 0,
        ctr: raw.ctr || 0,
        timestamp: timestampValue,
        lastEngagementAt: raw.lastEngagementAt ? toIsoTimestamp(raw.lastEngagementAt) : undefined,
        type: raw.type || raw.mediaType || (raw.image ? "mixed" : "text"),
        battleId: raw.battleId || null,
        sharedFromPostId: raw.sharedFromPostId,
        sharedFromUser: raw.sharedFromUser,
        status: raw.status,
        isLiked: viewerId ? likedBy.includes(viewerId) : !!raw.isLiked,
        isDisliked: viewerId ? dislikedBy.includes(viewerId) : !!raw.isDisliked,
        user: {
            id: raw.userId,
            name: raw.userName || "Unknown",
            username: (raw.username || raw.userHandle || "anon").replace(/^@/, ""),
            profileImage: raw.userAvatar,
            showRealName: true,
        },
    };
}

function sortPosts(posts: Post[], tab: FeedTab) {
    return sortFeedPosts(posts, tab);
}

function mergePosts(current: Post[], incoming: Post[], tab: FeedTab) {
    const byId = new Map<string, Post>();
    incoming.forEach((post) => byId.set(post.id, post));
    current.forEach((post) => {
        if (!byId.has(post.id)) byId.set(post.id, post);
    });
    return sortPosts(Array.from(byId.values()), tab);
}

function sameHiddenIds(left: string[], right: string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

export default function FeedClient() {
    const [activeTab, setActiveTab] = useState<FeedTab>("latest");
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [hiddenPostIds, setHiddenPostIds] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];

        try {
            const rawValue = window.localStorage.getItem(HIDDEN_POSTS_STORAGE_KEY);
            const parsedValue = rawValue ? JSON.parse(rawValue) : [];
            return Array.isArray(parsedValue) ? parsedValue.filter((item): item is string => typeof item === "string") : [];
        } catch {
            return [];
        }
    });
    const { user } = useAuth();
    const loaderRef = useRef<HTMLDivElement>(null);
    const hiddenPostIdsRef = useRef(hiddenPostIds);

    const combineHiddenIds = useCallback((incomingIds: string[]) => {
        return Array.from(new Set([...hiddenPostIdsRef.current, ...incomingIds]));
    }, []);

    const buildFeedUrl = useCallback((currentPage: number, tab: FeedTab) => {
        return `/api/posts?page=${currentPage}&limit=${PAGE_SIZE}&sort=${tab}`;
    }, []);

    const readFeedPage = useCallback(async (currentPage = 1, tab = activeTab) => {
        const [feedResponse, nextHiddenPostIds] = await Promise.all([
            fetch(buildFeedUrl(currentPage, tab), {
                credentials: "include",
                cache: "no-store",
            }),
            user?.id ? PostService.getHiddenPostIds(user.id) : Promise.resolve([]),
        ]);

        if (!feedResponse.ok) {
            throw new Error(`Feed request failed with status ${feedResponse.status}`);
        }

        const rawPosts = await feedResponse.json();
        const hiddenIds = combineHiddenIds(nextHiddenPostIds || []);
        const mappedPosts = Array.isArray(rawPosts)
            ? rawPosts
                .map((post) => normalizePost(post as RawFeedPost, user?.id))
                .filter((post) => !post.battleId && !hiddenIds.includes(post.id))
            : [];

        return {
            hiddenIds,
            mappedPosts,
        };
    }, [activeTab, buildFeedUrl, combineHiddenIds, user?.id]);

    const fetchPosts = useCallback(async (currentPage = 1, append = false, tab = activeTab) => {
        if (currentPage === 1 && !append) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const { mappedPosts, hiddenIds } = await readFeedPage(currentPage, tab);
            setHiddenPostIds((prev) => sameHiddenIds(prev, hiddenIds) ? prev : hiddenIds);
            setHasMore(mappedPosts.length >= PAGE_SIZE);
            setPosts((prev) => append ? mergePosts(prev, mappedPosts, tab) : sortPosts(mappedPosts, tab));
        } catch (error) {
            console.error("Failed to load feed", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeTab, readFeedPage]);

    const syncPosts = useCallback(async (tab = activeTab) => {
        if (typeof document !== "undefined" && document.visibilityState !== "visible") {
            return;
        }

        try {
            const { mappedPosts, hiddenIds } = await readFeedPage(1, tab);

            setHiddenPostIds((prev) => sameHiddenIds(prev, hiddenIds) ? prev : hiddenIds);
            setPosts((prev) => mergePosts(
                prev.filter((post) => !hiddenIds.includes(post.id)),
                mappedPosts,
                tab,
            ));
        } catch (error) {
            console.error("Feed sync failed", error);
        }
    }, [activeTab, readFeedPage]);

    const switchTab = (tab: FeedTab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setPage(1);
        setHasMore(true);
        void fetchPosts(1, false, tab);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        hiddenPostIdsRef.current = hiddenPostIds;
        try {
            window.localStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify(hiddenPostIds));
        } catch {
            // ignore storage errors
        }
    }, [hiddenPostIds]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        void fetchPosts(1, false, activeTab);
    }, [fetchPosts, activeTab]);

    useEffect(() => {
        if (!firebaseDb) {
            return;
        }

        const liveQuery = query(
            collection(firebaseDb, "posts"),
            orderBy("createdAt", "desc"),
            firestoreLimit(PAGE_SIZE * 8),
        );

        const unsubscribe = onSnapshot(
            liveQuery,
            async (snapshot) => {
                try {
                    const nextHiddenPostIds = user?.id
                        ? await PostService.getHiddenPostIds(user.id)
                        : [];
                    const hiddenIds = combineHiddenIds(nextHiddenPostIds || []);
                    const livePosts = snapshot.docs
                        .map((doc) => normalizePost(
                            {
                                id: doc.id,
                                ...(doc.data() as Omit<RawFeedPost, "id">),
                            },
                            user?.id,
                        ))
                        .filter((post) => !post.battleId && !hiddenIds.includes(post.id));

                    setHiddenPostIds((prev) => sameHiddenIds(prev, hiddenIds) ? prev : hiddenIds);
                    setPosts((prev) => mergePosts(
                        prev.filter((post) => !hiddenIds.includes(post.id)),
                        livePosts,
                        activeTab,
                    ));
                } catch (error) {
                    console.error("Realtime feed sync failed", error);
                }
            },
            (error) => {
                console.warn("Realtime feed unavailable", error);
            },
        );

        return () => unsubscribe();
    }, [activeTab, combineHiddenIds, user?.id]);

    useEffect(() => {
        const handleVisibleSync = () => {
            void syncPosts(activeTab);
        };

        const intervalId = window.setInterval(handleVisibleSync, 8000);
        window.addEventListener("focus", handleVisibleSync);
        document.addEventListener("visibilitychange", handleVisibleSync);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleVisibleSync);
            document.removeEventListener("visibilitychange", handleVisibleSync);
        };
    }, [activeTab, syncPosts]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchPosts(nextPage, true, activeTab);
                }
            },
            { rootMargin: "400px" },
        );

        const loader = loaderRef.current;
        if (loader) observer.observe(loader);
        return () => {
            if (loader) observer.unobserve(loader);
        };
    }, [activeTab, fetchPosts, hasMore, loading, loadingMore, page]);

    return (
        <div className="relative min-h-screen bg-[#0E0E0E] text-white">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(255,142,132,0.16),transparent_64%)]" />

            <header className="sticky top-16 z-30 border-b border-white/5 bg-[#0E0E0E]/90 backdrop-blur-2xl">
                <div className="mx-auto flex w-full max-w-[600px] items-center gap-8 px-6">
                    <TabButton
                        label="Latest"
                        icon={<Zap className="h-4 w-4" />}
                        active={activeTab === "latest"}
                        onClick={() => switchTab("latest")}
                    />
                    <TabButton
                        label="Trending"
                        icon={<TrendingUp className="h-4 w-4" />}
                        active={activeTab === "trending"}
                        onClick={() => switchTab("trending")}
                    />
                </div>
            </header>

            <main className="relative mx-auto w-full max-w-[600px] px-4 pb-32 pt-6 sm:px-6 md:px-0">
                {loading && posts.length === 0 ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((item) => <SkeletonCard key={item} />)}
                    </div>
                ) : posts.length === 0 ? (
                    <EmptyState isLoggedIn={!!user} onCompose={() => setShowCreate(true)} />
                ) : (
                    <section className="space-y-6">
                        {posts.map((post) => (
                            <FeedCard
                                key={post.id}
                                post={post}
                                isOwner={user?.id === post.user.id}
                                onDelete={() => setPosts((prev) => prev.filter((item) => item.id !== post.id))}
                                onHide={() => {
                                    setHiddenPostIds((prev) => prev.includes(post.id) ? prev : [...prev, post.id]);
                                    setPosts((prev) => prev.filter((item) => item.id !== post.id));
                                }}
                            />
                        ))}
                    </section>
                )}

                <div ref={loaderRef} className="flex h-10 items-center justify-center">
                    {loadingMore && (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FF8E84]/30 border-t-[#FF8E84]" />
                    )}
                </div>

                {!hasMore && posts.length > 0 && (
                    <p className="py-6 text-center text-[12px] font-semibold tracking-wide text-[#ABABAB]">
                        You&apos;ve reached the end of the chaos.
                    </p>
                )}
            </main>

            <button
                type="button"
                aria-label="Create post"
                onClick={() => setShowCreate(true)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF8E84] text-[#650007] shadow-[0_4px_24px_rgba(255,59,59,0.3)] transition-all duration-200 hover:scale-110 active:scale-95 lg:right-12"
            >
                <Plus className="h-7 w-7" strokeWidth={3} />
            </button>

            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowCreate(false)}
                    />
                    <div className="relative z-10 w-full max-w-[600px] overflow-hidden rounded-t-[28px] bg-[#141414] shadow-2xl animate-in slide-in-from-bottom-4 duration-200 sm:rounded-[28px]">
                        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-white/10 sm:hidden" />
                        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                            <span className="font-epilogue text-[13px] font-bold uppercase tracking-[0.18em] text-[#FF8E84]">
                                Drop a Roast
                            </span>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setShowCreate(false)}
                                className="rounded-full p-1.5 text-[#ABABAB] transition-colors hover:bg-white/5 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                            <CreatePost
                                onPostCreated={(createdPost) => {
                                    setShowCreate(false);
                                    setPage(1);

                                    const createdPostId = typeof createdPost.id === "string" ? createdPost.id : null;

                                    if (createdPostId && !hiddenPostIdsRef.current.includes(createdPostId)) {
                                        setPosts((prev) => mergePosts(
                                            prev,
                                            [normalizePost(createdPost as RawFeedPost, user?.id)],
                                            activeTab,
                                        ));
                                    }

                                    void syncPosts(activeTab);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TabButton({
    label,
    icon,
    active,
    onClick,
}: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex cursor-pointer flex-col items-center gap-2 pt-4"
        >
            <div className={cn(
                "flex items-center gap-2 pb-3 transition-all duration-200",
                active
                    ? "border-b-4 border-[#FF3B3B] text-white"
                    : "text-[#ABABAB] hover:text-white",
            )}>
                {icon}
                <span className="font-epilogue text-sm font-bold uppercase tracking-[0.12em]">
                    {label}
                </span>
            </div>
        </button>
    );
}

function SkeletonCard() {
    return (
        <article className="animate-pulse rounded-xl border border-white/5 bg-[#191919] p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-[#262626]" />
                <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 rounded-full bg-[#262626]" />
                    <div className="h-2.5 w-20 rounded-full bg-[#262626]" />
                </div>
                <div className="h-7 w-7 rounded-full bg-[#262626]" />
            </div>
            <div className="mt-4 space-y-2">
                <div className="h-3 rounded-full bg-[#262626]" />
                <div className="h-3 w-4/5 rounded-full bg-[#262626]" />
                <div className="h-3 w-3/5 rounded-full bg-[#262626]" />
            </div>
            <div className="mt-4 aspect-video rounded-[20px] bg-[#222]" />
            <div className="mt-4 flex gap-5">
                <div className="h-5 w-12 rounded-full bg-[#262626]" />
                <div className="h-5 w-12 rounded-full bg-[#262626]" />
                <div className="ml-auto h-5 w-5 rounded-full bg-[#262626]" />
            </div>
        </article>
    );
}

function EmptyState({ onCompose, isLoggedIn }: { onCompose: () => void; isLoggedIn: boolean }) {
    return (
        <article className="rounded-[28px] bg-[#191919] px-6 py-12 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8E84]/10">
                <Flame className="h-6 w-6 text-[#FF8E84]" />
            </div>
            <h2 className="font-epilogue text-[24px] font-black uppercase tracking-[0.06em] text-white">
                Quiet Arena
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-6 text-[#ABABAB]">
                No roasts have landed yet. Break the silence and give the wall its first hit.
            </p>
            {isLoggedIn ? (
                <button
                    type="button"
                    onClick={onCompose}
                    className="mt-6 rounded-full bg-[#FF8E84] px-5 py-3 text-[13px] font-bold uppercase tracking-[0.18em] text-[#650007] transition-transform hover:scale-[1.02]"
                >
                    Drop a Roast
                </button>
            ) : (
                <Link
                    href="/login"
                    className="mt-6 inline-block rounded-full bg-[#FF8E84] px-5 py-3 text-[13px] font-bold uppercase tracking-[0.18em] text-[#650007] transition-transform hover:scale-[1.02]"
                >
                    Join & Roast
                </Link>
            )}
        </article>
    );
}
