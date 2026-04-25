"use client";

import { useState, useEffect } from "react";
import { Post } from "@/types/feed";
import { FeedCard } from "@/components/feed/feed-card";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { FollowListModal } from "@/components/profile/follow-list-modal";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import Link from "next/link";
import { Settings, Mic, Trophy, Zap, Edit2, Swords, Shield, Star, Flame } from "lucide-react";
import { BADGE_META, BattleBadge, UserBattleStats, BattleRank } from "@/lib/models/battle";

type ProfileTab = "roasts" | "challenges";

interface BattleHistoryItem {
    id: string;
    title: string;
    winnerId?: string;
    status?: string;
    type?: string;
    createdAt?: string | number | Date | null;
}

interface UserData {
    id: string; name: string; username: string;
    profileImage?: string; bio?: string;
    showRealName: boolean;
    usernameChangeCount: number;
    followerCount: number; followingCount: number; postsCount: number;
}

interface Props {
    user: UserData; isOwner: boolean; isFollowing: boolean;
    posts: Post[]; currentUserId: string | null;
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(".0", "")}K`;
    return String(n);
}

// ── Rank display ──────────────────────────────────────────────────────────────
const RANK_COLORS: Record<BattleRank, string> = {
    legend:   "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
    platinum: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    gold:     "text-amber-400 border-amber-500/40 bg-amber-500/10",
    silver:   "text-gray-300 border-gray-500/40 bg-gray-500/10",
    bronze:   "text-orange-400 border-orange-500/40 bg-orange-500/10",
    unranked: "text-neutral-500 border-neutral-700 bg-neutral-800/50",
};

const RANK_EMOJI: Record<BattleRank, string> = {
    legend: "👑", platinum: "💎", gold: "🥇", silver: "🥈", bronze: "🥉", unranked: "🛡️"
};

function RankBadge({ rank }: { rank: BattleRank }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${RANK_COLORS[rank]}`}>
            {RANK_EMOJI[rank]} {rank}
        </span>
    );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ value, label, highlight = false }: { value: string | number; label: string; highlight?: boolean }) {
    return (
        <div className="flex flex-col items-center bg-neutral-900/60 border border-white/5 rounded-xl p-3">
            <span className={`font-black text-2xl tracking-tight ${highlight ? "text-red-400" : "text-white"}`}>{value}</span>
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mt-1">{label}</span>
        </div>
    );
}

// ── Badge chip ────────────────────────────────────────────────────────────────
function BadgeChip({ badge }: { badge: BattleBadge }) {
    const meta = BADGE_META[badge];
    return (
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/5 rounded-full px-3 py-1.5" title={meta.description}>
            <span>{meta.emoji}</span>
            <span className="text-[10px] font-black text-white uppercase tracking-wide">{meta.label}</span>
        </div>
    );
}

// ── Battle history row ────────────────────────────────────────────────────────
function BattleHistoryRow({ battle, userId }: { battle: BattleHistoryItem; userId: string }) {
    const won      = battle.winnerId === userId;
    const isActive = battle.status === "live" || battle.status === "upcoming";
    const dateStr  = battle.createdAt
        ? new Date(battle.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "—";

    return (
        <Link href={`/battles/${battle.id}`}
            className="flex items-center gap-3 py-3 px-0 border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                isActive ? "bg-red-600/20 text-red-400" : won ? "bg-yellow-500/20 text-yellow-400" : "bg-neutral-800 text-neutral-500"
            }`}>
                {isActive ? <Flame className="w-4 h-4" /> : won ? "🏆" : <Shield className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">{battle.title}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{battle.type} · {dateStr}</p>
            </div>
            <div className="shrink-0">
                {isActive ? (
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-1 rounded-full animate-pulse">Live</span>
                ) : won ? (
                    <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-950/40 border border-yellow-800/40 px-2 py-1 rounded-full">Won</span>
                ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">Ended</span>
                )}
            </div>
        </Link>
    );
}

// ── Challenges Tab ────────────────────────────────────────────────────────────
function ChallengesTab({ userId, isOwner }: { userId: string; isOwner: boolean }) {
    const [stats, setStats]     = useState<UserBattleStats | null>(null);
    const [history, setHistory] = useState<BattleHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const [statsResponse, historyResponse] = await Promise.all([
                    fetch(`/api/users/${userId}/battle-stats`).then((response) => response.ok ? response.json() : null),
                    fetch(`/api/users/${userId}/battle-history`).then((response) => response.ok ? response.json() : []),
                ]);

                if (!active) return;

                setStats(statsResponse);
                setHistory(Array.isArray(historyResponse) ? historyResponse as BattleHistoryItem[] : []);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            active = false;
        };
    }, [userId]);

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-red-500 animate-spin" />
        </div>
    );

    const hasActivity = stats && (stats.battleParticipations > 0 || history.length > 0);

    if (!hasActivity) return (
        <EmptyState
            icon={<Trophy className="w-10 h-10 text-white/20" />}
            title="NO CHALLENGES YET"
            subtitle={isOwner ? "Join a battle and let the roasts fly. Your history will appear here." : "This roaster hasn't entered any battles yet."}
            buttonLabel="ENTER ARENA"
            href="/battles"
        />
    );

    return (
        <div className="space-y-6 pt-2 pb-20">

            {/* ── Rank + Eligible badge ── */}
            {stats && (
                <div className="flex items-center gap-3 flex-wrap">
                    <RankBadge rank={stats.currentRank as BattleRank} />
                    {stats.eligiblePerformer && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                            <Star className="w-3 h-3" /> Eligible Performer
                        </span>
                    )}
                    {stats.currentWinStreak >= 3 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest">
                            <Flame className="w-3 h-3" /> {stats.currentWinStreak} streak 🔥
                        </span>
                    )}
                </div>
            )}

            {/* ── Stats grid ── */}
            {stats && (
                <div className="grid grid-cols-3 gap-2">
                    <StatTile value={stats.battleParticipations} label="Battles"  />
                    <StatTile value={stats.battleWins}           label="Wins" highlight />
                    <StatTile value={`${stats.winRate}%`}        label="Win Rate" />
                    <StatTile value={stats.battleLosses}         label="Losses" />
                    <StatTile value={stats.maxWinStreak}         label="Best Streak" />
                    <StatTile value={stats.bestScore || "—"}     label="Best Score" />
                </div>
            )}

            {/* ── Badges ── */}
            {stats && stats.badges.length > 0 && (
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Badges Earned</p>
                    <div className="flex flex-wrap gap-2">
                        {stats.badges.map((badge: BattleBadge) => <BadgeChip key={badge} badge={badge} />)}
                    </div>
                </div>
            )}

            {/* ── Eligible Performer box ── */}
            {stats?.eligiblePerformer && (
                <div className="bg-orange-950/20 border border-orange-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xl shrink-0">🎤</div>
                        <div>
                            <p className="font-black text-white text-sm">Eligible for Live Events</p>
                            <p className="text-orange-300 text-xs mt-0.5">
                                {isOwner ? "You've won 5+ battles — you can perform at Tana Maaro live events." : "This roaster qualifies to perform at live Tana Maaro events."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Battle History ── */}
            {history.length > 0 && (
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Battle History</p>
                    <div>
                        {history.map((battle) => <BattleHistoryRow key={battle.id} battle={battle} userId={userId} />)}
                    </div>
                </div>
            )}

            {/* ── CTA ── */}
            <Link href="/battles"
                className="flex items-center justify-center gap-2 border border-[#FF8E84]/45 rounded-full px-6 py-3.5 font-manrope font-extrabold text-[12px] tracking-[1.4px] uppercase text-[#FF8E84] hover:bg-[#FF8E84]/10 transition-colors w-fit mx-auto">
                <Swords className="w-4 h-4" />
                {isOwner ? "Join a Battle" : "View All Battles"}
            </Link>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfileClient({ user, isOwner, isFollowing: initFollowing, posts, currentUserId }: Props) {
    const [activeTab,     setActiveTab]     = useState<ProfileTab>("roasts");
    const [following,     setFollowing]     = useState(initFollowing);
    const [followerCount, setFollowerCount] = useState(user.followerCount);
    const [localPosts,    setLocalPosts]    = useState<Post[]>(posts);
    const [toggling,      setToggling]      = useState(false);
    const [isFollowersOpen, setIsFollowersOpen] = useState(false);
    const [isFollowingOpen, setIsFollowingOpen] = useState(false);

    const displayHandle = user.username.startsWith("@") ? user.username.slice(1) : user.username;
    const bio = user.bio?.trim() || "The arena is quiet. The flame never dies.";
    const editableUser = {
        id: user.id,
        name: user.name,
        username: displayHandle,
        bio: user.bio,
        profileImage: user.profileImage || "",
        showRealName: user.showRealName,
        usernameChangeCount: user.usernameChangeCount || 0,
    };

    const handleToggleFollow = async () => {
        if (!currentUserId || toggling) return;
        setToggling(true);
        try {
            const res = await fetch(`/api/users/${user.id}/follow`, { method: "POST" });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(payload.error || "Failed to update follow status");
            }

            const nextFollowing = typeof payload.isFollowing === "boolean"
                ? payload.isFollowing
                : !following;
            setFollowing(nextFollowing);

            if (typeof payload.followersCount === "number") {
                setFollowerCount(payload.followersCount);
            } else {
                setFollowerCount((prev) => prev + (nextFollowing ? 1 : -1));
            }
        } catch (error) {
            console.error("Failed to toggle follow:", error);
        } finally { setToggling(false); }
    };

    const handleDeletePost = (postId: string) => {
        setLocalPosts(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <div className="min-h-screen arena-bg">
            <div className="profile-hero-gradient fixed inset-0 pointer-events-none" />

            {/* Sub-header */}
            <div className="arena-appbar sticky top-16 z-30 border-b border-white/[0.08] px-4 h-[66px] flex items-center">
                <div className="mx-auto w-full max-w-[560px] flex items-center">
                    <div className="w-24" />
                    <div className="flex-1 text-center">
                        <span className="font-manrope font-black text-[11.5px] uppercase tracking-[2.1px] text-white">
                            {isOwner ? "MY PROFILE" : "PROFILE"}
                        </span>
                    </div>
                    <div className="w-24 flex justify-end">
                        {isOwner && (
                            <EditProfileModal
                                user={editableUser}
                                trigger={
                                    <button
                                        type="button"
                                        className="w-9 h-9 flex items-center justify-center text-[#ABABAB] hover:text-white transition-colors"
                                        aria-label="Manage profile"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                }
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 mx-auto max-w-[560px] px-4 pb-32">

                {/* Avatar */}
                <div className="flex flex-col items-center pt-6 pb-0">
                    <div className="relative mb-7">
                        <div className="avatar-ring w-[138px] h-[138px] rounded-full p-[3px]">
                            <div className="w-full h-full rounded-full arena-bg p-1 flex items-center justify-center">
                                <RoastAvatar
                                    value={user.profileImage}
                                    fallbackSeed={user.id || displayHandle}
                                    alt={`${displayHandle} avatar`}
                                    size={126}
                                    className="border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                                />
                            </div>
                        </div>
                        {isOwner && (
                            <EditProfileModal
                                user={editableUser}
                                initialView="avatar"
                                trigger={
                                    <button
                                        type="button"
                                        className="absolute bottom-1.5 right-1 w-8 h-8 rounded-full bg-[#FF3B3B] border-2 border-[#0E0E0E] flex items-center justify-center shadow-lg hover:bg-[#e03535] transition-colors"
                                        aria-label="Change avatar"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 text-white" />
                                    </button>
                                }
                            />
                        )}
                    </div>

                    <h1 className="font-epilogue font-black text-[30px] leading-[0.98] tracking-[-1.5px] text-white text-center mb-3">
                        {displayHandle}
                    </h1>
                    <p className="font-manrope font-medium text-[15px] leading-[1.55] text-[#ABABAB] text-center px-5 mb-9">{bio}</p>

                    {/* Stats row */}
                    <div className="flex w-full mb-9">
                        <StatBox value={formatCount(localPosts.length || user.postsCount)} label="ROASTS" accent />
                        <StatBox value={formatCount(followerCount)}       label="FOLLOWERS" onClick={() => setIsFollowersOpen(true)} />
                        <StatBox value={formatCount(user.followingCount)} label="FOLLOWING" onClick={() => setIsFollowingOpen(true)} />
                    </div>

                    {/* CTA */}
                    {isOwner ? (
                        <EditProfileModal
                            user={editableUser}
                            trigger={
                                <button
                                    type="button"
                                    className="w-full h-[54px] flex items-center justify-center rounded-[16px] border border-[#FF3B3B]/92 font-epilogue font-extrabold text-[13px] tracking-[1.7px] uppercase text-white hover:bg-white/5 transition-colors mb-0"
                                >
                                    MANAGE IDENTITY
                                </button>
                            }
                        />
                    ) : currentUserId ? (
                        <button type="button" onClick={handleToggleFollow} disabled={toggling}
                            className={`w-full h-[60px] flex items-center justify-center rounded-[14px] font-epilogue font-extrabold text-[14px] tracking-[1.4px] uppercase text-white transition-all disabled:opacity-60 ${
                                following ? "border border-[#FF8E84]/45 hover:bg-white/5" : "btn-arena-filled"
                            }`}>
                            {toggling
                                ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                : following ? "FOLLOWING" : "FOLLOW ROASTER"
                            }
                        </button>
                    ) : (
                        <Link href="/login"
                            className="btn-arena-filled w-full h-[60px] flex items-center justify-center rounded-[14px] font-epilogue font-extrabold text-[14px] tracking-[1.4px] uppercase text-white">
                            FOLLOW ROASTER
                        </Link>
                    )}
                </div>

                {/* Tabs */}
                <div className="mt-10 border-b border-white/[0.08] flex">
                    <ProfileTabButton label="ROASTS"     icon={<Mic    className="w-3.5 h-3.5" />} active={activeTab === "roasts"}     onClick={() => setActiveTab("roasts")} />
                    <div className="w-[18px]" />
                    <ProfileTabButton label="CHALLENGES" icon={<Trophy className="w-3.5 h-3.5" />} active={activeTab === "challenges"} onClick={() => setActiveTab("challenges")} />
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                    {activeTab === "roasts" ? (
                        localPosts.length > 0 ? (
                            <div className="flex flex-col gap-4 pb-4">
                                {localPosts.map(post => (
                                    <FeedCard key={post.id} post={post} isOwner={isOwner} onDelete={() => handleDeletePost(post.id)} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<Mic className="w-10 h-10 text-white/20" />}
                                title="NO ROASTS YET"
                                subtitle="The arena is quiet. Your verbal arsenal is currently empty."
                                buttonLabel="START BATTLE"
                                href="/battles"
                            />
                        )
                    ) : (
                        <ChallengesTab userId={user.id} isOwner={isOwner} />
                    )}
                </div>
            </div>

            <FollowListModal
                isOpen={isFollowersOpen}
                onClose={() => setIsFollowersOpen(false)}
                userId={user.id}
                title={`@${displayHandle}'s Followers`}
                type="followers"
            />
            <FollowListModal
                isOpen={isFollowingOpen}
                onClose={() => setIsFollowingOpen(false)}
                userId={user.id}
                title={`@${displayHandle}'s Following`}
                type="following"
            />
        </div>
    );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatBox({
    value,
    label,
    accent = false,
    onClick,
}: {
    value: string;
    label: string;
    accent?: boolean;
    onClick?: () => void;
}) {
    const sharedClasses = "flex-1 flex flex-col items-center py-1.5";

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${sharedClasses} rounded-xl transition-colors hover:bg-white/[0.03]`}
            >
                <span className={`font-epilogue font-black text-[18px] tracking-[-0.8px] ${accent ? "text-[#FF8E84]" : "text-white"}`}>{value}</span>
                <span className="font-manrope font-extrabold text-[9.5px] uppercase tracking-[1.5px] text-[#ABABAB] mt-2">{label}</span>
            </button>
        );
    }

    return (
        <div className={sharedClasses}>
            <span className={`font-epilogue font-black text-[18px] tracking-[-0.8px] ${accent ? "text-[#FF8E84]" : "text-white"}`}>{value}</span>
            <span className="font-manrope font-extrabold text-[9.5px] uppercase tracking-[1.5px] text-[#ABABAB] mt-2">{label}</span>
        </div>
    );
}

function ProfileTabButton({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex-1 flex flex-col items-center pb-2.5">
            <div className={`flex items-center gap-2 h-[22px] mb-2.5 transition-colors ${active ? "text-white" : "text-[#ABABAB]"}`}>
                {icon}
                <span className="font-epilogue font-extrabold text-[13px] tracking-[1.2px]">{label}</span>
            </div>
            <div className={`h-[2.4px] w-full rounded-full transition-all duration-200 ${active ? "bg-[#FF3B3B]" : "bg-transparent"}`} />
        </button>
    );
}

function EmptyState({ icon, title, subtitle, buttonLabel, href }: { icon: React.ReactNode; title: string; subtitle: string; buttonLabel: string; href: string }) {
    return (
        <div className="flex flex-col items-center text-center px-8 py-9 pb-28">
            <div className="relative mb-8">
                <div className="w-[104px] h-[104px] rounded-[26px] arena-surface-hi rotate-[45deg]" />
                <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
            </div>
            <h3 className="font-epilogue font-black text-[24px] tracking-[-1px] text-white mb-3.5">{title}</h3>
            <p className="font-manrope font-medium text-[15px] leading-[1.55] text-[#ABABAB] mb-7">{subtitle}</p>
            <Link href={href}
                className="flex items-center gap-2 border border-[#FF8E84]/45 rounded-full px-6 py-3.5 font-manrope font-extrabold text-[12px] tracking-[1.4px] uppercase text-[#FF8E84] hover:bg-[#FF8E84]/10 transition-colors">
                <Zap className="w-4 h-4" />
                {buttonLabel}
            </Link>
        </div>
    );
}
