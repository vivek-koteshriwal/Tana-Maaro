import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/widgets/interaction_bar.dart';
import 'package:url_launcher/url_launcher.dart';

class PostMediaView extends StatelessWidget {
  const PostMediaView({
    super.key,
    required this.mediaUrl,
    required this.isVideo,
    this.height,
    this.borderRadius = 16,
    this.cacheWidth,
  });

  final String mediaUrl;
  final bool isVideo;
  final double? height;
  final double borderRadius;
  final int? cacheWidth;

  @override
  Widget build(BuildContext context) {
    if (isVideo) {
      return _VideoAttachmentCard(
        mediaUrl: mediaUrl,
        height: height ?? 220,
        borderRadius: borderRadius,
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: CachedNetworkImage(
        imageUrl: mediaUrl,
        memCacheWidth: cacheWidth,
        maxWidthDiskCache: cacheWidth,
        fadeInDuration: const Duration(milliseconds: 120),
        width: double.infinity,
        height: height,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(
          height: height ?? 200,
          color: Colors.white.withValues(alpha: 0.05),
        ),
        errorWidget: (_, __, ___) => Container(
          height: height ?? 200,
          color: Colors.white.withValues(alpha: 0.03),
          alignment: Alignment.center,
          child: const Icon(
            Icons.broken_image_outlined,
            color: roastWallGreyText,
          ),
        ),
      ),
    );
  }
}

class _VideoAttachmentCard extends StatelessWidget {
  const _VideoAttachmentCard({
    required this.mediaUrl,
    required this.height,
    required this.borderRadius,
  });

  final String mediaUrl;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openVideo(context),
        borderRadius: BorderRadius.circular(borderRadius),
        child: Ink(
          height: height,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF250707),
                Color(0xFF121212),
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                top: -20,
                right: -20,
                child: Container(
                  width: 110,
                  height: 110,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0x1AFFFF3B),
                  ),
                ),
              ),
              Positioned(
                top: 14,
                left: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: roastWallPrimaryRed.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: roastWallPrimaryRed.withValues(alpha: 0.3),
                    ),
                  ),
                  child: const Text(
                    'VIDEO ATTACHED',
                    style: TextStyle(
                      color: roastWallWhiteText,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ),
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(
                      Icons.play_circle_fill_rounded,
                      color: roastWallPrimaryRed,
                      size: 56,
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Tap to open video',
                      style: TextStyle(
                        color: roastWallWhiteText,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Your roast uploaded successfully',
                      style: TextStyle(
                        color: roastWallGreyText,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openVideo(BuildContext context) async {
    final uri = Uri.tryParse(mediaUrl);
    if (uri == null) {
      _showError(context);
      return;
    }

    final launched = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );
    if (!launched && context.mounted) {
      _showError(context);
    }
  }

  void _showError(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Could not open this video.'),
        backgroundColor: roastWallCardBackground,
      ),
    );
  }
}
