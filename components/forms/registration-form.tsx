"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface RegistrationFormProps {
    triggerText?: string;
    triggerVariant?: "default" | "outline" | "ghost" | "savage";
    triggerSize?: "default" | "sm" | "lg" | "icon";
    className?: string;
    forcedRole?: "attendee" | "performer";
}

export function RegistrationForm({
    triggerText = "Register",
    triggerVariant = "savage",
    triggerSize = "default",
    eventId,
    eventName,
    className,
    forcedRole
}: RegistrationFormProps & { eventId?: string | number, eventName?: string }) {
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        city: "Select City",
        type: forcedRole ? (forcedRole === "attendee" ? "Roast Battle (Viewer)" : "Roast Battle (Participant)") : "Roast Battle (Viewer)"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/events/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: eventId || "general",
                    eventName: eventName || "General Registration",
                    ...formData
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Registration failed");
            }

            setSubmitted(true);
            setTimeout(() => {
                setOpen(false);
                setSubmitted(false);
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    city: "Select City",
                    type: "Roast Battle (Viewer)"
                });
            }, 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to register. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={triggerVariant as any} size={triggerSize as any} className={className}>
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-black/95 border-red-900/50 backdrop-blur-xl">
                {!submitted ? (
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-red-600 uppercase tracking-tighter">Join The Chaos</DialogTitle>
                            <DialogDescription>
                                Register for upcoming events and roast battles.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="reg-name" className="text-white">Full Name</Label>
                                <Input
                                    id="reg-name"
                                    placeholder="Enter your name"
                                    className="bg-neutral-900/50 border-neutral-800 focus:border-red-600"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="reg-email" className="text-white">Email</Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        placeholder="name@college.edu"
                                        className="bg-neutral-900/50 border-neutral-800 focus:border-red-600"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="reg-phone" className="text-white">Phone</Label>
                                    <Input
                                        id="reg-phone"
                                        type="tel"
                                        placeholder="+91..."
                                        className="bg-neutral-900/50 border-neutral-800 focus:border-red-600"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {!forcedRole && (
                                <div className="grid gap-2">
                                    <Label htmlFor="reg-city" className="text-white">City</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    >
                                        <option>Select City</option>
                                        <option>Delhi</option>
                                        <option>Mumbai</option>
                                        <option>Bengaluru</option>
                                        <option>Hyderabad</option>
                                        <option>Pune</option>
                                        <option>Chennai</option>
                                    </select>
                                </div>
                            )}

                            {!forcedRole && (
                                <div className="grid gap-2">
                                    <Label htmlFor="reg-event" className="text-white">Interested Event</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option>Roast Battle (Viewer)</option>
                                        <option>Roast Battle (Participant)</option>
                                        <option>Open Mic Standup</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-lg py-6 shadow-lg shadow-red-900/20" disabled={loading}>
                                {loading ? "Registering..." : "Confirm Registration"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">🤘</span>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase">You&apos;re In!</h3>
                        <p className="text-gray-400">Check your email for the ticket details.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
