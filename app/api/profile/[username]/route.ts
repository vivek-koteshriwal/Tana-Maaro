import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { isPublicUserVisible } from "@/lib/account-deletion";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Find user by username
    const user = await db.findUserByUsername(username) as any;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!isPublicUserVisible(user.status)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get auth user to check if following
    const authUser = await verifyAuth(req);
    let isFollowing = false;
    if (authUser && authUser.id !== user.id) {
        const followers = await db.getFollowers(user.id);
        isFollowing = followers.some(f => f.id === authUser.id);
    }

    // Get user's posts
    const posts = await db.getPostsByUser(user.id) as any[];

    // Get reactions for posts if user is logged in
    const postsWithReactions = posts.map(post => ({
      ...post,
      isLiked: authUser ? (post.likedBy || []).includes(authUser.id) : false,
      isDisliked: authUser ? (post.dislikedBy || []).includes(authUser.id) : false,
    }));

    // Calculate total likes received
    const totalLikes = posts.reduce((acc, post) => acc + (post.likes || 0), 0);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        bio: user.bio,
        followerCount: user.followerCount || 0,
        followingCount: user.followingCount || 0,
        postsCount: posts.length,
        likesCount: totalLikes,
        isFollowing
      },
      posts: postsWithReactions
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
