"use client";

import React, { useState } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, Calendar, MessageSquare, BadgeCheck, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

export function PartnershipTable({ initialRequests }: { initialRequests: any[] }) {
    const [requests, setRequests] = useState(initialRequests);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "new": return "text-red-500 bg-red-900/20 border-red-900/50";
            case "contacted": return "text-blue-500 bg-blue-900/20 border-blue-900/50";
            case "in_review": return "text-yellow-500 bg-yellow-900/20 border-yellow-900/50";
            case "completed": return "text-green-500 bg-green-900/20 border-green-900/50";
            case "rejected": return "text-gray-500 bg-neutral-900 border-neutral-800";
            default: return "text-gray-500 bg-neutral-900 border-neutral-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "new": return <Clock className="w-3 h-3 mr-1" />;
            case "contacted": return <Mail className="w-3 h-3 mr-1" />;
            case "in_review": return <MessageSquare className="w-3 h-3 mr-1" />;
            case "completed": return <BadgeCheck className="w-3 h-3 mr-1" />;
            case "rejected": return <XCircle className="w-3 h-3 mr-1" />;
            default: return null;
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/partnerships/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    return (
        <div className="bg-neutral-900/40 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-black/40">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest py-5">Sender / Entity</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Contact Intel</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Status / Date</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-20 text-gray-500 font-mono italic">
                                No partnership protocols detected in the archive...
                            </TableCell>
                        </TableRow>
                    )}
                    {requests.map((request) => (
                        <TableRow key={request.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="py-5">
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-lg tracking-tight group-hover:text-red-500 transition-colors">
                                        {request.name}
                                    </span>
                                    <span className="text-gray-500 flex items-center gap-1 text-xs mt-1">
                                        <Building2 className="w-3 h-3 text-red-600" />
                                        {request.company || "Individual Contributor"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <a href={`mailto:${request.email}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm transition-colors">
                                        <Mail className="w-3.5 h-3.5" /> {request.email}
                                    </a>
                                    {request.phone && (
                                        <a href={`tel:${request.phone}`} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
                                            <Phone className="w-3.5 h-3.5" /> {request.phone}
                                        </a>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${getStatusColor(request.status)}`}>
                                        {getStatusIcon(request.status)}
                                        {request.status.replace('_', ' ')}
                                    </div>
                                    <span className="text-gray-500 flex items-center gap-1 text-[10px] font-mono">
                                        <Calendar className="w-3 h-3 text-red-900" />
                                        {format(new Date(request.createdAt), "MMM dd, HH:mm")}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right px-6">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatus(request.id, 'contacted')}
                                        className="border-transparent bg-neutral-900 text-blue-500 hover:bg-blue-950/30 hover:text-blue-400 hover:border-blue-900/50 transition-colors"
                                        title="Mark as Contacted"
                                    >
                                        <Mail className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatus(request.id, 'in_review')}
                                        className="border-transparent bg-neutral-900 text-yellow-500 hover:bg-yellow-950/30 hover:text-yellow-400 hover:border-yellow-900/50 transition-colors"
                                        title="Move to Review"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatus(request.id, 'completed')}
                                        className="border-transparent bg-neutral-900 text-green-500 hover:bg-green-950/30 hover:text-green-400 hover:border-green-900/50 transition-colors"
                                        title="Complete / Partnered"
                                    >
                                        <BadgeCheck className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateStatus(request.id, 'rejected')}
                                        className="border-transparent bg-neutral-900 text-gray-500 hover:bg-neutral-800 hover:text-gray-400 transition-colors"
                                        title="Archive"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
