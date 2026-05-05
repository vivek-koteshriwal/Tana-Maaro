import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/models/user_model.dart';
import 'package:tanamaaro_mobile/screens/profile_screen.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/services/user_service.dart';
import 'package:tanamaaro_mobile/widgets/landing_feed_card.dart';
import 'package:tanamaaro_mobile/widgets/post_action_button.dart';
import 'package:tanamaaro_mobile/widgets/post_media_view.dart';
import 'package:tanamaaro_mobile/widgets/post_options_sheet.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';
import 'package:timeago/timeago.dart' as timeago;

enum _CommentSort {
  latest,
  oldest,
}

class PostDetailScreen extends StatefulWidget {
  const PostDetailScreen({
    super.key,
    required this.post,
  });

  final PostModel post;

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  final PostService _postService = PostService();
  final UserService _userService = UserService();
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _commentFocusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _composerKey = GlobalKey();

  String? _currentUserId;
  bool _isSubmittingComment = false;
  _CommentSort _commentSort = _CommentSort.latest;

  @override
  void initState() {
    super.initState();
    _currentUserId = FirebaseAuth.instance.currentUser?.uid;
  }

  @override
  void dispose() {
    _commentController.dispose();
    _commentFocusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  bool _isLiked(PostModel post) =>
      _currentUserId != null && post.likedBy.contains(_currentUserId);

  Future<void> _handleLike(PostModel post) async {
    final uid = _currentUserId;
    if (uid == null) {
      _showSnack('Sign in to fire reactions.');
      return;
    }
    await _postService.likePost(post.id);
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

  Future<void> _handleDeletePost(PostModel post) async {
    await _postService.deletePost(post.id);
    if (mounted) {
      Navigator.pop(context);
    }
  }

  Future<void> _deleteComment(PostModel post, String commentId) async {
    final deleted = await _postService.deleteComment(post.id, commentId);
    if (!mounted) {
      return;
    }

    if (deleted) {
      _showSnack('Comment deleted.');
      return;
    }

    _showSnack('You can delete only your own comments.');
  }

  Future<void> _submitComment(PostModel post) async {
    final uid = _currentUserId;
    if (uid == null) {
      _showSnack('Sign in to drop a counter-roast.');
      return;
    }

    final content = _commentController.text.trim();
    if (content.isEmpty || _isSubmittingComment) {
      return;
    }

    setState(() => _isSubmittingComment = true);
    try {
      await _postService.addComment(post.id, content);
      _commentController.clear();
      _commentFocusNode.unfocus();
    } finally {
      if (mounted) {
        setState(() => _isSubmittingComment = false);
      }
    }
  }

  void _focusComposer({String? prefill}) {
    if (prefill != null && prefill.isNotEmpty) {
      final baseText = '@${prefill.replaceAll('@', '')} ';
      _commentController.value = TextEditingValue(
        text: baseText,
        selection: TextSelection.collapsed(offset: baseText.length),
      );
    }

    final composerContext = _composerKey.currentContext;
    if (composerContext != null) {
      Scrollable.ensureVisible(
        composerContext,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
        alignment: 0.92,
      );
    } else if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    }

    Future<void>.delayed(const Duration(milliseconds: 120), () {
      if (mounted) {
        _commentFocusNode.requestFocus();
      }
    });
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.manrope(fontWeight: FontWeight.w700),
        ),
        backgroundColor: landingSurface,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _showCommentDeleteDialog(
      PostModel post, String commentId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: landingSurface,
        title: Text(
          'Delete Comment?',
          style: GoogleFonts.epilogue(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
        content: Text(
          'This taunt will be removed permanently.',
          style: GoogleFonts.manrope(
            color: landingMuted,
            height: 1.45,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(
              'CANCEL',
              style: GoogleFonts.manrope(
                color: Colors.white54,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(
              'DELETE',
              style: GoogleFonts.manrope(
                color: landingPrimary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _deleteComment(post, commentId);
    }
  }

  List<Map<String, dynamic>> _sortedComments(
      List<Map<String, dynamic>> comments) {
    final sorted = List<Map<String, dynamic>>.from(comments);
    sorted.sort((a, b) {
      final aTime = _commentCreatedAt(a);
      final bTime = _commentCreatedAt(b);
      return _commentSort == _CommentSort.latest
          ? bTime.compareTo(aTime)
          : aTime.compareTo(bTime);
    });
    return sorted;
  }

  DateTime _commentCreatedAt(Map<String, dynamic> comment) {
    final raw = comment['createdAt'];
    if (raw is Timestamp) {
      return raw.toDate();
    }
    if (raw is DateTime) {
      return raw;
    }
    if (raw is String) {
      return DateTime.tryParse(raw) ?? DateTime.now();
    }
    if (raw is int) {
      return DateTime.fromMillisecondsSinceEpoch(raw);
    }
    if (raw is num) {
      return DateTime.fromMillisecondsSinceEpoch(raw.toInt());
    }
    return DateTime.now();
  }

  String _compactTime(DateTime value) {
    return timeago.format(value, locale: 'en_short').toUpperCase();
  }

  bool _isTrending(PostModel post) {
    final score = post.likes + (post.comments * 2) + (post.shares * 3);
    return score >= 5;
  }

  void _openProfile(String userId, {bool isAnonymous = false}) {
    if (isAnonymous || userId.isEmpty || userId == 'anon') {
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileScreen(userId: userId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<PostModel?>(
      stream: _postService.watchPost(widget.post.id),
      builder: (context, snapshot) {
        if (!snapshot.hasData &&
            snapshot.connectionState != ConnectionState.waiting) {
          return ParentBackScope(
            child: Scaffold(
              backgroundColor: landingBackground,
              body: SafeArea(
                child: Column(
                  children: [
                    _TopBar(
                      onBack: () => navigateToParentRoute(context),
                      onMore: null,
                    ),
                    Expanded(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            'This roast is no longer available.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.manrope(
                              color: landingMuted,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final post = snapshot.data ?? widget.post;
        final pixelRatio = MediaQuery.devicePixelRatioOf(context);
        final imageCacheWidth =
            (MediaQuery.sizeOf(context).width * pixelRatio).round();
        final handle = post.isAnonymous
            ? '@ANONYMOUS'
            : (post.userHandle.startsWith('@')
                ? post.userHandle.toUpperCase()
                : '@${post.userHandle.toUpperCase()}');
        final metadataPrefix = post.battleId?.isNotEmpty == true
            ? 'LIVE IN THE ARENA'
            : 'ON ROAST WALL';
        const voiceNoteMarker = '[🎤 Voice Note Attached]';
        final hasVoiceNote = post.content.contains(voiceNoteMarker);
        final displayContent =
            post.content.replaceAll(voiceNoteMarker, '').trim();

        return ParentBackScope(
          child: Scaffold(
            backgroundColor: landingBackground,
            body: SafeArea(
              child: ResponsiveContent(
                maxWidth: 620,
                child: Column(
                  children: [
                    _TopBar(
                      onBack: () => navigateToParentRoute(context),
                      onMore: () => showPostOptionsSheet(
                        context: context,
                        post: post,
                        canDelete: post.userId == _currentUserId,
                        onDelete: post.userId != _currentUserId
                            ? null
                            : () => _handleDeletePost(post),
                        onHidden: () {
                          if (mounted) {
                            Navigator.pop(context);
                          }
                        },
                      ),
                    ),
                    Expanded(
                      child: CustomScrollView(
                        controller: _scrollController,
                        keyboardDismissBehavior:
                            ScrollViewKeyboardDismissBehavior.onDrag,
                        physics: const ClampingScrollPhysics(),
                        slivers: [
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(14, 18, 14, 28),
                            sliver: SliverList(
                              delegate: SliverChildListDelegate(
                                [
                                  _AuthorHeader(
                                    post: post,
                                    handle: handle,
                                    metadata:
                                        '$metadataPrefix • ${_compactTime(post.createdAt)}',
                                    showTrending: _isTrending(post),
                                    onProfileTap: () => _openProfile(
                                      post.userId,
                                      isAnonymous: post.isAnonymous,
                                    ),
                                  ),
                                  const SizedBox(height: 18),
                                  _RoastCard(
                                    content: displayContent,
                                    hasVoiceNote: hasVoiceNote,
                                    mediaUrl: post.image,
                                    isVideo: post.isVideo,
                                    cacheWidth: imageCacheWidth,
                                  ),
                                  const SizedBox(height: 18),
                                  Row(
                                    children: [
                                      Expanded(
                                        flex: 11,
                                        child: _DetailActionButton(
                                          label: 'FIRE',
                                          count: formatCompactCount(post.likes),
                                          icon: Icons
                                              .local_fire_department_rounded,
                                          active: _isLiked(post),
                                          primary: true,
                                          onTap: () => _handleLike(post),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        flex: 11,
                                        child: _DetailActionButton(
                                          label: 'TAUNT',
                                          count:
                                              formatCompactCount(post.comments),
                                          icon: Icons.psychology_alt_outlined,
                                          onTap: _focusComposer,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        flex: 6,
                                        child: _DetailActionButton(
                                          label: '',
                                          count: '',
                                          icon: Icons.share_rounded,
                                          compact: true,
                                          onTap: () => _handleShare(post),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 34),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'THE BATTLE LOG',
                                          style: GoogleFonts.epilogue(
                                            color: Colors.white,
                                            fontSize: 24,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: -1.2,
                                          ),
                                        ),
                                      ),
                                      PopupMenuButton<_CommentSort>(
                                        color: landingSurface,
                                        surfaceTintColor: Colors.transparent,
                                        initialValue: _commentSort,
                                        onSelected: (value) {
                                          setState(() => _commentSort = value);
                                        },
                                        itemBuilder: (_) => [
                                          PopupMenuItem(
                                            value: _CommentSort.latest,
                                            child: Text(
                                              'Latest',
                                              style: GoogleFonts.manrope(
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ),
                                          PopupMenuItem(
                                            value: _CommentSort.oldest,
                                            child: Text(
                                              'Oldest',
                                              style: GoogleFonts.manrope(
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ),
                                        ],
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              _commentSort ==
                                                      _CommentSort.latest
                                                  ? 'LATEST'
                                                  : 'OLDEST',
                                              style: GoogleFonts.manrope(
                                                color: landingMuted,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w800,
                                                letterSpacing: 1.1,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            const Icon(
                                              Icons.expand_more_rounded,
                                              color: landingMuted,
                                              size: 18,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 18),
                                  StreamBuilder<UserModel?>(
                                    stream: _currentUserId == null
                                        ? Stream<UserModel?>.value(null)
                                        : _userService
                                            .getUserData(_currentUserId!),
                                    builder: (context, userSnapshot) {
                                      return _CommentComposer(
                                        key: _composerKey,
                                        userId: _currentUserId ?? 'guest',
                                        user: userSnapshot.data,
                                        controller: _commentController,
                                        focusNode: _commentFocusNode,
                                        isSubmitting: _isSubmittingComment,
                                        onSend: () => _submitComment(post),
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 18),
                                  StreamBuilder<List<Map<String, dynamic>>>(
                                    stream: _postService.getComments(post.id),
                                    builder: (context, snapshot) {
                                      final comments = _sortedComments(
                                          snapshot.data ?? const []);
                                      if (comments.isEmpty) {
                                        return Padding(
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 22,
                                          ),
                                          child: Text(
                                            'No counter-roasts yet. Drop the first one.',
                                            style: GoogleFonts.manrope(
                                              color: landingMuted,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        );
                                      }

                                      return _BattleLog(
                                        comments: comments,
                                        currentUserId: _currentUserId,
                                        onProfileTap: (userId, isAnonymous) =>
                                            _openProfile(
                                          userId,
                                          isAnonymous: isAnonymous,
                                        ),
                                        onReplyTap: (handleValue) =>
                                            _focusComposer(
                                                prefill: handleValue),
                                        onDeleteTap: (commentId) =>
                                            _showCommentDeleteDialog(
                                          post,
                                          commentId,
                                        ),
                                        formatTime: _compactTime,
                                        commentCreatedAt: _commentCreatedAt,
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 36),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.onBack,
    this.onMore,
  });

  final VoidCallback onBack;
  final VoidCallback? onMore;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 4, 6, 0),
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            splashRadius: 20,
            icon: const Icon(
              Icons.arrow_back_rounded,
              color: landingMuted,
              size: 28,
            ),
          ),
          Expanded(
            child: Text(
              'ROAST',
              style: GoogleFonts.epilogue(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.8,
              ),
            ),
          ),
          IconButton(
            onPressed: onMore,
            splashRadius: 20,
            icon: Icon(
              Icons.more_vert_rounded,
              color: onMore == null ? Colors.transparent : landingMuted,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthorHeader extends StatelessWidget {
  const _AuthorHeader({
    required this.post,
    required this.handle,
    required this.metadata,
    required this.showTrending,
    required this.onProfileTap,
  });

  final PostModel post;
  final String handle;
  final String metadata;
  final bool showTrending;
  final VoidCallback onProfileTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: onProfileTap,
          child: Container(
            width: 56,
            height: 56,
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: landingPrimarySoft, width: 2),
              boxShadow: [
                BoxShadow(
                  color: landingPrimary.withValues(alpha: 0.16),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: RoastAvatar(
              avatarId: post.userAvatar,
              radius: 25,
              isAnonymous: post.isAnonymous,
              fallbackSeed: post.userId,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: GestureDetector(
            onTap: onProfileTap,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  handle,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.epilogue(
                    color: landingPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  metadata,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.manrope(
                    color: landingMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.9,
                  ),
                ),
              ],
            ),
          ),
        ),
        if (showTrending)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: landingPrimary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: landingPrimary.withValues(alpha: 0.16),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(
                    color: landingPrimarySoft,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'TRENDING',
                  style: GoogleFonts.manrope(
                    color: landingPrimarySoft,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _RoastCard extends StatelessWidget {
  const _RoastCard({
    required this.content,
    required this.hasVoiceNote,
    required this.mediaUrl,
    required this.isVideo,
    required this.cacheWidth,
  });

  final String content;
  final bool hasVoiceNote;
  final String? mediaUrl;
  final bool isVideo;
  final int cacheWidth;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: landingSurface,
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.format_quote_rounded,
            color: landingPrimary.withValues(alpha: 0.56),
            size: 44,
          ),
          if (content.isNotEmpty)
            Text(
              '"$content"',
              style: GoogleFonts.epilogue(
                color: Colors.white,
                fontSize: ResponsiveLayout.isTablet(context) ? 32 : 24,
                fontWeight: FontWeight.w900,
                height: 1.12,
                letterSpacing: -1.1,
              ),
            ),
          if (hasVoiceNote) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
              decoration: BoxDecoration(
                color: landingPrimary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.mic_rounded,
                    color: landingPrimarySoft,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'VOICE NOTE ATTACHED',
                    style: GoogleFonts.manrope(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (mediaUrl != null && mediaUrl!.trim().isNotEmpty) ...[
            const SizedBox(height: 18),
            PostMediaView(
              mediaUrl: mediaUrl!,
              isVideo: isVideo,
              cacheWidth: cacheWidth,
              height: 240,
              borderRadius: 18,
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailActionButton extends StatelessWidget {
  const _DetailActionButton({
    required this.label,
    required this.count,
    required this.icon,
    required this.onTap,
    this.primary = false,
    this.compact = false,
    this.active = false,
  });

  final String label;
  final String count;
  final IconData icon;
  final VoidCallback onTap;
  final bool primary;
  final bool compact;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final background =
        primary ? landingPrimarySoft : Colors.white.withValues(alpha: 0.05);
    final foreground = primary ? const Color(0xFF53090F) : Colors.white;

    return SizedBox(
      height: compact ? 74 : 78,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(16),
              border: primary
                  ? null
                  : Border.all(color: Colors.white.withValues(alpha: 0.12)),
              boxShadow: primary || active
                  ? [
                      BoxShadow(
                        color: landingPrimary.withValues(alpha: 0.16),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ]
                  : null,
            ),
            padding: EdgeInsets.symmetric(
              horizontal: compact ? 0 : 10,
              vertical: compact ? 0 : 8,
            ),
            child: compact
                ? Center(
                    child: Icon(
                      icon,
                      color: foreground,
                      size: 22,
                    ),
                  )
                : Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          icon,
                          color: foreground,
                          size: 17,
                        ),
                        const SizedBox(height: 4),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                label,
                                style: GoogleFonts.epilogue(
                                  color: foreground,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.2,
                                ),
                              ),
                              if (count.isNotEmpty) ...[
                                const SizedBox(width: 6),
                                Text(
                                  count,
                                  style: GoogleFonts.manrope(
                                    color: primary
                                        ? foreground.withValues(alpha: 0.84)
                                        : landingMuted,
                                    fontSize: 9.6,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class _CommentComposer extends StatelessWidget {
  const _CommentComposer({
    super.key,
    required this.userId,
    required this.user,
    required this.controller,
    required this.focusNode,
    required this.isSubmitting,
    required this.onSend,
  });

  final String userId;
  final UserModel? user;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isSubmitting;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final isFocused = focusNode.hasFocus;

    return Container(
      decoration: BoxDecoration(
        color: landingSurfaceHigh,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          RoastAvatar(
            avatarId: user?.profileImage ?? '',
            radius: 21,
            fallbackSeed: userId,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                minHeight: 54,
                maxHeight: 120,
              ),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.02),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isFocused
                        ? landingPrimary.withValues(alpha: 0.30)
                        : Colors.white.withValues(alpha: 0.08),
                    width: 1,
                  ),
                ),
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  minLines: 1,
                  maxLines: null,
                  scrollPhysics: const ClampingScrollPhysics(),
                  textAlignVertical: TextAlignVertical.top,
                  cursorColor: landingPrimary,
                  textCapitalization: TextCapitalization.sentences,
                  style: GoogleFonts.epilogue(
                    color: Colors.white,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.1,
                    height: 1.25,
                  ),
                  onSubmitted: (_) => onSend(),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 14,
                    ),
                    hintText: 'DROP A COUNTER-ROAST...',
                    hintStyle: GoogleFonts.epilogue(
                      color: Colors.white.withValues(alpha: 0.24),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.1,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: isSubmitting ? null : onSend,
              borderRadius: BorderRadius.circular(999),
              child: Ink(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: landingPrimary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isSubmitting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: landingPrimarySoft,
                          ),
                        )
                      : const Icon(
                          Icons.send_rounded,
                          color: landingPrimary,
                          size: 18,
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BattleLog extends StatelessWidget {
  const _BattleLog({
    required this.comments,
    required this.currentUserId,
    required this.onProfileTap,
    required this.onReplyTap,
    required this.onDeleteTap,
    required this.formatTime,
    required this.commentCreatedAt,
  });

  final List<Map<String, dynamic>> comments;
  final String? currentUserId;
  final void Function(String userId, bool isAnonymous) onProfileTap;
  final void Function(String handle) onReplyTap;
  final void Function(String commentId) onDeleteTap;
  final String Function(DateTime value) formatTime;
  final DateTime Function(Map<String, dynamic> comment) commentCreatedAt;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        if (comments.length > 1)
          Positioned(
            left: 20,
            top: 14,
            bottom: 20,
            child: Container(
              width: 1,
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
        Column(
          children: [
            for (var index = 0; index < comments.length; index++) ...[
              _CommentThreadItem(
                comment: comments[index],
                isOwner: comments[index]['userId'] == currentUserId,
                onProfileTap: onProfileTap,
                onReplyTap: onReplyTap,
                onDeleteTap: onDeleteTap,
                timestamp: formatTime(commentCreatedAt(comments[index])),
              ),
              if (index != comments.length - 1) const SizedBox(height: 26),
            ],
          ],
        ),
      ],
    );
  }
}

class _CommentThreadItem extends StatelessWidget {
  const _CommentThreadItem({
    required this.comment,
    required this.isOwner,
    required this.onProfileTap,
    required this.onReplyTap,
    required this.onDeleteTap,
    required this.timestamp,
  });

  final Map<String, dynamic> comment;
  final bool isOwner;
  final void Function(String userId, bool isAnonymous) onProfileTap;
  final void Function(String handle) onReplyTap;
  final void Function(String commentId) onDeleteTap;
  final String timestamp;

  @override
  Widget build(BuildContext context) {
    final rawHandle = (comment['userHandle'] as String? ?? '@anon');
    final displayHandle = rawHandle.startsWith('@')
        ? rawHandle.toUpperCase()
        : '@${rawHandle.toUpperCase()}';
    final userId = (comment['userId'] as String? ?? '');
    final isAnonymous =
        userId == 'anon' || displayHandle.toLowerCase() == '@anonymous';
    final likesCount = (comment['likes'] as num?)?.toInt() ?? 0;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => onProfileTap(userId, isAnonymous),
          child: RoastAvatar(
            avatarId: comment['userAvatar'] as String? ?? '',
            radius: 20,
            isAnonymous: isAnonymous,
            fallbackSeed: userId,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: landingSurface,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(8),
                    topRight: Radius.circular(18),
                    bottomLeft: Radius.circular(18),
                    bottomRight: Radius.circular(18),
                  ),
                  border: likesCount > 0
                      ? Border(
                          left: BorderSide(
                            color: landingPrimarySoft.withValues(alpha: 0.55),
                            width: 2,
                          ),
                        )
                      : null,
                ),
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            displayHandle,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.epilogue(
                              color: landingPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          timestamp,
                          style: GoogleFonts.manrope(
                            color: landingMuted,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        if (isOwner) ...[
                          const SizedBox(width: 4),
                          PopupMenuButton<String>(
                            padding: EdgeInsets.zero,
                            iconSize: 18,
                            color: landingSurfaceHigh,
                            surfaceTintColor: Colors.transparent,
                            icon: const Icon(
                              Icons.more_horiz_rounded,
                              color: landingMuted,
                            ),
                            onSelected: (value) {
                              if (value == 'delete') {
                                onDeleteTap(comment['id'] as String);
                              }
                            },
                            itemBuilder: (_) => [
                              PopupMenuItem(
                                value: 'delete',
                                child: Text(
                                  'Delete comment',
                                  style: GoogleFonts.manrope(
                                    color: landingPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      comment['content'] as String? ?? '',
                      style: GoogleFonts.manrope(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        height: 1.55,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  if (likesCount > 0) ...[
                    Icon(
                      Icons.local_fire_department_rounded,
                      size: 15,
                      color: likesCount > 0 ? landingPrimarySoft : landingMuted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      formatCompactCount(likesCount),
                      style: GoogleFonts.manrope(
                        color:
                            likesCount > 0 ? landingPrimarySoft : landingMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: 20),
                  ],
                  GestureDetector(
                    onTap: () => onReplyTap(rawHandle),
                    child: Text(
                      'REPLY',
                      style: GoogleFonts.manrope(
                        color: landingMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
