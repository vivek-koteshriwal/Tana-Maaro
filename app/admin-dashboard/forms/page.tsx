import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { FileText } from "lucide-react";
import { FormsTable } from "@/components/admin/forms-table";

export default async function AdminFormsPage() {
    const rawRegistrations = await db.getRegistrations() as any[];
    const rawPosts = await db.getPosts() as any[]; // Fetches posts (default 20 limit or similar, we can let it map)
    const pendingPosts = await db.getPendingPosts() as any[];

    const registrations = Array.isArray(rawRegistrations) ? rawRegistrations : [];
    const posts = Array.isArray(rawPosts) ? rawPosts : [];
    const pending = Array.isArray(pendingPosts) ? pendingPosts : [];

    // Map Event Registrations
    const mappedRegs = registrations.map((r: any) => ({
        id: r.id,
        formType: "Event Registration",
        submitter: r.userName || "Unknown",
        contactVector: r.email || "No Email",
        payloadData: `Target: ${r.eventName || r.city} | Role: ${r.role}`,
        timestamp: r.createdAt
    }));

    // Map Content Tracking (we combine approved and pending to see the live feed of form hooks)
    const allContent = [...posts, ...pending].reduce((acc: any[], current: any) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    const mappedPosts = allContent.map((p: any) => ({
        id: p.id,
        formType: "Content Submission",
        submitter: p.userName || "Unknown",
        contactVector: `User ID: ${p.userId}`,
        payloadData: p.content || (p.image ? "[Attached Media Payload]" : "Blank Submission"),
        timestamp: p.createdAt
    }));

    const unifiedQueue = [...mappedRegs, ...mappedPosts].sort((a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-red-900/30 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <FileText className="text-blue-500" />
                        Firehose Log
                    </h1>
                    <p className="text-gray-400 mt-1">Universal Tracking Queue for all incoming POST/Form payloads across the application.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-red-900/20 border border-red-900/50 px-4 py-2 rounded-lg text-sm text-red-500 font-bold uppercase tracking-widest">
                        Total Hooks: {unifiedQueue.length}
                    </div>
                </div>
            </div>

            <FormsTable initialQueue={unifiedQueue} />
        </div>
    );
}
