"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AtSign,
    Key,
    FileText,
    ChevronRight,
    Settings,
    Shield,
    User,
    Trash2,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import Link from "next/link";
import { PartnershipSection } from "@/components/landing/partnership-section";
import { RoastAvatar } from "@/components/shared/roast-avatar";

const DELETE_REASONS = [
    "Taking a break",
    "Privacy concerns",
    "Too many notifications",
    "Found another platform",
    "Not useful anymore",
    "Temporary issue",
    "Other",
] as const;

export default function SettingsPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [deleteReason, setDeleteReason] = useState<(typeof DELETE_REASONS)[number]>("Taking a break");
    const [deleteFeedback, setDeleteFeedback] = useState("");
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            setBio(user.bio || "");
        }
    }, [user]);

    useEffect(() => {
        if (!deleteDialogOpen || typeof window === "undefined") {
            return;
        }

        const { body, documentElement } = document;
        const previousBodyOverflow = body.style.overflow;
        const previousBodyPaddingRight = body.style.paddingRight;
        const previousHtmlOverflow = documentElement.style.overflow;
        const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

        body.style.overflow = "hidden";
        documentElement.style.overflow = "hidden";

        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            body.style.overflow = previousBodyOverflow;
            body.style.paddingRight = previousBodyPaddingRight;
            documentElement.style.overflow = previousHtmlOverflow;
        };
    }, [deleteDialogOpen]);

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setIsResetting(true);
        setMessage("");
        try {
            const firebaseUser = auth?.currentUser;
            const isSocial = firebaseUser?.providerData.some(
                p => p.providerId === "google.com" || p.providerId === "phone"
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, bio }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update profile");
            setMessage("Settings saved successfully!");
            refreshUser();
        } catch (error: unknown) {
            console.error(error);
            setMessage(error instanceof Error ? error.message : "Error updating settings.");
        } finally {
            setLoading(false);
        }
    };

    const openDeleteDialog = () => {
        setDeleteDialogOpen(true);
        setDeleteStep(1);
        setDeleteReason("Taking a break");
        setDeleteFeedback("");
        setDeleteConfirmationText("");
        setDeleteError("");
    };

    const closeDeleteDialog = () => {
        if (isDeletingAccount) {
            return;
        }

        setDeleteDialogOpen(false);
        setDeleteError("");
    };

    const handleDeleteStepOne = () => {
        if (deleteReason === "Other" && !deleteFeedback.trim()) {
            setDeleteError("Tell us why you are leaving before continuing.");
            return;
        }

        setDeleteError("");
        setDeleteStep(2);
    };

    const handleDeleteAccount = async () => {
        setDeleteError("");

        if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
            setDeleteError("Type DELETE exactly to confirm account deletion.");
            return;
        }

        setIsDeletingAccount(true);
        try {
            const response = await fetch("/api/account/delete-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    reason: deleteReason,
                    feedback: deleteFeedback.trim(),
                    confirmationText: deleteConfirmationText.trim(),
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Failed to schedule account deletion.");
            }

            if (auth) {
                await signOut(auth).catch(() => undefined);
            }
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);

            setDeleteDialogOpen(false);
            router.push("/login?accountDeletion=scheduled");
        } catch (error: unknown) {
            console.error("Delete account error:", error);
            setDeleteError(error instanceof Error ? error.message : "Failed to schedule account deletion.");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    if (!user) return <div className="pt-24 text-center text-white">Please login to access settings.</div>;

    return (
        <div className="min-h-screen bg-black pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-red-600 rounded-lg">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Control Center</h1>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Profile Header Card */}
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                        <RoastAvatar
                            value={user.profileImage}
                            fallbackSeed={user.id || user.username || user.name}
                            alt={user.name}
                            size={80}
                            className="border-2 border-red-600"
                        />
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            <p className="text-red-500 font-mono">@{user.username}</p>
                            <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                        </div>
                    </div>

                    {/* Identity Section */}
                    <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Identity</h3>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Username</Label>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-black/50 border-white/10 text-white pl-9 focus:border-red-600 font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Bio</Label>
                            <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us how savage you are..."
                                className="bg-black/50 border-white/10 text-white min-h-[100px] focus:border-red-600"
                            />
                        </div>
                    </div>

                    {/* Account Security */}
                    <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Key className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Account Security</h3>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-between text-white hover:bg-white/5 py-6 px-4 border border-white/5 hover:border-red-900/30"
                            onClick={handlePasswordReset}
                            disabled={isResetting}
                        >
                            <span className="flex items-center gap-3">
                                <Key className="w-4 h-4 text-gray-400" />
                                {isResetting ? "Dispatching Protocol..." : "Change Password"}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </Button>

                        <Link href="/terms" className="block">
                            <div className="flex items-center justify-between text-white hover:bg-white/5 py-4 px-4 border border-white/5 rounded-md transition-colors">
                                <span className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    Terms of Chaos
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </div>
                        </Link>

                        <Link href="/privacy" className="block">
                            <div className="flex items-center justify-between text-white hover:bg-white/5 py-4 px-4 border border-white/5 rounded-md transition-colors">
                                <span className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-gray-400" />
                                    Privacy Policy
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </div>
                        </Link>
                    </div>

                    <div className="bg-neutral-900/40 border border-red-900/30 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Account Management</h3>
                        </div>

                        <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
                                <div className="space-y-1.5">
                                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">
                                        Delete Account
                                    </p>
                                    <p className="text-sm leading-6 text-white/65">
                                        Your account will be deactivated immediately and scheduled for permanent deletion in 7 days. If you sign back in before then, you can reactivate it.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between rounded-2xl border-red-900/40 bg-transparent py-6 text-red-300 hover:bg-red-950/30 hover:text-red-200"
                            onClick={openDeleteDialog}
                        >
                            <span className="flex items-center gap-3">
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </span>
                            <ChevronRight className="w-4 h-4 text-red-400/70" />
                        </Button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-bold text-center animate-in fade-in slide-in-from-bottom-2 ${message.includes("Error") || message.includes("limit") || message.includes("Failed") ? "bg-red-900/30 text-red-400 border border-red-900/50" : "bg-green-900/30 text-green-400 border border-green-900/50"}`}>
                            {message}
                        </div>
                    )}

                    <div className="sticky bottom-8 z-10 pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 font-black uppercase tracking-widest text-lg p-8 shadow-2xl shadow-red-900/20"
                            disabled={loading}
                        >
                            {loading ? "Syncing..." : "Update Profile"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Partnership Section */}
            <PartnershipSection />

            <Dialog open={deleteDialogOpen} onOpenChange={(open) => open ? setDeleteDialogOpen(true) : closeDeleteDialog()}>
                <DialogContent className="flex max-h-[calc(100vh-1.5rem)] w-[calc(100vw-1rem)] max-w-2xl flex-col overflow-hidden rounded-[28px] border-red-900/40 bg-[#0D0D0D] p-0 sm:max-h-[calc(100vh-3rem)] sm:w-full">
                    <div className="shrink-0 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl tracking-tight">
                                {deleteStep === 1 ? "Delete Account" : "Final Confirmation"}
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-sm leading-6 text-white/60">
                                {deleteStep === 1
                                    ? "We do not delete accounts instantly. First tell us why you are leaving, then confirm the request."
                                    : "Your account will be deactivated now and permanently deleted after 7 days unless you reactivate it by signing back in."}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6">
                        <div className="space-y-6 pr-1">
                            <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-5">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                                    <div className="space-y-2">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-red-300">
                                            Deletion Window
                                        </p>
                                        <p className="text-sm leading-6 text-white/70">
                                            The account is deactivated first, then permanently deleted after 7 days. Logging in during that window lets you reactivate immediately.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                                                Selected reason
                                            </span>
                                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-200">
                                                {deleteReason}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        {deleteStep === 1 ? (
                            <>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <p className="text-sm font-black uppercase tracking-[0.18em] text-red-400">
                                        Why do you want to delete your account?
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        {DELETE_REASONS.map((reason) => {
                                            const isSelected = deleteReason === reason;
                                            return (
                                                <button
                                                    key={reason}
                                                    type="button"
                                                    onClick={() => setDeleteReason(reason)}
                                                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                                                        isSelected
                                                            ? "border-red-500/60 bg-red-950/30 text-white"
                                                            : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.04]"
                                                    }`}
                                                >
                                                    <span className="font-semibold">{reason}</span>
                                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-red-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-400">
                                        {deleteReason === "Other" ? "Tell us more" : "Additional feedback (optional)"}
                                    </Label>
                                    <Textarea
                                        value={deleteFeedback}
                                        onChange={(event) => setDeleteFeedback(event.target.value)}
                                        placeholder={deleteReason === "Other" ? "Write your reason here..." : "Anything you want us to know?"}
                                        className="min-h-[120px] border-white/10 bg-black/50 text-white focus:border-red-600"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                            What happens now
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
                                            <li>Your account is marked as pending deletion.</li>
                                            <li>Your profile becomes hidden and inactive.</li>
                                            <li>You cannot use the account normally during the recovery window.</li>
                                        </ul>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                            After 7 days
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
                                            <li>Authentication access is removed.</li>
                                            <li>Personal profile data is deleted or anonymized.</li>
                                            <li>Only legally required records are retained if needed.</li>
                                        </ul>
                                    </div>
                                </div>

                                {deleteFeedback.trim() && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                            Your feedback
                                        </p>
                                        <p className="mt-3 text-sm leading-6 text-white/65">
                                            {deleteFeedback.trim()}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-gray-400">Type DELETE to confirm permanent scheduling</Label>
                                    <Input
                                        value={deleteConfirmationText}
                                        onChange={(event) => setDeleteConfirmationText(event.target.value)}
                                        placeholder="DELETE"
                                        className="border-white/10 bg-black/50 font-mono tracking-[0.3em] text-white uppercase focus:border-red-600"
                                    />
                                            <p className="text-xs leading-5 text-white/45">
                                                This does not permanently erase the account immediately. It starts the 7-day deletion countdown.
                                            </p>
                                        </div>
                            </>
                        )}

                        {deleteError && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                                {deleteError}
                            </div>
                        )}
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-white/10 bg-[#0A0A0A] px-5 py-4 sm:px-8">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                                disabled={isDeletingAccount}
                                onClick={closeDeleteDialog}
                            >
                                Cancel
                            </Button>
                            {deleteStep === 2 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                                    disabled={isDeletingAccount}
                                    onClick={() => {
                                        setDeleteStep(1);
                                        setDeleteError("");
                                    }}
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                type="button"
                                className="rounded-2xl bg-red-600 font-black uppercase tracking-[0.18em] hover:bg-red-700"
                                disabled={isDeletingAccount}
                                onClick={deleteStep === 1 ? handleDeleteStepOne : handleDeleteAccount}
                            >
                                {isDeletingAccount ? "Scheduling..." : deleteStep === 1 ? "Continue" : "Schedule Deletion"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
