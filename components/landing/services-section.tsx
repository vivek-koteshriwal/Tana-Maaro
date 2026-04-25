"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function ServicesSection() {
    const services = [
        { title: "Live Roasting Events",  link: "/events"   },
        { title: "Roast Battles",         link: "/battles"  },
        { title: "Creator Opportunities", link: "/register" },
        { title: "College Shows",         link: "/events"   },
        { title: "Content Features",      link: "/post"     },
        { title: "Talent Discovery",      link: "/register" },
    ];

    return (
        <section id="services" className="py-24 bg-black border-b border-white/10">
            <div className="container mx-auto px-4">
                <ScrollReveal>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-12 text-center md:text-left">
                        What We <span className="text-red-600">Do</span>
                    </h2>
                </ScrollReveal>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
                    {services.map((service, i) => (
                        <Link key={i} href={service.link} className="group relative flex items-center justify-between p-8 bg-black hover:bg-neutral-900 transition-colors">
                            <span className="text-xl font-bold text-gray-300 group-hover:text-white uppercase tracking-wide relative z-10">
                                {service.title}
                            </span>
                            <ArrowUpRight className="w-6 h-6 text-red-600 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all relative z-10" />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
