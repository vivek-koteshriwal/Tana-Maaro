"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, School, Building2, Star, Smile, ArrowRight, RadioTower, Trophy } from "lucide-react";

interface BattleModel {
    id: string; title: string; type: string; status: string;
}

interface CategorySpec {
    id: string; typeKey: string; title: string; subtitle: string;
    buttonLabel: string; filledButton: boolean; icon: React.ReactNode; bgClass: string;
}

const CATEGORIES: CategorySpec[] = [
    { id: "college", typeKey: "college", title: "COLLEGE VS\nCOLLEGE", subtitle: "Settle the campus rivalry. Represent your university in massive scale social skirmishes.",    buttonLabel: "ENTER WAR ROOM", filledButton: false, icon: <School    className="w-5 h-5" />, bgClass: "arena-college" },
    { id: "city",    typeKey: "city",    title: "CITY VS CITY",         subtitle: "Territorial dominance. Which skyline rules the feed? Rally your locals and take over.",         buttonLabel: "CLAIM TERRITORY",filledButton: false, icon: <Building2 className="w-5 h-5" />, bgClass: "arena-city" },
    { id: "creator", typeKey: "creator", title: "CREATOR VS\nCREATOR",  subtitle: "Influence is the weapon. Fanbases clash to decide the ultimate digital kingpin.",              buttonLabel: "JOIN SQUAD",     filledButton: true,  icon: <Star      className="w-5 h-5" />, bgClass: "arena-creator" },
    { id: "memer",   typeKey: "memer",   title: "MEEMER VS\nMEEMER",    subtitle: "Meme reflexes. Brutal timing. Whoever blinks first gets ratioed.",                             buttonLabel: "ENTER CHAOS",    filledButton: false, icon: <Smile     className="w-5 h-5" />, bgClass: "arena-memer" },
];

const priority = (s: string) => s === "live" ? 0 : s === "upcoming" ? 1 : 2;
const status   = (b: BattleModel) => b.status || "upcoming";

export default function BattlesPage() {
    const [battles, setBattles] = useState<BattleModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/battles?limit=50")
            .then(r => r.json())
            .then(d => { setBattles(Array.isArray(d) ? d : (d.battles ?? [])); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const liveCount   = battles.filter(b => status(b) === "live").length;
    const featured    = battles.length ? [...battles].sort((a, b) => priority(status(a)) - priority(status(b)))[0] : null;
    const forCategory = (cat: CategorySpec) => {
        const m = battles.filter(b => b.type?.toLowerCase() === cat.typeKey || b.title?.toLowerCase().includes(cat.typeKey));
        return m.length ? m.sort((a, b) => priority(status(a)) - priority(status(b)))[0] : null;
    };

    const joinBattle = () => {
        if (featured) { window.location.href = `/battles/${featured.id}`; return; }
        document.getElementById("arena-cats")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen arena-bg">

            {/* AppBar */}
            <div className="arena-appbar sticky top-16 z-30 border-b border-white/[0.08] px-4 h-[62px] flex items-center">
                <div className="mx-auto w-full max-w-[1040px] flex items-center gap-2">
                    <div className="w-4 h-4 rounded-[4px] bg-arena-primary-16 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-arena-primary" />
                    </div>
                    <span className="font-epilogue font-black text-[15px] tracking-tight text-white">BATTLE ARENA</span>
                </div>
            </div>

            <div className="mx-auto max-w-[1040px]">
                <HeroSection liveCount={liveCount} arenaCount={CATEGORIES.length}
                    loading={loading && !battles.length} error={error}
                    onJoin={joinBattle}
                    onSchedule={() => document.getElementById("arena-cats")?.scrollIntoView({ behavior:"smooth" })} />

                <div id="arena-cats" className="px-4 pt-6 pb-36">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {CATEGORIES.map(cat => <CategoryCard key={cat.id} category={cat} battle={forCategory(cat)} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
function HeroSection({ liveCount, arenaCount, loading, error, onJoin, onSchedule }: {
    liveCount: number; arenaCount: number; loading: boolean; error: string | null;
    onJoin: () => void; onSchedule: () => void;
}) {
    return (
        <div className="relative overflow-hidden bg-black px-4 pt-6 pb-8 min-h-[330px]">
            <div className="absolute -top-5 -right-10 w-56 h-56 rounded-full bg-arena-primary-16 pointer-events-none" />
            <div className="absolute bottom-14 -right-3 w-28 h-28 rounded-[24px] bg-arena-primary-14 pointer-events-none" />

            <div className="relative z-10 max-w-[440px]">
                <div className="flex items-center gap-2 mb-5">
                    <span className="live-dot w-2 h-2 rounded-full bg-[#FF3B3B]" />
                    <span className="font-manrope font-black text-[10.5px] uppercase tracking-[1.35px] text-arena-primary-soft">Live Engagement</span>
                </div>

                <h1 className="font-epilogue font-black leading-[0.88] tracking-[-1.2px] mb-5">
                    <span className="text-white text-[clamp(28px,6vw,42px)]">ENTER THE</span><br />
                    <span className="text-arena-primary text-[clamp(28px,6vw,42px)]">ARENA</span>
                </h1>

                <p className="font-manrope font-semibold text-[13.5px] leading-relaxed mb-5 max-w-[320px] text-arena-muted">
                    Choose your faction. Defend your pride. This is the digital colosseum where only the strongest communities survive.
                </p>

                <div className="flex flex-col gap-2.5 mb-5 w-[138px]">
                    <button type="button" onClick={onJoin}
                        className="btn-arena-filled h-10 px-5 rounded-lg font-manrope font-black text-[11.2px] tracking-[0.95px] uppercase text-white">
                        JOIN BATTLE
                    </button>
                    <button type="button" onClick={onSchedule}
                        className="h-10 px-5 rounded-lg border border-[#FF3B3B]/38 font-manrope font-black text-[11.2px] tracking-[0.95px] uppercase text-white hover:bg-white/5 transition-colors">
                        VIEW SCHEDULE
                    </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <HeroPill icon={<Trophy className="w-3 h-3" />}      label={`${arenaCount} ARENAS`} />
                    <HeroPill icon={<RadioTower className="w-3 h-3" />}  label={liveCount > 0 ? `${liveCount} LIVE NOW` : "LIVE NOW"} />
                </div>

                {loading && (
                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                        <span className="font-manrope font-bold text-[10px] text-white/50 uppercase tracking-widest">Syncing Arenas</span>
                    </div>
                )}
                {error && (
                    <button type="button" onClick={() => window.location.reload()}
                        className="mt-4 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/[0.08] font-manrope font-bold text-[10px] text-white/70 uppercase tracking-wide hover:bg-white/10 transition-colors">
                        Arena Sync Failed. Tap to Retry.
                    </button>
                )}
            </div>
        </div>
    );
}

function HeroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-1.5 h-[30px] px-3 rounded-full bg-arena-primary-10 border border-[#FF3B3B]/18">
            <span className="text-arena-primary-soft">{icon}</span>
            <span className="font-manrope font-black text-[9.8px] uppercase tracking-[1px] text-arena-primary-soft">{label}</span>
        </div>
    );
}

/* ── Category Card ───────────────────────────────────────────────────── */
function CategoryCard({ category, battle }: { category: CategorySpec; battle: BattleModel | null }) {
    const st   = battle ? status(battle) : null;
    const stTxt = st === "live" ? "LIVE NOW" : st === "upcoming" ? "UP NEXT" : "ROOM READY";
    const href  = battle ? `/battles/${battle.id}` : `/battles?type=${category.typeKey}`;

    return (
        <Link href={href}
            className={`group relative min-h-[218px] rounded-[22px] overflow-hidden block transition-transform hover:-translate-y-0.5 hover:shadow-2xl ${category.bgClass}`}>
            <div className="absolute -top-5 -right-2.5 w-32 h-32 rounded-full bg-arena-primary-10 pointer-events-none" />
            <div className="absolute -bottom-4 -right-2 w-28 h-28 rounded-full bg-arena-primary-8 pointer-events-none" />

            <div className="relative z-10 p-[18px] flex flex-col min-h-[218px]">
                <div className="flex justify-end mb-10">
                    <div className="w-[34px] h-[34px] rounded-[10px] bg-arena-primary-16 flex items-center justify-center text-arena-primary">
                        {category.icon}
                    </div>
                </div>

                <h3 className="font-epilogue font-black text-[19px] leading-[0.95] tracking-[-0.7px] text-white whitespace-pre-line mb-2.5">
                    {category.title}
                </h3>
                <p className="font-manrope font-semibold text-[12.4px] leading-[1.45] text-arena-muted mb-2.5">
                    {category.subtitle}
                </p>
                <p className="font-manrope font-black text-[9.4px] uppercase tracking-[1.2px] text-arena-primary-soft mb-3">
                    {stTxt}
                </p>

                {category.filledButton
                    ? <div className="btn-arena-filled flex items-center gap-2 h-10 px-4 rounded-lg w-fit font-manrope font-black text-[10.7px] uppercase tracking-[0.95px] text-white cursor-pointer">
                        <span>{category.buttonLabel}</span><ArrowRight className="w-4 h-4" />
                      </div>
                    : <div className="arena-surface-hi border border-[#484848]/80 flex items-center gap-2 h-10 px-4 rounded-lg w-fit font-manrope font-black text-[10.7px] uppercase tracking-[0.95px] text-white cursor-pointer hover:bg-white/10 transition-colors">
                        <span>{category.buttonLabel}</span><ArrowRight className="w-4 h-4" />
                      </div>
                }
            </div>
        </Link>
    );
}
