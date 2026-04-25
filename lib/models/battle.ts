export type BattleType = "college" | "creator" | "city" | "memer";
export type BattleStatus = "upcoming" | "live" | "ended";
export type BattleDuration = "short" | "standard"; // short=15min, standard=24h

export interface Battle {
    id: string;
    title: string;
    type: BattleType;
    status: BattleStatus;
    duration: BattleDuration;
    startTime: string;   // ISO string
    endTime: string;     // ISO string
    participants: string[];
    winnerId?: string;
    winnerUsername?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BattleVote {
    id: string;           // `${battleId}_${voterId}`
    battleId: string;
    voterId: string;      // who cast the vote
    votedForId: string;   // who received the vote
    createdAt: string;
}

// Per-user score breakdown for a battle
export interface BattleScoreEntry {
    userId: string;
    username: string;
    avatar: string;
    // Raw signals
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    votesReceived: number;
    replyChains: number;
    // Weighted final score
    engagementScore: number;
    votingScore: number;
    qualityScore: number;
    finalScore: number;
    // Rank indicator
    rank: number;
    delta?: "leading" | "catching_up" | "trailing";
}

// Profile-level gamification stats stored on user document
export interface UserBattleStats {
    battleParticipations: number;
    battleWins: number;
    battleLosses: number;
    winRate: number;           // 0–100
    currentWinStreak: number;
    maxWinStreak: number;
    bestScore: number;
    badges: BattleBadge[];
    eligiblePerformer: boolean;
    currentRank: BattleRank;
}

export type BattleBadge =
    | "savage_king"       // 10+ wins
    | "roast_master"      // 5+ wins
    | "arena_champion"    // 3+ wins
    | "battle_veteran"    // 20+ participations
    | "win_streak_3"      // 3 consecutive wins
    | "win_streak_5"      // 5 consecutive wins
    | "win_streak_10"     // 10 consecutive wins
    | "first_blood";      // first ever win

export type BattleRank = "unranked" | "bronze" | "silver" | "gold" | "platinum" | "legend";

export const BADGE_META: Record<BattleBadge, { label: string; emoji: string; description: string }> = {
    savage_king:    { label: "Savage King",     emoji: "🔥", description: "Won 10 or more battles" },
    roast_master:   { label: "Roast Master",    emoji: "🎤", description: "Won 5 or more battles" },
    arena_champion: { label: "Arena Champion",  emoji: "⚔️", description: "Won 3 or more battles" },
    battle_veteran: { label: "Battle Veteran",  emoji: "🛡️", description: "Participated in 20+ battles" },
    win_streak_3:   { label: "On Fire",         emoji: "🔥", description: "3-win streak" },
    win_streak_5:   { label: "Unstoppable",     emoji: "💥", description: "5-win streak" },
    win_streak_10:  { label: "Godmode",         emoji: "👑", description: "10-win streak" },
    first_blood:    { label: "First Blood",     emoji: "🩸", description: "First battle win" },
};

export const RANK_THRESHOLDS: { rank: BattleRank; minWins: number }[] = [
    { rank: "legend",   minWins: 25 },
    { rank: "platinum", minWins: 15 },
    { rank: "gold",     minWins: 10 },
    { rank: "silver",   minWins: 5  },
    { rank: "bronze",   minWins: 1  },
    { rank: "unranked", minWins: 0  },
];

export function computeRank(wins: number): BattleRank {
    for (const { rank, minWins } of RANK_THRESHOLDS) {
        if (wins >= minWins) return rank;
    }
    return "unranked";
}

export function computeBadges(stats: Pick<UserBattleStats, "battleWins" | "battleParticipations" | "currentWinStreak" | "maxWinStreak">): BattleBadge[] {
    const badges: BattleBadge[] = [];
    const { battleWins, battleParticipations, maxWinStreak } = stats;
    if (battleWins >= 1)  badges.push("first_blood");
    if (battleWins >= 3)  badges.push("arena_champion");
    if (battleWins >= 5)  badges.push("roast_master");
    if (battleWins >= 10) badges.push("savage_king");
    if (battleParticipations >= 20) badges.push("battle_veteran");
    if (maxWinStreak >= 3)  badges.push("win_streak_3");
    if (maxWinStreak >= 5)  badges.push("win_streak_5");
    if (maxWinStreak >= 10) badges.push("win_streak_10");
    return badges;
}

export const DURATION_MS: Record<BattleDuration, number> = {
    short:    15 * 60 * 1000,       // 15 minutes
    standard: 24 * 60 * 60 * 1000,  // 24 hours
};
