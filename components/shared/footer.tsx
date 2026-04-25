import Link from "next/link";
import Image from "next/image";
import { Instagram, Twitter, Flame } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-white/[0.06] arena-bg py-12 md:py-16">
            <div className="mx-auto max-w-[1200px] px-4 grid gap-8 lg:grid-cols-3">
                {/* Brand */}
                <div className="flex flex-col gap-4">
                    <Link href="/feed" className="flex items-center">
                        <div className="relative w-44 h-10">
                            <Image src="/logo.png" alt="TanaMaaro" fill className="object-contain object-left" />
                        </div>
                    </Link>
                    <p className="max-w-xs font-manrope text-[13px] text-[#ABABAB] leading-relaxed">
                        India&apos;s raw roasting platform. Not for the snowflake generation. Roast without fear.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                        <Link href="#" aria-label="Instagram" className="w-9 h-9 rounded-lg arena-surface flex items-center justify-center text-[#ABABAB] hover:text-[#FF3B3B] transition-colors">
                            <Instagram className="w-4 h-4" />
                        </Link>
                        <Link href="#" aria-label="Twitter" className="w-9 h-9 rounded-lg arena-surface flex items-center justify-center text-[#ABABAB] hover:text-[#FF3B3B] transition-colors">
                            <Twitter className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Links */}
                <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:gap-12">
                    <div className="grid gap-3 content-start">
                        <h3 className="font-epilogue font-black text-[11px] uppercase tracking-[1.5px] text-[#FF3B3B] mb-1">Platform</h3>
                        {[
                            { label: "Roast Wall",      href: "/feed" },
                            { label: "Battle Arena",    href: "/battles" },
                            { label: "Events",          href: "/events" },
                            { label: "Submit Content",  href: "/post" },
                        ].map(l => (
                            <Link key={l.href} href={l.href}
                                className="font-manrope font-semibold text-[13px] text-[#ABABAB] hover:text-white transition-colors">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                    <div className="grid gap-3 content-start">
                        <h3 className="font-epilogue font-black text-[11px] uppercase tracking-[1.5px] text-[#FF3B3B] mb-1">Legal</h3>
                        <Link href="/privacy" className="font-manrope font-semibold text-[13px] text-[#ABABAB] hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="font-manrope font-semibold text-[13px] text-[#ABABAB] hover:text-white transition-colors">Terms of Chaos</Link>
                        <Link href="/about" className="font-manrope font-semibold text-[13px] text-[#ABABAB] hover:text-white transition-colors">About</Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1200px] mt-10 border-t border-white/[0.06] px-4 pt-7 flex flex-col md:flex-row items-center justify-between gap-3">
                <p className="font-manrope text-[12px] text-[#ABABAB]">
                    © {new Date().getFullYear()} Tanamaaro. Made for the brave.
                </p>
                <div className="flex items-center gap-1.5 text-[#ABABAB]">
                    <Flame className="w-3.5 h-3.5 text-[#FF3B3B]" />
                    <span className="font-manrope text-[11px]">Roast Without Fear</span>
                </div>
            </div>
        </footer>
    );
}
