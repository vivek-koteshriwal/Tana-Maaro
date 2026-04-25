"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, MessageCircle, Send, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PostService } from "@/lib/services/post-service";
import { cn } from "@/lib/utils";

interface PostShareDialogProps {
    postId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    text?: string;
}

function ShareOptionButton({
    icon,
    label,
    onClick,
    accent = false,
    disabled = false,
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void | Promise<void>;
    accent?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={() => void onClick()}
            disabled={disabled}
            className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-[20px] border px-4 py-5 text-center transition-colors",
                accent
                    ? "border-[#FF8E84]/35 bg-[#FF8E84]/10 text-[#FF8E84] hover:bg-[#FF8E84]/15"
                    : "border-white/8 bg-[#171717] text-white hover:border-white/16 hover:bg-[#1C1C1C]",
                disabled && "cursor-not-allowed opacity-55",
            )}
        >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35">
                {icon}
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">{label}</span>
        </button>
    );
}

export function PostShareDialog({
    postId,
    open,
    onOpenChange,
    title = "Tana Maaro Roast",
    text = "Check out this roast on Tana Maaro",
}: PostShareDialogProps) {
    const [copied, setCopied] = useState(false);
    const [isNativeSharing, setIsNativeSharing] = useState(false);
    const [nativeShareSupported, setNativeShareSupported] = useState(false);

    useEffect(() => {
        setNativeShareSupported(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }, []);

    useEffect(() => {
        if (!open) {
            setCopied(false);
        }
    }, [open]);

    const shareUrl = useMemo(() => {
        if (typeof window === "undefined") {
            return "";
        }
        return `${window.location.origin}/post/${postId}`;
    }, [postId]);

    const encodedText = encodeURIComponent(`${text}\n${shareUrl}`);
    const smsUrl = `sms:?&body=${encodedText}`;
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;

    const trackShare = async () => {
        try {
            await PostService.sharePost(postId);
        } catch {
            // Analytics increment is best-effort only.
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            return true;
        } catch {
            try {
                const element = document.createElement("textarea");
                element.value = shareUrl;
                element.style.position = "fixed";
                element.style.opacity = "0";
                document.body.appendChild(element);
                element.focus();
                element.select();
                document.execCommand("copy");
                document.body.removeChild(element);
                return true;
            } catch {
                return false;
            }
        }
    };

    const handleCopyLink = async () => {
        if (!shareUrl) return;

        const copiedSuccessfully = await copyToClipboard();
        if (!copiedSuccessfully) return;

        setCopied(true);
        await trackShare();
        window.setTimeout(() => setCopied(false), 1800);
    };

    const openExternalShare = async (url: string, mode: "window" | "location" = "window") => {
        await trackShare();
        onOpenChange(false);

        if (mode === "location") {
            window.location.href = url;
            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleNativeShare = async () => {
        if (!nativeShareSupported || !shareUrl) return;

        setIsNativeSharing(true);
        try {
            await navigator.share({
                title,
                text,
                url: shareUrl,
            });
            await trackShare();
            onOpenChange(false);
        } catch (error: unknown) {
            if (!(error instanceof Error) || error.name !== "AbortError") {
                console.error("Native share failed", error);
            }
        } finally {
            setIsNativeSharing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[560px] border border-white/[0.08] bg-[#101010] p-0 text-white">
                <DialogHeader className="border-b border-white/5 px-6 py-5">
                    <DialogTitle className="text-xl font-black uppercase tracking-[0.12em] text-white">
                        Share Roast
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-[#ABABAB]">
                        Send this roast where people actually see it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-6 py-5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <ShareOptionButton
                            icon={<MessageCircle className="h-5 w-5" />}
                            label="WhatsApp"
                            accent
                            onClick={() => openExternalShare(whatsappUrl)}
                        />
                        <ShareOptionButton
                            icon={<Send className="h-5 w-5" />}
                            label="Messages"
                            onClick={() => openExternalShare(smsUrl, "location")}
                        />
                        <ShareOptionButton
                            icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            label={copied ? "Copied" : "Copy Link"}
                            onClick={handleCopyLink}
                        />
                        <ShareOptionButton
                            icon={<Send className="h-5 w-5" />}
                            label="Telegram"
                            onClick={() => openExternalShare(telegramUrl)}
                        />
                        <ShareOptionButton
                            icon={<Share2 className="h-5 w-5" />}
                            label="X / Twitter"
                            onClick={() => openExternalShare(twitterUrl)}
                        />
                        {nativeShareSupported && (
                            <ShareOptionButton
                                icon={<Share2 className="h-5 w-5" />}
                                label={isNativeSharing ? "Opening" : "More Apps"}
                                onClick={handleNativeShare}
                                disabled={isNativeSharing}
                            />
                        )}
                    </div>

                    <div className="rounded-[20px] border border-white/8 bg-[#171717] px-4 py-3">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ABABAB]">
                            Share Link
                        </p>
                        <p className="truncate text-sm text-white/85">{shareUrl}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
