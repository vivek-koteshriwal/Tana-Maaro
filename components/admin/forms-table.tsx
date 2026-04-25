"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";

type FormRecord = {
    id: string;
    formType: string;
    submitter: string;
    contactVector: string;
    payloadData: string;
    timestamp: string;
};

export function FormsTable({ initialQueue }: { initialQueue: FormRecord[] }) {
    const [queue] = useState<FormRecord[]>(initialQueue);

    return (
        <div className="rounded-xl border border-blue-900/40 bg-black/60 overflow-hidden">
            <Table>
                <TableHeader className="bg-neutral-950 border-b border-blue-900/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-gray-400 font-bold uppercase py-4">Submitter</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase">Form Origin</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase max-w-sm">Raw Payload</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-right">Processed At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {queue.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                No inbound webhooks detected.
                            </TableCell>
                        </TableRow>
                    ) : (
                        queue.map((item) => (
                            <TableRow key={item.id} className="border-b border-white/5 hover:bg-neutral-900/50 transition-colors">
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-white text-sm">@{item.submitter}</span>
                                        <span className="text-xs text-gray-500">{item.contactVector}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`text-[10px] tracking-widest uppercase flex items-center gap-1 w-fit ${item.formType === 'Event Registration' ? 'border-orange-500 text-orange-400 bg-orange-950/20' : 'border-blue-500 text-blue-400 bg-blue-950/20'}`}>
                                        {item.formType === 'Event Registration' ? <FileSpreadsheet className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                        {item.formType}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs md:max-w-md">
                                    <div className="text-gray-300 text-xs italic bg-white/5 p-2 rounded border border-white/10 break-words">
                                        {item.payloadData}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-sm text-gray-400">
                                    {format(new Date(item.timestamp), "MMM d, HH:mm")}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
