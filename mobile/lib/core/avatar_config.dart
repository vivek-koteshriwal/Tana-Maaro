import 'dart:math';
import 'package:flutter/material.dart';

class RoastAvatarData {
  final IconData icon;
  final IconData accentIcon;
  final Color startColor;
  final Color endColor;
  final Color accentColor;
  final String name;
  final String badge;

  const RoastAvatarData({
    required this.icon,
    required this.accentIcon,
    required this.startColor,
    required this.endColor,
    required this.accentColor,
    required this.name,
    required this.badge,
  });
}

const List<RoastAvatarData> kRoastAvatars = [
  RoastAvatarData(
    icon: Icons.local_fire_department_rounded,
    accentIcon: Icons.flash_on_rounded,
    startColor: Color(0xFF7F1D1D),
    endColor: Color(0xFFFB923C),
    accentColor: Color(0xFFFACC15),
    name: 'Flamebait',
    badge: 'FB',
  ),
  RoastAvatarData(
    icon: Icons.bolt_rounded,
    accentIcon: Icons.graphic_eq_rounded,
    startColor: Color(0xFF581C87),
    endColor: Color(0xFF9333EA),
    accentColor: Color(0xFF38BDF8),
    name: 'Shockline',
    badge: 'SL',
  ),
  RoastAvatarData(
    icon: Icons.mic_rounded,
    accentIcon: Icons.auto_awesome_rounded,
    startColor: Color(0xFF7F1D1D),
    endColor: Color(0xFFDC2626),
    accentColor: Color(0xFFF59E0B),
    name: 'Mic Drop',
    badge: 'MD',
  ),
  RoastAvatarData(
    icon: Icons.theater_comedy_rounded,
    accentIcon: Icons.stars_rounded,
    startColor: Color(0xFF0F172A),
    endColor: Color(0xFF334155),
    accentColor: Color(0xFFF43F5E),
    name: 'Punchline',
    badge: 'PN',
  ),
  RoastAvatarData(
    icon: Icons.mood_rounded,
    accentIcon: Icons.visibility_rounded,
    startColor: Color(0xFF111827),
    endColor: Color(0xFF6D28D9),
    accentColor: Color(0xFFFB7185),
    name: 'Smirkstorm',
    badge: 'SS',
  ),
  RoastAvatarData(
    icon: Icons.record_voice_over_rounded,
    accentIcon: Icons.campaign_rounded,
    startColor: Color(0xFF7C2D12),
    endColor: Color(0xFFEA580C),
    accentColor: Color(0xFFFFEDD5),
    name: 'Loudmouth',
    badge: 'LM',
  ),
  RoastAvatarData(
    icon: Icons.auto_awesome_rounded,
    accentIcon: Icons.celebration_rounded,
    startColor: Color(0xFF1E1B4B),
    endColor: Color(0xFF7C3AED),
    accentColor: Color(0xFF22D3EE),
    name: 'Hype Dust',
    badge: 'HD',
  ),
  RoastAvatarData(
    icon: Icons.psychology_alt_rounded,
    accentIcon: Icons.lightbulb_rounded,
    startColor: Color(0xFF134E4A),
    endColor: Color(0xFF0F766E),
    accentColor: Color(0xFFFDE047),
    name: 'Brain Burn',
    badge: 'BB',
  ),
  RoastAvatarData(
    icon: Icons.rocket_launch_rounded,
    accentIcon: Icons.local_fire_department_rounded,
    startColor: Color(0xFF172554),
    endColor: Color(0xFF2563EB),
    accentColor: Color(0xFFFB923C),
    name: 'Roast Rocket',
    badge: 'RR',
  ),
  RoastAvatarData(
    icon: Icons.sports_mma_rounded,
    accentIcon: Icons.flash_on_rounded,
    startColor: Color(0xFF431407),
    endColor: Color(0xFFB91C1C),
    accentColor: Color(0xFFE5E7EB),
    name: 'Ring Riot',
    badge: 'RI',
  ),
  RoastAvatarData(
    icon: Icons.visibility_rounded,
    accentIcon: Icons.remove_red_eye_rounded,
    startColor: Color(0xFF18181B),
    endColor: Color(0xFF3F3F46),
    accentColor: Color(0xFF06B6D4),
    name: 'Side Eye',
    badge: 'SE',
  ),
  RoastAvatarData(
    icon: Icons.stars_rounded,
    accentIcon: Icons.workspace_premium_rounded,
    startColor: Color(0xFF3F1D63),
    endColor: Color(0xFF7E22CE),
    accentColor: Color(0xFFF59E0B),
    name: 'Star Flex',
    badge: 'SF',
  ),
  RoastAvatarData(
    icon: Icons.workspace_premium_rounded,
    accentIcon: Icons.flash_on_rounded,
    startColor: Color(0xFF78350F),
    endColor: Color(0xFFD97706),
    accentColor: Color(0xFFFFF7ED),
    name: 'Crown Heat',
    badge: 'CH',
  ),
  RoastAvatarData(
    icon: Icons.celebration_rounded,
    accentIcon: Icons.local_fire_department_rounded,
    startColor: Color(0xFF4C0519),
    endColor: Color(0xFFDB2777),
    accentColor: Color(0xFFFDE68A),
    name: 'Chaos Pop',
    badge: 'CP',
  ),
  RoastAvatarData(
    icon: Icons.flash_on_rounded,
    accentIcon: Icons.speed_rounded,
    startColor: Color(0xFF312E81),
    endColor: Color(0xFF4F46E5),
    accentColor: Color(0xFFFB7185),
    name: 'Quick Burn',
    badge: 'QB',
  ),
  RoastAvatarData(
    icon: Icons.emoji_emotions_rounded,
    accentIcon: Icons.sentiment_very_satisfied_rounded,
    startColor: Color(0xFF7F1D1D),
    endColor: Color(0xFFEF4444),
    accentColor: Color(0xFFFDE047),
    name: 'Meme Face',
    badge: 'MF',
  ),
  RoastAvatarData(
    icon: Icons.nightlife_rounded,
    accentIcon: Icons.music_note_rounded,
    startColor: Color(0xFF111827),
    endColor: Color(0xFF0F766E),
    accentColor: Color(0xFF34D399),
    name: 'Late Set',
    badge: 'LS',
  ),
  RoastAvatarData(
    icon: Icons.gavel_rounded,
    accentIcon: Icons.shield_rounded,
    startColor: Color(0xFF27272A),
    endColor: Color(0xFF52525B),
    accentColor: Color(0xFFEF4444),
    name: 'Verdict',
    badge: 'VD',
  ),
  RoastAvatarData(
    icon: Icons.campaign_rounded,
    accentIcon: Icons.record_voice_over_rounded,
    startColor: Color(0xFF7C2D12),
    endColor: Color(0xFFEA580C),
    accentColor: Color(0xFFFEF3C7),
    name: 'Callout',
    badge: 'CO',
  ),
  RoastAvatarData(
    icon: Icons.tips_and_updates_rounded,
    accentIcon: Icons.psychology_alt_rounded,
    startColor: Color(0xFF1E293B),
    endColor: Color(0xFF0EA5E9),
    accentColor: Color(0xFFFDE047),
    name: 'Idea Spike',
    badge: 'IS',
  ),
  RoastAvatarData(
    icon: Icons.sports_kabaddi_rounded,
    accentIcon: Icons.bolt_rounded,
    startColor: Color(0xFF431407),
    endColor: Color(0xFF9A3412),
    accentColor: Color(0xFF38BDF8),
    name: 'Grip Lock',
    badge: 'GL',
  ),
  RoastAvatarData(
    icon: Icons.music_note_rounded,
    accentIcon: Icons.graphic_eq_rounded,
    startColor: Color(0xFF4C1D95),
    endColor: Color(0xFF7C3AED),
    accentColor: Color(0xFFF472B6),
    name: 'Beat Bite',
    badge: 'BT',
  ),
  RoastAvatarData(
    icon: Icons.emoji_objects_rounded,
    accentIcon: Icons.auto_awesome_rounded,
    startColor: Color(0xFF713F12),
    endColor: Color(0xFFEAB308),
    accentColor: Color(0xFF7C3AED),
    name: 'Spark Plug',
    badge: 'SP',
  ),
  RoastAvatarData(
    icon: Icons.shutter_speed_rounded,
    accentIcon: Icons.flash_on_rounded,
    startColor: Color(0xFF172554),
    endColor: Color(0xFF1D4ED8),
    accentColor: Color(0xFFF97316),
    name: 'Speed Roast',
    badge: 'SR',
  ),
  RoastAvatarData(
    icon: Icons.forum_rounded,
    accentIcon: Icons.tag_faces_rounded,
    startColor: Color(0xFF7F1D1D),
    endColor: Color(0xFF991B1B),
    accentColor: Color(0xFFFB7185),
    name: 'Reply Gang',
    badge: 'RG',
  ),
  RoastAvatarData(
    icon: Icons.electric_bolt_rounded,
    accentIcon: Icons.bolt_rounded,
    startColor: Color(0xFF0F172A),
    endColor: Color(0xFF1D4ED8),
    accentColor: Color(0xFF22D3EE),
    name: 'Voltage',
    badge: 'VG',
  ),
  RoastAvatarData(
    icon: Icons.sports_esports_rounded,
    accentIcon: Icons.flash_on_rounded,
    startColor: Color(0xFF18181B),
    endColor: Color(0xFF27272A),
    accentColor: Color(0xFF22C55E),
    name: 'Ctrl Roast',
    badge: 'CR',
  ),
  RoastAvatarData(
    icon: Icons.satellite_alt_rounded,
    accentIcon: Icons.visibility_rounded,
    startColor: Color(0xFF082F49),
    endColor: Color(0xFF0EA5E9),
    accentColor: Color(0xFFE879F9),
    name: 'Radar',
    badge: 'RD',
  ),
  RoastAvatarData(
    icon: Icons.sentiment_very_satisfied_rounded,
    accentIcon: Icons.emoji_emotions_rounded,
    startColor: Color(0xFF7C2D12),
    endColor: Color(0xFFF97316),
    accentColor: Color(0xFFFEF08A),
    name: 'Laugh Trap',
    badge: 'LT',
  ),
  RoastAvatarData(
    icon: Icons.dangerous_rounded,
    accentIcon: Icons.warning_amber_rounded,
    startColor: Color(0xFF450A0A),
    endColor: Color(0xFFB91C1C),
    accentColor: Color(0xFFCBD5E1),
    name: 'Menace',
    badge: 'MN',
  ),
];

String randomAvatarId() => 'avatar_${Random().nextInt(kRoastAvatars.length)}';

String avatarIdFromIndex(int index) =>
    'avatar_${index.clamp(0, kRoastAvatars.length - 1)}';

bool isLocalAvatar(String value) => value.startsWith('avatar_');

bool isLegacyGeneratedAvatar(String value) {
  final lower = value.toLowerCase();
  return lower.contains('dicebear') ||
      lower.contains('ui-avatars.com') ||
      lower.contains('/api/avatar');
}

String normalizeAvatarValue(String value, {String? fallbackSeed}) {
  final trimmed = value.trim();
  final seed = (fallbackSeed ?? trimmed).trim();
  final safeSeed = seed.isEmpty ? 'guest' : seed;

  if (trimmed.isEmpty) {
    return avatarUrlFromSeed(safeSeed);
  }

  if (isLocalAvatar(trimmed)) {
    return trimmed;
  }

  if (isLegacyGeneratedAvatar(trimmed)) {
    return avatarUrlFromSeed(safeSeed);
  }

  if (!trimmed.startsWith('http')) {
    return avatarUrlFromSeed(safeSeed);
  }

  return trimmed;
}

RoastAvatarData? getAvatarData(String value) {
  final normalized = normalizeAvatarValue(value);
  if (!normalized.startsWith('avatar_')) return null;
  final idx = int.tryParse(normalized.substring(7));
  if (idx == null || idx < 0 || idx >= kRoastAvatars.length) return null;
  return kRoastAvatars[idx];
}

String avatarDisplayName(String value) {
  return getAvatarData(value)?.name ?? 'Roaster';
}

String randomAvatarUrl() => randomAvatarId();

String avatarUrlFromSeed(String seed) {
  if (seed.startsWith('avatar_')) return seed;
  final idx = seed.hashCode.abs() % kRoastAvatars.length;
  return avatarIdFromIndex(idx);
}

final List<String> kAvatarSeeds =
    List.generate(kRoastAvatars.length, avatarIdFromIndex);

const List<String> kRoastEmojis = [
  '🔥',
  '💀',
  '😂',
  '🤡',
  '💩',
  '👀',
  '💯',
  '👎',
  '🤮',
  '😡',
  '🎤',
  '👑',
  '🏆',
  '⚡',
  '🤣',
  '😈',
  '🃏',
  '💥',
  '🎯',
  '🤬',
  '😤',
  '💪',
  '🧠',
  '👊',
  '🗣️',
  '😏',
  '🤫',
  '😎',
  '🫵',
  '🤙',
  '🪄',
  '🎭',
  '🫡',
  '🤦',
  '🥇',
];
