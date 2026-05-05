import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/widgets/comments_bottom_sheet.dart';
import 'package:tanamaaro_mobile/widgets/post_action_button.dart';
import 'package:tanamaaro_mobile/widgets/post_media_view.dart';
import 'package:tanamaaro_mobile/widgets/post_options_sheet.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';
import 'package:tanamaaro_mobile/screens/profile_screen.dart';
import 'package:tanamaaro_mobile/screens/post_detail_screen.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:firebase_auth/firebase_auth.dart';

class RoastCard extends StatefulWidget {
  final PostModel post;
  final Future<void> Function()? onDelete;
  final EdgeInsetsGeometry margin;
  final double? imageHeight;
  final int? contentMaxLines;

  const RoastCard({
    super.key,
    required this.post,
    this.onDelete,
    this.margin = const EdgeInsets.only(bottom: 16),
    this.imageHeight,
    this.contentMaxLines = 5,
  });

  @override
  State<RoastCard> createState() => _RoastCardState();
}

class _RoastCardState extends State<RoastCard> {
  final PostService _postService = PostService();
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _currentUserId = FirebaseAuth.instance.currentUser?.uid;
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  Future<void> _handleLike(PostModel post) async {
    final uid = _currentUserId;
    if (uid == null) {
      _showAuthSnack('Sign in to fire reactions.');
      return;
    }
    await _postService.likePost(post.id);
  }

  Future<void> _handleDislike(PostModel post) async {
    final uid = _currentUserId;
    if (uid == null) {
      _showAuthSnack('Sign in to react to roasts.');
      return;
    }
    await _postService.dislikePost(post.id);
  }

  Future<void> _handleShare(PostModel post) async {
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
    await _postService.sharePost(post.id);
  }

  void _openComments(PostModel post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CommentsBottomSheet(
        postId: post.id,
      ),
    );
  }

  void _showAuthSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF1A1A1A),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  bool _isLiked(PostModel post) =>
      _currentUserId != null && post.likedBy.contains(_currentUserId);

  bool _isDisliked(PostModel post) =>
      _currentUserId != null && post.dislikedBy.contains(_currentUserId);

  void _navigateToProfile(PostModel post) {
    if (post.isAnonymous) return;
    Navigator.push(context,
        MaterialPageRoute(builder: (_) => ProfileScreen(userId: post.userId)));
  }

  void _openDetail(PostModel post) {
    Navigator.push(context,
        MaterialPageRoute(builder: (_) => PostDetailScreen(post: post)));
  }

  // ── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final pixelRatio = MediaQuery.devicePixelRatioOf(context);
    final imageCacheWidth =
        (MediaQuery.sizeOf(context).width * pixelRatio).round();
    const voiceNoteMarker = '[🎤 Voice Note Attached]';
    final hasVoiceNote = post.content.contains(voiceNoteMarker);
    final displayContent = post.content.replaceAll(voiceNoteMarker, '').trim();
    final canDelete = post.userId == _currentUserId;
    final handle = post.isAnonymous
        ? '@ANONYMOUS'
        : (post.userHandle.startsWith('@')
            ? post.userHandle.toUpperCase()
            : '@${post.userHandle.toUpperCase()}');

    return GestureDetector(
      onTap: () => _openDetail(post),
      child: Container(
        margin: widget.margin,
        decoration: BoxDecoration(
          color: AppTheme.darkGrey,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: () => _navigateToProfile(post),
                    child: RoastAvatar(
                      avatarId: post.userAvatar,
                      radius: 24,
                      isAnonymous: post.isAnonymous,
                      fallbackSeed: post.userId,
                      borderColor: AppTheme.primaryColor,
                      borderWidth: 3,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => _navigateToProfile(post),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            handle,
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                              color: AppTheme.primaryColor,
                              letterSpacing: 0.6,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            timeago.format(post.createdAt),
                            style: const TextStyle(
                              color: Colors.white24,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.more_horiz,
                      color: Colors.white24,
                      size: 24,
                    ),
                    onPressed: () => showPostOptionsSheet(
                      context: context,
                      post: post,
                      canDelete: canDelete,
                      onDelete: !canDelete
                          ? null
                          : () async {
                              await _postService.deletePost(post.id);
                              await widget.onDelete?.call();
                            },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ReadMoreText(
                    text: displayContent,
                    maxLines: widget.contentMaxLines ?? 3,
                    onReadMore: () => _openDetail(post),
                  ),
                  if (hasVoiceNote) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: AppTheme.primaryColor.withValues(alpha: 0.22),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.mic_rounded,
                            size: 16,
                            color: AppTheme.primaryColor,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'VOICE NOTE ATTACHED',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (post.image != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 0),
                child: PostMediaView(
                  mediaUrl: post.image!,
                  isVideo: post.isVideo,
                  cacheWidth: imageCacheWidth,
                  height: widget.imageHeight,
                  borderRadius: 14,
                ),
              ),
            const SizedBox(height: 18),
            Divider(color: Colors.white.withValues(alpha: 0.05), height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Row(
                children: [
                  Expanded(
                    child: RoastActionButton(
                      icon: const Icon(
                        Icons.local_fire_department_rounded,
                        size: 18,
                      ),
                      count: formatCompactCount(post.likes),
                      label: 'Fire',
                      isActive: _isLiked(post),
                      activeColor: const Color(0xFFFF8A00),
                      onTap: () => _handleLike(post),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RoastActionButton(
                      icon: const Icon(
                        Icons.mode_comment_outlined,
                        size: 18,
                      ),
                      count: formatCompactCount(post.comments),
                      label: 'Taunt',
                      onTap: () => _openComments(post),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RoastActionButton(
                      icon: const Icon(
                        Icons.thumb_down_alt_outlined,
                        size: 18,
                      ),
                      count: formatCompactCount(post.dislikes),
                      label: 'Down',
                      isActive: _isDisliked(post),
                      activeColor: AppTheme.primaryColor,
                      onTap: () => _handleDislike(post),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RoastActionButton(
                      icon: const Icon(
                        Icons.ios_share_rounded,
                        size: 18,
                      ),
                      count: formatCompactCount(post.shares),
                      label: 'Share',
                      onTap: () => _handleShare(post),
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline "… Read more" text
// ─────────────────────────────────────────────────────────────────────────────

class _ReadMoreText extends StatelessWidget {
  final String text;
  final int maxLines;
  final VoidCallback onReadMore;

  static const _style = TextStyle(
    fontSize: 15,
    color: Colors.white,
    height: 1.55,
    fontWeight: FontWeight.w500,
  );

  const _ReadMoreText({
    required this.text,
    required this.maxLines,
    required this.onReadMore,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final span = TextSpan(text: text, style: _style);
        final painter = TextPainter(
          text: span,
          maxLines: maxLines,
          textDirection: TextDirection.ltr,
        )..layout(maxWidth: constraints.maxWidth);

        if (!painter.didExceedMaxLines) {
          // Short post — show everything
          return Text(text, style: _style);
        }

        // Find the character offset at the last visible line's end
        final endPos = painter
            .getPositionForOffset(Offset(constraints.maxWidth, painter.size.height))
            .offset;

        // Leave room for "… Read more" (~14 chars)
        final cutoff = (endPos - 14).clamp(0, text.length);
        final truncated = text.substring(0, cutoff).trimRight();

        final readMoreRecognizer = TapGestureRecognizer()..onTap = onReadMore;

        return RichText(
          text: TextSpan(
            style: _style,
            children: [
              TextSpan(text: truncated),
              const TextSpan(text: '… '),
              TextSpan(
                text: 'Read more',
                style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
                recognizer: readMoreRecognizer,
              ),
            ],
          ),
        );
      },
    );
  }
}
