import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Show the Roast Share Sheet
// ─────────────────────────────────────────────────────────────────────────────

void showRoastShareSheet({
  required BuildContext context,
  required String postId,
  required String content,
  required String handle,
  required int shareCount,
  required VoidCallback onShareComplete,
}) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    enableDrag: true,
    builder: (_) => _RoastShareSheet(
      postId: postId,
      content: content,
      handle: handle,
      shareCount: shareCount,
      onShareComplete: onShareComplete,
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Sheet Widget
// ─────────────────────────────────────────────────────────────────────────────

class _RoastShareSheet extends StatefulWidget {
  final String postId;
  final String content;
  final String handle;
  final int shareCount;
  final VoidCallback onShareComplete;

  const _RoastShareSheet({
    required this.postId,
    required this.content,
    required this.handle,
    required this.shareCount,
    required this.onShareComplete,
  });

  @override
  State<_RoastShareSheet> createState() => _RoastShareSheetState();
}

class _RoastShareSheetState extends State<_RoastShareSheet>
    with SingleTickerProviderStateMixin {
  late final AnimationController _micCtrl;
  late final Animation<double> _micOffset;
  late final Animation<double> _micRotation;
  bool _dropped = false;

  @override
  void initState() {
    super.initState();
    _micCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));

    _micOffset = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 0.0, end: -22.0)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 25),
      TweenSequenceItem(
          tween: Tween(begin: -22.0, end: 14.0)
              .chain(CurveTween(curve: Curves.bounceOut)),
          weight: 75),
    ]).animate(_micCtrl);

    _micRotation = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 0.0, end: -0.25)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 30),
      TweenSequenceItem(
          tween: Tween(begin: -0.25, end: 0.0)
              .chain(CurveTween(curve: Curves.elasticOut)),
          weight: 70),
    ]).animate(_micCtrl);
  }

  @override
  void dispose() {
    _micCtrl.dispose();
    super.dispose();
  }

  String get _shareText {
    final h = widget.handle.startsWith('@')
        ? widget.handle
        : '@${widget.handle}';
    return 'Check out this roast by $h on Tana Maaro 🔥\n\n"${widget.content}"\n\ntanamaaro.com';
  }

  void _completedShare() {
    HapticFeedback.heavyImpact();
    _micCtrl.forward(from: 0);
    setState(() => _dropped = true);
    widget.onShareComplete();
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted) Navigator.pop(context);
    });
  }

  Future<void> _copyLink() async {
    await Clipboard.setData(ClipboardData(text: _shareText));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Text('🔗', style: TextStyle(fontSize: 18)),
              SizedBox(width: 10),
              Text('Roast link copied!',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900)),
            ],
          ),
          backgroundColor: const Color(0xFF1A1A1A),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 2),
        ),
      );
    }
    _completedShare();
  }

  String get _formattedCount {
    final c = widget.shareCount;
    if (c >= 1000) return '${(c / 1000).toStringAsFixed(1)}K';
    return '$c';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0D0D0D),
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
                color: Colors.white12,
                borderRadius: BorderRadius.circular(2)),
          ),

          // ── Header ─────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 4, 24, 20),
            child: Row(
              children: [
                AnimatedBuilder(
                  animation: _micCtrl,
                  builder: (_, child) => Transform.translate(
                    offset: Offset(0, _micOffset.value),
                    child: Transform.rotate(
                        angle: _micRotation.value, child: child),
                  ),
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFCC0000), Color(0xFF880000)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withValues(alpha: 0.4),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: const Center(
                      child: Text('🎤', style: TextStyle(fontSize: 28)),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'SPREAD THE ROAST',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '🎤  $_formattedCount roasters spread this',
                        style: const TextStyle(
                            color: Colors.white38, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Content preview ─────────────────────────────────────────────
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 24, vertical: 0),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: Colors.white.withValues(alpha: 0.07)),
              ),
              child: Text(
                '"${widget.content}"',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    height: 1.4),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // ── Copy Link button or success state ───────────────────────────
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            transitionBuilder: (child, anim) =>
                FadeTransition(opacity: anim, child: child),
            child: _dropped ? _buildSuccessState() : _buildCopyLinkButton(),
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
        ],
      ),
    );
  }

  Widget _buildCopyLinkButton() {
    return Padding(
      key: const ValueKey('copy'),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GestureDetector(
        onTap: _copyLink,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFCC0000), Color(0xFF880000)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryColor.withValues(alpha: 0.3),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('🔗', style: TextStyle(fontSize: 22)),
              SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'COPY LINK',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                    ),
                  ),
                  Text(
                    'Paste anywhere to spread the roast',
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessState() {
    return Padding(
      key: const ValueKey('success'),
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
      child: Column(
        children: [
          AnimatedBuilder(
            animation: _micCtrl,
            builder: (_, child) => Transform.translate(
              offset: Offset(0, _micOffset.value * 0.5),
              child: child,
            ),
            child: const Text('🎤', style: TextStyle(fontSize: 52)),
          ),
          const SizedBox(height: 14),
          const Text(
            'MIC DROPPED.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.5,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'The roast has been spread. 🔥',
            style: TextStyle(color: Colors.white38, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
