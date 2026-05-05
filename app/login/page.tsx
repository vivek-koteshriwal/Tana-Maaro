"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Flame } from "lucide-react";
import { auth } from "@/lib/firebase";
import { ACCOUNT_DELETION_WINDOW_DAYS } from "@/lib/account-deletion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/feed";
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        if (user) router.push(callbackUrl);
    }, [user, router, callbackUrl]);

    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (searchParams.get("accountDeletion") === "scheduled") {
            setSuccess(`Your account is scheduled for permanent deletion in ${ACCOUNT_DELETION_WINDOW_DAYS} days. Sign in before then if you want to reactivate it.`);
        }
    }, [searchParams]);

    // ── Email / Username login ─────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!identifier.trim() || !password.trim()) {
            setError("Please enter your identifier and password.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identifier, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");
            await refreshUser();
            router.push(callbackUrl);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Google Sign-In ─────────────────────────────────────────────
    const handleGoogleSignIn = async () => {
        if (!auth) { setError("Auth not initialised."); return; }
        setError("");
        setIsGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: idToken,
                    user: {
                        displayName: result.user.displayName,
                        photoURL: result.user.photoURL,
                    },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Google sign-in failed");

            await refreshUser();
            if (data.needsUsername) {
                router.push("/settings?setup=username");
            } else {
                router.push(callbackUrl);
            }
        } catch (err: unknown) {
            const code = typeof err === "object" && err !== null && "code" in err
                ? String((err as { code?: unknown }).code)
                : "";
            if (code !== "auth/popup-closed-by-user") {
                setError(err instanceof Error ? err.message : "Google sign-in failed.");
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // ── Forgot Password ────────────────────────────────────────────
    const handleForgotPassword = async () => {
        const email = identifier.includes("@") ? identifier : "";
        const input = window.prompt(
            "Enter your registered email address:",
            email
        );
        if (!input || !input.includes("@")) return;
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: input.trim() }),
            });
            if (res.ok) {
                setSuccess("Reset link sent! Check your inbox.");
            } else {
                const d = await res.json();
                setError(d.error || "Could not send reset email.");
            }
        } catch {
            setError("Could not send reset email.");
        }
    };

    const anyLoading = isLoading || isGoogleLoading;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-sm">

                {/* ── Logo / Brand ── */}
                <div className="flex flex-col items-center mb-10">
                    <div className="flame-glow w-24 h-24 rounded-full flex items-center justify-center mb-5">
                        <Flame className="w-12 h-12 text-red-500" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-epilogue font-black text-[2.2rem] leading-none tracking-tighter">
                        <span className="text-white">Tana</span>
                        <span className="text-red-500"> Maaro</span>
                    </h1>
                    <p className="mt-2 font-manrope font-black text-[11px] text-white/30 tracking-[4px] uppercase">
                        Enter the Chaos
                    </p>
                </div>

                {/* ── Alerts ── */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm font-manrope font-semibold">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-green-900/20 border border-green-500/30 text-green-400 text-sm font-manrope font-semibold">
                        {success}
                    </div>
                )}

                {/* ── Form ── */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Identifier */}
                    <div>
                        <label className="block font-manrope font-black text-[10px] text-white/25 tracking-[1.5px] uppercase mb-2">
                            Email / Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                placeholder="e.g. savage_cobra_42"
                                autoComplete="username"
                                className="w-full bg-white/5 border-0 rounded-xl pl-10 pr-4 py-3.5 text-white text-[15px] font-manrope font-semibold placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/60 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block font-manrope font-black text-[10px] text-white/25 tracking-[1.5px] uppercase mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="w-full bg-white/5 border-0 rounded-xl pl-10 pr-12 py-3.5 text-white text-[15px] font-manrope font-semibold placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/60 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot password */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="font-manrope font-semibold text-[13px] text-red-500 hover:text-red-400 transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Login button */}
                    <button
                        type="submit"
                        disabled={anyLoading}
                        className="w-full h-[54px] bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 text-white font-epilogue font-black text-[15px] tracking-[2px] uppercase rounded-[14px] shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : "LOGIN"}
                    </button>
                </form>

                {/* ── Sign-up link ── */}
                <div className="mt-5 flex items-center justify-center gap-1.5">
                    <span className="font-manrope text-[13px] text-white/30">New roaster?</span>
                    <Link
                        href="/register"
                        className="font-manrope font-bold text-[13px] text-red-500 hover:text-red-400 transition-colors uppercase tracking-[0.5px]"
                    >
                        Create Account
                    </Link>
                </div>

                {/* ── Divider ── */}
                <div className="my-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="font-manrope font-black text-[11px] text-white/20 tracking-[1px]">OR</span>
                    <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* ── Google Sign-In ── */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={anyLoading}
                    className="w-full h-[52px] bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 disabled:opacity-60 text-white/70 hover:text-white font-manrope font-bold text-[13px] tracking-[1px] uppercase rounded-[14px] transition-all flex items-center justify-center gap-3"
                >
                    {isGoogleLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    Continue with Google
                </button>

                <div className="mt-5 text-center">
                    <Link
                        href="/privacy"
                        className="font-manrope text-[12px] font-semibold uppercase tracking-[0.08em] text-white/35 transition-colors hover:text-white/70"
                    >
                        Read Privacy Policy
                    </Link>
                </div>

            </div>
        </div>
    );
}
