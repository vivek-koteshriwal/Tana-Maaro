"use client";

import { useState, useEffect } from "react";
import { Ticket, Calendar, Users } from "lucide-react";
import { EventManagementTable } from "@/components/admin/event-management-table";
import { EventRegistrationTable } from "@/components/admin/event-registration-table";

export default function AdminEventsPage() {
    const [tab, setTab] = useState<"events" | "registrations">("events");
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loadingRegs, setLoadingRegs] = useState(false);

    useEffect(() => {
        if (tab === "registrations" && registrations.length === 0) {
            setLoadingRegs(true);
            fetch("/api/admin/stats")
                .then(r => r.json())
                .then(d => {
                    const raw = Array.isArray(d.registrations) ? d.registrations : [];
                    setRegistrations(raw.map((r: any) => ({
                        id: r.id,
                        eventId: r.eventId,
                        eventName: r.eventName || "Unknown Event",
                        city: r.city || "N/A",
                        userName: r.userName,
                        email: r.email,
                        phone: r.phone,
                        role: r.role || "attendee",
                        createdAt: r.createdAt || new Date().toISOString(),
                    })));
                })
                .catch(() => {})
                .finally(() => setLoadingRegs(false));
        }
    }, [tab]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-900/30 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Ticket className="text-orange-500" />
                        Event Control Center
                    </h1>
                    <p className="text-gray-400 mt-1">Create events, manage registrations, and control event status in real time.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-900/60 border border-white/5 rounded-xl p-1 w-fit">
                <button
                    type="button"
                    onClick={() => setTab("events")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${
                        tab === "events"
                            ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    Events
                </button>
                <button
                    type="button"
                    onClick={() => setTab("registrations")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${
                        tab === "registrations"
                            ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Registrations
                    {registrations.length > 0 && (
                        <span className="bg-white/10 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {registrations.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            {tab === "events" && <EventManagementTable />}

            {tab === "registrations" && (
                loadingRegs ? (
                    <div className="py-20 text-center text-gray-500 animate-pulse">Loading registrations...</div>
                ) : (
                    <EventRegistrationTable registrations={registrations} />
                )
            )}
        </div>
    );
}
