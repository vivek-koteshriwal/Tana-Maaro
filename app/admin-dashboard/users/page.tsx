import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { Users } from "lucide-react";

export default async function UserManagementPage() {
    const [users, deletionRecords] = await Promise.all([
        db.getAllUsers(),
        db.getAccountDeletionRecords(),
    ]);
    const deletionRecordMap = new Map(
        deletionRecords.map((record: any) => [record.userId || record.id, record]),
    );

    // Map the users onto table-ready formats
    const mappedUsers = users.map((u: any) => ({
        id: u.id,
        username: u.username || u.name,
        email: u.email,
        phone: u.phone || "N/A",
        city: u.city || "N/A",
        createdAt: u.createdAt || new Date().toISOString(),
        status: u.status || "active",
        deletionRequestedAt: u.deletionRequestedAt || deletionRecordMap.get(u.id)?.requestedAt || null,
        scheduledDeletionAt: u.scheduledDeletionAt || deletionRecordMap.get(u.id)?.scheduledDeletionAt || null,
        deletionReason: u.deletionReason || deletionRecordMap.get(u.id)?.reason || null,
        deletionFeedback: u.deletionFeedback || deletionRecordMap.get(u.id)?.feedback || null,
        reactivatedAt: u.reactivatedAt || deletionRecordMap.get(u.id)?.reactivatedAt || null,
        deletionRecordStatus: deletionRecordMap.get(u.id)?.status || null,
    }));

    const stats = {
        active: mappedUsers.filter((user) => user.status === "active").length,
        deactivated: mappedUsers.filter((user) => user.status === "deactivated").length,
        pendingDeletion: mappedUsers.filter((user) => user.status === "pending_deletion").length,
        permanentlyDeleted: deletionRecords.filter((record: any) => record.status === "permanently_deleted").length,
        reactivated: deletionRecords.filter((record: any) => record.status === "reactivated").length,
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-red-900/30 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Users className="text-red-600" />
                        User Index
                    </h1>
                    <p className="text-gray-400 mt-1">Review, monitor, and enforce access control across platform accounts.</p>
                </div>
                <div className="bg-red-900/20 border border-red-900/50 px-4 py-2 rounded-lg text-sm text-red-500 font-bold uppercase tracking-widest">
                    Total: {mappedUsers.length} Users
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
                <div className="rounded-xl border border-green-900/40 bg-green-950/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-green-400">Active</p>
                    <p className="mt-2 text-3xl font-black text-white">{stats.active}</p>
                </div>
                <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Deactivated</p>
                    <p className="mt-2 text-3xl font-black text-white">{stats.deactivated}</p>
                </div>
                <div className="rounded-xl border border-orange-900/40 bg-orange-950/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Pending Deletion</p>
                    <p className="mt-2 text-3xl font-black text-white">{stats.pendingDeletion}</p>
                </div>
                <div className="rounded-xl border border-neutral-700/40 bg-neutral-900/60 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-300">Reactivated</p>
                    <p className="mt-2 text-3xl font-black text-white">{stats.reactivated}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Permanently Deleted</p>
                    <p className="mt-2 text-3xl font-black text-white">{stats.permanentlyDeleted}</p>
                </div>
            </div>

            {/* The interactive client component for handling sorting/deletion actions */}
            <UserManagementTable initialUsers={mappedUsers} />
        </div>
    );
}
