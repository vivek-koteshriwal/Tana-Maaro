"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, TimerReset } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { ACCOUNT_DELETION_WINDOW_DAYS, isPendingDeletionWindowActive } from "@/lib/account-deletion";

export function AccountDeletionGate() {
    const { user, loading, logout, reactivateAccount } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const scheduledLabel = (() => {
        if (!user?.scheduledDeletionAt) {
            return `${ACCOUNT_DELETION_WINDOW_DAYS} days`;
        }

        const parsed = Date.parse(user.scheduledDeletionAt);
        if (Number.isNaN(parsed)) {
            return `${ACCOUNT_DELETION_WINDOW_DAYS} days`;
        }

        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(parsed));
    })();

    if (loading || !user || !isPendingDeletionWindowActive(user)) {
        return null;
    }

    const handleReactivate = async () => {
        setError("");
        setIsSubmitting(true);
        const success = await reactivateAccount();
        if (!success) {
            setError("We could not reactivate the account right now. Please try again.");
        }
        setIsSubmitting(false);
    };

    const handleContinueDeletion = async () => {
        setError("");
        setIsSubmitting(true);
        await logout();
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[28px] border border-red-900/40 bg-[#0D0D0D] p-6 text-white shadow-2xl shadow-black/50 sm:p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/60 text-red-400">
                    <AlertTriangle className="h-7 w-7" />
                </div>

                <div className="space-y-3">
                    <p className="font-epilogue text-[12px] font-black uppercase tracking-[0.28em] text-red-400">
                        Account Scheduled For Deletion
                    </p>
                    <h2 className="font-epilogue text-3xl font-black uppercase tracking-tight text-white">
                        Reactivate Or Continue
                    </h2>
                    <p className="max-w-lg text-sm leading-7 text-white/70 sm:text-base">
                        Your account is currently pending permanent deletion. If you sign back in before the deadline, you can restore full access immediately.
                    </p>
                </div>

                <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start gap-3">
                        <TimerReset className="mt-0.5 h-5 w-5 text-red-400" />
                        <div className="space-y-1.5">
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
                                Permanent deletion deadline
                            </p>
                            <p className="text-base font-semibold text-white">
                                {scheduledLabel}
                            </p>
                            <p className="text-sm leading-6 text-white/60">
                                Choosing continue deletion will keep the deletion request active. Choosing reactivate cancels the schedule and restores your account right away.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Button
                        type="button"
                        onClick={handleReactivate}
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl bg-red-600 text-sm font-black uppercase tracking-[0.18em] hover:bg-red-700"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Reactivating..." : "Reactivate Account"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleContinueDeletion}
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl border-white/15 bg-white/[0.02] text-sm font-black uppercase tracking-[0.18em] text-white hover:bg-white/5"
                    >
                        Continue Deletion
                    </Button>
                </div>
            </div>
        </div>
    );
}
