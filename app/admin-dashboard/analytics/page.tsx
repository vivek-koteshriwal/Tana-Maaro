"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, FileText, Heart, Share2, Activity, MapPin, Ticket, ShieldAlert, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

export default function AnalyticsDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch("/api/admin/analytics");
                if (!res.ok) throw new Error("Failed to extract Analytics Telemetry.");
                const payload = await res.json();
                setData(payload);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-gray-500 animate-pulse">
                <Activity className="w-12 h-12 mb-4 text-red-500" />
                <p className="text-xl uppercase tracking-widest font-bold">Querying Data Streams...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center text-red-500 border border-red-900/30 bg-red-950/20 rounded-xl">
                <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-bold uppercase">Telemetry Failure</h2>
                <p>{error || "No data object returned."}</p>
            </div>
        );
    }

    const { userAnalytics, contentAnalytics, engagementAnalytics, regionAnalytics, eventAnalytics } = data;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Activity className="text-red-600" />
                    Platform Analytics
                </h1>
                <p className="text-gray-400 mt-1">Live structural telemetry and user engagement aggregates.</p>
            </div>

            {/* QUADRANT 1: HYPER KPI COUNTERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-neutral-950 border-red-900/30 shadow-xl overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-600/10 blur-2xl rounded-full"></div>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Users</CardTitle>
                        <Users className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{userAnalytics.totalRegistered}</div>
                        <div className="flex gap-2 text-xs font-bold mt-2">
                            <span className="text-green-500">+{userAnalytics.newUsersToday} Today</span>
                            <span className="text-gray-600">|</span>
                            <span className="text-blue-500">+{userAnalytics.newUsersThisWeek} This Week</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-950 border-white/5 shadow-xl">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Live Traffic</CardTitle>
                        <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-green-400">{userAnalytics.activeUsers}</div>
                        <p className="text-xs text-gray-500 font-medium uppercase mt-2">Active in last 5 mins</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-950 border-white/5 shadow-xl">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Content Flow</CardTitle>
                        <FileText className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{contentAnalytics.totalPosts}</div>
                        <p className="text-xs text-blue-400 font-medium uppercase mt-2">{contentAnalytics.totalSubmissions} Form Webhooks Fired</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-950 border-white/5 shadow-xl">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Engagement Rate</CardTitle>
                        <Heart className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{engagementAnalytics.engagementRate} Interactions</div>
                        <div className="flex gap-2 text-xs font-bold mt-2">
                            <span className="text-red-500">{contentAnalytics.totalLikes} Likes</span>
                            <span className="text-gray-600">|</span>
                            <span className="text-orange-500">{contentAnalytics.totalComments} Comments</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* QUADRANT 2 & 3: GRAPHS & EVENT TELEMETRY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* REGION PIE CHART */}
                <Card className="bg-neutral-950 border border-white/5 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                            <MapPin className="text-red-500" />
                            Global IP Geolocation
                        </CardTitle>
                        <CardDescription>Network distribution of all connected traffic vectors.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={regionAnalytics}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {regionAnalytics.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* EVENT BAR CHART */}
                <Card className="bg-neutral-950 border border-white/5 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                            <Ticket className="text-blue-500" />
                            Event Attendee Volume
                        </CardTitle>
                        <CardDescription>Live ticket registrations mapped internally by Node.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventAnalytics.byCity.slice(0, 7)}>
                                <XAxis dataKey="city" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                                />
                                <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>

            {/* QUADRANT 4: HIGH-VALUE TARGETS (Leaderboard) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-neutral-950 border-white/5 shadow-xl h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                            <Award className="text-yellow-500" />
                            Top Influencers (By Engagement)
                        </CardTitle>
                        <CardDescription>Accounts generating the massive traffic nodes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {engagementAnalytics.mostActiveUsers.map((user: any, index: number) => (
                                <div key={user.username} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="font-black text-2xl text-gray-500 w-6">#{index + 1}</div>
                                        <div>
                                            <p className="font-bold text-white">@{user.username}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-yellow-500 text-lg">{user.interactions}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Points</p>
                                    </div>
                                </div>
                            ))}
                            {engagementAnalytics.mostActiveUsers.length === 0 && (
                                <p className="text-gray-500 italic">Not enough active data models.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-950 border-white/5 shadow-xl h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                            <Activity className="text-green-500" />
                            System Summary
                        </CardTitle>
                        <CardDescription>Calculated structural outputs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                <span className="text-gray-400">Total Shares Tracked</span>
                                <span className="font-bold text-white text-xl">{contentAnalytics.totalShares}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                <span className="text-gray-400">Total Approved Content Hubs</span>
                                <span className="font-bold text-white text-xl">{contentAnalytics.totalPosts}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                <span className="text-gray-400">Total Event Participants</span>
                                <span className="font-bold text-white text-xl">{eventAnalytics.attendeeCount + eventAnalytics.performerCount}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-gray-400">Performance Index</span>
                                <span className="font-bold text-green-500 uppercase tracking-widest text-sm">Nominal [Healthy]</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
