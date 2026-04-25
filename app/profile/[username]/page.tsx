import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Post } from "@/types/feed";
import ProfileClient from "./profile-client";

interface ProfileUserRecord {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
    photoURL?: string;
    avatar?: string;
    bio?: string;
    showRealName?: boolean;
    usernameChangeCount?: number;
    followerCount?: number;
    followingCount?: number;
    postsCount?: number;
}

type ProfileFollowerRecord = {
    id: string;
};

type ProfilePostRecord = Post & {
    likedBy?: string[];
    dislikedBy?: string[];
};

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const user = await db.findUserByUsername(username) as ProfileUserRecord | null;
    if (!user) notFound();

    const authUser = await verifyAuth();

    let isFollowing = false;
    if (authUser && authUser.id !== user.id) {
        const followers = await db.getFollowers(user.id) as ProfileFollowerRecord[];
        isFollowing = followers.some((f) => f.id === authUser.id);
    }

    const posts = await db.getPostsByUser(user.id) as ProfilePostRecord[];
    const typedPosts: Post[] = posts.map((post) => ({
        ...post,
        isLiked: authUser ? (post.likedBy || []).includes(authUser.id) : false,
        isDisliked: authUser ? (post.dislikedBy || []).includes(authUser.id) : false,
        dislikes: typeof post.dislikes === "number" ? post.dislikes : (post.dislikedBy || []).length,
    })) as Post[];

    return (
        <ProfileClient
            user={{
                id:           user.id,
                name:         user.name,
                username:     user.username,
                profileImage: user.profileImage || user.photoURL || user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
                bio:          user.bio || "",
                showRealName: user.showRealName ?? true,
                usernameChangeCount: user.usernameChangeCount || 0,
                followerCount:  user.followerCount  || 0,
                followingCount: user.followingCount || 0,
                postsCount:   user.postsCount || posts.length,
            }}
            isOwner={authUser?.id === user.id}
            isFollowing={isFollowing}
            posts={typedPosts}
            currentUserId={authUser?.id ?? null}
        />
    );
}
