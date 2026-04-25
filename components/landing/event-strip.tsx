"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

const CITIES = [
    { name: "Delhi",     slug: "delhi" },
    { name: "Mumbai",    slug: "mumbai" },
    { name: "Hyderabad", slug: "hyderabad" },
    { name: "Pune",      slug: "pune" },
    { name: "Bangalore", slug: "bangalore" },
    { name: "Chennai",   slug: "chennai" },
];

export function EventStrip() {
    const { user } = useAuth();
    const router   = useRouter();

    const goToEvents = () => user ? router.push("/events") : router.push("/login?next=/events");

    return (
        <div className="w-full bg-red-600 py-2 border-b border-black/20 relative z-20">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">

                <div className="flex items-center gap-3 bg-red-800/80 px-5 py-1.5 -skew-x-12 shadow-sm">
                    <div className="h-2 w-2 bg-white rounded-full opacity-90 skew-x-12" />
                    <span className="text-white font-black uppercase tracking-wider text-sm whitespace-nowrap skew-x-12">
                        Tana Maro Live Events
                    </span>
                </div>

                <div className="flex-1 overflow-x-auto w-full md:w-auto">
                    <div className="flex items-center gap-4 md:gap-6 md:justify-center whitespace-nowrap px-4 py-1">
                        <span className="text-white/90 font-black text-xs uppercase tracking-wider hidden md:inline">Register Now:</span>
                        {CITIES.map(city => (
                            <button
                                key={city.slug}
                                type="button"
                                onClick={goToEvents}
                                className="text-xs md:text-sm font-black text-white hover:text-black transition-colors uppercase tracking-wider"
                            >
                                {city.name}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={goToEvents}
                    className="hidden md:block bg-black text-white hover:bg-neutral-800 uppercase tracking-widest font-black text-xs px-6 py-2 rounded-sm transition-colors"
                >
                    Register
                </button>
            </div>
        </div>
    );
}
