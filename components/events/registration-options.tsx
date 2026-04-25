"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket, Mic2 } from "lucide-react";
import { RegistrationForm } from "@/components/forms/registration-form";

export function RegistrationOptions({ city, eventId, eventName }: { city: string; eventId?: string; eventName?: string }) {
    const [selectedRole, setSelectedRole] = useState<"attendee" | "performer" | null>(null);

    return (
        <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-8 mt-8">
            <h2 className="text-2xl font-bold text-white uppercase text-center mb-8">Secure Your Spot</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <Button
                    variant="outline"
                    className={`h-auto py-8 flex flex-col items-center gap-4 transition-all duration-300 border-2 
                        ${selectedRole === "attendee" ? "border-red-600 bg-red-900/20" : "border-white/10 hover:border-white/30 hover:bg-white/5"}`}
                    onClick={() => setSelectedRole("attendee")}
                >
                    <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center border border-white/20">
                        <Ticket className={`w-8 h-8 ${selectedRole === "attendee" ? "text-red-500" : "text-white"}`} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white uppercase mb-2">Register as Attendee</h3>
                        <p className="text-sm text-gray-400 font-normal whitespace-normal px-4">
                            Grab a ticket to the chaos. Watch the roasters destroy each other live.
                        </p>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className={`h-auto py-8 flex flex-col items-center gap-4 transition-all duration-300 border-2 
                        ${selectedRole === "performer" ? "border-red-600 bg-red-900/20" : "border-white/10 hover:border-white/30 hover:bg-white/5"}`}
                    onClick={() => setSelectedRole("performer")}
                >
                    <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center border border-white/20">
                        <Mic2 className={`w-8 h-8 ${selectedRole === "performer" ? "text-red-500" : "text-white"}`} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white uppercase mb-2">Register as Performer</h3>
                        <p className="text-sm text-gray-400 font-normal whitespace-normal px-4">
                            Step into the ring. You have 3 minutes to roast the crowd or your opponent.
                        </p>
                    </div>
                </Button>
            </div>

            {selectedRole && (
                <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RegistrationForm
                        triggerText={`Proceed as ${selectedRole}`}
                        className="w-full md:w-auto mx-auto flex"
                        eventId={eventId || `EVENT_${city.toUpperCase()}_LIVE`}
                        eventName={eventName || `${city} Tana Maaro Live`}
                        forcedRole={selectedRole}
                    />
                </div>
            )}
        </div>
    );
}
