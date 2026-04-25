"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface User {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
    isMutual?: boolean;
}

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    title: string;
    type: "followers" | "following";
}

export function FollowListModal({ isOpen, onClose, userId, title, type }: FollowListModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/${type}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${type}:`, error);
        } finally {
            setLoading(false);
        }
    }, [type, userId]);

    useEffect(() => {
        if (isOpen && userId) {
            void fetchUsers();
        }
    }, [fetchUsers, isOpen, userId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-white/5">
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">{title}</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 italic">
                            No {type} yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/profile/${encodeURIComponent(user.username)}`}
                                    onClick={onClose}
                                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                                >
                                    <RoastAvatar
                                        value={user.profileImage}
                                        fallbackSeed={user.id || user.username || user.name}
                                        alt={user.name}
                                        size={48}
                                        className="border border-white/10 group-hover:border-red-600/50 transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white truncate">{user.name}</p>
                                            {user.isMutual && (
                                                <span className="px-1.5 py-0.5 rounded bg-red-600/10 border border-red-600/30 text-[8px] font-black text-red-500 uppercase tracking-tighter">
                                                    Mutual
                                                </span>
                                            )}
                                        </div>
                                        {user.username && user.username !== "anon" && (
                                            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
