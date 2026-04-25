"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calendar, MapPin, Loader2, Image as ImageIcon, ToggleLeft } from "lucide-react";
import { format } from "date-fns";

const CITIES = ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai"];
const STATUSES = [
    { value: "upcoming",    label: "Upcoming",    color: "border-blue-500 text-blue-400" },
    { value: "announced",   label: "Announced",   color: "border-yellow-500 text-yellow-400" },
    { value: "live",        label: "Live",        color: "border-green-500 text-green-400" },
    { value: "completed",   label: "Completed",   color: "border-gray-500 text-gray-400" },
    { value: "coming_soon", label: "Coming Soon", color: "border-orange-500 text-orange-400" },
];

type EventRecord = {
    id: string; title: string; city: string; date: string; time: string;
    venue: string; description: string; status: string; prizePool: string;
    format: string; posterUrl: string; registrationOpen: boolean; isFeatured: boolean;
};

const EMPTY_FORM: Omit<EventRecord, "id"> = {
    title: "", city: "Delhi", date: "", time: "7:00 PM", venue: "",
    description: "", status: "upcoming", prizePool: "", format: "Roast Battle",
    posterUrl: "", registrationOpen: false, isFeatured: false,
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUSES.find(x => x.value === status) || STATUSES[0];
    return <Badge variant="outline" className={`${s.color} uppercase text-[10px] tracking-widest`}>{s.label}</Badge>;
}

export function EventManagementTable() {
    const [events, setEvents] = useState<EventRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
    const [form, setForm] = useState<Omit<EventRecord, "id">>(EMPTY_FORM);
    const [error, setError] = useState("");

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/events");
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch { setEvents([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEvents(); }, []);

    const openCreate = () => {
        setEditingEvent(null);
        setForm(EMPTY_FORM);
        setError("");
        setModalOpen(true);
    };

    const openEdit = (event: EventRecord) => {
        setEditingEvent(event);
        // Convert ISO date back to YYYY-MM-DD for the date input
        const dateStr = event.date ? event.date.substring(0, 10) : "";
        setForm({ ...event, date: dateStr });
        setError("");
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.city || !form.date || !form.venue) {
            setError("Title, City, Date and Venue are required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const url = editingEvent
                ? `/api/admin/events/${editingEvent.id}`
                : "/api/admin/events";
            const method = editingEvent ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error || "Save failed.");
                return;
            }
            setModalOpen(false);
            await fetchEvents();
        } catch { setError("Network error. Try again."); }
        finally { setSaving(false); }
    };

    const handleDelete = async (event: EventRecord) => {
        if (!confirm(`Delete "${event.title}" in ${event.city}? This cannot be undone.`)) return;
        try {
            await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
            setEvents(prev => prev.filter(e => e.id !== event.id));
        } catch { alert("Delete failed."); }
    };

    const handleToggleReg = async (event: EventRecord) => {
        try {
            await fetch(`/api/admin/events/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registrationOpen: !event.registrationOpen }),
            });
            setEvents(prev => prev.map(e =>
                e.id === event.id ? { ...e, registrationOpen: !e.registrationOpen } : e
            ));
        } catch { alert("Toggle failed."); }
    };

    const set = (key: keyof typeof form, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">{events.length} event{events.length !== 1 ? "s" : ""} total</p>
                <Button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
                    <Plus className="w-4 h-4" /> Create Event
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading events...
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                    <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold">No events yet</p>
                    <p className="text-gray-600 text-sm mt-1">Click "Create Event" to add your first event</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map(event => {
                        const dateStr = event.date
                            ? (() => { try { return format(new Date(event.date), "MMM d, yyyy"); } catch { return event.date; } })()
                            : "Date TBD";
                        return (
                            <div key={event.id} className="bg-neutral-900/60 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                                {/* Poster thumbnail */}
                                <div className="w-14 h-14 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                    {event.posterUrl
                                        ? <img src={event.posterUrl} alt="" className="w-full h-full object-cover" />
                                        : <ImageIcon className="w-5 h-5 text-gray-600" />
                                    }
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-white font-black text-[15px] tracking-tight truncate">{event.title}</p>
                                        {event.isFeatured && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-1.5 py-0.5 rounded">Featured</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.city}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dateStr} {event.time && `· ${event.time}`}</span>
                                        {event.venue && <span className="truncate max-w-[200px]">{event.venue}</span>}
                                    </div>
                                </div>

                                {/* Status + reg toggle */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <StatusBadge status={event.status} />
                                    <button
                                        onClick={() => handleToggleReg(event)}
                                        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded transition-colors ${
                                            event.registrationOpen
                                                ? "bg-green-900/30 border border-green-700/40 text-green-400"
                                                : "bg-neutral-800 border border-white/5 text-gray-500 hover:text-white"
                                        }`}
                                        title="Toggle registration"
                                    >
                                        <ToggleLeft className="w-3 h-3" />
                                        {event.registrationOpen ? "Reg Open" : "Reg Closed"}
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(event)}
                                        className="border-transparent bg-neutral-800 text-blue-400 hover:bg-blue-950/30 hover:text-blue-300">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(event)}
                                        className="border-transparent bg-neutral-800 text-red-500 hover:bg-red-950/30 hover:text-red-400">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-neutral-950 border border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-red-500" />
                            {editingEvent ? "Edit Event" : "Create New Event"}
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <div className="bg-red-950/50 border border-red-900 text-red-400 px-3 py-2 rounded-lg text-sm">{error}</div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {/* Title */}
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Event Title *</Label>
                            <Input value={form.title} onChange={e => set("title", e.target.value)}
                                placeholder="e.g. Delhi Roast Battle Night" className="bg-black border-white/10 text-white" />
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">City *</Label>
                            <select value={form.city} onChange={e => set("city", e.target.value)}
                                className="w-full h-10 px-3 bg-black border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600">
                                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Status</Label>
                            <select value={form.status} onChange={e => set("status", e.target.value)}
                                className="w-full h-10 px-3 bg-black border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600">
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Date *</Label>
                            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                                className="bg-black border-white/10 text-white" />
                        </div>

                        {/* Time */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Time</Label>
                            <Input value={form.time} onChange={e => set("time", e.target.value)}
                                placeholder="7:00 PM" className="bg-black border-white/10 text-white" />
                        </div>

                        {/* Venue */}
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Venue *</Label>
                            <Input value={form.venue} onChange={e => set("venue", e.target.value)}
                                placeholder="e.g. National Arena 01, Connaught Place" className="bg-black border-white/10 text-white" />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Description</Label>
                            <textarea value={form.description} onChange={e => set("description", e.target.value)}
                                rows={3} placeholder="Event description..."
                                className="w-full px-3 py-2 bg-black border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600 resize-none" />
                        </div>

                        {/* Poster URL */}
                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Poster Image URL</Label>
                            <Input value={form.posterUrl} onChange={e => set("posterUrl", e.target.value)}
                                placeholder="https://..." className="bg-black border-white/10 text-white" />
                        </div>

                        {/* Prize Pool */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Prize Pool</Label>
                            <Input value={form.prizePool} onChange={e => set("prizePool", e.target.value)}
                                placeholder="₹50,000" className="bg-black border-white/10 text-white" />
                        </div>

                        {/* Format */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs uppercase tracking-widest font-bold">Format</Label>
                            <Input value={form.format} onChange={e => set("format", e.target.value)}
                                placeholder="Roast Battle / Open Mic" className="bg-black border-white/10 text-white" />
                        </div>

                        {/* Toggles */}
                        <div className="md:col-span-2 flex items-center gap-8 pt-2">
                            <div className="flex items-center gap-3">
                                <Switch checked={form.registrationOpen} onCheckedChange={v => set("registrationOpen", v)} />
                                <div>
                                    <p className="text-white text-sm font-bold">Registration Open</p>
                                    <p className="text-gray-500 text-xs">Allow users to register for this event</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch checked={form.isFeatured} onCheckedChange={v => set("isFeatured", v)} />
                                <div>
                                    <p className="text-white text-sm font-bold">Featured Event</p>
                                    <p className="text-gray-500 text-xs">Highlight on the home page</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                        <Button variant="outline" onClick={() => setModalOpen(false)}
                            className="border-white/10 text-gray-400 hover:text-white flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold flex-1">
                            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editingEvent ? "Save Changes" : "Create Event"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
