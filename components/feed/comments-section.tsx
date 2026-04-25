"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { RoastAvatar } from "@/components/shared/roast-avatar";

interface Comment {
    id: string;
    userId: string;
    userName: string;
    username?: string;
    userProfileImage?: string;
    userAvatar?: string;
    content: string;
    createdAt: number;
}

interface CommentsSectionProps {
    postId: string;
    isOpen: boolean;
    onCommentAdded?: () => void;
}

type ApiComment = {
    id: string;
    userId: string;
    userName?: string;
    userHandle?: string;
    username?: string;
    userProfileImage?: string;
    userAvatar?: string;
    content?: string;
    createdAt?: string | number;
};

export function CommentsSection({ postId, isOpen, onCommentAdded }: CommentsSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const normalizeComment = (comment: ApiComment): Comment => ({
        id: comment.id,
        userId: comment.userId,
        userName: comment.userName || "Anonymous",
        username: (comment.userHandle || comment.username || "anon").replace(/^@/, ""),
        userProfileImage: comment.userProfileImage,
        userAvatar: comment.userAvatar,
        content: comment.content || "",
        createdAt: typeof comment.createdAt === "number"
            ? comment.createdAt
            : new Date(comment.createdAt || Date.now()).getTime(),
    });

    const loadComments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                credentials: "include",
                cache: "no-store",
            });
            const data = await response.json();
            setComments(Array.isArray(data) ? data.map((item) => normalizeComment(item as ApiComment)) : []);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        if (isOpen) {
            loadComments();
        }
    }, [isOpen, loadComments]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newComment.trim()) return;

        if (!user) {
            setShowLogin(true);
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ content: newComment }),
            });

            if (!response.ok) {
                if (response.status === 401) setShowLogin(true);
                throw new Error("Comment submission failed");
            }

            const createdComment = await response.json();
            setNewComment("");
            setComments((prev) => [normalizeComment(createdComment as ApiComment), ...prev]);
            onCommentAdded?.();
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="mt-3 animate-in slide-in-from-top-1 fade-in duration-150">
            <div className="rounded-[24px] bg-[#131313] p-3 sm:p-4">
                {user ? (
                    <form onSubmit={handleSubmit} className="mb-4 flex items-center gap-3 rounded-[20px] bg-[#1D1D1D] px-3 py-3">
                        <RoastAvatar
                            value={user.profileImage}
                            fallbackSeed={user.id || user.username || user.name}
                            alt={user.name}
                            size={36}
                            className="flex-shrink-0 border border-white/10"
                        />
                        <input
                            type="text"
                            placeholder="Add a taunt..."
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[#7D7D7D]"
                            aria-label="Add a taunt"
                        />
                        <button
                            type="submit"
                            aria-label="Post taunt"
                            disabled={submitting || !newComment.trim()}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FF8E84]/14 text-[#FF8E84] transition-colors hover:bg-[#FF8E84]/22 disabled:opacity-40"
                        >
                            {submitting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border border-[#FF8E84]/30 border-t-[#FF8E84]" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowLogin(true)}
                        className="mb-4 flex w-full items-center justify-center rounded-[20px] bg-[#1D1D1D] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-[#ABABAB] transition-colors hover:text-white"
                    >
                        Sign In To Taunt
                    </button>
                )}

                <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {loading ? (
                        <p className="py-5 text-center text-[12px] text-[#ABABAB]">Loading taunts...</p>
                    ) : comments.length === 0 ? (
                        <p className="py-5 text-center text-[12px] text-[#ABABAB]">No taunts yet. Go first.</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <Link
                                    href={`/profile/${encodeURIComponent(comment.username || "anon")}`}
                                    className="mt-0.5 flex-shrink-0"
                                >
                                    <RoastAvatar
                                        value={comment.userProfileImage || comment.userAvatar}
                                        fallbackSeed={comment.userId || comment.username || comment.userName}
                                        alt={comment.userName}
                                        size={36}
                                        className="border border-white/10"
                                    />
                                </Link>
                                <div className="min-w-0 flex-1 rounded-[18px] bg-[#1B1B1B] px-3 py-2.5">
                                    <div className="mb-1 flex items-center gap-2">
                                        <Link href={`/profile/${encodeURIComponent(comment.username || "anon")}`}>
                                            <span className="text-[12px] font-bold uppercase tracking-[0.3px] text-[#FF3B3B] transition-colors hover:text-[#FF8E84]">
                                                @{(comment.username || "anonymous").toUpperCase()}
                                            </span>
                                        </Link>
                                        <span className="ml-auto shrink-0 text-[10px] text-[#6F6F6F]">
                                            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#D7D7D7]">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}
