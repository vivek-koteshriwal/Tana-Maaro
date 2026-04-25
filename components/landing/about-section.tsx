"use client";

import { Flame } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function AboutSection() {
    return (
        <section id="about" className="py-24 bg-neutral-950 relative overflow-hidden">
            <div className="container mx-auto px-4 text-center max-w-4xl">
                <ScrollReveal>
                    <Flame className="w-16 h-16 text-red-600 mx-auto mb-6 animate-pulse" />

                    <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-8 drop-shadow-lg">
                        About <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Tana Maro</span>
                    </h2>

                    <div className="space-y-8 text-lg md:text-2xl text-gray-300 font-medium leading-relaxed max-w-3xl mx-auto">
                        <p className="border-l-4 border-red-600 pl-6 text-left italic">
                            Tana Maro is not just a website. It&apos;s a movement. A roasting-first platform built for the generation that refuses to be silent.
                        </p>
                        <p className="text-left">
                            From college canteens to sold-out auditoriums, we give a stage to the funniest, rawest, and most savage voices in India. We believe comedy should punch up, punch down, and <span className="text-white font-bold underline decoration-red-600 decoration-4 underline-offset-4">punch hard</span>.
                        </p>
                        <div className="pt-8 pb-4 border-t border-white/10 mt-12">
                            <p className="text-white text-3xl md:text-4xl font-black uppercase tracking-widest leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                No Filters.<br className="md:hidden" /> No Safe Spaces.<br />
                                <span className="text-red-600">Just Chaos.</span>
                            </p>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
