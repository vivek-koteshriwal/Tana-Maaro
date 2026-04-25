"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Zap, Bell } from "lucide-react";

interface CitySpec {
    city: string;
    venue: string;
    fallbackDate: string;
    fallbackNote: string;
    liveByDefault: boolean;
    codeA: string;
    codeB: string;
    fallbackCrowd: string;
    fallbackActivity: string;
    bgClass: string;
}

const CITY_SPECS: CitySpec[] = [
    { city: "Delhi",     venue: "National Arena 01",   fallbackDate: "NOV 24", fallbackNote: "STARTS 20:00",      liveByDefault: true,  codeA: "JC", codeB: "MK", fallbackCrowd: "12K+", fallbackActivity: "Already registered for battle", bgClass: "city-delhi" },
    { city: "Mumbai",    venue: "Coastal Hub Alpha",   fallbackDate: "DEC 02", fallbackNote: "TICKET DROP SOON",  liveByDefault: false, codeA: "AS", codeB: "RT", fallbackCrowd: "45K+", fallbackActivity: "Watching for deployment",       bgClass: "city-mumbai" },
    { city: "Bangalore", venue: "Tech Colosseum",      fallbackDate: "NOV 25", fallbackNote: "FINAL SLOTS OPEN", liveByDefault: true,  codeA: "BK", codeB: "ML", fallbackCrowd: "8K+",  fallbackActivity: "Engineers of destruction ready",bgClass: "city-bangalore" },
    { city: "Hyderabad", venue: "Nizam Citadel",       fallbackDate: "DEC 10", fallbackNote: "PRE-REGISTRATION", liveByDefault: false, codeA: "VF", codeB: "LQ", fallbackCrowd: "22K+", fallbackActivity: "Tacticians gathering forces",    bgClass: "city-hyderabad" },
    { city: "Pune",      venue: "Shaniwar Arena",      fallbackDate: "DEC 15", fallbackNote: "COMING SOON",      liveByDefault: false, codeA: "RS", codeB: "AP", fallbackCrowd: "9K+",  fallbackActivity: "Waiting to unleash",            bgClass: "city-pune" },
    { city: "Chennai",   venue: "Marina Battleground", fallbackDate: "JAN 05", fallbackNote: "EARLY ACCESS",     liveByDefault: false, codeA: "KP", codeB: "ST", fallbackCrowd: "18K+", fallbackActivity: "South India rising",             bgClass: "city-chennai" },
];

interface EventModel {
    id: string; city: string; location?: string;
    date?: string; registrationOpen?: boolean; status?: string;
}

export default function EventsPage() {
    const [events, setEvents]       = useState<EventModel[]>([]);
    const [cityStats, setCityStats] = useState<Record<string, number>>({});
    const [hasError, setHasError]   = useState(false);

    useEffect(() => {
        fetch("/api/events")
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setEvents(d); else if (Array.isArray(d.events)) setEvents(d.events); })
            .catch(() => setHasError(true));

        CITY_SPECS.forEach(spec => {
            fetch(`/api/events/stats?city=${encodeURIComponent(spec.city)}`)
                .then(r => r.json())
                .then(d => { if (typeof d.registrationCount === "number") setCityStats(p => ({ ...p, [spec.city]: d.registrationCount })); })
                .catch(() => {});
        });
    }, []);

    const findEvent = (city: string): EventModel | null => {
        const n = city.toLowerCase();
        const m = events.filter(e => e.city.toLowerCase() === n || e.city.toLowerCase().includes(n));
        if (!m.length) return null;
        const sorted = [...m].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        return sorted.find(e => e.registrationOpen) || sorted[0];
    };

    const formatCount = (n: number) =>
        n >= 1000 ? `${(n / 1000) >= 10 ? Math.round(n / 1000) : (n / 1000).toFixed(1).replace(".0", "")}K+` : `${n}+`;

    return (
        <div className="min-h-screen arena-bg">

            {/* ── AppBar ── */}
            <div className="event-appbar sticky top-16 z-30 border-b border-white/[0.08] px-4 h-[62px] flex items-center">
                <div className="mx-auto w-full max-w-[1040px] flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-arena-primary" />
                    <span className="font-epilogue font-black text-[15px] tracking-tight text-white">EVENT</span>
                </div>
            </div>

            <div className="mx-auto max-w-[1040px]">

                {/* ── Hero ── */}
                <div className="relative overflow-hidden h-[340px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#191919]/60 to-[#0E0E0E]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E0E] via-[#0E0E0E]/85 to-transparent" />
                    <div className="absolute top-3 -right-8 w-44 h-44 rounded-full bg-arena-primary-8 pointer-events-none" />

                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-7">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B3B]" />
                            <span className="font-manrope font-black text-[10px] uppercase tracking-[1.45px] text-arena-primary-soft">
                                Offline City Meetups
                            </span>
                        </div>
                        <h1 className="font-epilogue font-black leading-[0.88] tracking-[-1.15px] mb-4">
                            <span className="text-white text-[clamp(26px,5vw,38px)]">IN-PERSON</span>
                            <br />
                            <span className="italic text-arena-primary text-[clamp(26px,5vw,38px)]">ARENA EVENTS</span>
                        </h1>
                        <p className="font-manrope font-semibold text-[13.5px] leading-relaxed max-w-[320px] text-arena-muted">
                            Witness the clash of legends in your territory. High-performance arenas, tactical gatherings, and global showdowns.
                        </p>
                        {hasError && (
                            <div className="mt-4 px-3 py-2 rounded-xl bg-white/5 inline-block">
                                <span className="font-manrope font-bold text-[9.4px] text-white/70 uppercase tracking-wide">
                                    Event sync failed. Showing fallback cities.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── City Grid ── */}
                <div className="px-4 pt-6 pb-36">
                    <h2 className="font-epilogue font-black text-[18px] text-white tracking-tight mb-1.5">ACTIVE ARENAS</h2>
                    <p className="font-manrope font-semibold text-[12.4px] leading-snug mb-5 text-arena-muted">
                        Select your battleground for local meetup details
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                        {CITY_SPECS.map(spec => {
                            const event   = findEvent(spec.city);
                            const isLive  = event ? !!event.registrationOpen : spec.liveByDefault;
                            const count   = cityStats[spec.city] ?? 0;
                            const crowd   = count > 0 ? formatCount(count) : spec.fallbackCrowd;
                            const date    = event?.date
                                ? new Date(event.date).toLocaleDateString("en-US", { month:"short", day:"2-digit" }).toUpperCase()
                                : spec.fallbackDate;
                            const note    = !event ? spec.fallbackNote
                                : event.registrationOpen ? "REG OPEN"
                                : event.status === "upcoming" ? "PRE-REGISTRATION"
                                : event.status === "ended"   ? "ARENA CLOSED"
                                : (event.status || "").toUpperCase();
                            const venue   = (event?.location?.trim() || spec.venue).toUpperCase();
                            return (
                                <CityCard key={spec.city} spec={spec} isLive={isLive}
                                    date={date} note={note} venue={venue} crowd={crowd}
                                    href={`/events/${spec.city.toLowerCase()}`} />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── City Card ──────────────────────────────────────────────────────────── */
function CityCard({ spec, isLive, date, note, venue, crowd, href }: {
    spec: CitySpec; isLive: boolean; date: string; note: string;
    venue: string; crowd: string; href: string;
}) {
    return (
        <Link href={href} className="group arena-surface rounded-[18px] overflow-hidden block transition-transform hover:-translate-y-0.5">
            {/* Image area */}
            <div className="relative h-[164px] w-full overflow-hidden">
                <div className={`absolute inset-0 ${spec.bgClass}`} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="font-epilogue font-black text-[72px] opacity-10 select-none text-arena-primary">
                        {spec.city[0]}
                    </span>
                </div>
                <div className="city-card-gradient absolute inset-0" />
                {/* Badge */}
                <div className="absolute top-2.5 left-2.5">
                    {isLive
                        ? <span className="bg-[#FF3B3B] text-white font-manrope font-black text-[8.6px] uppercase tracking-[0.95px] px-2 py-1 rounded">LIVE</span>
                        : <span className="arena-surface-hi border border-[#FF3B3B]/28 text-white font-manrope font-black text-[8.6px] uppercase tracking-[0.95px] px-2 py-1 rounded">SOON</span>
                    }
                </div>
            </div>

            {/* Body */}
            <div className="p-[14px]">
                <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div>
                        <h3 className="font-epilogue font-black text-[17px] tracking-[-0.55px] text-white mb-0.5">
                            {spec.city.toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-arena-muted" />
                            <span className="font-manrope font-bold text-[9px] uppercase tracking-[0.95px] text-arena-muted">{venue}</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`font-epilogue font-black text-[15px] tracking-[-0.35px] ${isLive ? "text-arena-primary" : "text-white"}`}>{date}</p>
                        <p className="font-manrope font-extrabold text-[8.4px] uppercase tracking-[0.8px] text-arena-muted">{note}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-2 mb-3.5">
                    <CodePill code={spec.codeA} />
                    <CodePill code={spec.codeB} />
                    <span className="font-epilogue font-black text-[13px] tracking-[-0.25px] text-arena-primary">{crowd}</span>
                    <span className="font-manrope font-semibold text-[10.4px] italic leading-snug text-arena-muted">{spec.fallbackActivity}</span>
                </div>

                {/* CTA */}
                {isLive
                    ? <div className="btn-arena-filled flex items-center gap-2 h-[34px] px-3.5 rounded-[6px] w-fit font-manrope font-black text-[9.6px] uppercase tracking-[0.95px] text-white cursor-pointer">
                        <span>ENTER ARENA</span><Zap className="w-3 h-3" />
                      </div>
                    : <div className="flex items-center gap-2 h-[34px] px-3.5 rounded-[6px] w-fit border border-[#FF3B3B]/28 font-manrope font-black text-[9.6px] uppercase tracking-[0.95px] text-white cursor-pointer hover:bg-white/5 transition-colors">
                        <span>REMIND ME</span><Bell className="w-3 h-3" />
                      </div>
                }
            </div>
        </Link>
    );
}

function CodePill({ code }: { code: string }) {
    return (
        <span className="arena-surface-hi w-[18px] h-[18px] rounded-full inline-flex items-center justify-center font-manrope font-extrabold text-[7.2px] text-white">
            {code}
        </span>
    );
}
