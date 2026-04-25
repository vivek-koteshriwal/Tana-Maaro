"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

const GlitchText = ({ text, className, glitchColor = "text-white" }: { text: string, className?: string, glitchColor?: string }) => {
    return (
        <motion.div
            className={`relative inline-block ${className}`}
            initial="rest"
            whileHover="hover"
            animate="rest"
        >
            <span className="relative z-10">{text}</span>
            <motion.span
                className={`absolute top-0 left-0 -z-10 ${glitchColor} opacity-0`}
                variants={{
                    hover: {
                        opacity: 0.7,
                        x: [-2, 2, -1, 3, -2],
                        y: [1, -1, 2, -2, 1],
                        transition: { repeat: Infinity, duration: 0.1 }
                    }
                }}
            >
                {text}
            </motion.span>
            <motion.span
                className="absolute top-0 left-0 -z-10 text-cyan-500 opacity-0 mix-blend-screen"
                variants={{
                    hover: {
                        opacity: 0.7,
                        x: [2, -2, 1, -3, 2],
                        y: [-1, 2, -2, 1, -1],
                        transition: { repeat: Infinity, duration: 0.1 }
                    }
                }}
            >
                {text}
            </motion.span>
        </motion.div>
    );
};

export function HeroSection() {
    const { user } = useAuth();
    const router   = useRouter();

    const goToEvents  = () => user ? router.push("/events")  : router.push("/login?next=/events");
    const goToBattles = () => user ? router.push("/battles") : router.push("/login?next=/battles");

    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-16">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-red-600/20 blur-[100px] md:blur-[120px] rounded-full pointer-events-none opacity-60" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                {/* Note: noise.png might not exist, but CSS gradient/overlay works too. Using pure code for noise if image missing is complex, relying on simple gradients/colors for now. */}
            </div>

            <div className="container relative z-10 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-6"
                >
                    <div className="relative z-20 mix-blend-lighten">
                        <GlitchText
                            text="This Is Not"
                            className="text-6xl md:text-9xl font-black text-red-600 tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] leading-none block mb-2 cursor-pointer"
                        />
                        <GlitchText
                            text="A Safe Space."
                            className="text-6xl md:text-9xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] leading-none block cursor-pointer"
                            glitchColor="text-red-600"
                        />
                    </div>

                    <p className="text-xl md:text-2xl font-medium text-gray-300 max-w-3xl mx-auto tracking-wide pt-4">
                        India’s boldest roasting platform where<br className="hidden md:block" /> creators perform live, roast hard, and get noticed.
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
                    >
                        <motion.button
                            type="button"
                            onClick={goToEvents}
                            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(220,38,38,0.6)" }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto bg-red-600 text-white font-black text-lg px-10 py-5 uppercase tracking-widest border-2 border-transparent hover:border-white transition-colors rounded-none"
                        >
                            Register for Live Event
                        </motion.button>
                        <motion.button
                            type="button"
                            onClick={() => router.push("/feed")}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto border-2 border-white/30 text-white font-black text-lg px-10 py-5 uppercase tracking-widest hover:border-white hover:bg-white/5 transition-colors rounded-none"
                        >
                            Enter Roast Wall
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-1 h-12 rounded-full bg-gradient-to-b from-red-600 to-transparent"></div>
            </div>
        </section>
    );
}
