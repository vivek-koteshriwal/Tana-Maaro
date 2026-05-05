import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/screens/post_detail_screen.dart';
import 'package:tanamaaro_mobile/screens/profile_screen.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/widgets/comments_bottom_sheet.dart';
import 'package:tanamaaro_mobile/widgets/post_action_button.dart';
import 'package:tanamaaro_mobile/widgets/post_media_view.dart';
import 'package:tanamaaro_mobile/widgets/post_options_sheet.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';
import 'package:timeago/timeago.dart' as timeago;

const Color landingBackground = Color(0xFF0E0E0E);
const Color landingSurface = Color(0xFF191919);
const Color landingSurfaceHigh = Color(0xFF1F1F1F);
const Color landingPrimary = Color(0xFFFF3B3B);
const Color landingPrimarySoft = Color(0xFFFF8E84);
const Color landingMuted = Color(0xFFABABAB);
const Color landingError = Color(0xFFFF6E84);

class LandingFeedCard extends StatelessWidget {
  const LandingFeedCard({
    super.key,
    required this.post,
    required this.onFire,
    required this.onDown,
    required this.onShare,
    this.onDelete,
    this.onHidden,
    this.margin = const EdgeInsets.only(bottom: 18),
  });

  final PostModel post;
  final Future<void> Function(PostModel post) onFire;
  final Future<void> Function(PostModel post) onDown;
  final Future<void> Function(PostModel post) onShare;
  final Future<void> Function(PostModel post)? onDelete;
  final void Function(PostModel post)? onHidden;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;
    final canDelete = currentUserId != null && currentUserId == post.userId;
    final isFired = post.isFiredBy(currentUserId);
    final isDowned = post.isDownedBy(currentUserId);
    const voiceNoteMarker = '[🎤 Voice Note Attached]';
    final hasVoiceNote = post.content.contains(voiceNoteMarker);
    final displayContent = post.content.replaceAll(voiceNoteMarker, '').trim();
    final handle = post.isAnonymous
        ? '@ANONYMOUS'
        : (post.userHandle.startsWith('@')
                ? post.userHandle
                : '@${post.userHandle}')
            .toUpperCase();
    final metadataLabel =
        '${timeago.format(post.createdAt)} • ${post.battleId?.isNotEmpty == true ? 'Arena Prime' : 'Roast Wall'}';
    final editorialHeadline = _editorialHeadline(displayContent);
    final editorialBody = _editorialBody(displayContent);
    final isMediaCard = post.hasMedia;

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: landingSurface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: landingPrimary.withValues(alpha: 0.05),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: () => _openDetail(context),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                      isMediaCard ? 14 : 18,
                      14,
                      14,
                      isMediaCard ? 10 : 0,
                    ),
                    child: _CardHeader(
                      post: post,
                      handle: handle,
                      metadataLabel: metadataLabel,
                      canDelete: canDelete,
                      onDelete:
                          onDelete == null ? null : () => onDelete!.call(post),
                      onHidden:
                          onHidden == null ? null : () => onHidden!.call(post),
                    ),
                  ),
                  if (isMediaCard) ...[
                    if (displayContent.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                        child: Text(
                          displayContent,
                          style: GoogleFonts.manrope(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            height: 1.42,
                          ),
                        ),
                      ),
                    if (hasVoiceNote)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                        child: _VoicePill(),
                      ),
                    if (post.image != null)
                      PostMediaView(
                        mediaUrl: post.image!,
                        isVideo: post.isVideo,
                        height: 198,
                        borderRadius: 0,
                      ),
                  ] else
                    Padding(
                      padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              landingPrimary.withValues(alpha: 0.08),
                              Colors.transparent,
                            ],
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (editorialHeadline.isNotEmpty)
                              Text(
                                '"$editorialHeadline"',
                                style: GoogleFonts.epilogue(
                                  color: Colors.white,
                                  fontSize: 25,
                                  fontWeight: FontWeight.w900,
                                  fontStyle: FontStyle.italic,
                                  letterSpacing: -0.9,
                                  height: 0.96,
                                ),
                              ),
                            if (editorialBody.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              Text(
                                editorialBody,
                                style: GoogleFonts.manrope(
                                  color: landingMuted,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  height: 1.48,
                                ),
                              ),
                            ] else if (displayContent.isNotEmpty &&
                                editorialHeadline.isEmpty)
                              Text(
                                displayContent,
                                style: GoogleFonts.manrope(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  height: 1.48,
                                ),
                              ),
                            if (hasVoiceNote) ...[
                              const SizedBox(height: 12),
                              _VoicePill(),
                            ],
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              child: Row(
                children: [
                  _StatAction(
                    icon: Icons.local_fire_department_rounded,
                    value: formatCompactCount(post.likes),
                    active: isFired,
                    color: landingPrimary,
                    onTap: () => _handleFire(context, currentUserId),
                  ),
                  const SizedBox(width: 18),
                  _StatAction(
                    icon: Icons.forum_outlined,
                    value: formatCompactCount(post.comments),
                    color: landingMuted,
                    onTap: () => _openComments(context),
                  ),
                  const SizedBox(width: 18),
                  _StatAction(
                    icon: Icons.thumb_down_alt_outlined,
                    value: formatCompactCount(post.dislikes),
                    active: isDowned,
                    color: landingError,
                    onTap: () => _handleDown(context, currentUserId),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => _handleShare(context),
                    splashRadius: 20,
                    icon: const Icon(
                      Icons.share_outlined,
                      color: landingMuted,
                      size: 22,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _editorialHeadline(String text) {
    if (text.isEmpty) {
      return '';
    }

    final words = text.trim().split(RegExp(r'\s+'));
    final headlineWords = words.take(words.length > 8 ? 8 : words.length);
    return headlineWords.join(' ').toUpperCase();
  }

  static String _editorialBody(String text) {
    final words = text.trim().split(RegExp(r'\s+'));
    if (words.length <= 8) {
      return '';
    }
    return words.skip(8).join(' ');
  }

  void _showAuthSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: landingSurface,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleFire(BuildContext context, String? currentUserId) async {
    if (currentUserId == null) {
      _showAuthSnack(context, 'Sign in to interact with roasts.');
      return;
    }
    await onFire(post);
  }

  Future<void> _handleDown(BuildContext context, String? currentUserId) async {
    if (currentUserId == null) {
      _showAuthSnack(context, 'Sign in to interact with roasts.');
      return;
    }
    await onDown(post);
  }

  Future<void> _handleShare(BuildContext context) async {
    await Share.share(DeepLinkService.buildPostShareText(post));
    await DeepLinkService.trackShare(
      targetType: 'post',
      targetId: post.id,
      appLink: DeepLinkService.postUri(post.id),
      fallbackLink: DeepLinkService.postShareUri(post.id),
      destination: 'external',
      extra: {
        'ownerId': post.userId,
      },
    );
    await onShare(post);
  }

  void _openComments(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CommentsBottomSheet(postId: post.id),
    );
  }

  void _openDetail(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => PostDetailScreen(post: post)),
    );
  }
}

class _CardHeader extends StatelessWidget {
  const _CardHeader({
    required this.post,
    required this.handle,
    required this.metadataLabel,
    required this.canDelete,
    required this.onDelete,
    required this.onHidden,
  });

  final PostModel post;
  final String handle;
  final String metadataLabel;
  final bool canDelete;
  final Future<void> Function()? onDelete;
  final VoidCallback? onHidden;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: post.isAnonymous
              ? null
              : () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProfileScreen(userId: post.userId),
                    ),
                  ),
          child: RoastAvatar(
            avatarId: post.userAvatar,
            radius: 20,
            isAnonymous: post.isAnonymous,
            fallbackSeed: post.userId,
            borderColor: landingPrimarySoft.withValues(alpha: 0.55),
            borderWidth: 1.5,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                handle,
                style: GoogleFonts.manrope(
                  color: landingPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                metadataLabel,
                style: GoogleFonts.manrope(
                  color: landingMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () => showPostOptionsSheet(
            context: context,
            post: post,
            canDelete: canDelete,
            onDelete: onDelete,
            onHidden: onHidden,
          ),
          padding: EdgeInsets.zero,
          visualDensity: VisualDensity.compact,
          splashRadius: 18,
          icon: const Icon(
            Icons.more_vert_rounded,
            color: landingMuted,
            size: 20,
          ),
        ),
      ],
    );
  }
}

class _StatAction extends StatelessWidget {
  const _StatAction({
    required this.icon,
    required this.value,
    required this.color,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final String value;
  final Color color;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final resolvedColor = active ? color : landingMuted;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: resolvedColor, size: 19),
            const SizedBox(width: 6),
            Text(
              value,
              style: GoogleFonts.manrope(
                color: landingMuted,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VoicePill extends StatelessWidget {
  const _VoicePill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: landingSurfaceHigh,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.mic_rounded,
            size: 14,
            color: landingPrimarySoft.withValues(alpha: 0.92),
          ),
          const SizedBox(width: 6),
          Text(
            'VOICE NOTE',
            style: GoogleFonts.manrope(
              color: landingPrimarySoft,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}
