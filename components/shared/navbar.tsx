"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { RoastAvatar } from "@/components/shared/roast-avatar";
import { useState, useEffect, useRef } from "react";
import {
    Zap, Swords, Calendar, User, Settings, LogOut,
    Menu, X, Bell, Search, Home,
} from "lucide-react";

const NAV_LINKS = [
    { label: "HOME",       href: "/",        icon: <Home     className="w-4 h-4" /> },
    { label: "ROAST WALL", href: "/feed",    icon: <Zap      className="w-4 h-4" /> },
    { label: "BATTLES",    href: "/battles", icon: <Swords   className="w-4 h-4" /> },
    { label: "EVENTS",     href: "/events",  icon: <Calendar className="w-4 h-4" /> },
];

interface NotificationItem {
    id: string;
    actorAvatar?: string;
    actorId?: string;
    actorName?: string;
    message: string;
    createdAt: string;
    read?: boolean;
}

export function Navbar() {
    const { user, logout } = useAuth();
    const pathname         = usePathname();
    const [menuOpen,  setMenuOpen]  = useState(false);
    const [showBell,  setShowBell]  = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const bellRef = useRef<HTMLDivElement>(null);

    const unread = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!user) return;
        fetch("/api/notifications")
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setNotifications(d); })
            .catch(() => {});
    }, [user]);

    const markRead = async () => {
        if (unread === 0) return;
        try {
            await fetch("/api/notifications/read", { method: "POST" });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* ignore */ }
    };

    // Close bell on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setShowBell(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const isActive = (href: string) => {
        if (href === "/")     return pathname === "/";
        if (href === "/feed") return pathname === "/feed";
        return pathname?.startsWith(href) ?? false;
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/88 backdrop-blur-md">
                <div className="mx-auto px-4 max-w-[1200px] h-16 flex items-center justify-between gap-6">

                    {/* ── Logo ── */}
                    <Link href="/feed" className="flex-shrink-0 flex items-center group">
                        <div className="relative w-44 h-10 transition-transform group-hover:scale-[1.03]">
                            <Image src="/logo.png" alt="TanaMaaro" fill className="object-contain object-left" priority />
                        </div>
                    </Link>

                    {/* ── Desktop nav ── */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-epilogue font-black text-[12px] uppercase tracking-[0.5px] transition-colors ${
                                    isActive(item.href)
                                        ? "text-white bg-white/8"
                                        : "text-[#ABABAB] hover:text-white hover:bg-white/5"
                                }`}
                            >
                                {item.icon}
                                {item.label}
                                {isActive(item.href) && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF3B3B]" />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* ── Desktop right actions ── */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link href="/search" className="w-9 h-9 flex items-center justify-center text-[#ABABAB] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                            <Search className="w-4.5 h-4.5" />
                        </Link>

                        {user ? (
                            <>
                                {/* Bell */}
                                <div ref={bellRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => { setShowBell(p => !p); if (!showBell && unread > 0) markRead(); }}
                                        className="relative w-9 h-9 flex items-center justify-center text-[#ABABAB] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                    >
                                        <Bell className="w-[18px] h-[18px]" />
                                        {unread > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF3B3B] live-dot border border-black" />
                                        )}
                                    </button>
                                    {showBell && (
                                        <div className="absolute right-0 mt-2 w-80 arena-surface border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50">
                                            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                                                <span className="font-epilogue font-bold text-[13px] text-white">Notifications</span>
                                                {unread > 0 && <span className="text-[10px] font-manrope font-bold text-[#FF8E84] uppercase tracking-wide">{unread} new</span>}
                                            </div>
                                            <div className="max-h-72 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <p className="text-center text-[#ABABAB] text-[13px] font-manrope py-8">No notifications yet.</p>
                                                ) : notifications.map(n => (
                                                    <div key={n.id} className={`px-4 py-3 border-b border-white/[0.05] flex gap-3 transition-colors ${!n.read ? "bg-[#FF3B3B]/8" : "hover:bg-white/5"}`}>
                                                        <RoastAvatar
                                                            value={n.actorAvatar}
                                                            fallbackSeed={n.actorId || n.actorName}
                                                            alt={n.actorName || "Notification avatar"}
                                                            size={32}
                                                            className="shrink-0 border border-white/10"
                                                        />
                                                        <div>
                                                            <p className="text-[13px] font-manrope font-semibold text-white/80 leading-snug">
                                                                <span className="font-bold text-[#FF3B3B]">{n.actorName}</span> {n.message}
                                                            </p>
                                                            <p className="text-[11px] text-[#ABABAB] mt-0.5">
                                                                {new Date(n.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Avatar → Profile */}
                                <Link
                                    href={`/profile/${encodeURIComponent(user.username || "")}`}
                                    className="w-8 h-8 rounded-full arena-surface-hi border border-white/10 hover:border-[#FF3B3B]/60 transition-colors overflow-hidden flex items-center justify-center ml-1"
                                >
                                    <RoastAvatar
                                        value={user.profileImage}
                                        fallbackSeed={user.id || user.username || user.name}
                                        alt={user.name}
                                        size={32}
                                    />
                                </Link>

                                {/* Settings */}
                                <Link href="/settings" className="w-9 h-9 flex items-center justify-center text-[#ABABAB] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                    <Settings className="w-4 h-4" />
                                </Link>

                                {/* Logout */}
                                <button
                                    type="button"
                                    onClick={logout}
                                    aria-label="Logout"
                                    className="w-9 h-9 flex items-center justify-center text-[#ABABAB] hover:text-[#FF3B3B] transition-colors rounded-lg hover:bg-white/5"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="btn-arena-filled flex items-center gap-2 px-4 py-2 rounded-lg font-manrope font-bold text-[12px] uppercase tracking-wide text-white"
                            >
                                <User className="w-3.5 h-3.5" />
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* ── Mobile hamburger ── */}
                    <button
                        type="button"
                        className="md:hidden w-9 h-9 flex items-center justify-center text-[#ABABAB] hover:text-white transition-colors"
                        onClick={() => setMenuOpen(p => !p)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* ── Mobile menu ── */}
                {menuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-5 flex flex-col gap-1 animate-in slide-in-from-top-2">
                        {NAV_LINKS.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3.5 rounded-xl font-epilogue font-black text-[14px] uppercase tracking-wide transition-colors ${
                                    isActive(item.href)
                                        ? "text-white bg-white/8"
                                        : "text-[#ABABAB] hover:text-white hover:bg-white/5"
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}

                        <div className="h-px bg-white/[0.08] my-2" />

                        {user ? (
                            <>
                                <Link
                                    href={`/profile/${encodeURIComponent(user.username || "")}`}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-white hover:bg-white/5 transition-colors"
                                >
                                    <RoastAvatar
                                        value={user.profileImage}
                                        fallbackSeed={user.id || user.username || user.name}
                                        alt={user.name}
                                        size={32}
                                        className="border border-white/10"
                                    />
                                    <span className="font-manrope font-bold text-[14px]">{user.name}</span>
                                </Link>
                                <Link href="/settings" onClick={() => setMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#ABABAB] hover:text-white hover:bg-white/5 transition-colors">
                                    <Settings className="w-4 h-4" />
                                    <span className="font-manrope font-semibold text-[14px]">Settings</span>
                                </Link>
                                <button type="button" onClick={() => { logout(); setMenuOpen(false); }}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#ABABAB] hover:text-[#FF3B3B] hover:bg-white/5 transition-colors w-full text-left">
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-manrope font-semibold text-[14px]">Logout</span>
                                </button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setMenuOpen(false)}
                                className="btn-arena-filled flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-manrope font-bold text-[14px] uppercase tracking-wide text-white mt-1">
                                <User className="w-4 h-4" />
                                Sign In
                            </Link>
                        )}
                    </div>
                )}
            </nav>
            {/* spacer so content isn't hidden under fixed nav */}
            <div className="h-16" />
        </>
    );
}
