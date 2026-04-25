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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function PartnershipForm() {
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to send data to backend would go here
        setSubmitted(true);
        setTimeout(() => {
            setOpen(false);
            setSubmitted(false);
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black uppercase tracking-wider font-bold">
                    Partner With Us
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-black border-red-900/50">
                {!submitted ? (
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-red-600">Partner With Chaos</DialogTitle>
                            <DialogDescription>
                                Bring Tana Maro to your college, brand, or basement.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-white">Full Name</Label>
                                <Input id="name" placeholder="Who are you?" className="bg-neutral-900 border-neutral-700" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="org" className="text-white">Organization / College</Label>
                                <Input id="org" placeholder="e.g. IIT Bombay, Red Bull" className="bg-neutral-900 border-neutral-700" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-white">Email</Label>
                                    <Input id="email" type="email" placeholder="john@doe.com" className="bg-neutral-900 border-neutral-700" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone" className="text-white">Phone</Label>
                                    <Input id="phone" type="tel" placeholder="+91 999..." className="bg-neutral-900 border-neutral-700" required />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type" className="text-white">Partnership Type</Label>
                                <select className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600">
                                    <option>Host a Roast Battle</option>
                                    <option>Brand Sponsorship</option>
                                    <option>College Fest Ty-up</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message" className="text-white">Message</Label>
                                <Textarea id="message" placeholder="Tell us what you want..." className="bg-neutral-900 border-neutral-700 min-h-[100px]" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest">
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="py-12 text-center space-y-4">
                        <div className="text-4xl">🔥</div>
                        <h3 className="text-2xl font-black text-white uppercase">Request Sent!</h3>
                        <p className="text-gray-400">Our team will reach out before you can say "Roasted".</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
