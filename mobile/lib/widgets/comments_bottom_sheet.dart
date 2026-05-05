import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/widgets/roast_emoji_tray.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';
import 'package:timeago/timeago.dart' as timeago;

class CommentsBottomSheet extends StatefulWidget {
  final String postId;
  final VoidCallback? onCommentAdded;
  final VoidCallback? onCommentDeleted;

  const CommentsBottomSheet({
    super.key,
    required this.postId,
    this.onCommentAdded,
    this.onCommentDeleted,
  });

  @override
  State<CommentsBottomSheet> createState() => _CommentsBottomSheetState();
}

class _CommentsBottomSheetState extends State<CommentsBottomSheet> {
  final TextEditingController _commentController = TextEditingController();
  final PostService _postService = PostService();
  bool _isSubmitting = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _currentUserId = FirebaseAuth.instance.currentUser?.uid;
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: AppTheme.darkGrey,
        borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20), topRight: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
                color: Colors.white24, borderRadius: BorderRadius.circular(2)),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20.0),
            child: Text('ROASTS IN THE RING',
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 1.2)),
          ),
          const Divider(color: Colors.white10, height: 24),

          Expanded(
            child: StreamBuilder<List<Map<String, dynamic>>>(
              stream: _postService.getComments(widget.postId),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                      child: CircularProgressIndicator(
                          color: AppTheme.primaryColor));
                }

                final comments = snapshot.data ?? [];

                if (comments.isEmpty) {
                  return const Center(
                    child: Text('No roasts here yet. Be the first!',
                        style: TextStyle(color: Colors.white24)),
                  );
                }

                return ListView.builder(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  itemCount: comments.length,
                  itemBuilder: (context, index) {
                    final comment = comments[index];
                    final handle = comment['userHandle'] ?? 'anon';
                    final displayHandle =
                        handle.startsWith('@') ? handle : '@$handle';
                    final isOwner = comment['userId'] == _currentUserId;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 20.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          RoastAvatar(
                            avatarId: comment['userAvatar'] as String? ?? '',
                            radius: 16,
                            fallbackSeed: comment['userId'] as String?,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(displayHandle,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w900,
                                            fontSize: 14,
                                            color: AppTheme.primaryColor)),
                                    const SizedBox(width: 8),
                                    Text(
                                      comment['createdAt'] != null
                                          ? timeago.format(
                                              comment['createdAt'].toDate())
                                          : 'just now',
                                      style: const TextStyle(
                                          color: Colors.white24, fontSize: 11),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(comment['content'] ?? '',
                                    style: const TextStyle(
                                        color: Colors.white, fontSize: 14)),
                              ],
                            ),
                          ),
                          if (isOwner)
                            PopupMenuButton<String>(
                              icon: const Icon(
                                Icons.more_horiz,
                                color: Colors.white24,
                                size: 20,
                              ),
                              color: const Color(0xFF1A1A1A),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              onSelected: (value) async {
                                if (value != 'delete') return;
                                await _confirmDeleteComment(comment['id']);
                              },
                              itemBuilder: (_) => const [
                                PopupMenuItem(
                                  value: 'delete',
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.delete_outline,
                                        color: Colors.redAccent,
                                        size: 18,
                                      ),
                                      SizedBox(width: 10),
                                      Text(
                                        'Delete Comment',
                                        style: TextStyle(
                                          color: Colors.redAccent,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),

          // Comment Input + emoji tray
          Container(
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border(
                  top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                RoastEmojiTray(controller: _commentController),
                Padding(
                  padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).viewInsets.bottom + 12,
                      left: 16,
                      right: 16,
                      top: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _commentController,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 15),
                          decoration: InputDecoration(
                            hintText: 'Drop a taunt...',
                            hintStyle: const TextStyle(color: Colors.grey),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(30),
                                borderSide: BorderSide.none),
                            fillColor: Colors.white.withValues(alpha: 0.05),
                            filled: true,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      IconButton(
                        onPressed: _isSubmitting
                            ? null
                            : () async {
                                if (_commentController.text.trim().isEmpty)
                                  return;
                                setState(() => _isSubmitting = true);
                                await _postService.addComment(widget.postId,
                                    _commentController.text.trim());
                                _commentController.clear();
                                widget.onCommentAdded?.call();
                                setState(() => _isSubmitting = false);
                              },
                        icon: Icon(Icons.send,
                            color: _isSubmitting
                                ? Colors.grey
                                : AppTheme.primaryColor),
                      ),
                    ],
                  ), // Row
                ), // Padding
              ], // inner Column.children
            ), // inner Column
          ), // inner Container
        ], // outer Column.children
      ), // outer Column
    ); // return Container
  }

  Future<void> _confirmDeleteComment(String commentId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF171717),
        title: const Text(
          'Delete Comment?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
        ),
        content: const Text(
          'This taunt will be removed permanently.',
          style: TextStyle(color: Colors.white60),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text(
              'CANCEL',
              style: TextStyle(color: Colors.white38),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text(
              'DELETE',
              style: TextStyle(
                color: Colors.redAccent,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final deleted = await _postService.deleteComment(widget.postId, commentId);
    if (!mounted) return;

    if (deleted) {
      widget.onCommentDeleted?.call();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Comment deleted'),
          backgroundColor: Color(0xFF1A1A1A),
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('You can delete only your own comments.'),
        backgroundColor: Color(0xFF1A1A1A),
      ),
    );
  }
}
