import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 3-Layer Scoring Formula:
 *   Layer 1 – Engagement (×0.4): likes × 2 + comments × 3 + shares × 4
 *   Layer 2 – Voting     (×0.4): votes received × 10
 *   Layer 3 – Quality    (×0.2): reply chains × 3 + unique commenters × 2
 *
 * finalScore = (engagement × 0.4) + (voting × 0.4) + (quality × 0.2)
 */
function computeScores(posts: any[], voteCounts: Record<string, number>) {
    const userMap = new Map<string, {
        userId: string; username: string; avatar: string;
        totalLikes: number; totalComments: number; totalShares: number;
        replyChains: number; uniqueCommenters: Set<string>;
    }>();

    for (const post of posts) {
        const uid = post.userId;
        if (!uid) continue;

        if (!userMap.has(uid)) {
            userMap.set(uid, {
                userId: uid,
                username: post.userName || post.userUsername || "User",
                avatar: post.userAvatar || "",
                totalLikes: 0, totalComments: 0, totalShares: 0,
                replyChains: 0, uniqueCommenters: new Set(),
            });
        }

        const entry = userMap.get(uid)!;
        const likes = typeof post.likes === "number" ? post.likes : 0;
        const shares = typeof post.shares === "number" ? post.shares : 0;
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const commentsCount = comments.length || (typeof post.commentsCount === "number" ? post.commentsCount : 0);

        entry.totalLikes    += likes;
        entry.totalComments += commentsCount;
        entry.totalShares   += shares;

        // Quality: count reply chains (posts with comments) and unique commenters
        if (commentsCount > 0) {
            entry.replyChains++;
            for (const c of comments) {
                if (c?.userId || c?.user?.id) {
                    entry.uniqueCommenters.add(c.userId || c.user?.id);
                }
            }
        }
    }

    const results = Array.from(userMap.values()).map(entry => {
        const engagementRaw = (entry.totalLikes * 2) + (entry.totalComments * 3) + (entry.totalShares * 4);
        const votingRaw = (voteCounts[entry.userId] || 0) * 10;
        const qualityRaw = (entry.replyChains * 3) + (entry.uniqueCommenters.size * 2);

        const finalScore = Math.round(
            (engagementRaw * 0.4) + (votingRaw * 0.4) + (qualityRaw * 0.2)
        );

        return {
            userId: entry.userId,
            username: entry.username,
            avatar: entry.avatar,
            totalLikes: entry.totalLikes,
            totalComments: entry.totalComments,
            totalShares: entry.totalShares,
            votesReceived: voteCounts[entry.userId] || 0,
            replyChains: entry.replyChains,
            engagementScore: Math.round(engagementRaw * 0.4),
            votingScore: Math.round(votingRaw * 0.4),
            qualityScore: Math.round(qualityRaw * 0.2),
            finalScore,
        };
    });

    results.sort((a, b) => b.finalScore - a.finalScore);

    // Annotate rank and delta indicator
    return results.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
        delta: idx === 0
            ? "leading" as const
            : entry.finalScore >= (results[0]?.finalScore || 0) * 0.8
                ? "catching_up" as const
                : "trailing" as const,
    }));
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch battle posts and votes in parallel
        const [allPosts, allVotes] = await Promise.all([
            db.getPosts(1, 500, id),
            db.getAllBattleVotes(id),
        ]);

        // Aggregate vote counts per userId
        const voteCounts: Record<string, number> = {};
        for (const v of allVotes) {
            voteCounts[v.votedForId] = (voteCounts[v.votedForId] || 0) + 1;
        }

        const leaderboard = computeScores(allPosts, voteCounts);

        return NextResponse.json({ leaderboard, totalVotes: allVotes.length });
    } catch (error) {
        console.error("Leaderboard Error:", error);
        return NextResponse.json({ leaderboard: [], totalVotes: 0 }, { status: 500 });
    }
}
