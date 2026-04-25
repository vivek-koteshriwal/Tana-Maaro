"use client";

import { useState } from "react";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { FollowButton } from "@/components/profile/follow-button";
import { FollowListModal } from "@/components/profile/follow-list-modal";
import { RoastAvatar } from "@/components/shared/roast-avatar";

interface ProfileHeaderProps {
    user: {
        id: string;
        name: string;
        username: string;
        profileImage?: string;
        bio?: string;
        showRealName: boolean;
        usernameChangeCount?: number;
    };
    isOwner: boolean;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    likesCount: number;
}

export function ProfileHeader({ 
    user, 
    isOwner, 
    isFollowing, 
    followersCount: initialFollowersCount, 
    followingCount: initialFollowingCount, 
    postsCount,
    likesCount
}: ProfileHeaderProps) {
    const [isFollowersOpen, setIsFollowersOpen] = useState(false);
    const [isFollowingOpen, setIsFollowingOpen] = useState(false);

    return (
        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start w-full">
                <RoastAvatar
                    value={user.profileImage}
                    fallbackSeed={user.id || user.username || user.name}
                    alt={user.name}
                    size={128}
                    className="border-4 border-black shadow-xl flex-shrink-0"
                />

                <div className="flex-1 w-full text-center md:text-left space-y-4 pt-2">
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between w-full">
                        <div>
                            {user.showRealName && (
                                <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-1">{user.name}</h1>
                            )}
                            <p className="text-red-500 font-bold text-lg">@{user.username}</p>
                        </div>
                        {isOwner ? (
                            <div className="shrink-0">
                                <EditProfileModal user={{
                                    id: user.id,
                                    name: user.name,
                                    username: user.username,
                                    bio: user.bio,
                                    profileImage: user.profileImage || "",
                                    showRealName: user.showRealName,
                                    usernameChangeCount: user.usernameChangeCount || 0
                                }} />
                            </div>
                        ) : (
                            <div className="shrink-0">
                                <FollowButton targetUserId={user.id} targetUsername={user.username} initialIsFollowing={isFollowing} />
                            </div>
                        )}
                    </div>

                    <p className="text-gray-400 italic text-md mt-2 max-w-lg mx-auto md:mx-0">
                        &ldquo;{user.bio || "No bio yet. Probably roasting someone."}&rdquo;
                    </p>

                    <div className="flex gap-6 justify-center md:justify-start pt-2">
                        <button 
                            onClick={() => setIsFollowersOpen(true)}
                            className="text-center md:text-left hover:opacity-80 transition-opacity"
                        >
                            <span className="block font-bold text-white text-lg">{initialFollowersCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Followers</span>
                        </button>
                        <button 
                            onClick={() => setIsFollowingOpen(true)}
                            className="text-center md:text-left hover:opacity-80 transition-opacity"
                        >
                            <span className="block font-bold text-white text-lg">{initialFollowingCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Following</span>
                        </button>
                        <div className="text-center md:text-left">
                            <span className="block font-bold text-white text-lg">{postsCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Roasts</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="block font-bold text-white text-lg">{likesCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Likes</span>
                        </div>
                    </div>
                </div>
            </div>

            <FollowListModal 
                isOpen={isFollowersOpen} 
                onClose={() => setIsFollowersOpen(false)} 
                userId={user.id} 
                title={`${user.showRealName ? user.name : '@' + user.username}'s Followers`} 
                type="followers" 
            />
            <FollowListModal 
                isOpen={isFollowingOpen} 
                onClose={() => setIsFollowingOpen(false)} 
                userId={user.id} 
                title={`${user.showRealName ? user.name : '@' + user.username}'s Following`} 
                type="following" 
            />
        </div>
    );
}
