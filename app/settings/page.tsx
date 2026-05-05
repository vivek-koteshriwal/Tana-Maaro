"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    AtSign,
    ChevronRight,
    FileText,
    Key,
    Settings,
    Shield,
    Trash2,
    User,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { PartnershipSection } from "@/components/landing/partnership-section";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNT_DELETION_WINDOW_DAYS } from "@/lib/account-deletion";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            setBio(user.bio || "");
        }
    }, [user]);

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setIsResetting(true);
        setMessage("");

        try {
            const firebaseUser = auth?.currentUser;
            const isSocial = firebaseUser?.providerData.some(
                (provider) => provider.providerId === "google.com" || provider.providerId === "phone"
            );

            if (isSocial) {
                setMessage("Your account is managed by Google/Phone. Password changes are not required locally.");
                return;
            }

            await sendPasswordResetEmail(auth!, user.email);
            setMessage(`Security Protocol Initiated: A reset link has been dispatched to ${user.email}. Check your inbox!`);
        } catch (error: unknown) {
            console.error("Password reset error:", error);
            setMessage("Failed to send reset email. Contact support if the issue persists.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, bio }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            setMessage("Settings saved successfully!");
            refreshUser();
        } catch (error: unknown) {
            console.error(error);
            setMessage(error instanceof Error ? error.message : "Error updating settings.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="pt-24 text-center text-white">Please login to access settings.</div>;
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-20">
            <div className="container mx-auto max-w-2xl px-4">
                <div className="mb-8 flex items-center gap-3">
                    <div className="rounded-lg bg-red-600 p-2">
                        <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Control Center</h1>
                        <p className="mt-1 text-sm text-white/55">
                            Manage profile details here. Destructive account deletion now has its own dedicated flow.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-neutral-900 p-6 md:flex-row">
                        <RoastAvatar
                            value={user.profileImage}
                            fallbackSeed={user.id || user.username || user.name}
                            alt={user.name}
                            size={80}
                            className="border-2 border-red-600"
                        />
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            <p className="font-mono text-red-500">@{user.username}</p>
                            <p className="mt-1 text-sm text-gray-400">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-2xl border border-white/5 bg-neutral-900/40 p-6">
                        <div className="mb-2 flex items-center gap-2">
                            <User className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-bold uppercase tracking-wider text-white">Identity</h3>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Username</Label>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-600" />
                                <Input
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    className="border-white/10 bg-black/50 pl-9 text-white font-mono focus:border-red-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Bio</Label>
                            <Textarea
                                value={bio}
                                onChange={(event) => setBio(event.target.value)}
                                placeholder="Tell us how savage you are..."
                                className="min-h-[100px] border-white/10 bg-black/50 text-white focus:border-red-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-white/5 bg-neutral-900/40 p-6">
                        <div className="mb-2 flex items-center gap-2">
                            <Key className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-bold uppercase tracking-wider text-white">Account Security</h3>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-between border border-white/5 px-4 py-6 text-white hover:border-red-900/30 hover:bg-white/5"
                            onClick={handlePasswordReset}
                            disabled={isResetting}
                        >
                            <span className="flex items-center gap-3">
                                <Key className="h-4 w-4 text-gray-400" />
                                {isResetting ? "Dispatching Protocol..." : "Change Password"}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                        </Button>

                        <Link href="/terms" className="block">
                            <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-4 text-white transition-colors hover:bg-white/5">
                                <span className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    Terms of Chaos
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                            </div>
                        </Link>

                        <Link href="/privacy" className="block">
                            <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-4 text-white transition-colors hover:bg-white/5">
                                <span className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-gray-400" />
                                    Privacy Policy
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                            </div>
                        </Link>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-red-900/30 bg-neutral-900/40 p-6">
                        <div className="mb-2 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-bold uppercase tracking-wider text-white">Delete Account</h3>
                        </div>

                        <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
                                <div className="space-y-1.5">
                                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">
                                        Dedicated Flow
                                    </p>
                                    <p className="text-sm leading-6 text-white/65">
                                        Delete Account now lives on its own page so it stays separate from routine settings. Deletion starts immediately and finishes after {ACCOUNT_DELETION_WINDOW_DAYS} days unless you reactivate in time.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            asChild
                            variant="outline"
                            className="w-full justify-between rounded-2xl border-red-900/40 bg-transparent py-6 text-red-300 hover:bg-red-950/30 hover:text-red-200"
                        >
                            <Link href="/delete-account">
                                <span className="flex items-center gap-3">
                                    <Trash2 className="h-4 w-4" />
                                    Open Delete Account Page
                                </span>
                                <ChevronRight className="h-4 w-4 text-red-400/70" />
                            </Link>
                        </Button>
                    </div>

                    {message && (
                        <div
                            className={`animate-in fade-in slide-in-from-bottom-2 rounded-xl border p-4 text-center text-sm font-bold ${
                                message.includes("Error") || message.includes("limit") || message.includes("Failed")
                                    ? "border-red-900/50 bg-red-900/30 text-red-400"
                                    : "border-green-900/50 bg-green-900/30 text-green-400"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <div className="sticky bottom-8 z-10 pt-4">
                        <Button
                            type="submit"
                            className="w-full p-8 text-lg font-black uppercase tracking-widest shadow-2xl shadow-red-900/20"
                            disabled={loading}
                        >
                            {loading ? "Syncing..." : "Update Profile"}
                        </Button>
                    </div>
                </form>
            </div>

            <PartnershipSection />
        </div>
    );
}
