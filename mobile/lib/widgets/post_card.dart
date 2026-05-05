import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/screens/post_detail_screen.dart';
import 'package:tanamaaro_mobile/screens/profile_screen.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/widgets/comments_bottom_sheet.dart';
import 'package:tanamaaro_mobile/widgets/interaction_bar.dart';
import 'package:tanamaaro_mobile/widgets/post_media_view.dart';
import 'package:tanamaaro_mobile/widgets/post_options_sheet.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';
import 'package:timeago/timeago.dart' as timeago;

enum PostCardStyle {
  feed,
  profile,
}

class PostCard extends StatelessWidget {
  const PostCard({
    super.key,
    required this.post,
    required this.onFire,
    required this.onDown,
    required this.onShare,
    this.onDelete,
    this.onHidden,
    this.onSync,
    this.margin = const EdgeInsets.only(bottom: 16),
    this.style = PostCardStyle.feed,
    this.showFireButton = true,
  });

  final PostModel post;
  final Future<void> Function(PostModel post) onFire;
  final Future<void> Function(PostModel post) onDown;
  final Future<void> Function(PostModel post) onShare;
  final Future<void> Function(PostModel post)? onDelete;
  final void Function(PostModel post)? onHidden;
  final Future<void> Function(PostModel post)? onSync;
  final EdgeInsetsGeometry margin;
  final PostCardStyle style;
  final bool showFireButton;

  @override
  Widget build(BuildContext context) {
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;
    final canDelete = currentUserId != null && currentUserId == post.userId;
    final isFired = post.isFiredBy(currentUserId);
    final isDowned = post.isDownedBy(currentUserId);
    final handle = post.isAnonymous
        ? '@ANONYMOUS'
        : (post.userHandle.startsWith('@')
            ? post.userHandle.toUpperCase()
            : '@${post.userHandle.toUpperCase()}');
    const voiceNoteMarker = '[🎤 Voice Note Attached]';
    final hasVoiceNote = post.content.contains(voiceNoteMarker);
    final displayContent = post.content.replaceAll(voiceNoteMarker, '').trim();
    final pixelRatio = MediaQuery.devicePixelRatioOf(context);
    final imageCacheWidth =
        (MediaQuery.sizeOf(context).width * pixelRatio).round();
    final isProfileStyle = style == PostCardStyle.profile;
    final accentRadius = isProfileStyle ? 16.0 : 24.0;
    final accentColor = const Color(0xFF1C1C1E);

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: isProfileStyle ? accentColor : roastWallCardBackground,
        borderRadius: BorderRadius.circular(accentRadius),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        boxShadow: isProfileStyle
            ? [
                BoxShadow(
                  color: roastWallPrimaryRed.withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () => _openPostDetail(context),
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(accentRadius),
            ),
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                isProfileStyle ? 14 : 16,
                isProfileStyle ? 14 : 16,
                isProfileStyle ? 14 : 16,
                12,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: post.isAnonymous
                            ? null
                            : () => _openProfile(context),
                        child: _AvatarWithStatus(
                          post: post,
                          radius: isProfileStyle ? 20 : 23,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: post.isAnonymous
                              ? null
                              : () => _openProfile(context),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                handle,
                                style: TextStyle(
                                  color: roastWallPrimaryRed,
                                  fontSize: isProfileStyle ? 13 : 14,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                timeago.format(post.createdAt),
                                style: const TextStyle(
                                  color: roastWallGreyText,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      IconButton(
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                        icon: const Icon(
                          Icons.more_horiz,
                          color: roastWallGreyText,
                          size: 22,
                        ),
                        onPressed: () => showPostOptionsSheet(
                          context: context,
                          post: post,
                          canDelete: canDelete,
                          onDelete: onDelete == null
                              ? null
                              : () => onDelete!.call(post),
                          onHidden: onHidden == null
                              ? null
                              : () => onHidden!.call(post),
                        ),
                      ),
                    ],
                  ),
                  if (displayContent.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Text(
                      displayContent,
                      style: const TextStyle(
                        color: roastWallWhiteText,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        height: 1.45,
                      ),
                      maxLines: 7,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (hasVoiceNote) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 9,
                      ),
                      decoration: BoxDecoration(
                        color: roastWallPrimaryRed.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: roastWallPrimaryRed.withValues(alpha: 0.22),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.mic_rounded,
                            size: 15,
                            color: roastWallPrimaryRed,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'VOICE NOTE ATTACHED',
                            style: TextStyle(
                              color: roastWallWhiteText,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.7,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (post.image != null) ...[
                    const SizedBox(height: 14),
                    PostMediaView(
                      mediaUrl: post.image!,
                      isVideo: post.isVideo,
                      cacheWidth: imageCacheWidth,
                      height: 220,
                      borderRadius: isProfileStyle ? 14 : 18,
                    ),
                  ],
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              12,
              0,
              12,
              isProfileStyle ? 10 : 12,
            ),
            child: InteractionBar(
              fireCount: post.fireCount,
              tauntCount: post.tauntCount,
              downCount: post.downCount,
              shareCount: post.shareCount,
              isFireActive: isFired,
              isDownActive: isDowned,
              onFire: () => _handleFire(context, currentUserId),
              onTaunt: () => _openComments(context),
              onDown: () => _handleDown(context, currentUserId),
              onShare: () => _handleShare(context),
              showFireButton: showFireButton,
            ),
          ),
        ],
      ),
    );
  }

  void _showAuthSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: roastWallCardBackground,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleFire(BuildContext context, String? currentUserId) async {
    if (currentUserId == null) {
      _showAuthSnack(context, 'Sign in to fire reactions.');
      return;
    }
    await onFire(post);
  }

  Future<void> _handleDown(BuildContext context, String? currentUserId) async {
    if (currentUserId == null) {
      _showAuthSnack(context, 'Sign in to react to roasts.');
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

  Future<void> _openComments(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CommentsBottomSheet(
        postId: post.id,
        onCommentAdded: () => onSync?.call(post),
        onCommentDeleted: () => onSync?.call(post),
      ),
    );
    await onSync?.call(post);
  }

  Future<void> _openPostDetail(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PostDetailScreen(post: post),
      ),
    );
    await onSync?.call(post);
  }

  void _openProfile(BuildContext context) {
    if (post.isAnonymous) {
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileScreen(userId: post.userId),
      ),
    );
  }
}

class _AvatarWithStatus extends StatelessWidget {
  const _AvatarWithStatus({
    required this.post,
    required this.radius,
  });

  final PostModel post;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        RoastAvatar(
          avatarId: post.userAvatar,
          radius: radius,
          isAnonymous: post.isAnonymous,
          fallbackSeed: post.userId,
          borderColor: roastWallPrimaryRed,
          borderWidth: 2.2,
        ),
        if (!post.isAnonymous)
          Positioned(
            right: -1,
            bottom: -1,
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: const Color(0xFF22C55E),
                shape: BoxShape.circle,
                border: Border.all(color: roastWallCardBackground, width: 2),
              ),
            ),
          ),
      ],
    );
  }
}
