"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, X, ShieldAlert, Image as ImageIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";

type ContentRecord = {
    id: string;
    userId: string;
    userName: string;
    content: string;
    image: string | null;
    type: string;
    status: string;
    createdAt: string;
};

export function ContentModerationTable({ initialQueue }: { initialQueue: ContentRecord[] }) {
    const [queue, setQueue] = useState<ContentRecord[]>(initialQueue);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleModeration = async (postId: string, action: 'approve' | 'reject') => {
        setLoadingId(postId);
        try {
            const nextStatus = action === 'approve' ? 'approved' : 'rejected';

            const res = await fetch(`/api/admin/content/${postId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus })
            });

            if (!res.ok) throw new Error(`Decision enforcement failed`);

            // Optimistic Client Flush
            setQueue(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error(error);
            alert("Administrative sequence stalled while writing to DB.");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!process.browser) return;
        if (!confirm("CRITICAL: Destructive action. Are you sure you want to permanently delete this content payload?")) return;

        setLoadingId(postId);
        try {
            const res = await fetch(`/api/admin/content/${postId}/status`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Deletion failed");

            setQueue(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error(error);
            alert("Failed to delete content from root index.");
            setLoadingId(null);
        }
    };

    return (
        <div className="rounded-xl border border-blue-900/40 bg-black/60 overflow-hidden">
            <Table>
                <TableHeader className="bg-neutral-950 border-b border-blue-900/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="text-gray-400 font-bold uppercase py-4">Publisher</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase">MIME Flag</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase">Payload Data</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase">Logged At</TableHead>
                        <TableHead className="text-gray-400 font-bold uppercase text-right">Judgment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {queue.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                <ShieldAlert className="mx-auto h-8 w-8 mb-2 opacity-50 text-blue-500" />
                                No pending content payloads. Network feed is clean.
                            </TableCell>
                        </TableRow>
                    ) : (
                        queue.map((post) => (
                            <TableRow key={post.id} className="border-b border-white/5 hover:bg-neutral-900/50 transition-colors">
                                <TableCell className="font-bold text-white text-base py-4 py-4">
                                    @{post.userName}
                                </TableCell>
                                <TableCell>
                                    {post.image ? (
                                        <Badge variant="outline" className="border-purple-500 bg-purple-950/20 text-purple-400 uppercase text-[10px] tracking-widest flex items-center gap-1 w-fit">
                                            <ImageIcon className="w-3 h-3" />
                                            Media+Text
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-gray-500 bg-gray-900/30 text-gray-400 uppercase text-[10px] tracking-widest flex items-center gap-1 w-fit">
                                            Standard Text
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <div className="text-gray-300 text-sm line-clamp-2 italic">
                                        "{post.content || "Media-only payload"}"
                                    </div>
                                    {post.image && (
                                        <div className="mt-2 w-16 h-16 rounded overflow-hidden border border-white/10 opacity-50 hover:opacity-100 transition-opacity">
                                            <img src={post.image} alt="Payload preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-gray-400 text-sm">
                                    {format(new Date(post.createdAt), "HH:mm | MMM d")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleModeration(post.id, 'approve')}
                                            disabled={loadingId === post.id}
                                            className="border-transparent bg-neutral-900 text-green-500 hover:bg-green-950/30 hover:text-green-400 hover:border-green-900/50 transition-colors"
                                        >
                                            <Check className="w-4 h-4 mr-1" /> Approve
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleModeration(post.id, 'reject')}
                                            disabled={loadingId === post.id}
                                            className="border-transparent bg-neutral-900 text-orange-600 hover:bg-orange-950/30 hover:text-orange-500 hover:border-orange-900/50 transition-colors"
                                        >
                                            <X className="w-4 h-4 mr-1" /> Reject
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(post.id)}
                                            disabled={loadingId === post.id}
                                            className="border-transparent bg-neutral-900 text-red-600 hover:bg-red-950/30 hover:text-red-500 hover:border-red-900/50 transition-colors"
                                            title="Permanent Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
