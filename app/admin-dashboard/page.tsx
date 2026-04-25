import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { Users, LayoutDashboard, MessageSquareText, ThumbsUp, MapPin, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardOverview() {
    // 1. Fetch live data from Firestore
    const users = await db.getAllUsers() as any[];
    const activeUsers = await db.getActiveUsersCounts() as any;
    const posts = await db.getPosts(1, 1000) as any[];
    const registrationsData = await db.getRegistrations() as any[];

    // 2. Calculate Aggregates
    let totalPosts = posts.length;
    let totalLikes = 0;
    let totalComments = 0;
    
    posts.forEach((p: any) => {
        totalLikes += (p.likes || 0);
        totalComments += (p.comments || 0);
    });

    const registrationsCount = registrationsData.length;

    // 3. Geographic Mapping Parse (Extracts 'city' from db.getAllUsers)
    const geoMap: Record<string, number> = {
        "Delhi NCR": 0,
        "Haryana": 0,
        "Uttar Pradesh": 0,
        "Hyderabad": 0,
        "Other Indian States": 0,
        "International": 0
    };

    const indianStates = ["mumbai", "bangalore", "bengaluru", "chennai", "pune", "kolkata", "ahmedabad", "jaipur", "surat", "lucknow", "kanpur", "nagpur", "indore", "thane", "bhopal", "visakhapatnam", "pimpri", "patna", "vadodara", "ghaziabad", "ludhiana", "agra", "nashik", "ranchi", "faridabad", "meerut", "rajkot", "kalyan", "vasai", "varanasi", "srinagar", "aurangabad", "dhanbad", "amritsar", "navi mumbai", "allahabad", "howrah", "gwalior", "jabalpur", "coimbatore", "vijayawada", "jodhpur", "madurai", "raipur", "kota", "guwahati", "chandigarh", "solapur", "hubli", "dharwad", "bareilly", "moradabad", "mysore", "gurgaon", "aligarh", "jalandhar", "tiruchirappalli", "bhubaneswar", "salem", "mira", "bhayandar", "warangal", "thiruvananthapuram", "bhiwandi", "saharanpur", "guntur", "amravati", "bikaner", "noida", "jamshedpur", "bhilai", "nagar", "cuttack", "kochi", "udaipur", "bhavnagar", "dehradun", "asansol", "nanded", "waghala", "ajmer", "jamnagar", "ujjain", "sangli", "loni", "jhansi", "pondicherry", "nellore", "jammu", "belagavi", "raurkela", "mangaluru", "tirunelveli", "malegaon", "gaya", "tiruppur", "davanagere", "kozhikode", "akola", "kurnool", "rajpur", "sonarpur", "bokaro", "south dumdum", "bellary", "patiala", "gopalpur", "agartala", "bhagalpur", "muzaffarnagar", "bhatpara", "panihati", "latur", "dhule", "rohtak", "korba", "bhilwara", "berhampur", "muzaffarpur", "ahmednagar", "mathura", "kollam", "avadi", "kadapa", "rajamundry", "bilaspur", "kamarhati", "shahjahanpur", "bijapur", "rampur", "shivamogga", "chandrapur", "junagadh", "thrissur", "alwar", "bardhaman", "kulti", "kakinada", "nizamabad", "parbhani", "tumkur", "khammam", "uzhavarkarai", "bihar sharif", "panipat", "darbhanga", "bally", "aizawl", "dewas", "ichalkaranji", "karnal", "bathinda", "jalna"];

    users.forEach((user: any) => {
        if (!user.city) return;
        const c = user.city.trim().toLowerCase();

        if (c.includes("delhi") || c.includes("new delhi") || c.includes("noida") || c.includes("gurgaon") || c.includes("gurugram") || c.includes("faridabad") || c.includes("ghaziabad")) {
            geoMap["Delhi NCR"]++;
        } else if (c.includes("haryana") || c.includes("rohtak") || c.includes("panipat") || c.includes("karnal") || c.includes("hisar")) {
            geoMap["Haryana"]++;
        } else if (c.includes("uttar pradesh") || c.includes("up") || c.includes("lucknow") || c.includes("kanpur") || c.includes("agra") || c.includes("meerut") || c.includes("varanasi") || c.includes("allahabad")) {
            geoMap["Uttar Pradesh"]++;
        } else if (c.includes("hyderabad") || c.includes("secunderabad") || c.includes("telangana")) {
            geoMap["Hyderabad"]++;
        } else if (indianStates.some(state => c.includes(state)) || c.includes("india")) {
            geoMap["Other Indian States"]++;
        } else {
            geoMap["International"]++;
        }
    });

    const topRegions = Object.entries(geoMap)
        .filter(([_, count]) => count > 0)
        .sort((a: any, b: any) => b[1] - a[1]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Platform Overview</h1>
                <p className="text-gray-400">High-level telemetry mapping currently active global states.</p>
            </div>

            {/* Top Level Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-neutral-900 border-red-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Active Users</CardTitle>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{activeUsers}</div>
                        <p className="text-xs text-green-500 mt-1">Live Right Now</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-red-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Users</CardTitle>
                        <Users className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{users.length}</div>
                        <p className="text-xs text-red-500 mt-1">Accounts Indexed</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-red-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Content Submissions</CardTitle>
                        <LayoutDashboard className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{totalPosts}</div>
                        <p className="text-xs text-blue-500 mt-1">Live Posts</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-red-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Engagement</CardTitle>
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <div className="text-3xl font-black text-white">{totalLikes}</div>
                            <span className="text-sm text-gray-400 mb-1">Likes</span>
                        </div>
                        <div className="flex items-end gap-2 mt-1">
                            <div className="text-xl font-bold text-gray-300">{totalComments}</div>
                            <span className="text-xs text-gray-500 mb-0.5">Comments</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-red-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Event Track</CardTitle>
                        <Ticket className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{registrationsCount}</div>
                        <p className="text-xs text-orange-500 mt-1">Total Bookings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Region Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-neutral-900 border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-white font-bold">
                            <MapPin className="text-red-500 w-5 h-5" />
                            Regional Traffic Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topRegions.length > 0 ? topRegions.map(([city, count]: any) => (
                                <div key={city} className="flex items-center justify-between">
                                    <span className="text-gray-300">{city}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-600"
                                                style={{ width: `${(count / users.length) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-white font-mono w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-gray-500 text-sm text-center py-4">No regional data mapped.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
