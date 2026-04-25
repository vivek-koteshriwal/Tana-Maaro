"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle as CardTitleUI } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Mic, Type, X } from "lucide-react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_VIDEO_UPLOAD_BYTES,
    validateUploadMetadata,
    VIDEO_UPLOAD_LIMIT_MESSAGE,
} from "@/lib/media-policy";

export default function PostPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("text");

    const [textContent, setTextContent] = useState("");
    const [caption, setCaption] = useState("");

    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideoTab = activeTab === "video";
            const allowedTypes = isVideoTab ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
            if (!allowedTypes.includes(file.type)) {
                setUploadError(isVideoTab
                    ? "Unsupported video format. Please upload MP4, MOV, or WebM."
                    : "Unsupported image format. Please upload JPG, PNG, GIF, WebP, or AVIF.");
                e.target.value = "";
                return;
            }

            if (isVideoTab && file.size > MAX_VIDEO_UPLOAD_BYTES) {
                setUploadError(VIDEO_UPLOAD_LIMIT_MESSAGE);
                e.target.value = "";
                return;
            }

            setUploadError("");
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUploadError("");
        try {
            let finalMediaUrl = undefined;
            const content = activeTab === "text" ? textContent : caption;

            if (mediaFile && (activeTab === "image" || activeTab === "video")) {
                let fileToUpload = mediaFile;

                if (activeTab === "image" && mediaFile.type.startsWith("image/")) {
                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                    fileToUpload = await imageCompression(mediaFile, options);
                }

                const validationError = validateUploadMetadata({
                    contentType: fileToUpload.type,
                    fileSize: fileToUpload.size,
                });
                if (validationError) throw new Error(validationError);

                const urlRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: `post_${Date.now()}_${fileToUpload.name}`,
                        contentType: fileToUpload.type,
                        fileSize: fileToUpload.size,
                    })
                });

                if (!urlRes.ok) throw new Error("Failed to get upload URL");
                const { uploadUrl, fileUrl } = await urlRes.json();

                const s3Res = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': fileToUpload.type },
                    body: fileToUpload
                });

                if (!s3Res.ok) throw new Error("Upload failed");
                finalMediaUrl = fileUrl;
            }

            const createRes = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: content || " ",
                    image: finalMediaUrl,
                    type:
                        activeTab === "text"
                            ? "text"
                            : activeTab === "video"
                                ? "video"
                                : "image",
                }),
            });

            if (!createRes.ok) {
                const errorData = await createRes.json().catch(() => null);
                throw new Error(errorData?.error || "Failed to create post");
            }

            router.push("/feed");
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Failed to submit roast. Try again.";
            setUploadError(message);
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4 pt-24">
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                    Say It. <span className="text-red-600">We Won&apos;t Judge.</span>
                </h1>
                <p className="text-gray-400">
                    Unleash the chaos. Roast without fear.
                </p>
            </div>

            <Card className="border-red-900/30 bg-black/50 backdrop-blur-md">
                <CardHeader>
                    <CardTitleUI className="text-xl">Submit a Roast</CardTitleUI>
                    <CardDescription>Choose your weapon of mass destruction.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setMediaFile(null); setMediaPreview(null); setUploadError(""); }} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-neutral-900/50 mb-6">
                            <TabsTrigger value="text" className="gap-2"><Type className="w-4 h-4" /> Text</TabsTrigger>
                            <TabsTrigger value="image" className="gap-2"><Upload className="w-4 h-4" /> Meme</TabsTrigger>
                            <TabsTrigger value="video" className="gap-2"><Mic className="w-4 h-4" /> Video</TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="college">College Name associated</Label>
                                    <Input id="college" placeholder="e.g. IIT Bombay" />
                                </div>

                                <TabsContent value="text" className="space-y-4 mt-0">
                                    <div className="space-y-2">
                                        <Label htmlFor="roast">Your Roast</Label>
                                        <Textarea
                                            id="roast"
                                            value={textContent}
                                            onChange={e => setTextContent(e.target.value)}
                                            placeholder="Type your savage thought here..."
                                            className="min-h-[150px] resize-none text-lg bg-black/50 border-neutral-800"
                                            required={activeTab === "text"}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="image" className="space-y-4 mt-0">
                                    {!mediaPreview ? (
                                        <div onClick={triggerFileInput} className="border-2 border-dashed border-neutral-800 rounded-lg p-10 text-center hover:border-red-600/50 transition-colors cursor-pointer bg-neutral-900/20">
                                            <Upload className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                                            <p className="text-sm text-gray-400">Drag and drop your meme here, or click to upload</p>
                                            <p className="text-xs text-gray-600 mt-2">JPG, PNG, GIF up to 5MB</p>
                                        </div>
                                    ) : (
                                        <div className="relative border border-neutral-800 rounded-lg p-2 bg-black/50 text-center">
                                            <img src={mediaPreview} alt="Preview" className="max-h-64 mx-auto rounded-md object-contain" />
                                            <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-xl">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <input type="file" ref={activeTab === "image" ? fileInputRef : null} accept="image/*" onChange={handleFileChange} className="hidden" />

                                    <div className="space-y-2 mt-4">
                                        <Label htmlFor="caption">Caption (Optional)</Label>
                                        <Input id="caption" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a spicy caption..." className="bg-black/50 border-neutral-800" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="video" className="space-y-4 mt-0">
                                    {!mediaPreview ? (
                                        <div onClick={triggerFileInput} className="border-2 border-dashed border-neutral-800 rounded-lg p-10 text-center hover:border-red-600/50 transition-colors cursor-pointer bg-neutral-900/20">
                                            <Mic className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                                            <p className="text-sm text-gray-400">Upload your rant or roast video</p>
                                            <p className="text-xs text-gray-600 mt-2">MP4, MOV, WebM up to 100MB</p>
                                        </div>
                                    ) : (
                                        <div className="relative border border-neutral-800 rounded-lg p-2 bg-black/50 text-center">
                                            <video src={mediaPreview} controls className="max-h-64 mx-auto rounded-md" />
                                            <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-xl">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <input type="file" ref={activeTab === "video" ? fileInputRef : null} accept="video/*" onChange={handleFileChange} className="hidden" />

                                    <div className="space-y-2 mt-4">
                                        <Label htmlFor="video-caption">Caption</Label>
                                        <Input id="video-caption" value={caption} onChange={e => setCaption(e.target.value)} placeholder="What is this about?" className="bg-black/50 border-neutral-800" />
                                    </div>
                                </TabsContent>
                            </div>

                            {uploadError && (
                                <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-200">
                                    {uploadError}
                                </div>
                            )}

                            <div className="pt-4">
                                <Button type="submit" disabled={isSubmitting} className="w-full text-lg py-6 font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50">
                                    {isSubmitting ? "Uploading..." : "Roast It 🔥"}
                                </Button>
                                <p className="text-center text-xs text-gray-600 mt-4">
                                    By posting, you agree to keep it funny, not abusive. <br />
                                    Savage is welcome, hate speech represents small d*ck energy.
                                </p>
                            </div>
                        </form>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
