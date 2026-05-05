import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:tanamaaro_mobile/core/avatar_config.dart';

class RoastAvatar extends StatelessWidget {
  final String avatarId;
  final double radius;
  final bool isAnonymous;
  final String? fallbackSeed;
  final Color? borderColor;
  final double borderWidth;
  final bool showAccentChip;

  const RoastAvatar({
    super.key,
    required this.avatarId,
    this.radius = 20,
    this.isAnonymous = false,
    this.fallbackSeed,
    this.borderColor,
    this.borderWidth = 0,
    this.showAccentChip = true,
  });

  @override
  Widget build(BuildContext context) {
    final size = radius * 2;
    final pixelRatio = MediaQuery.devicePixelRatioOf(context);
    final cacheSize = (size * pixelRatio).round();
    final resolvedAvatar = normalizeAvatarValue(
      avatarId,
      fallbackSeed: fallbackSeed,
    );
    final fallbackData = getAvatarData(avatarUrlFromSeed(
      (fallbackSeed ?? avatarId).isEmpty ? 'guest' : (fallbackSeed ?? avatarId),
    ));
    Widget inner;

    if (isAnonymous) {
      inner = _iconCircle(Colors.grey[850]!);
    } else if (isLocalAvatar(resolvedAvatar)) {
      final data = getAvatarData(resolvedAvatar);
      if (data != null) {
        inner = _localAvatar(data, size);
      } else {
        inner = _iconCircle(Colors.grey[850]!);
      }
    } else if (resolvedAvatar.isNotEmpty) {
      inner = CachedNetworkImage(
        imageUrl: resolvedAvatar,
        memCacheWidth: cacheSize,
        maxWidthDiskCache: cacheSize,
        fadeInDuration: const Duration(milliseconds: 90),
        imageBuilder: (_, provider) => CircleAvatar(
          radius: radius,
          backgroundImage: provider,
          backgroundColor: Colors.black,
        ),
        placeholder: (_, __) => _shimmerCircle(size),
        errorWidget: (_, __, ___) => fallbackData != null
            ? _localAvatar(fallbackData, size)
            : _iconCircle(Colors.grey[850]!),
      );
    } else {
      inner = fallbackData != null
          ? _localAvatar(fallbackData, size)
          : _iconCircle(Colors.grey[850]!);
    }

    if (borderColor != null && borderWidth > 0) {
      return Container(
        width: size + borderWidth * 2,
        height: size + borderWidth * 2,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: borderColor!, width: borderWidth),
        ),
        child: ClipOval(child: inner),
      );
    }

    return ClipOval(child: SizedBox(width: size, height: size, child: inner));
  }

  Widget _localAvatar(RoastAvatarData data, double size) {
    final iconSize = radius * 0.88;
    final chipSize = radius * 0.62;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [data.startColor, data.endColor],
        ),
        boxShadow: radius >= 18
            ? [
                BoxShadow(
                  color: data.endColor.withValues(alpha: 0.28),
                  blurRadius: radius * 0.45,
                  offset: Offset(0, radius * 0.12),
                ),
              ]
            : null,
      ),
      child: Stack(
        children: [
          Positioned(
            top: size * 0.12,
            left: size * 0.14,
            child: Container(
              width: size * 0.34,
              height: size * 0.34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.14),
              ),
            ),
          ),
          Positioned(
            bottom: -size * 0.01,
            right: -size * 0.02,
            child: Transform.rotate(
              angle: -0.28,
              child: Container(
                width: size * 0.62,
                height: size * 0.18,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(size * 0.2),
                  color: Colors.black.withValues(alpha: 0.18),
                ),
              ),
            ),
          ),
          Center(
            child: Icon(
              data.icon,
              color: Colors.white,
              size: iconSize,
            ),
          ),
          if (showAccentChip)
            Positioned(
              right: size * 0.08,
              bottom: size * 0.08,
              child: Container(
                width: chipSize,
                height: chipSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: data.accentColor,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.2),
                    width: radius * 0.06,
                  ),
                ),
                child: Icon(
                  data.accentIcon,
                  color: Colors.white,
                  size: radius * 0.28,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _iconCircle(Color bg) => Container(
        width: radius * 2,
        height: radius * 2,
        decoration: BoxDecoration(shape: BoxShape.circle, color: bg),
        child: Icon(Icons.person, color: Colors.white38, size: radius),
      );

  Widget _shimmerCircle(double size) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white.withValues(alpha: 0.06),
        ),
      );
}
