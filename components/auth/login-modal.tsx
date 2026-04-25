"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { cn } from "@/lib/utils";

const PRESET_AVATARS = [
    { id: "fire",      emoji: "🔥", bg: "#3D1A14", bgClass: "bg-[#3D1A14]" },
    { id: "skull",     emoji: "💀", bg: "#1A1A1A", bgClass: "bg-[#1A1A1A]" },
    { id: "lightning", emoji: "⚡", bg: "#171B2D", bgClass: "bg-[#171B2D]" },
    { id: "clown",     emoji: "🤡", bg: "#2A1A2D", bgClass: "bg-[#2A1A2D]" },
    { id: "dragon",    emoji: "🐉", bg: "#0D2B1A", bgClass: "bg-[#0D2B1A]" },
    { id: "crown",     emoji: "👑", bg: "#2D2210", bgClass: "bg-[#2D2210]" },
    { id: "eagle",     emoji: "🦅", bg: "#161E20", bgClass: "bg-[#161E20]" },
    { id: "mask",      emoji: "🎭", bg: "#18102E", bgClass: "bg-[#18102E]" },
];

function makeAvatarUri(emoji: string, bg: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${bg}"/><text x="50" y="68" text-anchor="middle" font-size="50" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">${emoji}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function GoogleIcon() {
    return (
        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalStep = "login" | "signup" | "avatar-setup";

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { refreshUser } = useAuth();
    const [step, setStep] = useState<ModalStep>("login");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Login fields
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    // Signup fields
    const [signupName, setSignupName] = useState("");
    const [signupUsername, setSignupUsername] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupDob, setSignupDob] = useState("");

    // Avatar setup (for Google new users)
    const [setupUsername, setSetupUsername] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].id);

    const reset = () => {
        setStep("login");
        setError("");
        setSuccess("");
        setIdentifier("");
        setPassword("");
        setSignupName("");
        setSignupUsername("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupDob("");
        setSetupUsername("");
        setSelectedAvatar(PRESET_AVATARS[0].id);
        setShowPassword(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim() || !password.trim()) {
            setError("Please enter your identifier and password.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identifier, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");
            await refreshUser();
            handleClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signupName.trim() || !signupUsername.trim() || !signupEmail.trim() || !signupPassword.trim() || !signupDob) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: signupName,
                    username: signupUsername.replace(/^@/, ""),
                    email: signupEmail,
                    password: signupPassword,
                    dateOfBirth: signupDob,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");
            await refreshUser();
            handleClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!auth) { setError("Auth not initialised."); return; }
        setGoogleLoading(true);
        setError("");
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

            if (data.needsUsername) {
                setStep("avatar-setup");
            } else {
                await refreshUser();
                handleClose();
            }
        } catch (err: unknown) {
            const e = err as { code?: string; message?: string };
            if (e.code !== "auth/popup-closed-by-user") {
                setError(e.message || "Google sign-in failed.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleAvatarSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupUsername.trim()) { setError("Username is required."); return; }
        setLoading(true);
        setError("");
        try {
            const preset = PRESET_AVATARS.find((a) => a.id === selectedAvatar) ?? PRESET_AVATARS[0];
            const avatarUri = makeAvatarUri(preset.emoji, preset.bg);

            const res = await fetch("/api/auth/update-username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: setupUsername, profileImage: avatarUri }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to set username");
            await refreshUser();
            handleClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Setup failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const email = identifier.includes("@") ? identifier : "";
        const input = window.prompt("Enter your registered email address:", email);
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

    const anyLoading = loading || googleLoading;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="border border-white/[0.08] bg-[#141414] p-0 text-white sm:max-w-[400px] [&>button]:hidden">
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h2 className="font-epilogue text-xl font-black uppercase tracking-[0.1em] text-[#FF8E84]">
                            {step === "avatar-setup"
                                ? "Claim Your Identity"
                                : step === "signup"
                                ? "Join The Arena"
                                : "Enter The Chaos"}
                        </h2>
                        <p className="mt-1 font-manrope text-[12px] text-white/40">
                            {step === "avatar-setup"
                                ? "Pick your arena persona to begin"
                                : step === "signup"
                                ? "Create your account to start roasting"
                                : "Sign in to post, like, and roast"}
                        </p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-[13px] font-semibold text-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-900/20 px-4 py-3 text-[13px] font-semibold text-green-400">
                            {success}
                        </div>
                    )}

                    {/* ── Login Step ── */}
                    {step === "login" && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="mb-2 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                    Email / Username
                                </label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="e.g. savage_cobra_42"
                                    autoComplete="username"
                                    className="w-full rounded-xl bg-white/5 px-4 py-3.5 font-manrope text-[14px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="w-full rounded-xl bg-white/5 px-4 py-3.5 pr-12 font-manrope text-[14px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="font-manrope text-[12px] font-semibold text-[#FF8E84] hover:text-[#FF6B61] transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={anyLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#FF3B3B] py-3.5 font-epilogue text-[14px] font-black uppercase tracking-[2px] text-white shadow-lg shadow-red-900/30 hover:bg-[#FF2929] disabled:opacity-60 transition-all"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "LOGIN"}
                            </button>

                            <div className="flex items-center gap-4 py-1">
                                <div className="h-px flex-1 bg-white/8" />
                                <span className="font-manrope text-[11px] font-black tracking-[1px] text-white/20">OR</span>
                                <div className="h-px flex-1 bg-white/8" />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={anyLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-white/10 bg-transparent py-3.5 font-manrope text-[13px] font-bold uppercase tracking-[1px] text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white disabled:opacity-60 transition-all"
                            >
                                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                                Continue with Google
                            </button>

                            <div className="pt-1 text-center">
                                <span className="font-manrope text-[12px] text-white/30">New roaster? </span>
                                <button
                                    type="button"
                                    onClick={() => { setStep("signup"); setError(""); setSuccess(""); }}
                                    className="font-manrope text-[12px] font-bold uppercase tracking-[0.5px] text-[#FF8E84] hover:text-[#FF6B61] transition-colors"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Signup Step ── */}
                    {step === "signup" && (
                        <form onSubmit={handleSignup} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">Full Name</label>
                                    <input
                                        type="text"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        placeholder="Roast God"
                                        className="w-full rounded-xl bg-white/5 px-3.5 py-3 font-manrope text-[13px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">Username</label>
                                    <input
                                        type="text"
                                        value={signupUsername}
                                        onChange={(e) => setSignupUsername(e.target.value)}
                                        placeholder="@roastking"
                                        className="w-full rounded-xl bg-white/5 px-3.5 py-3 font-manrope text-[13px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">Email</label>
                                <input
                                    type="email"
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    className="w-full rounded-xl bg-white/5 px-4 py-3 font-manrope text-[13px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">Password</label>
                                <input
                                    type="password"
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl bg-white/5 px-4 py-3 font-manrope text-[13px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">Date of Birth</label>
                                <input
                                    type="date"
                                    value={signupDob}
                                    onChange={(e) => setSignupDob(e.target.value)}
                                    max={new Date().toISOString().split("T")[0]}
                                    title="Date of Birth — must be 18 or older"
                                    className="w-full rounded-xl bg-white/5 px-4 py-3 font-manrope text-[13px] font-semibold text-white/70 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                    required
                                />
                                <p className="mt-1 font-manrope text-[10px] font-bold uppercase tracking-[1px] text-red-500/60">18+ Only</p>
                            </div>

                            <button
                                type="submit"
                                disabled={anyLoading}
                                className="mt-1 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#FF3B3B] py-3.5 font-epilogue text-[14px] font-black uppercase tracking-[2px] text-white shadow-lg shadow-red-900/30 hover:bg-[#FF2929] disabled:opacity-60 transition-all"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "CREATE ACCOUNT"}
                            </button>

                            <div className="pt-1 text-center">
                                <button
                                    type="button"
                                    onClick={() => { setStep("login"); setError(""); setSuccess(""); }}
                                    className="font-manrope text-[12px] text-white/30 hover:text-white/60 transition-colors"
                                >
                                    Already a veteran?{" "}
                                    <span className="font-bold text-[#FF8E84]">Login</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Avatar Setup Step (Google new users) ── */}
                    {step === "avatar-setup" && (
                        <form onSubmit={handleAvatarSetup} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                    Choose Username
                                </label>
                                <input
                                    type="text"
                                    value={setupUsername}
                                    onChange={(e) => setSetupUsername(e.target.value)}
                                    placeholder="@your_handle"
                                    className="w-full rounded-xl bg-white/5 px-4 py-3.5 font-manrope text-[14px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-[#FF8E84]/50 transition-all"
                                    required
                                />
                                <p className="mt-1.5 font-manrope text-[11px] text-white/30">
                                    This is how you&apos;ll be known in the arena.
                                </p>
                            </div>

                            <div>
                                <label className="mb-3 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                    Pick Your Avatar
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {PRESET_AVATARS.map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            type="button"
                                            aria-label={`Select ${avatar.id} avatar`}
                                            onClick={() => setSelectedAvatar(avatar.id)}
                                            className={cn(
                                                "flex h-16 w-full items-center justify-center rounded-2xl text-3xl transition-all",
                                                avatar.bgClass,
                                                selectedAvatar === avatar.id
                                                    ? "scale-105 ring-2 ring-[#FF8E84] ring-offset-2 ring-offset-[#141414]"
                                                    : "opacity-60 hover:opacity-90",
                                            )}
                                        >
                                            {avatar.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={anyLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#FF3B3B] py-3.5 font-epilogue text-[14px] font-black uppercase tracking-[2px] text-white shadow-lg shadow-red-900/30 hover:bg-[#FF2929] disabled:opacity-60 transition-all"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTER THE ARENA"}
                            </button>
                        </form>
                    )}

                    <div className="pt-5 text-center">
                        <Link
                            href="/privacy"
                            onClick={handleClose}
                            className="font-manrope text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35 transition-colors hover:text-white/70"
                        >
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
