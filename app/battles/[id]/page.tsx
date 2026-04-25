"use client";

import { useState, useEffect, useCallback } from "react";
import { FeedCard } from "@/components/feed/feed-card";
import { CreatePost } from "@/components/feed/create-post";
import { Post } from "@/types/feed";
import { PostData, PostService } from "@/lib/services/post-service";
import {
    Loader2, Clock, Swords, Trophy, Activity, UserPlus, CheckCircle,
    Flame, Zap, ThumbsUp, BarChart3
} from "lucide-react";
import { use } from "react";
import { Battle } from "@/lib/models/battle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

type BattleRoomBattle = Battle & {
    winnerId?: string;
    winnerUsername?: string;
    participants?: string[];
};

// ── Score breakdown type ──────────────────────────────────────────────────────
interface LeaderboardEntry {
    userId: string; username: string; avatar: string;
    totalLikes: number; totalComments: number; totalShares: number;
    votesReceived: number; replyChains: number;
    engagementScore: number; votingScore: number; qualityScore: number;
    finalScore: number;
    rank: number;
    delta: "leading" | "catching_up" | "trailing";
}

// ── Rank medal ────────────────────────────────────────────────────────────────
function RankMedal({ rank }: { rank: number }) {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-black text-neutral-500">#{rank}</span>;
}

// ── Delta indicator ───────────────────────────────────────────────────────────
function DeltaBadge({ delta }: { delta: LeaderboardEntry["delta"] }) {
    if (delta === "leading")     return <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" /> Leading</span>;
    if (delta === "catching_up") return <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> Catching Up</span>;
    return null;
}

// ── Winner Banner ─────────────────────────────────────────────────────────────
function WinnerBanner({ battle, currentUserId }: { battle: Battle & { winnerId?: string; winnerUsername?: string }; currentUserId?: string }) {
    if (battle.status !== "ended") return null;

    const isYou = battle.winnerId && battle.winnerId === currentUserId;

    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 mb-8 border-2 ${isYou ? "border-yellow-500 bg-yellow-900/20" : "border-neutral-700 bg-neutral-900/60"}`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-3xl shrink-0">
                    {battle.winnerId ? "👑" : "⚔️"}
                </div>
                <div className="text-center sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">Battle Concluded</p>
                    {battle.winnerId ? (
                        <>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                {isYou ? "🎉 YOU WON!" : `${battle.winnerUsername || "Champion"} Wins!`}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {isYou ? "You dominated the arena. The crowd roared for you." : `The arena bowed to ${battle.winnerUsername}.`}
                            </p>
                        </>
                    ) : (
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Battle Concluded — No Winner</h2>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Vote Button ───────────────────────────────────────────────────────────────
function VoteButton({
    battleId, targetUserId,
    currentUserId, hasVoted, myVotedForId, battleStatus,
    onVote,
}: {
    battleId: string; targetUserId: string;
    currentUserId?: string; hasVoted: boolean; myVotedForId?: string;
    battleStatus: string;
    onVote: (userId: string) => void;
}) {
    const [voting, setVoting] = useState(false);
    const canVote = !!currentUserId && battleStatus === "live" && !hasVoted && targetUserId !== currentUserId;
    const votedThis = myVotedForId === targetUserId;

    const handleVote = async () => {
        if (!canVote || voting) return;
        setVoting(true);
        try {
            const res = await fetch(`/api/battles/${battleId}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ votedForId: targetUserId }),
            });
            if (res.ok) onVote(targetUserId);
        } finally {
            setVoting(false);
        }
    };

    if (votedThis) return (
        <span className="text-[9px] font-black uppercase tracking-widest text-green-400 flex items-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" /> Voted
        </span>
    );
    if (!canVote) return null;

    return (
        <button
            type="button"
            onClick={handleVote}
            disabled={voting}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
        >
            {voting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <ThumbsUp className="w-2.5 h-2.5" />}
            Vote
        </button>
    );
}

// ── Score Breakdown Tooltip ───────────────────────────────────────────────────
function ScoreBreakdown({ entry }: { entry: LeaderboardEntry }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                className="text-neutral-600 hover:text-neutral-400 transition-colors"
                aria-label="Score breakdown"
            >
                <BarChart3 className="w-3 h-3" />
            </button>
            {open && (
                <div className="absolute right-0 bottom-6 z-50 w-44 bg-neutral-950 border border-white/10 rounded-xl p-3 shadow-2xl text-[10px] space-y-1.5">
                    <p className="font-black text-white uppercase tracking-wide mb-2">Score Breakdown</p>
                    <div className="flex justify-between text-gray-400">
                        <span>Engagement (×0.4)</span>
                        <span className="text-white font-bold">{entry.engagementScore}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Votes (×0.4)</span>
                        <span className="text-green-400 font-bold">{entry.votingScore}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Quality (×0.2)</span>
                        <span className="text-blue-400 font-bold">{entry.qualityScore}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-1.5 font-black text-white">
                        <span>Total</span>
                        <span>{entry.finalScore} PTS</span>
                    </div>
                    <div className="pt-1 text-gray-600 leading-snug">
                        Likes:{entry.totalLikes} · Comments:{entry.totalComments} · Shares:{entry.totalShares} · Votes:{entry.votesReceived}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BattleRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id: battleId } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [battle, setBattle]           = useState<BattleRoomBattle | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [totalVotes, setTotalVotes]   = useState(0);
    const [posts, setPosts]             = useState<Post[]>([]);
    const [loading, setLoading]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [timeLeft, setTimeLeft]       = useState(0);
    const [isJoining, setIsJoining]     = useState(false);
    const [hasVoted, setHasVoted]       = useState(false);
    const [myVotedForId, setMyVotedForId] = useState<string | undefined>();
    const [activeScoreTab, setActiveScoreTab] = useState<"live" | "breakdown">("live");

    // ── Data fetchers ─────────────────────────────────────────────────────────
    const fetchBattleData = useCallback(async () => {
        try {
            const [battleRes, lbRes] = await Promise.all([
                fetch(`/api/battles/${battleId}`),
                fetch(`/api/battles/${battleId}/leaderboard`),
            ]);
            if (battleRes.ok) {
                const d = await battleRes.json();
                setBattle(d.battle);
            }
            if (lbRes.ok) {
                const d = await lbRes.json();
                setLeaderboard(d.leaderboard || []);
                setTotalVotes(d.totalVotes || 0);
            }
        } catch (e) {
            console.error("Failed fetching battle metrics", e);
        }
    }, [battleId]);

    const fetchVoteStatus = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/battles/${battleId}/vote`);
            if (res.ok) {
                const d = await res.json();
                setHasVoted(d.hasVoted);
                setMyVotedForId(d.vote?.votedForId);
            }
        } catch { /* silent */ }
    }, [battleId, user]);

    const fetchPosts = useCallback(async (currentPage = 1, append = false) => {
        if (currentPage === 1) setLoading(true);
        else setLoadingMore(true);
        try {
            const rawPosts = await PostService.getFeed(currentPage, 10, battleId);
            setHasMore(rawPosts.length >= 10);
            const mappedPosts: Post[] = rawPosts.map((p: PostData) => {
                const createdAt =
                    typeof p.createdAt === "string" || typeof p.createdAt === "number"
                        ? p.createdAt
                        : Date.now();

                return {
                    id: p.id,
                    content: p.content || "",
                    image: p.image,
                    likes: p.likes || 0,
                    comments: p.comments || [],
                    shares: p.shares || 0,
                    timestamp: new Date(createdAt).toLocaleDateString(),
                    type: p.type || (p.image ? "mixed" : "text"),
                    user: {
                        id: p.userId,
                        name: p.userName || "Unknown",
                        username: p.userHandle?.replace("@", "") || "anon",
                        profileImage: p.userAvatar,
                        showRealName: true,
                    },
                };
            });
            if (append) setPosts(prev => [...prev, ...mappedPosts]);
            else setPosts(mappedPosts);
        } catch (e) {
            console.error("Failed to load feed", e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [battleId]);

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchBattleData();
        fetchPosts(1, false);
        fetchVoteStatus();
        const interval = setInterval(fetchBattleData, 20000);
        return () => clearInterval(interval);
    }, [fetchBattleData, fetchPosts, fetchVoteStatus]);

    // ── Timer ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!battle) return;
        const tick = () => {
            const now   = Date.now();
            const end   = new Date(battle.endTime).getTime();
            const start = new Date(battle.startTime).getTime();
            if (battle.status === "ended" || now > end) {
                setTimeLeft(0);
            } else if (now < start) {
                setTimeLeft(Math.floor((start - now) / 1000));
            } else {
                setTimeLeft(Math.floor((end - now) / 1000));
            }
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [battle]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleJoinBattle = async () => {
        if (!user) { router.push(`/login?callbackUrl=/battles/${battleId}`); return; }
        setIsJoining(true);
        try {
            const res = await fetch(`/api/battles/${battleId}/join`, { method: "POST" });
            if (res.ok) await fetchBattleData();
        } finally { setIsJoining(false); }
    };

    const handleLeaveBattle = async () => {
        if (!confirm("Leave the arena? You won't be listed as a participant.")) return;
        setIsJoining(true);
        try {
            const res = await fetch(`/api/battles/${battleId}/exit`, { method: "POST" });
            if (res.ok) await fetchBattleData();
        } finally { setIsJoining(false); }
    };

    const handleVoteCast = (userId: string) => {
        setHasVoted(true);
        setMyVotedForId(userId);
        setTotalVotes(v => v + 1);
        setLeaderboard(prev => prev.map(e =>
            e.userId === userId ? { ...e, votesReceived: e.votesReceived + 1, votingScore: e.votingScore + 4, finalScore: e.finalScore + 4 } : e
        ).sort((a, b) => b.finalScore - a.finalScore)
         .map((e, i) => ({ ...e, rank: i + 1, delta: i === 0 ? "leading" : e.finalScore >= (prev[0]?.finalScore || 0) * 0.8 ? "catching_up" : "trailing" }))
        );
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!battle) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        </div>
    );

    const isLive        = battle.status === "live";
    const isParticipant = user && battle.participants?.includes(user.id);

    return (
        <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black">
            <div className="container mx-auto px-4 max-w-6xl pt-24 pb-20">

                {/* ── Winner Banner ── */}
                <WinnerBanner battle={battle} currentUserId={user?.id} />

                {/* ── Battle Header ── */}
                <div className="mb-8 border border-red-900/40 rounded-2xl bg-gradient-to-br from-neutral-900 to-black p-6 md:p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-[80px] rounded-full pointer-events-none" />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                    isLive ? "bg-red-600/20 text-red-500 border border-red-600/50 animate-pulse" :
                                    battle.status === "upcoming" ? "bg-blue-600/20 text-blue-500 border border-blue-600/50" :
                                    "bg-neutral-800 text-neutral-400 border border-neutral-700"
                                }`}>
                                    {battle.status}
                                </span>
                                <span className="text-gray-400 font-medium text-sm capitalize">{battle.type} Clash</span>
                                {battle.duration && (
                                    <span className="text-gray-600 text-xs uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-full">
                                        {battle.duration === "short" ? "15 min" : "24 hr"}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-3 mb-4">
                                <Swords className="w-8 h-8 md:w-10 md:h-10 text-red-600" />
                                {battle.title}
                            </h1>
                            <div className="flex items-center gap-3 text-neutral-500 text-xs">
                                <span className="font-black uppercase tracking-widest">{battle.participants?.length || 0} Participants</span>
                                <span>·</span>
                                <span className="font-black uppercase tracking-widest text-orange-500">{totalVotes} Votes Cast</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Join / Leave */}
                            {battle.status !== "ended" && (
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleJoinBattle}
                                        disabled={!!isJoining || !!isParticipant}
                                        className={`px-6 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all shadow-lg border-2 ${
                                            isParticipant
                                                ? "bg-green-950/40 border-green-900 text-green-500 cursor-default"
                                                : "bg-red-600 hover:bg-red-500 border-red-500 text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                                        }`}
                                    >
                                        {isJoining ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : isParticipant ? <><CheckCircle className="w-5 h-5" /> Entered</>
                                            : <><UserPlus className="w-5 h-5" /> Join Battle</>
                                        }
                                    </button>
                                    {isParticipant && (
                                        <button type="button" onClick={handleLeaveBattle} disabled={isJoining}
                                            className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest hover:text-red-500 transition-colors">
                                            Leave Arena
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Timer */}
                            <div className={`px-6 py-4 rounded-xl border-2 flex flex-col items-center justify-center min-w-[160px] shadow-lg ${
                                battle.status === "ended" ? "bg-neutral-950 border-neutral-800 text-neutral-500" :
                                isLive ? "bg-red-950/30 border-red-900 text-red-500" :
                                "bg-blue-950/30 border-blue-900 text-blue-500"
                            }`}>
                                <span className="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-80">
                                    {battle.status === "ended" ? "Battle Concluded" : isLive ? "Time Remaining" : "Starts In"}
                                </span>
                                <div className="flex items-center gap-2 font-black text-2xl md:text-3xl tracking-tighter">
                                    <Clock className="w-5 h-5 md:w-6 md:h-6" />
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Voting notice ── */}
                {isLive && user && !hasVoted && !isParticipant && (
                    <div className="mb-6 bg-orange-950/30 border border-orange-700/40 rounded-xl px-5 py-3 flex items-center gap-3 text-sm">
                        <ThumbsUp className="w-4 h-4 text-orange-400 shrink-0" />
                        <p className="text-orange-300"><span className="font-black">Cast your vote</span> for the best roaster — one vote per battle, shown in the leaderboard.</p>
                    </div>
                )}
                {isLive && hasVoted && (
                    <div className="mb-6 bg-green-950/30 border border-green-700/40 rounded-xl px-5 py-3 flex items-center gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                        <p className="text-green-300">Your vote has been counted. Watch the leaderboard update live.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── Arena Feed ── */}
                    <div className="lg:col-span-2 space-y-6">
                        {isLive ? (
                            <CreatePost battleId={battleId} disabled={false} onPostCreated={() => fetchPosts(1, false)} />
                        ) : (
                            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl text-center">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {battle.status === "upcoming" ? "The Arena is Sealed" : "The Dust Has Settled"}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {battle.status === "upcoming"
                                        ? "Wait for the countdown to drop your roasts."
                                        : "This battle is over. No new roasts can be submitted."}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-8 mb-4">
                            <Activity className="w-5 h-5 text-red-500" />
                            <h2 className="text-xl font-black uppercase tracking-wider text-white">Live Roast Stream</h2>
                        </div>

                        {loading ? (
                            <div className="text-center py-20"><Loader2 className="animate-spin w-8 h-8 mx-auto text-red-600" /></div>
                        ) : (
                            <>
                                {posts.map((post) => <FeedCard key={post.id} post={post} />)}
                                {hasMore && (
                                    <div className="text-center py-6">
                                        <button type="button" onClick={() => { const n = page + 1; setPage(n); fetchPosts(n, true); }}
                                            disabled={loadingMore}
                                            className="bg-neutral-900 border border-neutral-800 hover:border-red-600/50 text-white px-8 py-3 rounded-full font-bold transition-all disabled:opacity-50 text-sm uppercase tracking-wider">
                                            {loadingMore ? "Loading..." : "Load Older Roasts"}
                                        </button>
                                    </div>
                                )}
                                {posts.length === 0 && (
                                    <div className="text-center py-12 bg-neutral-900/30 rounded-xl border border-dashed border-neutral-800">
                                        <h3 className="text-2xl font-black text-neutral-600 uppercase tracking-widest">Awaiting First Strike</h3>
                                        <p className="text-neutral-500 text-sm mt-2">No one has shed blood yet. Drop the first roast.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Leaderboard Panel ── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="bg-red-900/20 border-b border-red-900/30 p-4 flex items-center justify-between">
                                <h3 className="font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard
                                </h3>
                                <div className="flex items-center gap-2">
                                    {isLive && <span className="text-xs text-red-500 font-bold bg-red-950 px-2 py-1 rounded animate-pulse">LIVE</span>}
                                    <span className="text-[10px] text-gray-500 font-bold">{totalVotes} votes</span>
                                </div>
                            </div>

                            {/* Score tabs */}
                            <div className="flex border-b border-neutral-800">
                                {(["live", "breakdown"] as const).map(tab => (
                                    <button key={tab} type="button" onClick={() => setActiveScoreTab(tab)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeScoreTab === tab ? "text-white border-b-2 border-red-500" : "text-neutral-500 hover:text-white"}`}>
                                        {tab === "live" ? "Scores" : "Breakdown"}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col max-h-[520px] overflow-y-auto">
                                {leaderboard.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">No scores yet. Engage to earn points.</div>
                                ) : (
                                    leaderboard.map((entry) => (
                                        <div key={entry.userId}
                                            className={`flex items-center gap-3 p-3.5 border-b border-neutral-800/50 transition-colors ${entry.rank === 1 ? "bg-yellow-500/5" : "hover:bg-neutral-900"}`}>
                                            <div className="w-7 flex items-center justify-center shrink-0">
                                                <RankMedal rank={entry.rank} />
                                            </div>
                                            <Avatar className={`w-9 h-9 border-2 shrink-0 ${entry.rank === 1 ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : entry.rank === 2 ? "border-gray-400" : entry.rank === 3 ? "border-amber-700" : "border-neutral-700"}`}>
                                                <AvatarImage src={entry.avatar} />
                                                <AvatarFallback className="bg-neutral-800 text-neutral-400 text-xs">
                                                    {entry.username.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{entry.username}</p>
                                                {activeScoreTab === "live" ? (
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-red-500 font-black">{entry.finalScore} PTS</p>
                                                        <DeltaBadge delta={entry.delta} />
                                                    </div>
                                                ) : (
                                                    <p className="text-[9px] text-gray-500 font-mono">
                                                        E:{entry.engagementScore} V:{entry.votingScore} Q:{entry.qualityScore}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <ScoreBreakdown entry={entry} />
                                                <VoteButton
                                                    battleId={battleId}
                                                    targetUserId={entry.userId}
                                                    currentUserId={user?.id}
                                                    hasVoted={hasVoted}
                                                    myVotedForId={myVotedForId}
                                                    battleStatus={battle.status}
                                                    onVote={handleVoteCast}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="bg-neutral-900 p-3 text-center border-t border-neutral-800">
                                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                                    Engagement ×0.4 · Votes ×0.4 · Quality ×0.2
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
