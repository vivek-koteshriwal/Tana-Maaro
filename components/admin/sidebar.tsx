"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Ticket, Video, LogOut, ShieldAlert, FileText, BarChart3, Settings, ExternalLink, Handshake, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar({ adminName, adminEmail }: { adminName?: string; adminEmail?: string }) {
    const pathname = usePathname();

    const navItems = [
        { href: "/admin-dashboard", icon: Home, label: "Overview" },
        { href: "/admin-dashboard/users", icon: Users, label: "User Management" },
        { href: "/admin-dashboard/content", icon: Video, label: "Content Moderation" },
        { href: "/admin-dashboard/events", icon: Ticket, label: "Events" },
        { href: "/admin-dashboard/battles", icon: Swords, label: "Battles" },
        { href: "/admin-dashboard/partnerships", icon: Handshake, label: "Partnerships" },
        { href: "/admin-dashboard/forms", icon: FileText, label: "Form Submissions" },
        { href: "/admin-dashboard/analytics", icon: BarChart3, label: "Analytics" },
        { href: "/admin-dashboard/settings", icon: Settings, label: "Settings" },
    ];

    const handleLogout = async () => {
        await fetch("/api/admin/auth/logout", { method: "POST" });
        window.location.href = "/admin-login";
    };

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-neutral-950 border-r border-red-900/30 flex flex-col z-50">
            {/* Header / Logo */}
            <div className="h-20 flex items-center px-6 border-b border-white/5 bg-black/40">
                <Link href="/admin-dashboard" className="flex items-center gap-3">
                    <ShieldAlert className="text-red-600 w-8 h-8" />
                    <span className="text-2xl font-black text-white uppercase tracking-tighter">
                        Admin <span className="text-red-600">Core</span>
                    </span>
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <span
                                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${isActive
                                    ? "bg-red-600/10 text-red-500 border border-red-600/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? "text-red-500" : ""}`} />
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Admin identity */}
            {(adminName || adminEmail) && (
                <div className="px-4 py-3 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-600/30 flex items-center justify-center text-red-400 font-black text-sm shrink-0">
                        {(adminName || adminEmail || "A")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-xs font-bold truncate">{adminName || "Admin"}</p>
                        <p className="text-gray-500 text-[10px] truncate">{adminEmail}</p>
                    </div>
                </div>
            )}

            {/* Footer / Actions */}
            <div className="p-4 border-t border-white/5 flex flex-col gap-2">
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-start gap-4 px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded-lg transition-colors"
                >
                    <ExternalLink className="w-5 h-5" />
                    <span className="font-medium">Go to Live Website</span>
                </a>

                <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start gap-4 px-4 py-6 text-gray-400 hover:text-white hover:bg-neutral-900 transition-colors"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </Button>
            </div>
        </aside>
    );
}
