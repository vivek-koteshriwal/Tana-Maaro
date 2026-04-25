"use client";

import { Button } from "@/components/ui/button";
import { Swords, Video, Trophy } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function BattleSection() {
    const { user } = useAuth();
    const router   = useRouter();

    const goToBattles = () => user ? router.push("/battles") : router.push("/login?next=/battles");

    const battleTypes = [
        { title: "College vs College", count: "14 Active Battles" },
        { title: "Creator vs Creator", count: "8 Active Battles"  },
        { title: "City vs City",       count: "3 Active Battles"  },
        { title: "Meme vs Meme",       count: "4 Active Battles"  },
    ];

    return (
        <section id="battles" className="py-12 lg:py-24 relative overflow-hidden bg-neutral-950">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-red-900/5 -skew-x-12 transform origin-top-right" />

            <div className="container mx-auto px-4 relative z-10 pt-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                    <div className="lg:w-1/2 space-y-8">
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                            Battle.<br />
                            <span className="text-red-600">Roast.</span><br />
                            Win.
                        </h2>
                        <p className="text-xl text-gray-400 max-w-lg mb-10">
                            Upload your roast. Community votes. Winners get the stage, the cash, and the glory.
                        </p>

                        <div className="flex flex-col gap-6 mb-12">
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="w-10 h-10 rounded bg-red-900/20 flex items-center justify-center border border-red-900/40">
                                    <Video className="w-5 h-5 text-red-500" />
                                </div>
                                <span>Upload your roast (video/text)</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="w-10 h-10 rounded bg-red-900/20 flex items-center justify-center border border-red-900/40">
                                    <Swords className="w-5 h-5 text-red-500" />
                                </div>
                                <span>Community Votes</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="w-10 h-10 rounded bg-red-900/20 flex items-center justify-center border border-red-900/40">
                                    <Trophy className="w-5 h-5 text-red-500" />
                                </div>
                                <span>Win Cash & Features</span>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-6 uppercase tracking-wider">
                                        Join a Battle
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-neutral-950 border-white/10">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black text-white uppercase tracking-wider">Select Battle Arena</DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                            Choose your battle format and enter the arena.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-3 py-4">
                                        {battleTypes.map((battle, i) => (
                                            <button key={i} type="button" onClick={goToBattles} className="w-full">
                                                <div className="w-full flex justify-between items-center bg-black border border-white/10 hover:border-red-600 hover:bg-neutral-900 transition-all h-14 px-4 group rounded-md">
                                                    <span className="font-bold uppercase tracking-wider text-white group-hover:text-red-500">{battle.title}</span>
                                                    <Swords className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <button type="button" onClick={() => router.push("/post")} className="border border-white/20 text-white hover:bg-white hover:text-black hover:border-white px-8 py-4 uppercase tracking-wider bg-transparent font-bold transition-colors rounded-md">
                                Upload Roast
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-1/2 w-full">
                        <div className="grid gap-4">
                            {battleTypes.map((battle, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i}
                                >
                                    <button type="button" onClick={goToBattles} className="w-full text-left">
                                        <div className="group bg-black p-8 border border-white/10 hover:border-red-600 transition-all hover:-translate-x-2 cursor-pointer flex items-center justify-between">
                                            <div>
                                                <h3 className="text-2xl font-black text-white uppercase group-hover:text-red-500 transition-colors">
                                                    {battle.title}
                                                </h3>
                                                <p className="text-sm text-gray-500">{battle.count}</p>
                                            </div>
                                            <Swords className="w-8 h-8 text-gray-700 group-hover:text-red-600 transform group-hover:rotate-12 transition-all" />
                                        </div>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
