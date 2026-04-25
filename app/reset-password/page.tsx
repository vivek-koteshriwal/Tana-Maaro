"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordRequest() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to request reset");
            }

            setSuccessMessage(data.message);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-neutral-900/50 border border-neutral-800 p-8 rounded-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-red-600 uppercase tracking-tighter mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm text-center">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-md text-sm text-center">
                            {successMessage}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="roaster@tanamaaro.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 font-bold py-6"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                </form>

                <div className="text-center pt-4 border-t border-neutral-800">
                    <Link href="/login" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
