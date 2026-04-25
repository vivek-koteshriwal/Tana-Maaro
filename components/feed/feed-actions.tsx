"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, MessageCircle, Share2, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { PostShareDialog } from "@/components/feed/post-share-dialog";
import { RoastAvatar } from "@/components/shared/roast-avatar";

import { cn, formatCompactCount } from "@/lib/utils";

interface FeedActionsProps {
    postId: string;
    likes: number;
    dislikes?: number;
    isLiked?: boolean;
    isDisliked?: boolean;
    comments: number;
    onCommentClick: () => void;
}

interface LikeUser {
    id: string;
    name?: string;
    username?: string;
    profileImage?: string;
}

export function FeedActions({
    postId,
    likes: initialLikes,
    dislikes: initialDislikes = 0,
    isLiked: initialIsLiked,
    isDisliked: initialIsDisliked,
    comments,
    onCommentClick,
}: FeedActionsProps) {
    const { user } = useAuth();
    const isAuthenticated = !!user;

    const [likes, setLikes] = useState(initialLikes);
    const [dislikes, setDislikes] = useState(initialDislikes);
    const [liked, setLiked] = useState(initialIsLiked || false);
    const [disliked, setDisliked] = useState(initialIsDisliked || false);
    const [showLogin, setShowLogin] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [likeUsers, setLikeUsers] = useState<LikeUser[]>([]);
    const [loadingLikes, setLoadingLikes] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);

    useEffect(() => {
        setLikes(initialLikes);
    }, [initialLikes]);

    useEffect(() => {
        setDislikes(initialDislikes);
    }, [initialDislikes]);

    useEffect(() => {
        setLiked(initialIsLiked || false);
    }, [initialIsLiked]);

    useEffect(() => {
        setDisliked(initialIsDisliked || false);
    }, [initialIsDisliked]);

    const openLikesModal = async () => {
        if (likes === 0) return;
        setShowLikesModal(true);
        setLoadingLikes(true);
        try {
            const response = await fetch(`/api/posts/${postId}/likes`, {
                credentials: "include",
                cache: "no-store",
            });
            if (response.ok) {
                const data = await response.json();
                setLikeUsers(Array.isArray(data) ? data as LikeUser[] : []);
            }
        } catch (error) {
            console.error("Failed to load likes", error);
        } finally {
            setLoadingLikes(false);
        }
    };

    const handleReaction = async (type: "like" | "dislike") => {
        if (!isAuthenticated) {
            setShowLogin(true);
            return;
        }

        const previousState = { likes, dislikes, liked, disliked };

        if (type === "like") {
            if (liked) {
                setLikes((v) => Math.max(0, v - 1));
                setLiked(false);
            } else {
                setLikes((v) => v + 1);
                setLiked(true);
                if (disliked) {
                    setDisliked(false);
                    setDislikes((v) => Math.max(0, v - 1));
                }
            }
        } else {
            if (disliked) {
                setDislikes((v) => Math.max(0, v - 1));
                setDisliked(false);
            } else {
                setDislikes((v) => v + 1);
                setDisliked(true);
                if (liked) {
                    setLikes((v) => Math.max(0, v - 1));
                    setLiked(false);
                }
            }
        }

        try {
            const response = await fetch(`/api/posts/${postId}/react`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ type }),
            });

            if (!response.ok) {
                if (response.status === 401) setShowLogin(true);
                throw new Error("Reaction request failed");
            }

            const data = await response.json();
            const nextLikedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
            const nextDislikedBy = Array.isArray(data.dislikedBy) ? data.dislikedBy : [];

            setLikes(typeof data.likes === "number" ? data.likes : nextLikedBy.length);
            setDislikes(typeof data.dislikes === "number" ? data.dislikes : nextDislikedBy.length);
            if (user?.id) {
                setLiked(nextLikedBy.includes(user.id));
                setDisliked(nextDislikedBy.includes(user.id));
            }
        } catch (error) {
            console.error("Failed to react", error);
            setLikes(previousState.likes);
            setDislikes(previousState.dislikes);
            setLiked(previousState.liked);
            setDisliked(previousState.disliked);
        }
    };

    return (
        <>
            <div className="flex items-center px-0 py-0">
                {/* Fire reaction */}
                <button
                    type="button"
                    aria-label="Fire reaction"
                    onClick={() => handleReaction("like")}
                    className="group flex items-center gap-1.5"
                >
                    <Flame className={cn(
                        "h-[19px] w-[19px] transition-transform group-active:scale-90",
                        liked
                            ? "fill-[#FF3B3B] text-[#FF3B3B]"
                            : "text-[#ABABAB] group-hover:text-[#FF3B3B]",
                    )} />
                    <span
                        onClick={(e) => { e.stopPropagation(); openLikesModal(); }}
                        className="text-[12px] font-extrabold text-[#ABABAB] group-hover:text-[#FF8E84]"
                    >
                        {formatCompactCount(likes)}
                    </span>
                </button>

                <div className="w-[18px]" />

                {/* Comments / Forum */}
                <button
                    type="button"
                    aria-label="Open taunts"
                    onClick={onCommentClick}
                    className="group flex items-center gap-1.5"
                >
                    <MessageCircle className="h-[19px] w-[19px] text-[#ABABAB] transition-transform group-hover:text-white group-active:scale-90" />
                    <span className="text-[12px] font-extrabold text-[#ABABAB] group-hover:text-white">
                        {formatCompactCount(comments)}
                    </span>
                </button>

                <div className="w-[18px]" />

                {/* Dislike */}
                <button
                    type="button"
                    aria-label="Dislike"
                    onClick={() => handleReaction("dislike")}
                    className="group flex items-center gap-1.5"
                >
                    <ThumbsDown className={cn(
                        "h-[19px] w-[19px] transition-transform group-active:scale-90",
                        disliked
                            ? "fill-[#FF6E84] text-[#FF6E84]"
                            : "text-[#ABABAB] group-hover:text-[#FF6E84]",
                    )} />
                    <span className="text-[12px] font-extrabold text-[#ABABAB] group-hover:text-white">
                        {formatCompactCount(dislikes)}
                    </span>
                </button>

                <div className="flex-1" />

                {/* Share */}
                <button
                    type="button"
                    aria-label="Share post"
                    onClick={() => setShowShareDialog(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#ABABAB] transition-colors hover:bg-white/5 hover:text-[#FF8E84]"
                >
                    <Share2 className="h-[22px] w-[22px]" />
                </button>
            </div>

            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

            <Dialog open={showLikesModal} onOpenChange={setShowLikesModal}>
                <DialogContent className="border border-white/10 bg-[#141414] text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-epilogue text-xl font-black uppercase tracking-[0.14em] text-[#FF8E84]">
                            Fired By
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                        {loadingLikes ? (
                            <div className="py-4 text-center text-[#8A8A8A]">Loading...</div>
                        ) : likeUsers.length === 0 ? (
                            <div className="py-4 text-center text-[#8A8A8A]">No data found.</div>
                        ) : (
                            likeUsers.map((item) => (
                                <Link
                                    href={`/profile/${encodeURIComponent((item.username ?? "anon").replace(/^@/, ""))}`}
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]"
                                >
                                    <RoastAvatar
                                        value={item.profileImage}
                                        fallbackSeed={item.id || item.username || item.name}
                                        alt={item.name || item.username || "User"}
                                        size={40}
                                        className="border border-white/10"
                                    />
                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-[0.4px] text-[#FF3B3B]">
                                            @{(item.username || item.name || "anon").replace(/^@/, "").toUpperCase()}
                                        </p>
                                        {item.username && item.username !== "anon" && (
                                            <p className="text-xs text-[#8A8A8A]">{item.name}</p>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <PostShareDialog
                postId={postId}
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
            />
        </>
    );
}
