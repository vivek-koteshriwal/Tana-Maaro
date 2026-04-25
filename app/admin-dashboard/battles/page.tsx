"use client";

import { useState, useEffect } from "react";
import { Swords, Plus, Loader2, Zap, Clock, Users, Trophy, Trash2, StopCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import Link from "next/link";

const BATTLE_TYPES = ["college", "city", "creator", "memer"] as const;
const DURATIONS    = [
    { value: "short",    label: "Short (15 min)" },
    { value: "standard", label: "Standard (24 h)" },
];

const STATUS_COLORS: Record<string, string> = {
    live:     "border-green-500 text-green-400",
    upcoming: "border-blue-500 text-blue-400",
    ended:    "border-gray-600 text-gray-500",
};

function evaluateStatus(b: any) {
    if (b.status === "ended") return b;
    const now = Date.now();
    const status = now > new Date(b.endTime).getTime() ? "ended"
        : now >= new Date(b.startTime).getTime() ? "live" : "upcoming";
    return { ...b, status };
}

export default function AdminBattlesPage() {
    const [battles,     setBattles]     = useState<any[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [creating,    setCreating]    = useState(false);
    const [modalOpen,   setModalOpen]   = useState(false);
    const [error,       setError]       = useState("");

    const [form, setForm] = useState({
        type: "college" as typeof BATTLE_TYPES[number],
        title: "",
        duration: "standard" as "short" | "standard",
        startNow: true,
        startTime: "",
    });

    const fetchBattles = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/battles");
            const data = await res.json();
            setBattles(Array.isArray(data) ? data.map(evaluateStatus) : []);
        } catch { setBattles([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBattles(); }, []);

    const handleCreate = async () => {
        if (!form.type) { setError("Battle type is required."); return; }
        if (!form.startNow && !form.startTime) { setError("Start time is required for scheduled battles."); return; }
        setCreating(true);
        setError("");
        try {
            const res = await fetch("/api/admin/battles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error || "Failed to create battle.");
                return;
            }
            setModalOpen(false);
            await fetchBattles();
        } catch { setError("Network error."); }
        finally { setCreating(false); }
    };

    const handleEnd = async (battle: any) => {
        if (!confirm(`End battle "${battle.title}"? This will declare a winner based on current scores.`)) return;
        try {
            await fetch(`/api/admin/battles/${battle.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ended" }),
            });
            await fetchBattles();
        } catch { alert("Failed to end battle."); }
    };

    const handleDelete = async (battle: any) => {
        if (!confirm(`Force-end "${battle.title}"? This cannot be reversed.`)) return;
        try {
            await fetch(`/api/admin/battles/${battle.id}`, { method: "DELETE" });
            await fetchBattles();
        } catch { alert("Failed."); }
    };

    const set = (key: keyof typeof form, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const liveBattles    = battles.filter(b => b.status === "live");
    const upcomingBattles = battles.filter(b => b.status === "upcoming");
    const endedBattles   = battles.filter(b => b.status === "ended");

    return (
        <>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-red-900/30 pb-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Swords className="text-red-500" />
                            Battle Control Center
                        </h1>
                        <p className="text-gray-400 mt-1">Create and manage roast battles. Monitor live arenas in real time.</p>
                    </div>
                    <Button onClick={() => { setError(""); setModalOpen(true); }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
                        <Plus className="w-4 h-4" /> Create Battle
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Live Now",  value: liveBattles.length,    icon: <Zap className="w-5 h-5 text-green-400" />, color: "text-green-400" },
                        { label: "Upcoming",  value: upcomingBattles.length, icon: <Clock className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
                        { label: "Total",     value: battles.length,         icon: <Trophy className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
                    ].map(s => (
                        <div key={s.label} className="bg-neutral-900/60 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                            {s.icon}
                            <div>
                                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Battle list */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading battles...
                    </div>
                ) : battles.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                        <Swords className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-bold">No battles yet</p>
                        <p className="text-gray-600 text-sm mt-1">Click "Create Battle" to launch the first arena</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {battles.map(battle => {
                            const startStr = battle.startTime ? (() => { try { return format(new Date(battle.startTime), "MMM d, h:mm a"); } catch { return battle.startTime; } })() : "—";
                            const endStr   = battle.endTime   ? (() => { try { return format(new Date(battle.endTime),   "MMM d, h:mm a"); } catch { return battle.endTime;   } })() : "—";
                            return (
                                <div key={battle.id} className="bg-neutral-900/60 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                                    {/* Type icon */}
                                    <div className="w-10 h-10 rounded-lg bg-red-900/20 border border-red-900/30 flex items-center justify-center shrink-0">
                                        <Swords className="w-5 h-5 text-red-500" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <p className="text-white font-black text-[15px] tracking-tight truncate">{battle.title}</p>
                                            <Badge variant="outline" className={`uppercase text-[10px] tracking-widest ${STATUS_COLORS[battle.status] || STATUS_COLORS.ended}`}>
                                                {battle.status}
                                            </Badge>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest border border-white/10 px-1.5 py-0.5 rounded">{battle.type}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest border border-white/10 px-1.5 py-0.5 rounded">{battle.duration === "short" ? "15 min" : "24 hr"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{startStr} – {endStr}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{battle.participants?.length || 0} participants</span>
                                            {battle.winnerId && <span className="text-yellow-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> Winner: {battle.winnerUsername || battle.winnerId}</span>}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={`/battles/${battle.id}`} target="_blank">
                                            <Button variant="outline" size="sm"
                                                className="border-transparent bg-neutral-800 text-blue-400 hover:bg-blue-950/30 hover:text-blue-300">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>
                                        {battle.status === "live" && (
                                            <Button variant="outline" size="sm" onClick={() => handleEnd(battle)}
                                                className="border-transparent bg-neutral-800 text-orange-400 hover:bg-orange-950/30 hover:text-orange-300"
                                                title="End battle & declare winner">
                                                <StopCircle className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(battle)}
                                            className="border-transparent bg-neutral-800 text-red-500 hover:bg-red-950/30 hover:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Battle Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-neutral-950 border border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <Swords className="w-5 h-5 text-red-500" /> Create New Battle
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <div className="bg-red-950/50 border border-red-900 text-red-400 px-3 py-2 rounded-lg text-sm">{error}</div>
                    )}

                    <div className="space-y-4 mt-2">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Title (optional)</Label>
                            <Input value={form.title} onChange={e => set("title", e.target.value)}
                                placeholder="Auto-generated if left blank" className="bg-black border-white/10 text-white" />
                        </div>

                        {/* Type */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Battle Type *</Label>
                            <select value={form.type} onChange={e => set("type", e.target.value)}
                                className="w-full h-10 px-3 bg-black border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600">
                                {BATTLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Duration</Label>
                            <select value={form.duration} onChange={e => set("duration", e.target.value)}
                                className="w-full h-10 px-3 bg-black border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600">
                                {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>

                        {/* Start */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Start</Label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => set("startNow", true)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${form.startNow ? "bg-red-600/20 border-red-600/50 text-red-400" : "bg-neutral-800 border-white/10 text-gray-400 hover:text-white"}`}>
                                    Start Now
                                </button>
                                <button type="button" onClick={() => set("startNow", false)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${!form.startNow ? "bg-blue-600/20 border-blue-600/50 text-blue-400" : "bg-neutral-800 border-white/10 text-gray-400 hover:text-white"}`}>
                                    Schedule
                                </button>
                            </div>
                            {!form.startNow && (
                                <Input type="datetime-local" value={form.startTime} onChange={e => set("startTime", e.target.value)}
                                    className="bg-black border-white/10 text-white mt-2" />
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="border-white/10 text-gray-400 hover:text-white flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={creating} className="bg-red-600 hover:bg-red-700 text-white font-bold flex-1">
                            {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Launch Battle"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
