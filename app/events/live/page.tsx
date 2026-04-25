import { Button } from "@/components/ui/button";
import { MoveRight, Calendar, MapPin, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { RegistrationForm } from "@/components/forms/registration-form";

export default function LiveEventPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
            {/* Minimal spacing for fixed navbar */}
            <div className="h-20" />

            {/* Hero Event Banner */}
            <section className="relative w-full h-[60vh] min-h-[500px] flex items-end pb-12 overflow-hidden bg-neutral-950">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl opacity-30 blur-2xl pointer-events-none">
                    <div className="w-full h-full bg-red-600/30 rounded-full mix-blend-screen" />
                </div>
                {/* Fallback pattern instead of image to ensure it works without assets */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900 via-neutral-950 to-black z-0" />

                <div className="container relative z-20 px-4 md:px-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/50 text-red-500 text-sm font-bold tracking-widest uppercase mb-6">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Live Event
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-4 drop-shadow-2xl">
                        The Great Indian <br />
                        <span className="text-red-600">Roast Battle</span> '24
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl font-medium mb-8">
                        The biggest stage for raw comedy. College vs College. No mercy. Winner takes ₹50,000 and ultimate bragging rights.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        <RegistrationForm
                            triggerText="Register for Event"
                            triggerVariant="default"
                            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-lg px-10 py-6 rounded-none shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
                            eventId="the-great-indian-roast-battle-24"
                            eventName="The Great Indian Roast Battle '24"
                        />
                        <Link href="#details">
                            <Button variant="outline" className="border-white/20 hover:bg-white hover:text-black font-black uppercase tracking-widest text-lg px-8 py-6 rounded-none bg-transparent">
                                View Details
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Event Highlights Strip */}
            <section className="border-y border-white/10 bg-neutral-900/40 backdrop-blur-md relative z-20">
                <div className="container px-4 md:px-8 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="flex items-start gap-4">
                            <Calendar className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-white uppercase">Date</h4>
                                <p className="text-gray-400 text-sm">Oct 24 - Oct 30, 2026</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <MapPin className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-white uppercase">Location</h4>
                                <p className="text-gray-400 text-sm">Mumbai (And Online)</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Users className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-white uppercase">Format</h4>
                                <p className="text-gray-400 text-sm">College vs College</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Trophy className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-white uppercase">Prize Pool</h4>
                                <p className="text-gray-400 text-sm">₹50,000 Cash</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Event Description & Stages */}
            <section id="details" className="py-24 relative z-20">
                <div className="container px-4 md:px-8">
                    <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">
                                    About The <span className="text-red-500">Battle</span>
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed content-space-y-4">
                                    Tana Maaro brings the underground roast culture to the main stage. For the first time, colleges from across the country will clash in a brutal, no-holds-barred comedy warfare.
                                    <br /><br />
                                    Whether you're participating on stage to defend your turf, or joining as part of the live audience to fuel the fire, this is going to be a night of unforgettable punchlines.
                                </p>
                            </div>

                            <div className="p-6 border border-red-900/30 bg-red-950/10 rounded-xl">
                                <h3 className="text-xl font-bold uppercase mb-2 flex items-center gap-2">
                                    <span className="text-red-500">⚠️</span> Warning
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    This event features unfiltered, explicit comedy. If you are easily offended, this is definitely not the place for you. Viewer discretion is heavily advised.
                                </p>
                            </div>
                        </div>

                        {/* Stage Slider / Schedule Simulation */}
                        <div className="space-y-8">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                                Stage <span className="text-red-500">Breakdown</span>
                            </h2>

                            <div className="space-y-4">
                                <div className="group relative p-6 bg-neutral-900 border border-neutral-800 hover:border-red-500/50 transition-colors">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top z-10" />
                                    <div className="flex justify-between items-start mb-2 relative z-20">
                                        <h3 className="text-xl font-black uppercase text-white group-hover:text-red-400 transition-colors">Round 1: Online Qualifiers</h3>
                                        <span className="text-sm font-bold text-gray-500 bg-black px-3 py-1 rounded">Oct 24 - 26</span>
                                    </div>
                                    <p className="text-gray-400 relative z-20">Submit your 2-minute roast video online. The community votes on the Tana Maaro feed. Top 16 advance.</p>
                                </div>

                                <div className="group relative p-6 bg-neutral-900 border border-neutral-800 hover:border-red-500/50 transition-colors">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top z-10" />
                                    <div className="flex justify-between items-start mb-2 relative z-20">
                                        <h3 className="text-xl font-black uppercase text-white group-hover:text-red-400 transition-colors">Round 2: The Knockouts</h3>
                                        <span className="text-sm font-bold text-gray-500 bg-black px-3 py-1 rounded">Oct 28</span>
                                    </div>
                                    <p className="text-gray-400 relative z-20">Live virtual battles. 1v1 matchups broadcasted directly to the platform. Judges decide the Final 4.</p>
                                </div>

                                <div className="group relative p-6 bg-neutral-900 border border-red-900/30 hover:border-red-500 transition-colors overflow-hidden">
                                    <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors z-0" />
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600 z-10" />
                                    <div className="flex justify-between items-start mb-2 relative z-20">
                                        <h3 className="text-xl font-black uppercase text-white group-hover:text-red-400 transition-colors flex items-center gap-2">
                                            The Grand Finale <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Offline Event</span>
                                        </h3>
                                        <span className="text-sm font-bold text-red-400 bg-red-950 px-3 py-1 rounded">Oct 30</span>
                                    </div>
                                    <p className="text-gray-300 relative z-20">The surviving 4 face off live on stage in Mumbai. A 500-person live audience. Pure chaos. One champion.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
