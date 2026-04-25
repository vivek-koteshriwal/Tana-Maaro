"use client";

import { useState } from "react";
import { Image as ImageIcon, Smile, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_VIDEO_UPLOAD_BYTES,
    validateUploadMetadata,
    VIDEO_UPLOAD_LIMIT_MESSAGE,
} from "@/lib/media-policy";

export function CreatePost({
    onPostCreated,
    battleId,
    disabled,
}: {
    onPostCreated?: (createdPost: Record<string, unknown>) => void;
    battleId?: string;
    disabled?: boolean;
}) {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [showLogin, setShowLogin] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [justPosted, setJustPosted] = useState(false);

    const emojis = ["🔥", "💀", "😂", "🤡", "💩", "👀", "💯", "👎", "🤮", "😡"];

    const uploadFileWithProgress = (file: File) => {
        return new Promise<{ fileUrl: string; url?: string }>((resolve, reject) => {
            const request = new XMLHttpRequest();
            const formData = new FormData();
            formData.append("file", file);

            request.upload.onprogress = (event) => {
                if (!event.lengthComputable) {
                    return;
                }

                setUploadProgress(Math.round((event.loaded / event.total) * 100));
            };

            request.onload = () => {
                const responseBody = (() => {
                    try {
                        return JSON.parse(request.responseText || "{}");
                    } catch {
                        return {};
                    }
                })();

                if (request.status >= 200 && request.status < 300) {
                    resolve(responseBody);
                    return;
                }

                reject(new Error(responseBody.error || "Media upload failed"));
            };

            request.onerror = () => reject(new Error("Media upload failed. Please check your connection and try again."));
            request.open("POST", "/api/upload/local");
            request.send(formData);
        });
    };

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const image = new Image();
                image.src = event.target?.result as string;
                image.onload = () => {
                    const canvas = document.createElement("canvas");
                    const maxWidth = 1200;
                    const maxHeight = 1200;
                    let width = image.width;
                    let height = image.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    if (!context) return reject("Failed to get canvas context");

                    context.drawImage(image, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (!blob) return reject("Canvas to Blob failed");

                        resolve(new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}.webp`, {
                            type: "image/webp",
                            lastModified: Date.now(),
                        }));
                    }, "image/webp", 0.7);
                };
                image.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleSubmit = async () => {
        if (!user) {
            setShowLogin(true);
            return;
        }

        if (!content.trim() && !mediaFile) return;

        setUploadError("");
        setUploadStatus("");
        setUploadProgress(0);
        setIsUploading(true);
        try {
            let imageUrl = "";
            let resolvedType: "text" | "image" | "video" | "mixed" = "text";

            if (mediaFile) {
                const preCompressionError = mediaType === "video" ? validateUploadMetadata({
                    contentType: mediaFile.type,
                    fileSize: mediaFile.size,
                }) : null;
                if (preCompressionError) {
                    throw new Error(preCompressionError);
                }

                setUploadStatus(mediaType === "image" ? "Compressing image..." : "Preparing video...");
                const uploadFile = mediaType === "image" ? await compressImage(mediaFile) : mediaFile;
                const validationError = validateUploadMetadata({
                    contentType: uploadFile.type,
                    fileSize: uploadFile.size,
                });
                if (validationError) {
                    throw new Error(validationError);
                }

                resolvedType = mediaType === "video" ? "video" : "image";

                setUploadStatus("Uploading media...");
                const uploadResponse = await uploadFileWithProgress(uploadFile);
                imageUrl = uploadResponse.url || uploadResponse.fileUrl;
                if (content.trim()) resolvedType = "mixed";
            }

            setUploadStatus("Publishing roast...");
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    content: content.trim() || " ",
                    image: imageUrl || undefined,
                    type: resolvedType,
                    battleId: battleId || undefined,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || "Post creation failed");
            }

            const createdPost = await response.json().catch(() => ({}));

            setContent("");
            setMediaFile(null);
            setMediaPreview(null);
            setMediaType(null);
            setUploadProgress(0);
            setUploadStatus("");
            setShowEmoji(false);
            setJustPosted(true);
            window.setTimeout(() => setJustPosted(false), 2000);
            onPostCreated?.(createdPost);
        } catch (error) {
            console.error("Post creation failed", error);
            setUploadError(error instanceof Error ? error.message : "Post creation failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMediaUpload = (type: "image" | "video") => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = type === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
        if (!allowedTypes.includes(file.type)) {
            setUploadError(type === "video"
                ? "Unsupported video format. Please upload MP4, MOV, or WebM."
                : "Unsupported image format. Please upload JPG, PNG, GIF, WebP, or AVIF.");
            event.target.value = "";
            return;
        }

        if (type === "video" && file.size > MAX_VIDEO_UPLOAD_BYTES) {
            setUploadError(VIDEO_UPLOAD_LIMIT_MESSAGE);
            event.target.value = "";
            return;
        }

        setUploadError("");
        setUploadProgress(0);
        setUploadStatus("");
        setMediaFile(file);
        setMediaType(type);
        setMediaPreview(URL.createObjectURL(file));
    };

    return (
        <>
            <div className="rounded-[28px] bg-[#191919] p-4 text-white sm:p-5">
                <div className="flex gap-3 sm:gap-4">
                    <RoastAvatar
                        value={user?.profileImage}
                        fallbackSeed={user?.id || user?.username || user?.name || "guest"}
                        alt={user?.name || "Guest"}
                        size={44}
                        className="border border-[#FF8E84]/20"
                    />

                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <p className="font-epilogue text-[13px] font-bold uppercase tracking-[0.18em] text-[#FF8E84]">
                                Drop a Roast
                            </p>
                            <p className="text-[12px] text-[#878787]">
                                Same backend. New arena look.
                            </p>
                        </div>

                        <Textarea
                            placeholder={disabled ? "The battle has concluded. No more roasts." : user ? "What are you torching today?" : "Sign in to roast..."}
                            className="min-h-[120px] resize-none rounded-[22px] border-0 bg-[#121212] px-4 py-4 text-[15px] leading-7 text-white placeholder:text-[#6F6F6F] focus-visible:ring-1 focus-visible:ring-[#FF8E84]/35"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            onFocus={() => !user && setShowLogin(true)}
                            disabled={disabled}
                        />

                        {mediaPreview && (
                            <div className="relative inline-block overflow-hidden rounded-[20px] bg-[#111]">
                                {mediaType === "video" ? (
                                    <video src={mediaPreview} controls className="max-h-64 rounded-[20px] bg-black" />
                                ) : (
                                    <img src={mediaPreview} alt="Preview" className="max-h-64 rounded-[20px]" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMediaPreview(null);
                                        setMediaFile(null);
                                        setMediaType(null);
                                        setUploadProgress(0);
                                        setUploadStatus("");
                                        setUploadError("");
                                    }}
                                    disabled={isUploading}
                                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/85 disabled:opacity-50"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {uploadError && (
                            <div className="rounded-[18px] border border-red-500/30 bg-red-950/30 px-4 py-3 text-[13px] font-semibold text-red-200">
                                {uploadError}
                            </div>
                        )}

                        {!user && (
                            <div className="rounded-[22px] bg-[#121212] px-4 py-4 text-center">
                                <div className="mb-2 font-epilogue text-[14px] font-black uppercase tracking-[0.18em] text-[#FF8E84]">
                                    Spectator Mode
                                </div>
                                <p className="mb-4 text-[13px] leading-6 text-[#ABABAB]">
                                    Sign in before you drop a roast, add media, or light up the wall.
                                </p>
                                <Button
                                    onClick={() => setShowLogin(true)}
                                    className="rounded-full bg-[#FF8E84] px-5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#650007] transition-colors hover:bg-[#FF766D]"
                                >
                                    Login to Enter Battle
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex flex-wrap gap-2 text-[#FF8E84]">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleMediaUpload("image")}
                                        disabled={!user || disabled}
                                    />
                                    <label htmlFor="image-upload">
                                        <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#111] transition-colors hover:bg-[#1A1A1A]">
                                            <ImageIcon className="h-5 w-5" />
                                        </div>
                                    </label>
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        id="video-upload"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={handleMediaUpload("video")}
                                        disabled={!user || disabled}
                                    />
                                    <label htmlFor="video-upload">
                                        <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#111] transition-colors hover:bg-[#1A1A1A]">
                                            <Video className="h-5 w-5" />
                                        </div>
                                    </label>
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        aria-label="Add emoji"
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111] transition-colors hover:bg-[#1A1A1A]"
                                        onClick={() => user ? setShowEmoji(!showEmoji) : setShowLogin(true)}
                                        disabled={disabled}
                                    >
                                        <Smile className="h-5 w-5" />
                                    </button>

                                    {showEmoji && (
                                        <div className="absolute left-0 top-12 z-50 grid w-64 grid-cols-5 gap-1 rounded-[20px] border border-white/10 bg-[#121212] p-2 shadow-xl">
                                            {emojis.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => {
                                                        setContent((prev) => prev + emoji);
                                                        setShowEmoji(false);
                                                    }}
                                                    className="rounded-md p-2 text-2xl transition-colors hover:bg-white/10"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                className={`rounded-full px-6 text-[12px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ${justPosted ? "bg-green-600 hover:bg-green-700 text-white" : "bg-[#FF8E84] hover:bg-[#FF766D] text-[#650007]"} ${isUploading ? "cursor-not-allowed opacity-50" : ""}`}
                                disabled={!user || (!content.trim() && !mediaFile) || isUploading || !!disabled}
                                onClick={handleSubmit}
                            >
                                {isUploading ? "Uploading..." : justPosted ? "Posted!" : "Post"}
                            </Button>
                        </div>

                        {isUploading && (uploadStatus || uploadProgress > 0) && (
                            <div className="space-y-2 rounded-[18px] bg-[#111] px-4 py-3">
                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF8E84]">
                                    <span>{uploadStatus || "Uploading..."}</span>
                                    {uploadProgress > 0 && <span>{uploadProgress}%</span>}
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-[#FF8E84] transition-all"
                                        style={{ width: `${Math.max(uploadProgress, uploadStatus === "Publishing roast..." ? 100 : 6)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </>
    );
}
