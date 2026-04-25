"use client";

import { Button } from "@/components/ui/button";
import { Mic, Users, Trophy, Video } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function LiveEventsSection() {
    const { user } = useAuth();
    const router   = useRouter();

    const goToEvents = () => user ? router.push("/events") : router.push("/login?next=/events");
    const offerings = [
        { icon: Mic, title: "Live Roast Sets", desc: "Take the mic. Roast the crowd. Own the night." },
        { icon: Users, title: "Roast Battles", desc: "Head-to-head combat. Last ego standing wins." },
        { icon: Video, title: "Content Recording", desc: "Professional recording of your savage moments." },
        { icon: Trophy, title: "Get Featured", desc: "Top performers go viral on our socials." },
    ];

    return (
        <section id="events" className="py-24 bg-black relative border-t border-white/10">
            <div className="container mx-auto px-4">
                <ScrollReveal>
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                            From Screen to <span className="text-red-600">Stage</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Tana Maro is taking roasting offline. Get a real stage, a real crowd, and real chaos.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {offerings.map((item, idx) => (
                        <ScrollReveal key={idx} delay={idx * 0.1}>
                            <div className="bg-neutral-900/40 border border-red-900/20 p-8 rounded-xl hover:border-red-600 transition-colors group text-center h-full">
                                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900 group-hover:bg-red-600 group-hover:text-black transition-all">
                                    <item.icon className="w-8 h-8 text-red-600 group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase mb-3">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                <ScrollReveal delay={0.4}>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button type="button" onClick={goToEvents}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-8 py-4 uppercase tracking-wider shadow-lg shadow-red-900/20 transition-colors">
                            Participate in Event
                        </button>
                        <button type="button" onClick={goToEvents}
                            className="w-full sm:w-auto border border-red-600 text-red-500 hover:bg-red-600 hover:text-white text-lg px-8 py-4 uppercase tracking-wider bg-transparent transition-colors">
                            View City Registrations
                        </button>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
