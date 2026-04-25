export type FeedSortMode = "latest" | "trending";

type NumericLike = number | string | null | undefined;

export type RankableFeedPost = {
    createdAt?: string | number | Date | null;
    timestamp?: string | number | Date | null;
    lastEngagementAt?: string | number | Date | null;
    likes?: NumericLike;
    dislikes?: NumericLike;
    comments?: NumericLike | unknown[];
    commentsCount?: NumericLike;
    shares?: NumericLike;
    saves?: NumericLike;
    savedCount?: NumericLike;
    saveCount?: NumericLike;
    views?: NumericLike;
    viewCount?: NumericLike;
    impressions?: NumericLike;
    clicks?: NumericLike;
    clickCount?: NumericLike;
    ctr?: NumericLike;
    clickThroughRate?: NumericLike;
    engagementRate?: NumericLike;
    likedBy?: unknown[];
    dislikedBy?: unknown[];
};

export const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function toNumber(value: NumericLike, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
}

function arrayLength(value: unknown) {
    return Array.isArray(value) ? value.length : 0;
}

export function getCommentCount(post: RankableFeedPost) {
    if (typeof post.comments === "number") {
        return post.comments;
    }

    if (Array.isArray(post.comments)) {
        return post.comments.length;
    }

    return Math.max(0, Math.round(toNumber(post.commentsCount)));
}

function getTimestampMs(candidate: string | number | Date | null | undefined) {

    if (candidate instanceof Date) {
        return candidate.getTime();
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
    }

    if (typeof candidate === "string") {
        const parsed = Date.parse(candidate);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    return Date.now();
}

export function getFeedTimestampMs(post: Pick<RankableFeedPost, "createdAt" | "timestamp">) {
    return getTimestampMs(post.createdAt ?? post.timestamp);
}

export function getTrendingAnchorTimestampMs(post: Pick<RankableFeedPost, "lastEngagementAt" | "createdAt" | "timestamp">) {
    return getTimestampMs(post.lastEngagementAt ?? post.createdAt ?? post.timestamp);
}

export function isTrendingEligible(post: RankableFeedPost, now = Date.now()) {
    const activityMs = getTrendingAnchorTimestampMs(post);
    const ageMs = now - activityMs;

    return ageMs >= -5 * 60 * 1000 && ageMs <= TRENDING_WINDOW_MS;
}

export function getTrendingScore(post: RankableFeedPost, now = Date.now()) {
    if (!isTrendingEligible(post, now)) {
        return Number.NEGATIVE_INFINITY;
    }

    const activityMs = getTrendingAnchorTimestampMs(post);
    const ageMs = Math.max(0, now - activityMs);
    const ageHours = Math.max(1, ageMs / (60 * 60 * 1000));

    const likes = Math.max(0, Math.round(
        typeof post.likes === "number"
            ? post.likes
            : Math.max(toNumber(post.likes), arrayLength(post.likedBy)),
    ));
    const dislikes = Math.max(0, Math.round(
        typeof post.dislikes === "number"
            ? post.dislikes
            : Math.max(toNumber(post.dislikes), arrayLength(post.dislikedBy)),
    ));
    const comments = Math.max(0, getCommentCount(post));
    const shares = Math.max(0, Math.round(toNumber(post.shares)));
    const saves = Math.max(0, Math.round(
        toNumber(post.saveCount) ||
        toNumber(post.savedCount) ||
        toNumber(post.saves),
    ));
    const views = Math.max(0, Math.round(
        toNumber(post.viewCount) ||
        toNumber(post.views) ||
        toNumber(post.impressions),
    ));
    const clicks = Math.max(0, Math.round(
        toNumber(post.clickCount) ||
        toNumber(post.clicks),
    ));
    const ctr = Math.max(
        0,
        toNumber(post.ctr) ||
            toNumber(post.clickThroughRate) ||
            toNumber(post.engagementRate) ||
            (views > 0 ? clicks / views : 0),
    );

    const weightedEngagement =
        (likes * 4.5) +
        (comments * 7.5) +
        (shares * 10) +
        (saves * 6.5) +
        Math.min(views * 0.04, 40) +
        (clicks * 1.2);
    const totalActions = likes + comments + shares + saves + clicks;
    const velocityBoost = (totalActions / ageHours) * 28;
    const freshnessBoost =
        ((TRENDING_WINDOW_MS - ageMs) / TRENDING_WINDOW_MS) * 42;
    const spikeBoost =
        ageHours <= 6
            ? totalActions * 5
            : ageHours <= 24
                ? totalActions * 2.4
                : ageHours <= 72
                    ? totalActions * 1.15
                    : 0;
    const ctrBoost = ctr * 24;
    const dislikePenalty = dislikes * 2.2;

    return weightedEngagement + velocityBoost + freshnessBoost + spikeBoost + ctrBoost - dislikePenalty;
}

export function compareFeedPosts<T extends RankableFeedPost>(
    left: T,
    right: T,
    sortMode: FeedSortMode,
    now = Date.now(),
) {
    if (sortMode === "latest") {
        return getFeedTimestampMs(right) - getFeedTimestampMs(left);
    }

    const scoreDelta = getTrendingScore(right, now) - getTrendingScore(left, now);
    if (scoreDelta !== 0) {
        return scoreDelta;
    }

    const rightActions =
        Math.max(0, Math.round(toNumber(right.likes))) +
        Math.max(0, getCommentCount(right)) +
        Math.max(0, Math.round(toNumber(right.shares)));
    const leftActions =
        Math.max(0, Math.round(toNumber(left.likes))) +
        Math.max(0, getCommentCount(left)) +
        Math.max(0, Math.round(toNumber(left.shares)));

    if (rightActions !== leftActions) {
        return rightActions - leftActions;
    }

    return getFeedTimestampMs(right) - getFeedTimestampMs(left);
}

export function sortFeedPosts<T extends RankableFeedPost>(
    posts: T[],
    sortMode: FeedSortMode,
    now = Date.now(),
) {
    const eligiblePosts = sortMode === "trending"
        ? posts.filter((post) => isTrendingEligible(post, now))
        : posts;

    return [...eligiblePosts].sort((left, right) => compareFeedPosts(left, right, sortMode, now));
}
