"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
    targetUserId: string;
    targetUsername: string;
    initialIsFollowing: boolean;
}

export function FollowButton({ targetUserId, targetUsername, initialIsFollowing }: FollowButtonProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    if (user && user.id === targetUserId) {
        return null; // Don't show follow button on own profile
    }

    const handleFollowToggle = async () => {
        if (!user) {
            // Unauthenticated users are redirected to login
            router.push(`/login?callbackUrl=/profile/${targetUsername}`);
            return;
        }

        setIsLoading(true);
        // Optimistic update
        setIsFollowing(!isFollowing);

        try {
            const res = await fetch(`/api/users/${targetUserId}/follow`, {
                method: "POST"
            });

            if (!res.ok) {
                throw new Error("Failed to follow");
            }

            const data = await res.json();
            setIsFollowing(data.isFollowing);
            router.refresh(); // Refresh to update server-side counts on the profile page
        } catch (error) {
            console.error("Follow toggle failed:", error);
            // Revert optimistic update
            setIsFollowing(isFollowing);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleFollowToggle}
            disabled={isLoading}
            variant={isFollowing ? "outline" : "default"}
            className={`font-bold rounded-full px-6 transition-all duration-300 ${isFollowing ? 'border-red-600/50 text-red-500 hover:bg-red-950/30 hover:border-red-500 text-xs uppercase tracking-widest bg-transparent' : 'bg-red-600 hover:bg-red-500 text-white text-sm uppercase tracking-widest'}`}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <><UserMinus className="w-4 h-4 mr-2" /> Unfollow</>
            ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Follow</>
            )}
        </Button>
    );
}
