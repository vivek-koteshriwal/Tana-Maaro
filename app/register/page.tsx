"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Flame, Loader2 } from "lucide-react";
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

export default function RegisterPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        if (user) router.push("/feed");
    }, [user, router]);

    const [step, setStep] = useState<"info" | "avatar">("info");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [dob, setDob] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].id);

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !username.trim() || !email.trim() || !password.trim() || !dob) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");
        setStep("avatar");
    };

    const handleRegister = async () => {
        setIsLoading(true);
        setError("");
        try {
            const preset = PRESET_AVATARS.find((a) => a.id === selectedAvatar) ?? PRESET_AVATARS[0];
            const avatarUri = makeAvatarUri(preset.emoji, preset.bg);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    username: username.replace(/^@/, "").trim(),
                    email: email.trim(),
                    password,
                    dateOfBirth: dob,
                    profileImage: avatarUri,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");
            await refreshUser();
            router.push("/feed");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed.");
            setStep("info");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        if (!auth) { setError("Auth not initialised."); return; }
        setIsLoading(true);
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
                    user: { displayName: result.user.displayName, photoURL: result.user.photoURL },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Google sign-up failed");

            await refreshUser();
            if (data.needsUsername) {
                router.push("/settings?setup=username");
            } else {
                router.push("/feed");
            }
        } catch (err: unknown) {
            const e = err as { code?: string; message?: string };
            if (e.code !== "auth/popup-closed-by-user") {
                setError(e.message || "Google sign-up failed.");
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0E0E0E] p-6 py-24">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="mb-10 flex flex-col items-center">
                    <div className="flame-glow mb-5 flex h-20 w-20 items-center justify-center rounded-full">
                        <Flame className="h-10 w-10 text-red-500" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-epilogue font-black text-[2rem] leading-none tracking-tighter">
                        <span className="text-white">Tana</span>
                        <span className="text-red-500"> Maaro</span>
                    </h1>
                    <p className="mt-2 font-manrope font-black text-[11px] uppercase tracking-[4px] text-white/30">
                        {step === "avatar" ? "Pick Your Persona" : "Join The Arena"}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 font-manrope text-sm font-semibold text-red-400">
                        {error}
                    </div>
                )}

                {step === "info" ? (
                    <>
                        <form onSubmit={handleInfoSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Roast God"
                                        className="w-full rounded-xl bg-white/5 px-3.5 py-3 font-manrope text-[13px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="roast_king"
                                        className="w-full rounded-xl bg-white/5 px-3.5 py-3 font-manrope text-[13px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    autoComplete="email"
                                    className="w-full rounded-xl bg-white/5 px-4 py-3.5 font-manrope text-[14px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        className="w-full rounded-xl bg-white/5 px-4 py-3.5 pr-12 font-manrope text-[14px] font-semibold text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                        required
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

                            <div>
                                <label className="mb-1.5 block font-manrope text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    max={new Date().toISOString().split("T")[0]}
                                    title="Date of Birth — must be 18 or older"
                                    className="w-full rounded-xl bg-white/5 px-4 py-3.5 font-manrope text-[14px] font-semibold text-white/70 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                    required
                                />
                                <p className="mt-1 font-manrope text-[10px] font-bold uppercase tracking-[1px] text-red-500/60">
                                    18+ Strictly Enforced
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="flex h-[54px] w-full items-center justify-center rounded-[14px] bg-red-600 font-epilogue text-[15px] font-black uppercase tracking-[2px] text-white shadow-lg shadow-red-900/30 hover:bg-red-700 transition-all"
                            >
                                NEXT: PICK AVATAR
                            </button>
                        </form>

                        <div className="my-7 flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/8" />
                            <span className="font-manrope font-black text-[11px] tracking-[1px] text-white/20">OR</span>
                            <div className="h-px flex-1 bg-white/8" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignUp}
                            disabled={isLoading}
                            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-white/10 bg-transparent font-manrope text-[13px] font-bold uppercase tracking-[1px] text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white disabled:opacity-60 transition-all"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
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

                        <div className="mt-6 text-center">
                            <span className="font-manrope text-[13px] text-white/30">Already in the arena? </span>
                            <Link
                                href="/login"
                                className="font-manrope text-[13px] font-bold uppercase tracking-[0.5px] text-red-500 hover:text-red-400 transition-colors"
                            >
                                Login
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <p className="text-center font-manrope text-[13px] font-semibold text-white/50">
                            Choose your arena persona. You can change this later.
                        </p>

                        <div className="grid grid-cols-4 gap-3">
                            {PRESET_AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    type="button"
                                    aria-label={`Select ${avatar.id} avatar`}
                                    onClick={() => setSelectedAvatar(avatar.id)}
                                    className={cn(
                                        "flex aspect-square w-full items-center justify-center rounded-2xl text-3xl transition-all",
                                        avatar.bgClass,
                                        selectedAvatar === avatar.id
                                            ? "scale-105 ring-2 ring-[#FF8E84] ring-offset-2 ring-offset-[#0E0E0E]"
                                            : "opacity-60 hover:opacity-90",
                                    )}
                                >
                                    {avatar.emoji}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleRegister}
                            disabled={isLoading}
                            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-red-600 font-epilogue text-[15px] font-black uppercase tracking-[2px] text-white shadow-lg shadow-red-900/30 hover:bg-red-700 disabled:opacity-60 transition-all"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTER THE ARENA"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep("info")}
                            className="flex w-full items-center justify-center gap-2 font-manrope text-[12px] text-white/30 hover:text-white/60 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Go back
                        </button>

                        <div className="text-center">
                            <Link
                                href="/privacy"
                                className="font-manrope text-[12px] font-semibold uppercase tracking-[0.08em] text-white/35 transition-colors hover:text-white/70"
                            >
                                Read Privacy Policy
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
