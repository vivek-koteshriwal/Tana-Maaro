"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function AdminLogin() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [creds, setCreds] = useState({ email: "", password: "" });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: creds.email, password: creds.password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Authentication failed.");
                setLoading(false);
                return;
            }

            const redirectTo = searchParams.get("from") || "/admin-dashboard";
            router.push(redirectTo);
        } catch {
            setError("Server connection failed. Try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            <ScrollReveal className="w-full max-w-md px-4 relative z-10">
                <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-900 via-red-600 to-red-900" />

                    <div className="text-center mb-10 mt-4">
                        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                            <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            Admin <span className="text-red-500">Core</span>
                        </h1>
                        <p className="text-gray-400 text-sm">Restricted Area. Authorized Personnel Only.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-md text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2 relative">
                            <Label htmlFor="email" className="text-gray-300">Admin Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@tanamaaro.com"
                                    className="pl-10 bg-black/50 border-neutral-800 focus-visible:ring-red-600 text-white"
                                    value={creds.email}
                                    onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <Label htmlFor="password" className="text-gray-300">Passphrase</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-black/50 border-neutral-800 focus-visible:ring-red-600 text-white"
                                    value={creds.password}
                                    onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white uppercase font-bold tracking-widest py-6 mt-4 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                            disabled={loading}
                        >
                            {loading ? "Authenticating..." : "Access Control"}
                        </Button>
                    </form>
                </div>
            </ScrollReveal>
        </div>
    );
}
