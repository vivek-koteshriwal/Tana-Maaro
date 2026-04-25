"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, User, Mic2, MapPin, ChevronDown, ChevronUp, Users } from "lucide-react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type RegistrationRecord = {
    id: string;
    eventId: string;
    eventName: string;
    city: string;
    userName: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
};

type EventBlock = {
    key: string;
    eventName: string;
    city: string;
    lastRegistrationUpdate: string;
    attendeesCount: number;
    performersCount: number;
    registrations: RegistrationRecord[];
};

export function EventRegistrationTable({ registrations }: { registrations: RegistrationRecord[] }) {
    const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null);

    // Group the flat registrations list by unique Event Configuration (Name + City)
    const groupedEventsMap = registrations.reduce((acc, reg) => {
        // Fallback names if missing
        const name = reg.eventName || "TanaMaaro Live Event";
        const city = reg.city || "Unknown Zone";
        const key = `${name}-${city}`;

        if (!acc[key]) {
            acc[key] = {
                key,
                eventName: name,
                city,
                lastRegistrationUpdate: reg.createdAt,
                attendeesCount: 0,
                performersCount: 0,
                registrations: []
            };
        }

        if (reg.role === "performer") acc[key].performersCount++;
        else acc[key].attendeesCount++;

        acc[key].registrations.push(reg);

        // Keep the most recent registration date at the top level
        if (new Date(reg.createdAt).getTime() > new Date(acc[key].lastRegistrationUpdate).getTime()) {
            acc[key].lastRegistrationUpdate = reg.createdAt;
        }

        return acc;
    }, {} as Record<string, EventBlock>);

    // Sort event blocks by most recent activity
    const eventBlocks = Object.values(groupedEventsMap).sort((a, b) =>
        new Date(b.lastRegistrationUpdate).getTime() - new Date(a.lastRegistrationUpdate).getTime()
    );

    return (
        <div className="space-y-4">
            {eventBlocks.length === 0 ? (
                <div className="rounded-xl border border-red-900/40 bg-black/60 p-12 text-center text-gray-500 flex flex-col items-center">
                    <AlertCircle className="h-10 w-10 mb-4 opacity-50" />
                    <p>No active Event Blocks discovered in the database.</p>
                </div>
            ) : (
                eventBlocks.map((block) => (
                    <Card key={block.key} className="bg-neutral-900 border-red-900/30 overflow-hidden">
                        <CardHeader
                            className="flex flex-row items-center justify-between cursor-pointer hover:bg-neutral-800 transition-colors py-4 px-6 border-b border-transparent data-[state=open]:border-red-900/30"
                            data-state={expandedEventKey === block.key ? "open" : "closed"}
                            onClick={() => setExpandedEventKey(expandedEventKey === block.key ? null : block.key)}
                        >
                            <div className="flex flex-col gap-2">
                                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                                    {block.eventName}
                                    <Badge variant="outline" className="border-red-500 text-red-400 bg-red-950/20 text-xs tracking-widest uppercase">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {block.city}
                                    </Badge>
                                </CardTitle>
                                <div className="flex items-center gap-6 mt-1 text-sm text-gray-400">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-orange-400" />
                                        <span className="font-bold text-gray-300">{block.attendeesCount + block.performersCount}</span> Total
                                    </span>
                                    <span className="flex items-center gap-2 border-l border-white/10 pl-4">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="font-bold text-gray-300">{block.attendeesCount}</span> Attendees
                                    </span>
                                    <span className="flex items-center gap-2 border-l border-white/10 pl-4">
                                        <Mic2 className="w-4 h-4 text-red-500" />
                                        <span className="font-bold text-gray-300">{block.performersCount}</span> Performers
                                    </span>
                                </div>
                            </div>
                            <div className="text-gray-500">
                                {expandedEventKey === block.key ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                            </div>
                        </CardHeader>

                        {expandedEventKey === block.key && (
                            <CardContent className="p-0 border-t border-red-900/30">
                                <Table>
                                    <TableHeader className="bg-black/40">
                                        <TableRow className="border-b border-white/5 hover:bg-transparent">
                                            <TableHead className="text-gray-500 font-bold uppercase text-xs">Registrant</TableHead>
                                            <TableHead className="text-gray-500 font-bold uppercase text-xs">Vector (Email/Phone)</TableHead>
                                            <TableHead className="text-gray-500 font-bold uppercase text-xs">Classification</TableHead>
                                            <TableHead className="text-gray-500 font-bold uppercase text-xs text-right">Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {block.registrations
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                            .map((reg) => (
                                                <TableRow key={reg.id} className="border-b border-white/5 hover:bg-neutral-800/50 transition-colors">
                                                    <TableCell className="font-bold text-white text-sm py-3">
                                                        @{reg.userName}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-sm text-gray-300">{reg.email}</span>
                                                            <span className="text-xs text-gray-500">{reg.phone}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {reg.role === "performer" ? (
                                                            <Badge variant="outline" className="border-red-500/50 bg-red-950/20 text-red-400 uppercase text-[10px] tracking-widest flex items-center gap-1 w-fit">
                                                                <Mic2 className="w-3 h-3" />
                                                                Performer
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-gray-500/50 bg-gray-900/30 text-gray-400 uppercase text-[10px] tracking-widest flex items-center gap-1 w-fit">
                                                                <User className="w-3 h-3" />
                                                                Audience
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs text-gray-400">
                                                        {format(new Date(reg.createdAt), "MMM d, HH:mm")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        )}
                    </Card>
                ))
            )}
        </div>
    );
}
