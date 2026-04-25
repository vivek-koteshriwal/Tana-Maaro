"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

export default function ProfileRedirect() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user?.username) {
                router.replace(`/profile/${encodeURIComponent(user.username)}`);
            } else {
                router.replace("/");
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
    );
}
