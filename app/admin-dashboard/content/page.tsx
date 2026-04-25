import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { ShieldCheck } from "lucide-react";
import { ContentModerationTable } from "@/components/admin/content-moderation-table";

export default async function ContentApprovalsPage() {
    // Phase 24 Implementation: 
    // We mock fetching "pending" content, but currently JsonDB just gives us all posts. 
    // We will append a "status" property mapping locally. In production, this uses `PostModel.find({ status: 'pending' })`

    // We use the shared db export which safely checks IS_DEV and wraps the MongoDB connection pool
    const rawPosts: any[] = await db.getPendingPosts();

    // Map the Posts payload adding a rigorous moderation interface signature
    const unmoderatedContent = rawPosts.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName || "Unknown",
        content: p.content,
        image: p.image || null,
        type: p.type || "text",
        status: p.status || "pending", // Default unmapped legacy posts to pending
        createdAt: p.createdAt || new Date().toISOString()
    })).filter((p: any) => p.status === 'pending'); // Strictly isolate

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-red-900/30 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-blue-500" />
                        Content Quarantine
                    </h1>
                    <p className="text-gray-400 mt-1">Review community submissions before they hit global feeds.</p>
                </div>
                <div className="bg-blue-900/20 border border-blue-900/50 px-4 py-2 rounded-lg text-sm text-blue-500 font-bold uppercase tracking-widest">
                    Pending Queue: {unmoderatedContent.length}
                </div>
            </div>

            <ContentModerationTable initialQueue={unmoderatedContent} />
        </div>
    );
}
