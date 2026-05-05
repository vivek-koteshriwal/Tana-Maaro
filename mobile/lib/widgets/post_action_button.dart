import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';

String formatCompactCount(int value) {
  if (value >= 1000000) {
    return '${(value / 1000000).toStringAsFixed(1)}M';
  }
  if (value >= 1000) {
    return '${(value / 1000).toStringAsFixed(1)}K';
  }
  return '$value';
}

class RoastActionButton extends StatelessWidget {
  final Widget icon;
  final String count;
  final String label;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onTap;

  const RoastActionButton({
    super.key,
    required this.icon,
    required this.count,
    required this.label,
    required this.onTap,
    this.isActive = false,
    this.activeColor = AppTheme.primaryColor,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = isActive
        ? activeColor.withValues(alpha: 0.45)
        : Colors.white.withValues(alpha: 0.08);
    final fillColor = isActive
        ? activeColor.withValues(alpha: 0.16)
        : Colors.white.withValues(alpha: 0.05);
    final contentColor = isActive ? activeColor : Colors.white70;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: fillColor,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconTheme(
                    data: IconThemeData(color: contentColor),
                    child: icon,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    count,
                    style: TextStyle(
                      color: isActive ? Colors.white : Colors.white70,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      height: 1.0,
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
                color: isActive ? Colors.white70 : Colors.white30,
                fontSize: 8,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.0,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
