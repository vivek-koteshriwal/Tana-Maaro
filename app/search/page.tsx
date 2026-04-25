"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, User, Flame, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserResult {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    bio: string | null;
}

interface PostResult {
    id: string;
    content: string;
    userId: string;
    userName: string;
    userHandle: string;
    userAvatar: string | null;
    likes: number;
    timestamp: string;
}

type Tab = "all" | "users" | "posts";

export default function SearchPage() {
    const [query, setQuery]     = useState("");
    const [tab, setTab]         = useState<Tab>("all");
    const [users, setUsers]     = useState<UserResult[]>([]);
    const [posts, setPosts]     = useState<PostResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = useCallback(async (q: string, t: Tab) => {
        if (q.length < 2) { setUsers([]); setPosts([]); return; }
        setLoading(true);
        try {
            const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${t}`);
            const data = await res.json();
            setUsers(data.users ?? []);
            setPosts(data.posts ?? []);
        } catch {
            setUsers([]); setPosts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSearch(val, tab), 380);
    };

    const handleTab = (t: Tab) => {
        setTab(t);
        if (query.length >= 2) runSearch(query, t);
    };

    const clearQuery = () => {
        setQuery("");
        setUsers([]);
        setPosts([]);
    };

    const showUsers = tab === "all" || tab === "users";
    const showPosts = tab === "all" || tab === "posts";
    const hasResults = users.length > 0 || posts.length > 0;
    const searched   = query.length >= 2;

    return (
        <main className="min-h-screen arena-bg pb-16">
            {/* ── Search bar ── */}
            <div className="arena-appbar sticky top-16 z-40 border-b border-white/[0.06] px-4 py-3">
                <div className="mx-auto max-w-[680px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB] pointer-events-none" />
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={handleInput}
                        placeholder="Search roasters or posts…"
                        className="w-full arena-surface rounded-xl pl-10 pr-10 py-3 font-manrope font-semibold text-[14px] text-white placeholder:text-[#ABABAB] outline-none border border-white/[0.07] focus:border-[#FF3B3B]/40 transition-colors"
                    />
                    {query && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={clearQuery}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-[#ABABAB] hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="mx-auto max-w-[680px] flex gap-1 mt-3">
                    {(["all", "users", "posts"] as Tab[]).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => handleTab(t)}
                            className={`relative px-4 py-1.5 rounded-lg font-epilogue font-black text-[11px] uppercase tracking-[0.8px] transition-colors ${
                                tab === t
                                    ? "text-white bg-white/8"
                                    : "text-[#ABABAB] hover:text-white hover:bg-white/5"
                            }`}
                        >
                            {t}
                            {tab === t && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF3B3B]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mx-auto max-w-[680px] px-4 pt-6">

                {/* Loading */}
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="arena-surface rounded-2xl h-16 skeleton" />
                        ))}
                    </div>
                )}

                {/* Empty state — before search */}
                {!loading && !searched && (
                    <div className="flex flex-col items-center justify-center pt-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl arena-surface flex items-center justify-center">
                            <Search className="w-7 h-7 text-[#ABABAB]" />
                        </div>
                        <p className="font-epilogue font-black text-[18px] text-white">Find Roasters &amp; Posts</p>
                        <p className="font-manrope text-[13px] text-[#ABABAB] max-w-xs leading-relaxed">
                            Search by username or post content. At least 2 characters to start.
                        </p>
                    </div>
                )}

                {/* No results */}
                {!loading && searched && !hasResults && (
                    <div className="flex flex-col items-center justify-center pt-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl arena-surface flex items-center justify-center">
                            <Flame className="w-7 h-7 text-[#ABABAB]" />
                        </div>
                        <p className="font-epilogue font-black text-[18px] text-white">No results</p>
                        <p className="font-manrope text-[13px] text-[#ABABAB]">
                            Nothing found for &ldquo;{query}&rdquo;
                        </p>
                    </div>
                )}

                {/* ── Users ── */}
                {!loading && showUsers && users.length > 0 && (
                    <section className="mb-6">
                        <h2 className="font-epilogue font-black text-[11px] uppercase tracking-[1.5px] text-[#FF3B3B] mb-3">
                            Roasters
                        </h2>
                        <div className="space-y-2">
                            {users.map(u => (
                                <Link
                                    key={u.id}
                                    href={`/profile/${encodeURIComponent(u.username)}`}
                                    className="flex items-center gap-3 arena-surface rounded-2xl px-4 py-3 hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full arena-surface-hi border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {u.profileImage ? (
                                            <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-epilogue font-black text-[14px] text-[#FF8E84]">
                                                {(u.name || u.username || "?")[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-epilogue font-black text-[13px] text-white uppercase truncate">
                                            @{u.username}
                                        </p>
                                        {u.name && (
                                            <p className="font-manrope text-[11px] text-[#ABABAB] truncate">{u.name}</p>
                                        )}
                                    </div>
                                    <User className="w-4 h-4 text-[#ABABAB] flex-shrink-0 ml-auto" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Posts ── */}
                {!loading && showPosts && posts.length > 0 && (
                    <section>
                        <h2 className="font-epilogue font-black text-[11px] uppercase tracking-[1.5px] text-[#FF3B3B] mb-3">
                            Posts
                        </h2>
                        <div className="space-y-3">
                            {posts.map(p => {
                                const handle = p.userHandle?.startsWith("@")
                                    ? p.userHandle
                                    : `@${p.userHandle || "anon"}`;
                                const timeAgo = (() => {
                                    try {
                                        const d = new Date(p.timestamp);
                                        return isNaN(d.getTime()) ? "recently" : formatDistanceToNow(d, { addSuffix: true });
                                    } catch { return "recently"; }
                                })();
                                return (
                                    <Link
                                        key={p.id}
                                        href={`/post/${p.id}`}
                                        className="block arena-surface rounded-2xl px-4 py-3.5 hover:bg-white/5 transition-colors border-l-[3px] border-[#FF8E84]"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 rounded-full arena-surface-hi border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                {p.userAvatar ? (
                                                    <img src={p.userAvatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-epilogue font-black text-[11px] text-[#FF8E84]">
                                                        {(p.userName || "?")[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-epilogue font-black text-[12px] text-white uppercase">
                                                {handle.toUpperCase()}
                                            </span>
                                            <span className="font-manrope text-[11px] text-[#ABABAB] ml-auto flex-shrink-0">{timeAgo}</span>
                                        </div>
                                        <p className="font-manrope font-semibold text-[13px] text-white/90 leading-[1.45] line-clamp-2">
                                            {p.content}
                                        </p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <Flame className="w-3 h-3 text-[#FF3B3B]" />
                                            <span className="font-manrope font-semibold text-[11px] text-[#ABABAB]">{p.likes}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
