import { db } from "@/lib/db";
import { Handshake } from "lucide-react";
import { PartnershipTable } from "@/components/admin/partnership-table";

export const dynamic = "force-dynamic";

export default async function PartnershipsPage() {
    const requests = await db.getPartnershipRequests();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-red-900/30 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Handshake className="text-red-600 w-8 h-8" />
                        Partnerships
                    </h1>
                    <p className="text-gray-400 mt-1">Review and manage inbound brand collaborations and industry partnerships.</p>
                </div>
                <div className="bg-red-900/20 border border-red-900/50 px-4 py-2 rounded-lg text-sm text-red-500 font-bold uppercase tracking-widest">
                    {requests.length} Requests
                </div>
            </div>

            <PartnershipTable initialRequests={requests} />
        </div>
    );
}
