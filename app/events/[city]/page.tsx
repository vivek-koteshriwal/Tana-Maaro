import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RegistrationOptions } from "@/components/events/registration-options";
import { format } from "date-fns";

const VALID_CITIES = ["Delhi", "Mumbai", "Hyderabad", "Pune", "Bangalore", "Chennai"];

export default async function CityEventPage({
    params
}: {
    params: Promise<{ city: string }>
}) {
    const { city } = await params;
    const decodedCity = decodeURIComponent(city).replace(/-/g, " ");
    const normalizedCity = decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1).toLowerCase();

    if (!VALID_CITIES.includes(normalizedCity)) {
        notFound();
    }

    // Fetch live events for this city from Firestore
    const events = await db.getEvents(normalizedCity);
    const activeEvent = events.find((e: any) =>
        e.registrationOpen || e.status === "live" || e.status === "announced" || e.status === "upcoming"
    ) || null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Date TBD";
        try { return format(new Date(dateStr), "EEEE, MMMM d, yyyy"); } catch { return dateStr; }
    };

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-4xl pt-8">

                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 border-l-4 border-red-600 pl-4 py-1">
                    Upcoming TanaMaaro Event in <span className="text-red-500">{normalizedCity}</span>
                </h1>

                {!activeEvent ? (
                    <div className="mt-12 bg-neutral-900/50 border border-white/10 p-12 rounded-xl text-center">
                        <span className="text-6xl mb-4 block">🏜️</span>
                        <h2 className="text-2xl font-bold text-white mb-2">No upcoming events in {normalizedCity} right now.</h2>
                        <p className="text-gray-400 text-lg">Stay tuned. We&apos;re roasting the whole country soon.</p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-8">
                        {/* Event Details Card */}
                        <div className="bg-neutral-900/40 border border-red-900/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                            {/* Poster / Banner */}
                            {activeEvent.posterUrl ? (
                                <div className="h-48 md:h-72 relative overflow-hidden border-b border-red-900/50">
                                    <img
                                        src={activeEvent.posterUrl}
                                        alt={activeEvent.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    {activeEvent.status === "live" && (
                                        <span className="absolute top-4 left-4 bg-red-600 text-white font-bold px-4 py-1 text-sm tracking-wider rounded-sm animate-pulse">
                                            LIVE NOW
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="h-48 md:h-64 bg-red-900/20 relative overflow-hidden flex items-center justify-center border-b border-red-900/50">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600 via-black to-black" />
                                    <h1 className="text-red-500/20 text-8xl font-black uppercase whitespace-nowrap opacity-50 select-none">Tana Maaro Live</h1>
                                    <div className="absolute z-10 flex flex-col items-center">
                                        <span className="bg-red-600 text-white font-bold px-4 py-1 text-sm tracking-wider rounded-sm animate-pulse">OFFICIAL EVENT</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white uppercase mb-4 tracking-wide">
                                            {activeEvent.title}
                                        </h2>
                                        <p className="text-gray-400 mb-6 leading-relaxed">
                                            {activeEvent.description || `The Tana Maaro crew is dropping in ${normalizedCity} for our most ruthless live show yet. We've got the mics, we've got the cameras. Bring your thickest skin.`}
                                        </p>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-gray-300">
                                                <span className="text-red-500">📅</span>
                                                <span className="font-semibold">Date:</span>
                                                <span>{formatDate(activeEvent.date)}{activeEvent.time ? ` · ${activeEvent.time}` : ""}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-300">
                                                <span className="text-red-500">📍</span>
                                                <span className="font-semibold">Venue:</span>
                                                <span>{activeEvent.venue || activeEvent.location || `Underground Arena, ${normalizedCity}`}</span>
                                            </div>
                                            {activeEvent.format && (
                                                <div className="flex items-center gap-3 text-gray-300">
                                                    <span className="text-red-500">🎤</span>
                                                    <span className="font-semibold">Format:</span>
                                                    <span>{activeEvent.format}</span>
                                                </div>
                                            )}
                                            {activeEvent.prizePool && (
                                                <div className="flex items-center gap-3 text-gray-300">
                                                    <span className="text-red-500">🏆</span>
                                                    <span className="font-semibold">Prize Pool:</span>
                                                    <span className="text-yellow-400 font-bold">{activeEvent.prizePool}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-black/50 border border-white/5 p-6 rounded-lg">
                                        <h3 className="text-white font-bold uppercase mb-4 border-b border-white/10 pb-2">Entry Requirements</h3>
                                        <ul className="text-gray-400 text-sm space-y-2 list-disc pl-4">
                                            <li>Strictly 18+ only. ID verification at gates.</li>
                                            <li>Zero tolerance for physical altercations.</li>
                                            <li>By entering, you consent to being recorded and roasted.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Registration Options Router */}
                        {activeEvent.registrationOpen ? (
                            <RegistrationOptions
                                city={normalizedCity}
                                eventId={activeEvent.id}
                                eventName={activeEvent.title}
                            />
                        ) : (
                            <div className="bg-neutral-900/40 border border-white/10 rounded-xl p-8 text-center">
                                <p className="text-gray-400 text-lg font-semibold">Registration is not open yet.</p>
                                <p className="text-gray-600 text-sm mt-1">Check back soon or follow us for updates.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
