"use client";

import React, { useState } from "react";
import { Handshake, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PartnershipSection() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        email: "",
        phone: "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/partnerships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit request.");

            setSuccess(true);
            setFormData({ name: "", company: "", email: "", phone: "", message: "" });
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="partnerships" className="py-24 bg-black relative border-t border-white/5 overflow-hidden">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Copy */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-900/30 bg-red-900/10 text-red-500 font-bold uppercase tracking-widest text-xs">
                            <Handshake className="w-4 h-4" />
                            Business Intelligence
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                            Partner <br /> with <span className="text-red-600 italic">Chaos</span>
                        </h2>
                        <div className="space-y-4 text-xl text-gray-400 font-medium">
                            <p>
                                Are you a brand that isn&apos;t afraid to get roasted? Or a venue looking to host India&apos;s most savage comedy nights?
                            </p>
                            <p className="text-white">
                                Tana Maaro is the ultimate platform to reach a raw, engaged, and unfiltered audience. Let&apos;s build something legendary together.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            <div className="p-4 bg-neutral-950 border border-white/5 rounded-xl">
                                <h4 className="text-white font-bold mb-1 uppercase tracking-tight">2.5M+</h4>
                                <p className="text-gray-500 text-sm">Monthly Savage Impressions</p>
                            </div>
                            <div className="p-4 bg-neutral-950 border border-white/5 rounded-xl">
                                <h4 className="text-white font-bold mb-1 uppercase tracking-tight">15+ Cities</h4>
                                <p className="text-gray-400 text-sm">Live Event Presence</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-red-600/20 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                        <div className="relative bg-neutral-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                            {success ? (
                                <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(22,163,74,0.3)]">
                                        <CheckCircle2 className="w-12 h-12 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Protocol Initiated!</h3>
                                    <p className="text-gray-400">
                                        Your partnership proposal has been encrypted and sent to our scouts. We&apos;ll be in touch shortly.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setSuccess(false)}
                                        className="border-white/20 text-white hover:bg-white/10 mt-4"
                                    >
                                        Send Another Request
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-400 text-xs uppercase tracking-widest font-black">Full Name</Label>
                                            <Input 
                                                required
                                                placeholder="Savage Person"
                                                className="bg-black/50 border-white/10 text-white focus:border-red-600"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-400 text-xs uppercase tracking-widest font-black">Company / Brand</Label>
                                            <Input 
                                                placeholder="The Cool Brand"
                                                className="bg-black/50 border-white/10 text-white focus:border-red-600"
                                                value={formData.company}
                                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-400 text-xs uppercase tracking-widest font-black">Email Address</Label>
                                            <Input 
                                                required
                                                type="email"
                                                placeholder="partner@chaos.com"
                                                className="bg-black/50 border-white/10 text-white focus:border-red-600"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-400 text-xs uppercase tracking-widest font-black">Phone Number</Label>
                                            <Input 
                                                placeholder="+91-00000-00000"
                                                className="bg-black/50 border-white/10 text-white focus:border-red-600"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-400 text-xs uppercase tracking-widest font-black">Your Vision / Message</Label>
                                        <Textarea 
                                            required
                                            placeholder="Tell us how we can collab..."
                                            className="bg-black/50 border-white/10 text-white min-h-[120px] focus:border-red-600"
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-600/10 border border-red-600/20 rounded-lg text-red-500 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <Button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-red-600 hover:bg-red-700 h-14 font-black uppercase tracking-widest text-white shadow-xl shadow-red-900/20"
                                    >
                                        {loading ? "Transmitting..." : "Initialize Partnership"}
                                        <Send className="w-4 h-4 ml-2" />
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
