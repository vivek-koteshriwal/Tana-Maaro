"use client";

import type { HTMLAttributes } from "react";
import {
    AudioWaveform,
    Brain,
    CircleAlert,
    Crown,
    Dumbbell,
    Eye,
    Flame,
    Gamepad2,
    Gauge,
    Gavel,
    Laugh,
    Lightbulb,
    Megaphone,
    MessageSquare,
    Mic,
    Music,
    PartyPopper,
    Radar,
    Rocket,
    Shield,
    Smile,
    Sparkles,
    Star,
    Swords,
    Theater,
    Zap,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarPreset, normalizeAvatarValue } from "@/lib/avatar-config";

interface RoastAvatarProps extends HTMLAttributes<HTMLDivElement> {
    value?: string | null;
    fallbackSeed?: string | null;
    alt?: string;
    size?: number;
}

const AVATAR_ICONS: Record<string, LucideIcon> = {
    alert: CircleAlert,
    brain: Brain,
    crown: Crown,
    dumbbell: Dumbbell,
    eye: Eye,
    flame: Flame,
    gamepad: Gamepad2,
    gauge: Gauge,
    gavel: Gavel,
    laugh: Laugh,
    lightbulb: Lightbulb,
    megaphone: Megaphone,
    message: MessageSquare,
    mic: Mic,
    music: Music,
    party: PartyPopper,
    radar: Radar,
    rocket: Rocket,
    shield: Shield,
    smile: Smile,
    sparkles: Sparkles,
    star: Star,
    swords: Swords,
    theater: Theater,
    waveform: AudioWaveform,
    zap: Zap,
};

export function RoastAvatar({
    value,
    fallbackSeed,
    alt = "Profile avatar",
    size = 40,
    className,
    style,
    ...props
}: RoastAvatarProps) {
    const normalized = normalizeAvatarValue(value, fallbackSeed);
    const preset = getAvatarPreset(normalized);

    const mergedStyle = {
        width: size,
        height: size,
        ...style,
    };

    if (!preset) {
        return (
            <div
                className={cn("relative overflow-hidden rounded-full bg-[#202020]", className)}
                style={mergedStyle}
                {...props}
            >
                <img
                    src={normalized}
                    alt={alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    const MainIcon = AVATAR_ICONS[preset.icon];
    const AccentIcon = AVATAR_ICONS[preset.accentIcon];
    const iconSize = Math.max(14, Math.round(size * 0.44));
    const accentSize = Math.max(10, Math.round(size * 0.31));
    const accentIconSize = Math.max(8, Math.round(size * 0.14));
    const accentOffset = Math.max(3, Math.round(size * 0.08));

    return (
        <div
            className={cn("relative overflow-hidden rounded-full", className)}
            style={{
                ...mergedStyle,
                background: `linear-gradient(145deg, ${preset.startColor}, ${preset.endColor})`,
                boxShadow: size >= 36 ? `0 ${Math.round(size * 0.12)}px ${Math.round(size * 0.45)}px ${preset.endColor}45` : undefined,
            }}
            role="img"
            aria-label={alt}
            {...props}
        >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,0.16),transparent_36%),radial-gradient(circle_at_72%_74%,rgba(0,0,0,0.18),transparent_46%)]" />
            <div
                className="absolute rounded-full bg-white/15"
                style={{
                    width: `${size * 0.34}px`,
                    height: `${size * 0.34}px`,
                    top: `${size * 0.12}px`,
                    left: `${size * 0.14}px`,
                }}
            />
            <div
                className="absolute bg-black/20"
                style={{
                    width: `${size * 0.62}px`,
                    height: `${size * 0.18}px`,
                    right: `${-size * 0.02}px`,
                    bottom: `${-size * 0.01}px`,
                    transform: "rotate(-16deg)",
                    borderRadius: `${size * 0.2}px`,
                }}
            />
            <div className="relative flex h-full w-full items-center justify-center text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.32)]">
                {MainIcon ? (
                    <MainIcon size={iconSize} strokeWidth={2.35} />
                ) : (
                    <span
                        className="font-black uppercase"
                        style={{
                            fontSize: Math.max(10, Math.round(size * 0.28)),
                            letterSpacing: `${Math.max(0.2, size * 0.02)}px`,
                        }}
                    >
                        {preset.badge}
                    </span>
                )}
            </div>
            <span
                className="absolute flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(0,0,0,0.25)]"
                style={{
                    width: accentSize,
                    height: accentSize,
                    right: accentOffset,
                    bottom: accentOffset,
                    backgroundColor: preset.accentColor,
                    border: `${Math.max(1, Math.round(size * 0.06))}px solid rgba(255,255,255,0.2)`,
                }}
            >
                {AccentIcon ? (
                    <AccentIcon size={accentIconSize} className="text-white" strokeWidth={2.2} />
                ) : null}
            </span>
        </div>
    );
}
