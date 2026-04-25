"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    Ban,
    Check,
    Copy,
    CornerUpRight,
    EyeOff,
    Flag,
    Mic,
    MoreVertical,
    Pencil,
    Share2,
    Trash2,
    X,
} from "lucide-react";
import { FeedActions } from "@/components/feed/feed-actions";
import { CommentsSection } from "@/components/feed/comments-section";
import { useAuth } from "@/components/auth/auth-provider";
import { PostShareDialog } from "@/components/feed/post-share-dialog";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import { Post } from "@/types/feed";
import { PostService } from "@/lib/services/post-service";
import { cn } from "@/lib/utils";

function RichText({ text }: { text: string }) {
    const parts = text.split(/(#\w+|@\w+)/g).filter(Boolean);
    return (
        <>
            {parts.map((part, index) => {
                if (/^#\w+$/.test(part)) {
                    return (
                        <Link
                            key={`${part}-${index}`}
                            href={`/tag/${encodeURIComponent(part.slice(1))}`}
                            className="text-[#FF8E84] transition-colors hover:text-white"
                        >
                            {part}
                        </Link>
                    );
                }
                if (/^@\w+$/.test(part)) {
                    return (
                        <Link
                            key={`${part}-${index}`}
                            href={`/profile/${encodeURIComponent(part.slice(1))}`}
                            className="text-[#FF8E84] transition-colors hover:text-white"
                        >
                            {part}
                        </Link>
                    );
                }
                return <span key={`${part}-${index}`}>{part}</span>;
            })}
        </>
    );
}

function editorialHeadline(text: string) {
    if (!text.trim()) {
        return "";
    }

    const words = text.trim().split(/\s+/);
    return words.slice(0, Math.min(words.length, 8)).join(" ").toUpperCase();
}

function editorialBody(text: string) {
    const words = text.trim().split(/\s+/);
    if (words.length <= 8) {
        return "";
    }
    return words.slice(8).join(" ");
}

function MenuItem({
    icon,
    label,
    onClick,
    danger,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-left text-[13px] font-semibold transition-colors hover:bg-white/5 last:border-b-0",
                danger ? "text-[#FF8E84]" : "text-white",
            )}
        >
            <span className={cn("flex-shrink-0", danger ? "text-[#FF8E84]" : "text-[#ABABAB]")}>{icon}</span>
            {label}
        </button>
    );
}

interface FeedCardProps {
    post: Post;
    isOwner?: boolean;
    onDelete?: () => void;
    onHide?: () => void;
}

type PostUserFallback = {
    userId?: string;
    userName?: string;
    userHandle?: string;
    userAvatar?: string;
};

export function FeedCard({ post, isOwner, onDelete, onHide }: FeedCardProps) {
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [reportedState, setReportedState] = useState<"idle" | "done">("idle");
    const [blocked, setBlocked] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const fallbackPost = post as Post & PostUserFallback;
    const postUser = post.user || {
        id: fallbackPost.userId || "",
        name: fallbackPost.userName || "Anonymous",
        username: fallbackPost.userHandle || "anon",
        profileImage: fallbackPost.userAvatar,
    };
    const normalizedUsername = (postUser.username || "anon").replace(/^@/, "");
    const ownsPost = isOwner ?? user?.id === postUser.id;

    const initialCommentCount =
        typeof post.comments === "number"
            ? post.comments
            : Array.isArray(post.comments)
                ? post.comments.length
                : post.commentsCount || 0;

    const [commentCount, setCommentCount] = useState(initialCommentCount);
    const [bodyText, setBodyText] = useState(
        post.content.replace("[🎤 Voice Note Attached]", "").trim(),
    );

    const hasMedia = Boolean(post.image);
    const isVideo = hasMedia && (
        post.type === "video" || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(post.image || "")
    );
    const isMediaCard = hasMedia;

    const profileHref = `/profile/${encodeURIComponent(normalizedUsername || "anon")}`;
    const hasVoice = post.content.includes("[🎤 Voice Note Attached]");
    const displayHandle = `@${normalizedUsername.toUpperCase()}`;

    const category = post.sharedFromPostId
        ? "Signal Boost"
        : post.battleId
            ? "Arena Prime"
            : "Roast Wall";

    const timeAgo = (() => {
        try {
            const date = new Date(post.timestamp);
            return Number.isNaN(date.getTime()) ? "recently" : formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return "recently";
        }
    })();
    const metadataLabel = `${timeAgo} • ${category}`;
    const headlineText = editorialHeadline(bodyText);
    const supportingText = editorialBody(bodyText);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        setCommentCount(
            typeof post.comments === "number"
                ? post.comments
                : Array.isArray(post.comments)
                    ? post.comments.length
                    : post.commentsCount || 0,
        );
    }, [post.comments, post.commentsCount]);

    useEffect(() => {
        setBodyText(post.content.replace("[🎤 Voice Note Attached]", "").trim());
    }, [post.content]);

    const handleDelete = async () => {
        if (isDeleting) return;
        if (!confirm("Delete this roast?")) return;
        setShowMenu(false);
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error || "Failed to delete post");
            }
            setDeleted(true);
            onDelete?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete post";
            window.alert(message);
            setIsDeleting(false);
        }
    };

    const handleCopyLink = async () => {
        setShowMenu(false);
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    };

    const handleShare = async () => {
        setShowMenu(false);
        setShowShareDialog(true);
    };

    const handleNotInterested = async () => {
        setShowMenu(false);
        await PostService.hidePost(post.id);
        onHide?.();
    };

    const handleReport = async () => {
        setShowMenu(false);
        if (!user) return;
        try {
            await fetch(`/api/posts/${post.id}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ reason: "inappropriate" }),
            });
        } catch {
            // ignore
        }
        setReportedState("done");
    };

    const handleBlock = async () => {
        setShowMenu(false);
        if (!user || !postUser.id) return;
        try {
            await fetch(`/api/users/${postUser.id}/block`, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // ignore
        }
        setBlocked(true);
    };

    const handleEditSave = async () => {
        if (!editContent.trim() || editContent === bodyText) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ content: editContent }),
            });
            if (response.ok) setBodyText(editContent);
        } catch {
            // ignore
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    const openEdit = () => {
        setEditContent(bodyText);
        setIsEditing(true);
        setShowMenu(false);
    };

    if (blocked) {
        return (
            <article className="flex items-center gap-3 rounded-xl bg-[#191919] px-4 py-4">
                <Ban className="h-4 w-4 text-[#ABABAB]" />
                <span className="text-[13px] font-semibold text-[#ABABAB]">User blocked.</span>
            </article>
        );
    }

    if (reportedState === "done") {
        return (
            <article className="flex items-center gap-3 rounded-xl bg-[#191919] px-4 py-4">
                <Flag className="h-4 w-4 text-[#ABABAB]" />
                <span className="text-[13px] font-semibold text-[#ABABAB]">
                    Reported. We&apos;ll review this post.
                </span>
            </article>
        );
    }

    if (deleted) {
        return (
            <article className="flex items-center gap-3 rounded-xl bg-[#191919] px-4 py-4">
                <Trash2 className="h-4 w-4 text-[#ABABAB]" />
                <span className="text-[13px] font-semibold text-[#ABABAB]">Post deleted.</span>
            </article>
        );
    }

    return (
        <>
            <article className={cn(
                "relative rounded-[18px] bg-[#191919] shadow-[0_10px_24px_rgba(255,59,59,0.05)] transition-transform duration-200 active:scale-[0.98]",
            )}>
                {/* ── Header ── */}
                <div
                    className={cn(
                        "flex items-start justify-between",
                        isMediaCard ? "px-[14px] pb-[10px] pt-[14px]" : "px-[14px] pb-0 pt-[14px] pl-[18px]",
                    )}
                >
                    <Link href={profileHref} className="flex min-w-0 items-center gap-3">
                        <RoastAvatar
                            value={postUser.profileImage}
                            fallbackSeed={postUser.id || normalizedUsername || postUser.name}
                            alt={postUser.name || normalizedUsername}
                            size={40}
                            className="border border-[#FF8E84]/55"
                        />
                        <div className="min-w-0">
                            <h3 className="truncate font-manrope text-[15px] font-extrabold uppercase leading-tight text-[#FF3B3B]">
                                {displayHandle}
                            </h3>
                            <p className="text-[11px] font-bold text-[#ABABAB]">
                                {metadataLabel}
                            </p>
                        </div>
                    </Link>

                    <div ref={menuRef} className="relative flex-shrink-0">
                        <button
                            type="button"
                            aria-label="Post options"
                            onClick={() => setShowMenu((v) => !v)}
                            className={cn(
                                "rounded-full p-1.5 text-[#ABABAB] transition-colors hover:bg-white/5 hover:text-white",
                                showMenu && "bg-white/5 text-white",
                            )}
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-10 z-[999] w-56 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto overscroll-contain rounded-[20px] border border-white/[0.08] bg-[#262626] shadow-2xl">
                                <MenuItem icon={<Copy className="h-[15px] w-[15px]" />} label="Copy Link" onClick={handleCopyLink} />
                                <MenuItem icon={<Share2 className="h-[15px] w-[15px]" />} label="Share" onClick={handleShare} />
                                {ownsPost ? (
                                    <>
                                        <MenuItem icon={<Pencil className="h-[15px] w-[15px]" />} label="Edit" onClick={openEdit} />
                                        <MenuItem
                                            icon={<Trash2 className="h-[15px] w-[15px]" />}
                                            label={isDeleting ? "Deleting..." : "Delete"}
                                            onClick={() => { void handleDelete(); }}
                                            danger
                                        />
                                    </>
                                ) : (
                                    <>
                                        <MenuItem icon={<EyeOff className="h-[15px] w-[15px]" />} label="Not Interested" onClick={handleNotInterested} />
                                        <MenuItem icon={<Flag className="h-[15px] w-[15px]" />} label="Report" onClick={handleReport} danger />
                                        <MenuItem icon={<Ban className="h-[15px] w-[15px]" />} label="Block" onClick={handleBlock} danger />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            {/* ── Body ── */}
            {post.sharedFromUser && (
                <div className={cn(
                    "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8E8E8E]",
                    isMediaCard ? "px-[14px] pb-2" : "px-[18px] pb-2",
                )}>
                    <CornerUpRight className="h-3.5 w-3.5" />
                    <span>
                        Shared from{" "}
                        <Link
                            href={`/profile/${encodeURIComponent((post.sharedFromUser.username || "anon").replace(/^@/, ""))}`}
                            className="text-[#FF8E84] transition-colors hover:text-white"
                        >
                            @{(post.sharedFromUser.username || "anon").replace(/^@/, "")}
                        </Link>
                    </span>
                </div>
            )}

            {isEditing ? (
                <div className={cn("flex flex-col gap-3 pb-4", isMediaCard ? "px-[14px]" : "px-[18px]")}>
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        aria-label="Edit post content"
                        placeholder="Edit your roast..."
                        className="w-full resize-none rounded-[20px] bg-[#121212] px-4 py-3 text-[14px] leading-[1.55] text-white outline-none ring-1 ring-white/8 transition focus:ring-[#FF8E84]/35"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleEditSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 rounded-full bg-[#FF8E84] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#650007] disabled:opacity-50"
                        >
                            <Check className="h-3.5 w-3.5" />
                            {isSaving ? "Saving…" : "Save"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#ABABAB] hover:bg-white/10"
                        >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {isMediaCard ? (
                        <>
                            {bodyText && (
                                <div className="px-[14px] pb-3">
                                    <p className="whitespace-pre-wrap font-manrope text-[14px] font-semibold leading-[1.42] text-white">
                                        <RichText text={bodyText} />
                                    </p>
                                </div>
                            )}
                            {hasVoice && (
                                <div className="px-[14px] pb-3">
                                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#1F1F1F] px-[10px] py-[6px]">
                                        <Mic className="h-[14px] w-[14px] text-[#FF8E84]" />
                                        <span className="text-[10px] font-extrabold tracking-[0.8px] text-[#FF8E84]">
                                            VOICE NOTE
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-[linear-gradient(135deg,rgba(255,59,59,0.08),transparent)] px-[18px] pb-[18px] pt-3">
                            {headlineText ? (
                                <p className="font-epilogue text-[25px] font-black italic leading-[0.96] tracking-[-0.9px] text-white">
                                    &ldquo;<RichText text={headlineText} />&rdquo;
                                </p>
                            ) : bodyText ? (
                                <p className="whitespace-pre-wrap font-manrope text-[13px] font-semibold leading-[1.48] text-white">
                                    <RichText text={bodyText} />
                                </p>
                            ) : null}
                            {supportingText ? (
                                <p className="mt-[14px] whitespace-pre-wrap font-manrope text-[13px] font-semibold leading-[1.48] text-[#ABABAB]">
                                    <RichText text={supportingText} />
                                </p>
                            ) : null}
                            {hasVoice && (
                                <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#1F1F1F] px-[10px] py-[6px]">
                                    <Mic className="h-[14px] w-[14px] text-[#FF8E84]" />
                                    <span className="text-[10px] font-extrabold tracking-[0.8px] text-[#FF8E84]">
                                        VOICE NOTE
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Media — overflow-hidden lives here so it doesn't clip dropdown/comments ── */}
            {hasMedia && !isEditing && (
                <div className="relative overflow-hidden bg-[#111]">
                    {isVideo ? (
                        <video src={post.image} controls className="h-[198px] w-full bg-black object-cover" />
                    ) : (
                        <img
                            src={post.image}
                            alt="Post media"
                            className="h-[198px] w-full object-cover"
                        />
                    )}
                </div>
            )}

            {/* ── Engagement Bar ── */}
            <div className="px-[14px] py-[14px]">
                <FeedActions
                    postId={post.id}
                    likes={post.likes}
                    dislikes={post.dislikes || 0}
                    isLiked={post.isLiked}
                    isDisliked={post.isDisliked}
                    comments={commentCount}
                    onCommentClick={() => setShowComments((v) => !v)}
                />

                <CommentsSection
                    postId={post.id}
                    isOpen={showComments}
                    onCommentAdded={() => setCommentCount((v) => v + 1)}
                />
            </div>
            </article>

            <PostShareDialog
                postId={post.id}
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
            />
        </>
    );
}
