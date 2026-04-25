"use client";

import { useEffect, useState, type ReactElement } from "react";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import { ROAST_AVATARS, avatarIdFromIndex, normalizeAvatarValue } from "@/lib/avatar-config";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    name: string;
    username: string;
    bio?: string;
    profileImage: string;
    showRealName: boolean;
    usernameChangeCount: number;
}

interface EditProfileModalProps {
    user: User;
    trigger?: ReactElement;
    initialView?: "identity" | "avatar";
}

export function EditProfileModal({
    user,
    trigger,
    initialView = "identity",
}: EditProfileModalProps) {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeView, setActiveView] = useState<"identity" | "avatar">(initialView);
    const [name, setName] = useState(user.name || "");
    const [username, setUsername] = useState(user.username || "");
    const [bio, setBio] = useState(user.bio || "");
    const [showRealName, setShowRealName] = useState(user.showRealName ?? true);
    const [profileImage, setProfileImage] = useState(normalizeAvatarValue(user.profileImage, user.id || user.username));
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        setName(user.name || "");
        setUsername(user.username || "");
        setBio(user.bio || "");
        setShowRealName(user.showRealName ?? true);
        setProfileImage(normalizeAvatarValue(user.profileImage, user.id || user.username));
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            setActiveView(initialView);
            setImageFile(null);
            setImagePreview(null);
        }
    }, [isOpen, initialView]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handlePresetSelect = (avatarId: string) => {
        setImageFile(null);
        setImagePreview(null);
        setProfileImage(avatarId);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const resolvedName =
                name.trim() ||
                String(user.name || "").trim() ||
                String(username || user.username || "").replace(/^@/, "").trim();

            let finalImageUrl = profileImage;

            if (imageFile) {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(imageFile, options);

                const urlRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: `profile_${Date.now()}_${compressedFile.name}`,
                        contentType: compressedFile.type,
                    }),
                });

                if (!urlRes.ok) throw new Error("Failed to get upload URL");
                const { uploadUrl, fileUrl } = await urlRes.json();

                const s3Res = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": compressedFile.type },
                    body: compressedFile,
                });

                if (!s3Res.ok) throw new Error("Failed to upload profile image");
                finalImageUrl = fileUrl;
            }

            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: resolvedName,
                    username,
                    bio,
                    showRealName,
                    profileImage: finalImageUrl,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.error || "Failed to update profile");
            }

            setProfileImage(normalizeAvatarValue(finalImageUrl, user.id || username));
            setImageFile(null);
            setImagePreview(null);
            setIsOpen(false);
            await refreshUser();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="border-red-600/50 text-red-500 hover:bg-red-950">
                        Edit Profile
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-hidden border border-white/[0.08] bg-[#101010] p-0 text-white sm:max-w-[720px]">
                <DialogHeader className="border-b border-white/5 px-6 py-5">
                    <DialogTitle className="text-xl font-black uppercase tracking-[0.12em] text-white">
                        Manage Identity
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-84px)] flex-col">
                    <div className="border-b border-white/5 px-6 py-4">
                        <div className="inline-flex rounded-full bg-black/50 p-1">
                            <button
                                type="button"
                                onClick={() => setActiveView("identity")}
                                className={cn(
                                    "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors",
                                    activeView === "identity"
                                        ? "bg-[#FF8E84] text-[#490909]"
                                        : "text-[#ABABAB] hover:text-white",
                                )}
                            >
                                Identity
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView("avatar")}
                                className={cn(
                                    "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors",
                                    activeView === "avatar"
                                        ? "bg-[#FF8E84] text-[#490909]"
                                        : "text-[#ABABAB] hover:text-white",
                                )}
                            >
                                Avatar
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto px-6 py-5">
                        {activeView === "avatar" ? (
                            <div className="space-y-6">
                                <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/8 bg-[#161616] px-6 py-6 text-center">
                                    <RoastAvatar
                                        value={imagePreview || profileImage}
                                        fallbackSeed={user.id || username || name}
                                        alt="Selected profile avatar"
                                        size={112}
                                        className="border-2 border-[#FF8E84]/35 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                                    />
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#FF8E84]">
                                            Arena Avatar
                                        </p>
                                        <p className="text-sm text-[#ABABAB]">
                                            Pick the same preset identity system used in the mobile app, or upload a custom photo.
                                        </p>
                                    </div>
                                    <div className="w-full max-w-sm">
                                        <Label
                                            htmlFor="avatar-upload"
                                            className="flex cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/40 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#FF8E84]/45 hover:bg-white/5"
                                        >
                                            Upload Custom Photo
                                        </Label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#ABABAB]">
                                        Preset Avatars
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {ROAST_AVATARS.map((avatar, index) => {
                                            const avatarId = avatarIdFromIndex(index);
                                            const isSelected = !imagePreview && normalizeAvatarValue(profileImage) === avatarId;

                                            return (
                                                <button
                                                    key={avatar.id}
                                                    type="button"
                                                    onClick={() => handlePresetSelect(avatarId)}
                                                    className={cn(
                                                        "rounded-[20px] border bg-[#171717] p-3 text-left transition-all",
                                                        isSelected
                                                            ? "border-[#FF8E84] shadow-[0_0_0_1px_rgba(255,142,132,0.25)]"
                                                            : "border-white/8 hover:border-white/18 hover:bg-[#1B1B1B]",
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <RoastAvatar
                                                            value={avatarId}
                                                            fallbackSeed={avatar.id}
                                                            alt={avatar.name}
                                                            size={52}
                                                            className="border border-white/10"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-black uppercase tracking-[0.08em] text-white">
                                                                {avatar.name}
                                                            </p>
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ABABAB]">
                                                                {avatar.badge}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex items-center gap-4 rounded-[24px] border border-white/8 bg-[#161616] px-5 py-4">
                                    <RoastAvatar
                                        value={imagePreview || profileImage}
                                        fallbackSeed={user.id || username || name}
                                        alt="Current profile avatar"
                                        size={72}
                                        className="border border-[#FF8E84]/30"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#FF8E84]">
                                            Current Identity
                                        </p>
                                        <p className="truncate text-lg font-black text-white">@{username || user.username}</p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveView("avatar")}
                                            className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#ABABAB] transition-colors hover:text-white"
                                        >
                                            Change Avatar
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-end justify-between">
                                        <Label>Username</Label>
                                        <span className="rounded-full border border-red-900/40 bg-red-950/30 px-2 py-0.5 text-[10px] font-mono uppercase text-red-500">
                                            {Math.max(0, 2 - user.usernameChangeCount)} changes left
                                        </span>
                                    </div>
                                    <Input
                                        value={username}
                                        onChange={(event) => setUsername(event.target.value)}
                                        className="bg-black/50 border-white/10 font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Bio</Label>
                                    <Textarea
                                        value={bio}
                                        onChange={(event) => setBio(event.target.value)}
                                        className="min-h-[112px] resize-none bg-black/50 border-white/10"
                                        rows={4}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-[20px] border border-white/5 bg-black/40 px-4 py-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-bold">Show Real Name</Label>
                                        <p className="text-xs text-[#8A8A8A]">
                                            If disabled, your public handle stays primary across the Roast Wall.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={showRealName}
                                        onChange={(event) => setShowRealName(event.target.checked)}
                                        className="h-4 w-4 accent-red-600"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/5 px-6 py-4">
                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
