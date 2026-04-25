"use client";

import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function ParticipateSection() {
    const { user } = useAuth();
    const router   = useRouter();

    const goToPost = () => user ? router.push("/post") : router.push("/login?next=/post");

    return (
        <section id="participate" className="py-24 bg-red-700 relative overflow-hidden">
            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-multiply" />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <ScrollReveal>
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-lg">
                        Your Content Deserves <span className="text-red-300 drop-shadow-[0_0_15px_rgba(252,165,165,0.8)]">Attention</span>
                    </h2>
                    <p className="text-white/90 text-xl font-medium max-w-2xl mx-auto mb-12">
                        Can’t make it to an event? We’ve got you. Submit your roast videos, reels, or one-liners online.
                    </p>
                </ScrollReveal>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
                    {[
                        { icon: Upload, title: "Submit Content", text: "Upload your video or text via our portal." },
                        { icon: CheckCircle, title: "We Review", text: "Our team filters for maximum savage factor." },
                        { icon: Zap, title: "Get Famous", text: "Top content gets posted to our 100k+ community." }
                    ].map((step, i) => (
                        <ScrollReveal key={i} delay={i * 0.1}>
                            <div className="bg-black/20 p-8 rounded-xl backdrop-blur-sm border border-black/10 h-full">
                                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-lg">
                                    {i + 1}
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase mb-2">{step.title}</h3>
                                <p className="text-white/80">{step.text}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                <ScrollReveal delay={0.4}>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button type="button" onClick={goToPost}
                            className="bg-white text-red-700 hover:bg-neutral-200 font-black text-lg px-8 py-4 uppercase tracking-wider shadow-xl transition-all border border-transparent">
                            Submit Your Content
                        </button>
                        <Link href="/register">
                            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-red-700 text-lg px-8 py-6 uppercase tracking-wider bg-transparent font-black shadow-lg">
                                Participate Online
                            </Button>
                        </Link>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
