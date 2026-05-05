"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ShieldAlert,
    TimerReset,
    Trash2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase";
import {
    ACCOUNT_DELETION_WINDOW_DAYS,
    DELETE_ACCOUNT_REASONS,
} from "@/lib/account-deletion";

type DeleteStep = 1 | 2;
type DeleteReason = (typeof DELETE_ACCOUNT_REASONS)[number];

export default function DeleteAccountPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [deleteStep, setDeleteStep] = useState<DeleteStep>(1);
    const [deleteReason, setDeleteReason] = useState<DeleteReason>("Taking a break");
    const [deleteFeedback, setDeleteFeedback] = useState("");
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const profileHref = useMemo(() => {
        if (!user?.username) {
            return "/profile";
        }

        return `/profile/${encodeURIComponent(user.username)}`;
    }, [user?.username]);

    const resetStepTwo = () => {
        setDeleteStep(1);
        setDeleteConfirmationText("");
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

            router.push("/login?accountDeletion=scheduled");
        } catch (error: unknown) {
            console.error("Delete account error:", error);
            setDeleteError(error instanceof Error ? error.message : "Failed to schedule account deletion.");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black pt-24">
                <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-red-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black pt-24 pb-20">
                <div className="mx-auto max-w-2xl px-4">
                    <div className="rounded-[28px] border border-red-900/30 bg-[#0D0D0D] p-8 text-center shadow-2xl shadow-black/40">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-950/60 text-red-400">
                            <ShieldAlert className="h-8 w-8" />
                        </div>
                        <p className="font-epilogue text-[11px] font-black uppercase tracking-[0.24em] text-red-400">
                            Secure Action
                        </p>
                        <h1 className="mt-3 font-epilogue text-3xl font-black uppercase tracking-tight text-white">
                            Sign In To Continue
                        </h1>
                        <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
                            Account deletion requires an active session so we can verify the request and protect against accidental removal.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button asChild className="rounded-2xl bg-red-600 font-black uppercase tracking-[0.18em] hover:bg-red-700">
                                <Link href="/login?callbackUrl=/delete-account">Go To Login</Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5">
                                <Link href="/settings">Back To Settings</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-20">
            <div className="mx-auto max-w-5xl px-4">
                <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="font-epilogue text-[11px] font-black uppercase tracking-[0.24em] text-red-400">
                            Dedicated Delete Flow
                        </p>
                        <h1 className="mt-3 font-epilogue text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                            Delete Account
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                            This action lives outside general settings so it stays intentional. Review the impact, confirm your reason, and start the deletion countdown only when you are ready.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                        >
                            <Link href={profileHref}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back To Profile
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                        >
                            <Link href="/settings">Back To Settings</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.2fr]">
                    <div className="space-y-6">
                        <div className="rounded-[28px] border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl shadow-black/40">
                            <div className="flex items-center gap-4">
                                <RoastAvatar
                                    value={user.profileImage}
                                    fallbackSeed={user.id || user.username || user.name}
                                    alt={user.name}
                                    size={64}
                                    className="border border-red-500/30"
                                />
                                <div className="min-w-0">
                                    <p className="font-epilogue text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                                        Account
                                    </p>
                                    <p className="mt-1 truncate text-xl font-black text-white">
                                        {user.name}
                                    </p>
                                    <p className="truncate text-sm text-red-300">@{user.username}</p>
                                    <p className="truncate text-sm text-white/55">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-red-900/30 bg-red-950/20 p-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                                <div className="space-y-2">
                                    <p className="text-sm font-black uppercase tracking-[0.18em] text-red-300">
                                        What Happens First
                                    </p>
                                    <p className="text-sm leading-6 text-white/70">
                                        Your account is deactivated immediately. Permanent deletion happens after {ACCOUNT_DELETION_WINDOW_DAYS} days unless you sign back in and reactivate before the deadline.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                            <div className="flex items-start gap-3">
                                <TimerReset className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                        Recovery Window
                                    </p>
                                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
                                        <li>Signing back in before the deadline reactivates the account immediately.</li>
                                        <li>During the countdown, your profile stays hidden and inactive.</li>
                                        <li>After the deadline, personal account data is deleted or anonymized.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                        Why This Is Separate
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-white/65">
                                        Delete Account is isolated from routine profile edits so it stays visible, deliberate, and harder to trigger by mistake.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[32px] border border-white/10 bg-[#0D0D0D] shadow-2xl shadow-black/40">
                        <div className="border-b border-white/10 px-6 py-6 sm:px-8">
                            <p className="font-epilogue text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                                Step {deleteStep} of 2
                            </p>
                            <h2 className="mt-3 font-epilogue text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                                {deleteStep === 1 ? "Confirm Intent" : "Final Confirmation"}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-white/65">
                                {deleteStep === 1
                                    ? "Tell us why you are leaving, then continue to the final review."
                                    : `Type DELETE to start the ${ACCOUNT_DELETION_WINDOW_DAYS}-day countdown.`}
                            </p>
                        </div>

                        <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                            <div className="rounded-[24px] border border-red-900/30 bg-red-950/20 p-5">
                                <div className="flex items-start gap-3">
                                    <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                                    <div className="space-y-2">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-red-300">
                                            Selected Reason
                                        </p>
                                        <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-200">
                                            {deleteReason}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {deleteStep === 1 ? (
                                <>
                                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-red-400">
                                            Why do you want to delete your account?
                                        </p>
                                        <div className="mt-4 space-y-3">
                                            {DELETE_ACCOUNT_REASONS.map((reason) => {
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
                                            className="min-h-[140px] border-white/10 bg-black/50 text-white focus:border-red-600"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                                What happens now
                                            </p>
                                            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
                                                <li>Your account is marked as pending deletion.</li>
                                                <li>Your profile becomes hidden and inactive.</li>
                                                <li>You cannot use the account normally during the recovery window.</li>
                                            </ul>
                                        </div>

                                        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                                After {ACCOUNT_DELETION_WINDOW_DAYS} days
                                            </p>
                                            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
                                                <li>Authentication access is removed.</li>
                                                <li>Personal profile data is deleted or anonymized.</li>
                                                <li>Only legally required records are retained if needed.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {deleteFeedback.trim() && (
                                        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">
                                                Your feedback
                                            </p>
                                            <p className="mt-3 text-sm leading-6 text-white/65">
                                                {deleteFeedback.trim()}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-gray-400">
                                            Type DELETE to confirm permanent scheduling
                                        </Label>
                                        <Input
                                            value={deleteConfirmationText}
                                            onChange={(event) => setDeleteConfirmationText(event.target.value)}
                                            placeholder="DELETE"
                                            className="border-white/10 bg-black/50 font-mono uppercase tracking-[0.3em] text-white focus:border-red-600"
                                        />
                                        <p className="text-xs leading-5 text-white/45">
                                            This does not erase the account immediately. It starts the {ACCOUNT_DELETION_WINDOW_DAYS}-day deletion countdown.
                                        </p>
                                    </div>
                                </>
                            )}

                            {deleteError && (
                                <div className="rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                                    {deleteError}
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-2 sm:flex-row sm:justify-end">
                                {deleteStep === 2 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                                        disabled={isDeletingAccount}
                                        onClick={resetStepTwo}
                                    >
                                        Back
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                                    >
                                        <Link href="/settings">Cancel</Link>
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    className="rounded-2xl bg-red-600 font-black uppercase tracking-[0.18em] hover:bg-red-700"
                                    disabled={isDeletingAccount}
                                    onClick={deleteStep === 1 ? handleDeleteStepOne : handleDeleteAccount}
                                >
                                    {isDeletingAccount
                                        ? "Scheduling..."
                                        : deleteStep === 1
                                            ? "Continue"
                                            : "Schedule Deletion"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
