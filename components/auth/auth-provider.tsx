"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Define our App User type
export interface SocialUser {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    username: string;
    followers: number;
    following: number;
    bio?: string;
    showRealName: boolean;
    usernameChangeCount: number;
    lastUsernameChange?: string | null;
    createdAt?: string;
    status?: string;
    scheduledDeletionAt?: string | null;
    deletionRequestedAt?: string | null;
    deletionReason?: string | null;
    deletionFeedback?: string | null;
    reactivatedAt?: string | null;
}

interface AuthContextType {
    user: SocialUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    reactivateAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SocialUser | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        try {
            const res = await fetch("/api/auth/me");
            const data = await res.json();
            
            if (data.user) {
                setUser(data.user);
                return data.user;
            } else {
                setUser(null);
                return null;
            }
        } catch (error) {
            console.error("Backend session check failed", error);
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // First check backend session
        checkSession();

        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
                // When Firebase state changes (e.g. Google Login), re-sync with backend
                if (firebaseUser) {
                    await checkSession();
                }
            });
            return () => unsubscribe();
        }
    }, []);

    const logout = async () => {
        try {
            // 1. Clear Firebase session
            if (auth) await signOut(auth);

            // 2. Clear Backend cookie
            await fetch("/api/auth/logout", { method: "POST" });

            // 3. Reset local state
            setUser(null);
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const refreshUser = async () => {
        setLoading(true);
        await checkSession();
    };

    const reactivateAccount = async () => {
        try {
            const response = await fetch("/api/account/reactivate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Failed to reactivate account.");
            }

            await checkSession();
            return true;
        } catch (error) {
            console.error("Account reactivation failed", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser, reactivateAccount }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
