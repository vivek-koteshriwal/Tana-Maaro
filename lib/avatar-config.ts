export interface RoastAvatarPreset {
    id: string;
    name: string;
    badge: string;
    icon: string;
    accentIcon: string;
    startColor: string;
    endColor: string;
    accentColor: string;
}

export const ROAST_AVATARS: RoastAvatarPreset[] = [
    { id: "avatar_0", name: "Flamebait", badge: "FB", icon: "flame", accentIcon: "zap", startColor: "#7F1D1D", endColor: "#FB923C", accentColor: "#FACC15" },
    { id: "avatar_1", name: "Shockline", badge: "SL", icon: "zap", accentIcon: "waveform", startColor: "#581C87", endColor: "#9333EA", accentColor: "#38BDF8" },
    { id: "avatar_2", name: "Mic Drop", badge: "MD", icon: "mic", accentIcon: "sparkles", startColor: "#7F1D1D", endColor: "#DC2626", accentColor: "#F59E0B" },
    { id: "avatar_3", name: "Punchline", badge: "PN", icon: "theater", accentIcon: "star", startColor: "#0F172A", endColor: "#334155", accentColor: "#F43F5E" },
    { id: "avatar_4", name: "Smirkstorm", badge: "SS", icon: "smile", accentIcon: "eye", startColor: "#111827", endColor: "#6D28D9", accentColor: "#FB7185" },
    { id: "avatar_5", name: "Loudmouth", badge: "LM", icon: "megaphone", accentIcon: "megaphone", startColor: "#7C2D12", endColor: "#EA580C", accentColor: "#FFEDD5" },
    { id: "avatar_6", name: "Hype Dust", badge: "HD", icon: "sparkles", accentIcon: "party", startColor: "#1E1B4B", endColor: "#7C3AED", accentColor: "#22D3EE" },
    { id: "avatar_7", name: "Brain Burn", badge: "BB", icon: "brain", accentIcon: "lightbulb", startColor: "#134E4A", endColor: "#0F766E", accentColor: "#FDE047" },
    { id: "avatar_8", name: "Roast Rocket", badge: "RR", icon: "rocket", accentIcon: "flame", startColor: "#172554", endColor: "#2563EB", accentColor: "#FB923C" },
    { id: "avatar_9", name: "Ring Riot", badge: "RI", icon: "swords", accentIcon: "zap", startColor: "#431407", endColor: "#B91C1C", accentColor: "#E5E7EB" },
    { id: "avatar_10", name: "Side Eye", badge: "SE", icon: "eye", accentIcon: "eye", startColor: "#18181B", endColor: "#3F3F46", accentColor: "#06B6D4" },
    { id: "avatar_11", name: "Star Flex", badge: "SF", icon: "star", accentIcon: "crown", startColor: "#3F1D63", endColor: "#7E22CE", accentColor: "#F59E0B" },
    { id: "avatar_12", name: "Crown Heat", badge: "CH", icon: "crown", accentIcon: "zap", startColor: "#78350F", endColor: "#D97706", accentColor: "#FFF7ED" },
    { id: "avatar_13", name: "Chaos Pop", badge: "CP", icon: "party", accentIcon: "flame", startColor: "#4C0519", endColor: "#DB2777", accentColor: "#FDE68A" },
    { id: "avatar_14", name: "Quick Burn", badge: "QB", icon: "zap", accentIcon: "gauge", startColor: "#312E81", endColor: "#4F46E5", accentColor: "#FB7185" },
    { id: "avatar_15", name: "Meme Face", badge: "MF", icon: "laugh", accentIcon: "smile", startColor: "#7F1D1D", endColor: "#EF4444", accentColor: "#FDE047" },
    { id: "avatar_16", name: "Late Set", badge: "LS", icon: "music", accentIcon: "music", startColor: "#111827", endColor: "#0F766E", accentColor: "#34D399" },
    { id: "avatar_17", name: "Verdict", badge: "VD", icon: "gavel", accentIcon: "shield", startColor: "#27272A", endColor: "#52525B", accentColor: "#EF4444" },
    { id: "avatar_18", name: "Callout", badge: "CO", icon: "megaphone", accentIcon: "mic", startColor: "#7C2D12", endColor: "#EA580C", accentColor: "#FEF3C7" },
    { id: "avatar_19", name: "Idea Spike", badge: "IS", icon: "lightbulb", accentIcon: "brain", startColor: "#1E293B", endColor: "#0EA5E9", accentColor: "#FDE047" },
    { id: "avatar_20", name: "Grip Lock", badge: "GL", icon: "dumbbell", accentIcon: "zap", startColor: "#431407", endColor: "#9A3412", accentColor: "#38BDF8" },
    { id: "avatar_21", name: "Beat Bite", badge: "BT", icon: "music", accentIcon: "waveform", startColor: "#4C1D95", endColor: "#7C3AED", accentColor: "#F472B6" },
    { id: "avatar_22", name: "Spark Plug", badge: "SP", icon: "lightbulb", accentIcon: "sparkles", startColor: "#713F12", endColor: "#EAB308", accentColor: "#7C3AED" },
    { id: "avatar_23", name: "Speed Roast", badge: "SR", icon: "gauge", accentIcon: "zap", startColor: "#172554", endColor: "#1D4ED8", accentColor: "#F97316" },
    { id: "avatar_24", name: "Reply Gang", badge: "RG", icon: "message", accentIcon: "smile", startColor: "#7F1D1D", endColor: "#991B1B", accentColor: "#FB7185" },
    { id: "avatar_25", name: "Voltage", badge: "VG", icon: "zap", accentIcon: "zap", startColor: "#0F172A", endColor: "#1D4ED8", accentColor: "#22D3EE" },
    { id: "avatar_26", name: "Ctrl Roast", badge: "CR", icon: "gamepad", accentIcon: "zap", startColor: "#18181B", endColor: "#27272A", accentColor: "#22C55E" },
    { id: "avatar_27", name: "Radar", badge: "RD", icon: "radar", accentIcon: "eye", startColor: "#082F49", endColor: "#0EA5E9", accentColor: "#E879F9" },
    { id: "avatar_28", name: "Laugh Trap", badge: "LT", icon: "laugh", accentIcon: "smile", startColor: "#7C2D12", endColor: "#F97316", accentColor: "#FEF08A" },
    { id: "avatar_29", name: "Menace", badge: "MN", icon: "alert", accentIcon: "alert", startColor: "#450A0A", endColor: "#B91C1C", accentColor: "#CBD5E1" },
];

function stableHash(seed: string) {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
    }
    return Math.abs(hash);
}

export function avatarIdFromIndex(index: number) {
    const clampedIndex = Math.max(0, Math.min(index, ROAST_AVATARS.length - 1));
    return `avatar_${clampedIndex}`;
}

export function isLocalAvatar(value?: string | null) {
    return /^avatar_\d+$/i.test(String(value || "").trim());
}

export function isLegacyGeneratedAvatar(value?: string | null) {
    const lower = String(value || "").trim().toLowerCase();
    return lower.includes("dicebear") || lower.includes("ui-avatars.com") || lower.includes("/api/avatar");
}

export function avatarUrlFromSeed(seed?: string | null) {
    const safeSeed = (seed || "guest").trim() || "guest";
    if (isLocalAvatar(safeSeed)) {
        return safeSeed;
    }
    const index = stableHash(safeSeed) % ROAST_AVATARS.length;
    return avatarIdFromIndex(index);
}

export function normalizeAvatarValue(value?: string | null, fallbackSeed?: string | null) {
    const trimmed = String(value || "").trim();
    const safeSeed = (fallbackSeed || trimmed || "guest").trim() || "guest";

    if (!trimmed) {
        return avatarUrlFromSeed(safeSeed);
    }

    if (isLocalAvatar(trimmed)) {
        return trimmed;
    }

    if (trimmed.startsWith("data:image")) {
        return trimmed;
    }

    if (isLegacyGeneratedAvatar(trimmed)) {
        return avatarUrlFromSeed(safeSeed);
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    return avatarUrlFromSeed(safeSeed);
}

export function getAvatarPreset(value?: string | null) {
    const normalized = normalizeAvatarValue(value);
    if (!isLocalAvatar(normalized)) {
        return null;
    }

    const index = Number(normalized.replace("avatar_", ""));
    if (!Number.isFinite(index)) {
        return null;
    }

    return ROAST_AVATARS[index] || null;
}

export function avatarDisplayName(value?: string | null, fallbackSeed?: string | null) {
    const preset = getAvatarPreset(normalizeAvatarValue(value, fallbackSeed));
    return preset?.name || "Roaster";
}
