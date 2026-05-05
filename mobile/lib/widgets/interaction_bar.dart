import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/widgets/post_action_button.dart';

const Color roastWallPrimaryRed = Color(0xFFFF3B3B);
const Color roastWallBackgroundBlack = Color(0xFF000000);
const Color roastWallCardBackground = Color(0xFF1A1A1A);
const Color roastWallButtonBackground = Color(0xFF2A2A2A);
const Color roastWallActiveFireColor = Color(0xFFB45309);
const Color roastWallGreyText = Color(0xFF888888);
const Color roastWallWhiteText = Color(0xFFFFFFFF);

class InteractionBar extends StatelessWidget {
  final int fireCount;
  final int tauntCount;
  final int downCount;
  final int shareCount;
  final bool isFireActive;
  final bool isDownActive;
  final VoidCallback onFire;
  final VoidCallback onTaunt;
  final VoidCallback onDown;
  final VoidCallback onShare;
  final bool showFireButton;

  const InteractionBar({
    super.key,
    required this.fireCount,
    required this.tauntCount,
    required this.downCount,
    required this.shareCount,
    required this.isFireActive,
    required this.isDownActive,
    required this.onFire,
    required this.onTaunt,
    required this.onDown,
    required this.onShare,
    this.showFireButton = true,
  });

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[
      if (showFireButton)
        Expanded(
          child: _InteractionButton(
            icon: Icons.local_fire_department_rounded,
            label: 'Fire',
            count: fireCount,
            active: isFireActive,
            activeColor: roastWallActiveFireColor,
            onTap: onFire,
          ),
        ),
      if (showFireButton) const SizedBox(width: 8),
      Expanded(
        child: _InteractionButton(
          icon: Icons.chat_bubble_outline_rounded,
          label: 'Taunt',
          count: tauntCount,
          onTap: onTaunt,
        ),
      ),
      const SizedBox(width: 8),
      Expanded(
        child: _InteractionButton(
          icon: Icons.thumb_down_alt_outlined,
          label: 'Down',
          count: downCount,
          active: isDownActive,
          activeColor: roastWallPrimaryRed,
          onTap: onDown,
        ),
      ),
      const SizedBox(width: 8),
      Expanded(
        child: _InteractionButton(
          icon: Icons.ios_share_rounded,
          label: 'Share',
          count: shareCount,
          onTap: onShare,
        ),
      ),
    ];

    return Row(children: children);
  }
}

class _InteractionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  const _InteractionButton({
    required this.icon,
    required this.label,
    required this.count,
    required this.onTap,
    this.active = false,
    this.activeColor = roastWallPrimaryRed,
  });

  @override
  Widget build(BuildContext context) {
    final fillColor = active
        ? activeColor.withValues(alpha: 0.22)
        : roastWallButtonBackground;
    final borderColor = active
        ? activeColor.withValues(alpha: 0.5)
        : Colors.white.withValues(alpha: 0.06);
    final iconColor = active ? Colors.white : roastWallGreyText;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: fillColor,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 16,
                      color: iconColor,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      formatCompactCount(count),
                      style: TextStyle(
                        color: active ? roastWallWhiteText : Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        height: 1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: active
                      ? roastWallWhiteText.withValues(alpha: 0.82)
                      : roastWallGreyText,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.7,
                  height: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
