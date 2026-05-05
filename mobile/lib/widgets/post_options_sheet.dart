import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/models/user_model.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/services/user_service.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';

Future<void> showPostOptionsSheet({
  required BuildContext context,
  required PostModel post,
  bool canDelete = false,
  Future<void> Function()? onDelete,
  VoidCallback? onHidden,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => _PostOptionsSheet(
      parentContext: context,
      post: post,
      canDelete: canDelete,
      onDelete: onDelete,
      onHidden: onHidden,
    ),
  );
}

class _PostOptionsSheet extends StatelessWidget {
  final BuildContext parentContext;
  final PostModel post;
  final bool canDelete;
  final Future<void> Function()? onDelete;
  final VoidCallback? onHidden;

  const _PostOptionsSheet({
    required this.parentContext,
    required this.post,
    required this.canDelete,
    this.onDelete,
    this.onHidden,
  });

  @override
  Widget build(BuildContext context) {
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;
    final userService = UserService();
    final postService = PostService();
    final canFollow = !post.isAnonymous &&
        post.userId.isNotEmpty &&
        post.userId != currentUserId;

    return SafeArea(
      top: false,
      child: Container(
        decoration: const BoxDecoration(
          color: AppTheme.darkGrey,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 10),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 18),
              child: Row(
                children: [
                  RoastAvatar(
                    avatarId: post.userAvatar,
                    radius: 20,
                    isAnonymous: post.isAnonymous,
                    fallbackSeed: post.userId,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      post.isAnonymous
                          ? '@ANONYMOUS'
                          : post.userHandle.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        letterSpacing: 1,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            if (canFollow)
              StreamBuilder<bool>(
                stream: userService.isFollowing(post.userId),
                builder: (context, snapshot) {
                  final following = snapshot.data ?? false;
                  return _OptionTile(
                    icon: following
                        ? Icons.person_remove_alt_1
                        : Icons.person_add_alt_1,
                    title: following ? 'Unfollow Roaster' : 'Follow',
                    subtitle: following
                        ? 'Remove this roaster from your following list.'
                        : 'Follow this roaster directly from the post.',
                    onTap: () async {
                      Navigator.pop(context);
                      await userService.toggleFollow(post.userId, following);
                      if (!parentContext.mounted) return;
                      _showSnack(
                        parentContext,
                        following ? 'Roaster unfollowed.' : 'Roaster followed.',
                      );
                    },
                  );
                },
              ),
            _OptionTile(
              icon: Icons.link_rounded,
              title: 'Copy Link',
              subtitle: 'Copy the shareable link for this roast.',
              onTap: () async {
                await Clipboard.setData(
                  ClipboardData(
                    text: DeepLinkService.buildPostLinkText(post),
                  ),
                );
                await DeepLinkService.trackShare(
                  targetType: 'post',
                  targetId: post.id,
                  appLink: DeepLinkService.postUri(post.id),
                  fallbackLink: DeepLinkService.postShareUri(post.id),
                  destination: 'copy_link',
                  extra: {
                    'ownerId': post.userId,
                  },
                );
                await postService.sharePost(post.id);
                if (context.mounted) {
                  Navigator.pop(context);
                }
                if (!parentContext.mounted) return;
                _showSnack(parentContext, 'Post link copied.');
              },
            ),
            _OptionTile(
              icon: Icons.ios_share_rounded,
              title: 'Share',
              subtitle: 'Share this roast through any app on your phone.',
              onTap: () async {
                if (context.mounted) {
                  Navigator.pop(context);
                }
                await Share.share(
                  DeepLinkService.buildPostShareText(post),
                );
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
                await postService.sharePost(post.id);
                _showInternalSharePrompt(postService);
              },
            ),
            _OptionTile(
              icon: Icons.visibility_off_outlined,
              title: 'Not Interested',
              subtitle: 'Hide this roast from your feed.',
              onTap: () async {
                await postService.hidePost(post.id);
                if (context.mounted) Navigator.pop(context);
                onHidden?.call();
                if (!parentContext.mounted) return;
                _showUndoHideSnack(parentContext, post.id);
              },
            ),
            // ── Block / Mute — only for other users' posts ──────────────
            if (canFollow) ...[
              StreamBuilder<bool>(
                stream: userService.isBlocked(post.userId),
                builder: (context, snapshot) {
                  final blocked = snapshot.data ?? false;
                  return _OptionTile(
                    icon: blocked
                        ? Icons.do_not_disturb_off_outlined
                        : Icons.block_rounded,
                    title: blocked ? 'Unblock User' : 'Block User',
                    subtitle: blocked
                        ? 'Allow this user to interact with you again.'
                        : 'Block this user — their posts will disappear.',
                    titleColor:
                        blocked ? Colors.white : Colors.orangeAccent,
                    iconColor:
                        blocked ? Colors.white70 : Colors.orangeAccent,
                    onTap: () async {
                      if (blocked) {
                        await userService.unblockUser(post.userId);
                      } else {
                        await userService.blockUser(post.userId);
                      }
                      if (context.mounted) Navigator.pop(context);
                      if (!parentContext.mounted) return;
                      _showSnack(
                        parentContext,
                        blocked ? 'User unblocked.' : 'User blocked.',
                      );
                    },
                  );
                },
              ),
              StreamBuilder<bool>(
                stream: userService.isMuted(post.userId),
                builder: (context, snapshot) {
                  final muted = snapshot.data ?? false;
                  return _OptionTile(
                    icon: muted
                        ? Icons.volume_up_outlined
                        : Icons.volume_off_outlined,
                    title: muted ? 'Unmute User' : 'Mute User',
                    subtitle: muted
                        ? 'Show this user\'s posts in your feed again.'
                        : 'Hide this user\'s posts from your feed silently.',
                    onTap: () async {
                      if (muted) {
                        await userService.unmuteUser(post.userId);
                      } else {
                        await userService.muteUser(post.userId);
                      }
                      if (context.mounted) Navigator.pop(context);
                      if (!parentContext.mounted) return;
                      _showSnack(
                        parentContext,
                        muted ? 'User unmuted.' : 'User muted.',
                      );
                    },
                  );
                },
              ),
            ],
            _OptionTile(
              icon: Icons.flag_outlined,
              title: 'Report Post',
              subtitle: 'Report this content for review.',
              onTap: () async {
                final report = await showModalBottomSheet<_ReportPayload>(
                  context: context,
                  backgroundColor: Colors.transparent,
                  isScrollControlled: true,
                  builder: (_) => _ReportPostSheet(post: post),
                );
                if (report == null) return;

                await postService.reportPost(
                  post: post,
                  reason: report.reason,
                  details: report.details,
                );
                if (context.mounted) Navigator.pop(context);
                if (!parentContext.mounted) return;
                _showSnack(parentContext, 'Report submitted.');
              },
            ),
            // ── Owner-only actions ───────────────────────────────────────
            if (canDelete) ...[
              _OptionTile(
                icon: Icons.edit_outlined,
                title: 'Edit Post',
                subtitle: 'Rewrite or fix your roast.',
                onTap: () async {
                  Navigator.pop(context);
                  if (!parentContext.mounted) return;
                  await showModalBottomSheet<void>(
                    context: parentContext,
                    backgroundColor: Colors.transparent,
                    isScrollControlled: true,
                    builder: (_) => _EditPostSheet(
                      post: post,
                      postService: postService,
                      onSaved: () {
                        if (!parentContext.mounted) return;
                        _showSnack(parentContext, 'Roast updated.');
                      },
                    ),
                  );
                },
              ),
              _OptionTile(
                icon: Icons.delete_outline,
                title: 'Delete Post',
                subtitle: 'Remove this roast permanently.',
                titleColor: Colors.redAccent,
                iconColor: Colors.redAccent,
                onTap: () async {
                  Navigator.pop(context);
                  await onDelete?.call();
                },
              ),
            ],
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF1A1A1A),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showUndoHideSnack(BuildContext context, String postId) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Post hidden from your feed.'),
        backgroundColor: const Color(0xFF1A1A1A),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'UNDO',
          textColor: AppTheme.primaryColor,
          onPressed: () {
            PostService().unhidePost(postId);
          },
        ),
      ),
    );
  }

  void _showInternalSharePrompt(PostService postService) {
    if (!parentContext.mounted || FirebaseAuth.instance.currentUser == null) {
      return;
    }

    final messenger = ScaffoldMessenger.of(parentContext);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: const Text('Need to share inside Tana Maaro too?'),
        backgroundColor: const Color(0xFF1A1A1A),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'PICK USER',
          textColor: AppTheme.primaryColor,
          onPressed: () {
            _sharePostInternally(postService);
          },
        ),
      ),
    );
  }

  Future<void> _sharePostInternally(PostService postService) async {
    final selectedUser = await showModalBottomSheet<UserModel>(
      context: parentContext,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _InternalShareSheet(post: post),
    );
    if (selectedUser == null) return;

    await postService.sharePostInternally(
      post: post,
      recipientUserId: selectedUser.uid,
    );
    await DeepLinkService.trackShare(
      targetType: 'post',
      targetId: post.id,
      appLink: DeepLinkService.postUri(post.id),
      fallbackLink: DeepLinkService.postShareUri(post.id),
      destination: 'internal',
      extra: {
        'ownerId': post.userId,
        'recipientUserId': selectedUser.uid,
      },
    );
    if (!parentContext.mounted) return;
    _showSnack(
      parentContext,
      'Shared with @${selectedUser.handle}.',
    );
  }
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color? titleColor;
  final Color? iconColor;
  final Future<void> Function() onTap;

  const _OptionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.titleColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Icon(
        icon,
        color: iconColor ?? Colors.white70,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: titleColor ?? Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: 14,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          color: Colors.white38,
          fontSize: 12,
          height: 1.35,
        ),
      ),
      onTap: () => onTap(),
    );
  }
}

class _InternalShareSheet extends StatefulWidget {
  final PostModel post;

  const _InternalShareSheet({
    required this.post,
  });

  @override
  State<_InternalShareSheet> createState() => _InternalShareSheetState();
}

class _InternalShareSheetState extends State<_InternalShareSheet> {
  final UserService _userService = UserService();
  final TextEditingController _searchController = TextEditingController();
  late Future<List<UserModel>> _resultsFuture;

  @override
  void initState() {
    super.initState();
    _resultsFuture = _userService.searchUsers('');
    _searchController.addListener(_handleQueryChanged);
  }

  @override
  void dispose() {
    _searchController
      ..removeListener(_handleQueryChanged)
      ..dispose();
    super.dispose();
  }

  void _handleQueryChanged() {
    setState(() {
      _resultsFuture = _userService.searchUsers(_searchController.text);
    });
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;
    return SafeArea(
      top: false,
      child: Container(
        height: MediaQuery.sizeOf(context).height * 0.74,
        decoration: const BoxDecoration(
          color: AppTheme.darkGrey,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 10),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Text(
                'SHARE INSIDE TANA MAARO',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                  letterSpacing: 1.4,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search roasters...',
                  hintStyle: const TextStyle(color: Colors.white24),
                  prefixIcon:
                      const Icon(Icons.search, color: Colors.white38, size: 20),
                  filled: true,
                  fillColor: Colors.black,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: FutureBuilder<List<UserModel>>(
                future: _resultsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.primaryColor,
                      ),
                    );
                  }

                  final users = (snapshot.data ?? [])
                      .where((user) => user.uid != currentUserId)
                      .toList(growable: false);

                  if (users.isEmpty) {
                    return const Center(
                      child: Text(
                        'No roasters found.',
                        style: TextStyle(color: Colors.white24),
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                    itemCount: users.length,
                    separatorBuilder: (_, __) =>
                        const Divider(color: Colors.white10, height: 1),
                    itemBuilder: (context, index) {
                      final user = users[index];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 6,
                        ),
                        leading: RoastAvatar(
                          avatarId: user.profileImage,
                          radius: 22,
                          fallbackSeed: user.uid,
                        ),
                        title: Text(
                          '@${user.handle}'.toUpperCase(),
                          style: const TextStyle(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          user.bio ?? 'Tana Maaro Challenger',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                        trailing: const Icon(
                          Icons.send_rounded,
                          color: Colors.white38,
                          size: 18,
                        ),
                        onTap: () => Navigator.pop(context, user),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportPayload {
  final String reason;
  final String details;

  const _ReportPayload({
    required this.reason,
    required this.details,
  });
}

class _ReportPostSheet extends StatefulWidget {
  final PostModel post;

  const _ReportPostSheet({
    required this.post,
  });

  @override
  State<_ReportPostSheet> createState() => _ReportPostSheetState();
}

class _ReportPostSheetState extends State<_ReportPostSheet> {
  static const List<String> _reasons = [
    'Harassment or bullying',
    'Hate speech',
    'Spam or scam',
    'Sexual content',
    'Violence or threats',
    'Other',
  ];

  final TextEditingController _detailsController = TextEditingController();
  String _selectedReason = _reasons.first;

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        decoration: const BoxDecoration(
          color: AppTheme.darkGrey,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            12,
            20,
            MediaQuery.viewInsetsOf(context).bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const Text(
                'REPORT POST',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Choose the reason that best matches this content.',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _reasons.map((reason) {
                  final selected = reason == _selectedReason;
                  return ChoiceChip(
                    label: Text(reason),
                    selected: selected,
                    selectedColor:
                        AppTheme.primaryColor.withValues(alpha: 0.18),
                    backgroundColor: Colors.black,
                    side: BorderSide(
                      color: selected
                          ? AppTheme.primaryColor
                          : Colors.white.withValues(alpha: 0.08),
                    ),
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : Colors.white70,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (_) {
                      setState(() {
                        _selectedReason = reason;
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _detailsController,
                minLines: 3,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Add more details (optional)',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: Colors.black,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(
                      context,
                      _ReportPayload(
                        reason: _selectedReason,
                        details: _detailsController.text.trim(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'SUBMIT REPORT',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Post Sheet
// ─────────────────────────────────────────────────────────────────────────────

class _EditPostSheet extends StatefulWidget {
  final PostModel post;
  final PostService postService;
  final VoidCallback onSaved;

  const _EditPostSheet({
    required this.post,
    required this.postService,
    required this.onSaved,
  });

  @override
  State<_EditPostSheet> createState() => _EditPostSheetState();
}

class _EditPostSheetState extends State<_EditPostSheet> {
  late final TextEditingController _controller;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.post.content);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final text = _controller.text.trim();
    if (text.isEmpty || text == widget.post.content.trim()) {
      Navigator.pop(context);
      return;
    }
    setState(() => _saving = true);
    try {
      await widget.postService.updatePost(widget.post.id, text);
      if (mounted) Navigator.pop(context);
      widget.onSaved();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$e'),
            backgroundColor: Colors.red[900],
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Container(
          decoration: const BoxDecoration(
            color: AppTheme.darkGrey,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 18),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const Text(
                  'EDIT ROAST',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _controller,
                  autofocus: true,
                  maxLines: 6,
                  minLines: 3,
                  maxLength: PostService.maxPostLength,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    height: 1.55,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Rewrite your roast…',
                    hintStyle: const TextStyle(color: Colors.white24),
                    filled: true,
                    fillColor: Colors.black,
                    counterStyle:
                        const TextStyle(color: Colors.white38, fontSize: 11),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(
                          color: AppTheme.primaryColor, width: 1),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'SAVE CHANGES',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
