import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Flame } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <section className="relative py-24 pt-32 px-4 overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
                <Flame className="w-16 h-16 text-red-600 mb-6 animate-pulse" />
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 relative z-10">
                    About <span className="stroke-text text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Tanamaaro</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed relative z-10">
                    India&apos;s rawest roasting platform. Born in a hostel room, raised in chaos.
                </p>
            </section>

            {/* Story Section */}
            <section className="py-20 bg-neutral-900/30">
                <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold uppercase text-red-600">The Origin Story</h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                It started with a simple Instagram page. A place to vent about toxic professors, terrible mess food, and the existential dread of engineering.
                            </p>
                            <p>
                                But comments weren&apos;t enough. You wanted a stage. You wanted a battlefield.
                            </p>
                            <p className="font-bold text-white">
                                So we built Tanamaaro.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="aspect-square bg-neutral-800 rounded-lg p-8 flex items-center justify-center border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-red-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                            <h3 className="text-4xl font-black text-center uppercase leading-tight relative z-10">
                                No Filters.<br />No Safe Spaces.<br />Just <span className="text-red-600">Raw Talent.</span>
                            </h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-24 px-4 container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-16 uppercase tracking-widest">Our DNA</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Not Polite", desc: "We don’t do sugarcoating. If it sucks, we say it sucks." },
                        { title: "Not Filtered", desc: "Your raw thoughts, unedited. (As long as it's funny)." },
                        { title: "Not Boring", desc: "Life is too short for boring content. Make them laugh or make them cry." }
                    ].map((value, i) => (
                        <div key={i} className="p-8 border border-red-900/20 bg-black hover:bg-neutral-900 hover:border-red-600 transition-colors duration-300 rounded-xl group">
                            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-500">{value.title}</h3>
                            <p className="text-gray-500">{value.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-red-600 text-black text-center px-4">
                <h2 className="text-4xl font-black uppercase mb-8">Ready to join the cult?</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/join">
                        <Button className="bg-black text-white hover:bg-neutral-800 border-none text-lg px-8 py-6 uppercase font-bold">
                            Become a Creator
                        </Button>
                    </Link>
                    <Link href="/feed">
                        <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white text-lg px-8 py-6 uppercase font-bold bg-transparent">
                            Watch the Roast
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
