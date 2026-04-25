import { NextResponse } from "next/server";
import { subDays, subWeeks, subMonths, isAfter } from "date-fns";
import { db } from "@/lib/db";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET() {
    try {
        const admin = await verifyAdminAuth();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const [users, posts, registrations] = await Promise.all([
            db.getAllUsers() as Promise<any[]>,
            db.getPosts(1, 1000) as Promise<any[]>,
            db.getRegistrations() as Promise<any[]>,
        ]);

        // Comments: best-effort via posts' comment counts
        const totalComments = posts.reduce((sum: number, p: any) => sum + (p.comments || 0), 0);

        const now = new Date();
        const oneDayAgo = subDays(now, 1);
        const oneWeekAgo = subWeeks(now, 1);
        const oneMonthAgo = subMonths(now, 1);
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // --- USER ANALYTICS ---
        const totalRegistered = users.length;
        const activeUsers = users.filter((u: any) => u.lastActiveAt && new Date(u.lastActiveAt) > fiveMinsAgo).length;
        const newUsersToday = users.filter((u: any) => u.createdAt && isAfter(new Date(u.createdAt), oneDayAgo)).length;
        const newUsersThisWeek = users.filter((u: any) => u.createdAt && isAfter(new Date(u.createdAt), oneWeekAgo)).length;
        const newUsersThisMonth = users.filter((u: any) => u.createdAt && isAfter(new Date(u.createdAt), oneMonthAgo)).length;

        // --- CONTENT ANALYTICS ---
        const totalPosts = posts.length;
        const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.likedBy?.length || p.likes || 0), 0);
        const totalShares = posts.reduce((sum: number, p: any) => sum + (p.shares || 0), 0);

        // --- ENGAGEMENT ANALYTICS ---
        const engagementRate = totalRegistered > 0
            ? ((totalLikes + totalComments + totalShares) / totalRegistered).toFixed(2)
            : "0.00";

        // Most Active Users (by post volume + comment count)
        const userActivityMap: Record<string, { username: string; interactions: number }> = {};
        users.forEach((u: any) => {
            if (u.username) userActivityMap[u.username] = { username: u.username, interactions: 0 };
        });
        posts.forEach((p: any) => {
            const key = p.userName || p.userHandle;
            if (key && userActivityMap[key]) userActivityMap[key].interactions += 3;
        });

        const mostActiveUsers = Object.values(userActivityMap)
            .sort((a, b) => b.interactions - a.interactions)
            .slice(0, 5)
            .filter(u => u.interactions > 0);

        const mostLikedPosts = [...posts]
            .sort((a: any, b: any) => (b.likedBy?.length || b.likes || 0) - (a.likedBy?.length || a.likes || 0))
            .slice(0, 3);

        const mostCommentedPosts = [...posts]
            .sort((a: any, b: any) => (b.comments || 0) - (a.comments || 0))
            .slice(0, 3);

        // --- REGION ANALYTICS ---
        const regionBuckets: Record<string, number> = {
            "Delhi NCR": 0,
            "Haryana": 0,
            "Uttar Pradesh": 0,
            "Hyderabad": 0,
            "Other Indian States": 0,
            "International": 0,
        };

        const checkRegion = (cityStr: string) => {
            if (!cityStr) return "Other Indian States";
            const c = cityStr.toLowerCase();
            if (c.includes("delhi") || c.includes("noida") || c.includes("gurgaon") || c.includes("faridabad") || c.includes("ghaziabad")) return "Delhi NCR";
            if (c.includes("haryana") || c.includes("rohtak") || c.includes("panipat") || c.includes("karnal") || c.includes("hisar") || c.includes("ambala") || c.includes("sirsa") || c.includes("sonipat")) return "Haryana";
            if (c.includes("up") || c.includes("uttar") || c.includes("lucknow") || c.includes("kanpur") || c.includes("agra") || c.includes("varanasi") || c.includes("meerut")) return "Uttar Pradesh";
            if (c.includes("hyd") || c.includes("hyderabad")) return "Hyderabad";
            if (c.includes("us") || c.includes("uk") || c.includes("dubai") || c.includes("london") || c.includes("new york") || c.includes("international")) return "International";
            return "Other Indian States";
        };

        users.forEach((u: any) => {
            const region = checkRegion(u.city || "");
            regionBuckets[region] = (regionBuckets[region] || 0) + 1;
        });

        const regionAnalytics = Object.entries(regionBuckets).map(([name, value]) => ({ name, value }));

        // --- EVENT ANALYTICS ---
        let attendeeCount = 0;
        let performerCount = 0;
        const cityMap: Record<string, number> = {};

        registrations.forEach((r: any) => {
            if (r.role === "performer") performerCount++;
            else attendeeCount++;
            const city = r.city || r.eventName || "Unknown Event";
            cityMap[city] = (cityMap[city] || 0) + 1;
        });

        const byCity = Object.entries(cityMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 7)
            .map(([city, count]) => ({ city, registrations: count }));

        return NextResponse.json({
            userAnalytics: { totalRegistered, activeUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth },
            contentAnalytics: { totalPosts, totalSubmissions: totalPosts, totalComments, totalLikes, totalShares },
            engagementAnalytics: { engagementRate, mostActiveUsers, mostLikedPosts, mostCommentedPosts },
            regionAnalytics,
            eventAnalytics: { totalRegistrations: registrations.length, attendeeCount, performerCount, byCity },
        }, { status: 200 });
    } catch (error: any) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to generate analytics.", trace: error.message }, { status: 500 });
    }
}
