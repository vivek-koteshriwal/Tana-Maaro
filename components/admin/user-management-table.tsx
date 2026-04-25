"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Ban, Trash2, CheckCircle2, Eye, PowerOff, Mail, Phone, MapPin, Calendar, User } from "lucide-react";
import { format } from "date-fns";

type MinimalUser = {
    id: string;
    username: string;
    email: string;
    phone: string;
    city: string;
    createdAt: string;
    status: string;
    deletionRequestedAt?: string | null;
    scheduledDeletionAt?: string | null;
    deletionReason?: string | null;
    deletionFeedback?: string | null;
    reactivatedAt?: string | null;
    deletionRecordStatus?: string | null;
};

function StatusBadge({ status }: { status: string }) {
    if (status === "active") return <Badge variant="outline" className="border-green-500 text-green-400 uppercase text-[10px] tracking-widest">Active</Badge>;
    if (status === "suspended") return <Badge variant="outline" className="border-orange-500 text-orange-500 uppercase text-[10px] tracking-widest">Suspended</Badge>;
    if (status === "deactivated") return <Badge variant="outline" className="border-red-500 text-red-500 uppercase text-[10px] tracking-widest animate-pulse">Deactivated</Badge>;
    if (status === "pending_deletion") return <Badge variant="outline" className="border-amber-500 text-amber-400 uppercase text-[10px] tracking-widest">Pending Deletion</Badge>;
    return <Badge variant="outline" className="border-gray-500 text-gray-400 uppercase text-[10px] tracking-widest">{status}</Badge>;
}

function formatDateLabel(value?: string | null, pattern = "MMM d, yyyy 'at' h:mm a") {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return format(parsed, pattern);
}

export function UserManagementTable({ initialUsers }: { initialUsers: MinimalUser[] }) {
    const [users, setUsers] = useState<MinimalUser[]>(initialUsers);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<MinimalUser | null>(null);

    const handleStatusUpdate = async (userId: string, nextStatus: string) => {
        setLoadingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            if (!res.ok) throw new Error("Status update failed");
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
            // Keep modal in sync
            setSelectedUser(prev => prev?.id === userId ? { ...prev, status: nextStatus } : prev);
        } catch {
            alert("Failed to update user status.");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("CRITICAL: This will permanently delete this account. Are you sure?")) return;
        setLoadingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, { method: "DELETE" });
            if (!res.ok) throw new Error("Deletion failed");
            setUsers(prev => prev.filter(u => u.id !== userId));
            setSelectedUser(prev => prev?.id === userId ? null : prev);
        } catch {
            alert("Failed to delete user.");
            setLoadingId(null);
        }
    };

    return (
        <>
            <div className="rounded-xl border border-red-900/40 bg-black/60 overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-950 border-b border-red-900/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-gray-400 font-bold uppercase py-4">Username</TableHead>
                            <TableHead className="text-gray-400 font-bold uppercase">Contact</TableHead>
                            <TableHead className="text-gray-400 font-bold uppercase">Location</TableHead>
                            <TableHead className="text-gray-400 font-bold uppercase">Registered</TableHead>
                            <TableHead className="text-gray-400 font-bold uppercase">Status</TableHead>
                            <TableHead className="text-gray-400 font-bold uppercase text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    No registered users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="border-b border-white/5 hover:bg-neutral-900/50 transition-colors">
                                    <TableCell className="font-bold text-white text-base py-4">
                                        @{user.username}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-300">{user.email}</span>
                                            <span className="text-xs text-gray-500">{user.phone !== "N/A" ? user.phone : "No phone"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400">{user.city}</TableCell>
                                    <TableCell className="text-gray-400 text-sm">
                                        {formatDateLabel(user.createdAt, "MMM d, yyyy") || "Unknown"}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={user.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedUser(user)}
                                                className="border-transparent bg-neutral-900 text-blue-500 hover:bg-blue-950/30 hover:text-blue-400 hover:border-blue-900/50 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {user.status !== "active" && (
                                                <Button variant="outline" size="sm"
                                                    onClick={() => handleStatusUpdate(user.id, "active")}
                                                    disabled={loadingId === user.id}
                                                    className="border-transparent bg-neutral-900 text-green-500 hover:bg-green-950/30 hover:text-green-400 hover:border-green-900/50 transition-colors"
                                                    title="Reactivate">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {user.status !== "suspended" && (
                                                <Button variant="outline" size="sm"
                                                    onClick={() => handleStatusUpdate(user.id, "suspended")}
                                                    disabled={loadingId === user.id}
                                                    className="border-transparent bg-neutral-900 text-orange-500 hover:bg-orange-950/30 hover:text-orange-400 hover:border-orange-900/50 transition-colors"
                                                    title="Suspend">
                                                    <PowerOff className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {user.status !== "deactivated" && (
                                                <Button variant="outline" size="sm"
                                                    onClick={() => handleStatusUpdate(user.id, "deactivated")}
                                                    disabled={loadingId === user.id}
                                                    className="border-transparent bg-neutral-900 text-red-500 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-colors"
                                                    title="Deactivate">
                                                    <Ban className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm"
                                                onClick={() => handleDelete(user.id)}
                                                disabled={loadingId === user.id}
                                                className="border-transparent bg-neutral-900 text-red-700 hover:bg-red-950 hover:text-red-600 border border-red-900/20 hover:border-red-900/80 transition-colors"
                                                title="Permanently Delete">
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

            {/* View Details Modal */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
                <DialogContent className="bg-neutral-950 border border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-red-500" />
                            User Profile
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-5 mt-2">
                            {/* Avatar + name */}
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                <div className="w-14 h-14 rounded-full bg-red-900/40 border border-red-600/30 flex items-center justify-center text-red-400 font-black text-2xl">
                                    {(selectedUser.username || "U")[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-black text-lg">@{selectedUser.username}</p>
                                    <StatusBadge status={selectedUser.status} />
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                                    <span className="text-gray-300 break-all">{selectedUser.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                                    <span className="text-gray-300">{selectedUser.phone !== "N/A" ? selectedUser.phone : "No phone on file"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                                    <span className="text-gray-300">{selectedUser.city !== "N/A" ? selectedUser.city : "Location not set"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                    <span className="text-gray-300">Joined {formatDateLabel(selectedUser.createdAt, "MMMM d, yyyy") || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <User className="w-4 h-4 text-gray-500 shrink-0" />
                                    <span className="text-gray-500 font-mono text-xs break-all">ID: {selectedUser.id}</span>
                                </div>
                                {selectedUser.deletionRequestedAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-gray-300">
                                            Deletion requested {formatDateLabel(selectedUser.deletionRequestedAt) || "recently"}
                                        </span>
                                    </div>
                                )}
                                {selectedUser.scheduledDeletionAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Ban className="w-4 h-4 text-red-500 shrink-0" />
                                        <span className="text-gray-300">
                                            Scheduled deletion {formatDateLabel(selectedUser.scheduledDeletionAt) || "pending"}
                                        </span>
                                    </div>
                                )}
                                {selectedUser.reactivatedAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                        <span className="text-gray-300">
                                            Reactivated {formatDateLabel(selectedUser.reactivatedAt) || "recently"}
                                        </span>
                                    </div>
                                )}
                                {selectedUser.deletionReason && (
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Deletion reason</p>
                                        <p className="mt-2 text-sm text-gray-200">{selectedUser.deletionReason}</p>
                                        {selectedUser.deletionFeedback && (
                                            <p className="mt-2 text-sm text-gray-400">{selectedUser.deletionFeedback}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-white/10">
                                {selectedUser.status !== "active" && (
                                    <Button size="sm" onClick={() => handleStatusUpdate(selectedUser.id, "active")}
                                        disabled={loadingId === selectedUser.id}
                                        className="bg-green-700 hover:bg-green-600 text-white flex-1">
                                        <CheckCircle2 className="w-4 h-4 mr-1" /> Reactivate
                                    </Button>
                                )}
                                {selectedUser.status !== "suspended" && (
                                    <Button size="sm" onClick={() => handleStatusUpdate(selectedUser.id, "suspended")}
                                        disabled={loadingId === selectedUser.id}
                                        className="bg-orange-700 hover:bg-orange-600 text-white flex-1">
                                        <PowerOff className="w-4 h-4 mr-1" /> Suspend
                                    </Button>
                                )}
                                {selectedUser.status !== "deactivated" && (
                                    <Button size="sm" onClick={() => handleStatusUpdate(selectedUser.id, "deactivated")}
                                        disabled={loadingId === selectedUser.id}
                                        className="bg-red-800 hover:bg-red-700 text-white flex-1">
                                        <Ban className="w-4 h-4 mr-1" /> Deactivate
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => handleDelete(selectedUser.id)}
                                    disabled={loadingId === selectedUser.id}
                                    className="border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
