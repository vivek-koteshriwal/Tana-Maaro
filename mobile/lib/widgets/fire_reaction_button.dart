import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// ─────────────────────────────────────────────────────────────────────────────
// 🔥  FIRE REACTION BUTTON  — single tap toggle, no tray
// ─────────────────────────────────────────────────────────────────────────────

class FireReactionButton extends StatefulWidget {
  final int count;
  final bool isActive;
  final VoidCallback onTap;

  const FireReactionButton({
    super.key,
    required this.count,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<FireReactionButton> createState() => _FireReactionButtonState();
}

class _FireReactionButtonState extends State<FireReactionButton>
    with TickerProviderStateMixin {
  late final AnimationController _bounceCtrl;
  late final Animation<double> _bounceAnim;
  late final AnimationController _particleCtrl;
  late final AnimationController _countCtrl;
  late final Animation<double> _countAnim;
  late final AnimationController _glowCtrl;
  late final Animation<double> _glowAnim;

  @override
  void initState() {
    super.initState();

    _bounceCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 380));
    _bounceAnim = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.5)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 35),
      TweenSequenceItem(
          tween: Tween(begin: 1.5, end: 0.82)
              .chain(CurveTween(curve: Curves.easeIn)),
          weight: 30),
      TweenSequenceItem(
          tween: Tween(begin: 0.82, end: 1.0)
              .chain(CurveTween(curve: Curves.elasticOut)),
          weight: 35),
    ]).animate(_bounceCtrl);

    _particleCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));

    _countCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 480));
    _countAnim = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.7)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 35),
      TweenSequenceItem(
          tween: Tween(begin: 1.7, end: 1.0)
              .chain(CurveTween(curve: Curves.bounceOut)),
          weight: 65),
    ]).animate(_countCtrl);

    _glowCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _glowAnim = Tween(begin: 0.0, end: 1.0)
        .chain(CurveTween(curve: Curves.easeOut))
        .animate(_glowCtrl);
  }

  @override
  void dispose() {
    _bounceCtrl.dispose();
    _particleCtrl.dispose();
    _countCtrl.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  void _handleTap() {
    HapticFeedback.mediumImpact();
    _bounceCtrl.forward(from: 0);
    _particleCtrl.forward(from: 0);
    _countCtrl.forward(from: 0);
    _glowCtrl.forward(from: 0).then((_) => _glowCtrl.reverse());
    widget.onTap();
  }

  String get _label {
    final c = widget.count;
    if (c >= 1000000) return '${(c / 1000000).toStringAsFixed(1)}M';
    if (c >= 1000) return '${(c / 1000).toStringAsFixed(1)}K';
    return '$c';
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.isActive;
    return GestureDetector(
      onTap: _handleTap,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // ── Fire burst particles ──────────────────────────────────────────
          AnimatedBuilder(
            animation: _particleCtrl,
            builder: (_, __) => CustomPaint(
              painter: _FireParticlePainter(_particleCtrl.value),
              size: const Size(100, 100),
            ),
          ),

          // ── Glow halo ────────────────────────────────────────────────────
          AnimatedBuilder(
            animation: _glowAnim,
            builder: (_, __) => Container(
              width: 70 * (1 + _glowAnim.value * 0.3),
              height: 36 * (1 + _glowAnim.value * 0.3),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: const Color(0xFFFF4500)
                              .withValues(alpha: _glowAnim.value * 0.55),
                          blurRadius: 20,
                          spreadRadius: 3,
                        )
                      ]
                    : null,
              ),
            ),
          ),

          // ── Button body ──────────────────────────────────────────────────
          AnimatedBuilder(
            animation: _bounceAnim,
            builder: (_, child) =>
                Transform.scale(scale: _bounceAnim.value, child: child),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 260),
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                gradient: active
                    ? const LinearGradient(
                        colors: [Color(0xFFFF4500), Color(0xFFFF8C00)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: active ? null : Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: active
                      ? Colors.transparent
                      : Colors.white.withValues(alpha: 0.1),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('🔥',
                      style: TextStyle(fontSize: active ? 19 : 17)),
                  const SizedBox(width: 7),
                  AnimatedBuilder(
                    animation: _countAnim,
                    builder: (_, child) => Transform.scale(
                        scale: _countAnim.value, child: child),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _label,
                          style: TextStyle(
                            color: active ? Colors.white : Colors.white60,
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            height: 1.0,
                          ),
                        ),
                        Text(
                          active ? 'FIRED' : 'FIRE',
                          style: TextStyle(
                            color: active
                                ? Colors.white70
                                : Colors.white24,
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 👑  CROWN REACTION BUTTON  — single tap toggle, no tray
// ─────────────────────────────────────────────────────────────────────────────

class CrownReactionButton extends StatefulWidget {
  final int count;
  final bool isActive;
  final VoidCallback onTap;

  const CrownReactionButton({
    super.key,
    required this.count,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<CrownReactionButton> createState() => _CrownReactionButtonState();
}

class _CrownReactionButtonState extends State<CrownReactionButton>
    with TickerProviderStateMixin {
  late final AnimationController _bounceCtrl;
  late final Animation<double> _bounceAnim;
  late final AnimationController _glowCtrl;
  late final Animation<double> _glowAnim;
  late final AnimationController _countCtrl;
  late final Animation<double> _countAnim;

  @override
  void initState() {
    super.initState();

    _bounceCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 420));
    _bounceAnim = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.4)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 35),
      TweenSequenceItem(
          tween: Tween(begin: 1.4, end: 0.85)
              .chain(CurveTween(curve: Curves.easeIn)),
          weight: 30),
      TweenSequenceItem(
          tween: Tween(begin: 0.85, end: 1.0)
              .chain(CurveTween(curve: Curves.elasticOut)),
          weight: 35),
    ]).animate(_bounceCtrl);

    _glowCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _glowAnim = Tween(begin: 0.0, end: 1.0)
        .chain(CurveTween(curve: Curves.easeOut))
        .animate(_glowCtrl);

    _countCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _countAnim = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.5)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 40),
      TweenSequenceItem(
          tween: Tween(begin: 1.5, end: 1.0)
              .chain(CurveTween(curve: Curves.bounceOut)),
          weight: 60),
    ]).animate(_countCtrl);
  }

  @override
  void dispose() {
    _bounceCtrl.dispose();
    _glowCtrl.dispose();
    _countCtrl.dispose();
    super.dispose();
  }

  void _handleTap() {
    HapticFeedback.mediumImpact();
    _bounceCtrl.forward(from: 0);
    _glowCtrl.forward(from: 0).then((_) => _glowCtrl.reverse());
    _countCtrl.forward(from: 0);
    widget.onTap();
  }

  String get _label {
    final c = widget.count;
    if (c >= 1000) return '${(c / 1000).toStringAsFixed(1)}K';
    return '$c';
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.isActive;
    const crownGold = Color(0xFFD4AF37);

    return GestureDetector(
      onTap: _handleTap,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // ── Gold glow halo ───────────────────────────────────────────────
          AnimatedBuilder(
            animation: _glowAnim,
            builder: (_, __) => Container(
              width: 70 * (1 + _glowAnim.value * 0.25),
              height: 36 * (1 + _glowAnim.value * 0.25),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(22),
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: crownGold
                              .withValues(alpha: _glowAnim.value * 0.5),
                          blurRadius: 18,
                          spreadRadius: 2,
                        )
                      ]
                    : null,
              ),
            ),
          ),

          // ── Button body ──────────────────────────────────────────────────
          AnimatedBuilder(
            animation: _bounceAnim,
            builder: (_, child) =>
                Transform.scale(scale: _bounceAnim.value, child: child),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 260),
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                gradient: active
                    ? const LinearGradient(
                        colors: [Color(0xFFD4AF37), Color(0xFF9A7B1C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: active ? null : Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: active
                      ? Colors.transparent
                      : Colors.white.withValues(alpha: 0.1),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('👑',
                      style: TextStyle(fontSize: active ? 19 : 17)),
                  const SizedBox(width: 7),
                  AnimatedBuilder(
                    animation: _countAnim,
                    builder: (_, child) =>
                        Transform.scale(scale: _countAnim.value, child: child),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _label,
                          style: TextStyle(
                            color: active ? Colors.white : Colors.white60,
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            height: 1.0,
                          ),
                        ),
                        Text(
                          active ? 'CROWNED' : 'CROWN',
                          style: TextStyle(
                            color: active
                                ? Colors.white70
                                : Colors.white24,
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 💬  COMMENT BUTTON
// ─────────────────────────────────────────────────────────────────────────────

class CommentButton extends StatefulWidget {
  final int count;
  final VoidCallback onTap;

  const CommentButton({super.key, required this.count, required this.onTap});

  @override
  State<CommentButton> createState() => _CommentButtonState();
}

class _CommentButtonState extends State<CommentButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 280));
    _anim = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.2)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 50),
      TweenSequenceItem(
          tween: Tween(begin: 1.2, end: 1.0)
              .chain(CurveTween(curve: Curves.easeIn)),
          weight: 50),
    ]).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  String get _label {
    final c = widget.count;
    if (c >= 1000) return '${(c / 1000).toStringAsFixed(1)}K';
    return '$c';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        _ctrl.forward(from: 0);
        widget.onTap();
      },
      child: AnimatedBuilder(
        animation: _anim,
        builder: (_, child) =>
            Transform.scale(scale: _anim.value, child: child),
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(22),
            border:
                Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('💬', style: TextStyle(fontSize: 15)),
              const SizedBox(width: 6),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _label,
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                    ),
                  ),
                  const Text(
                    'TAUNTS',
                    style: TextStyle(
                      color: Colors.white24,
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                      height: 1.2,
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
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 FIRE PARTICLE PAINTER
// ─────────────────────────────────────────────────────────────────────────────

class _FireParticlePainter extends CustomPainter {
  final double progress;

  static final _rng = Random(99);
  static final List<_Spark> _sparks = List.generate(16, (i) {
    final baseAngle = (i / 16) * 2 * pi;
    final jitter = (_rng.nextDouble() - 0.5) * 0.5;
    return _Spark(
      angle: baseAngle + jitter,
      speed: 20 + _rng.nextDouble() * 26,
      radius: 2.2 + _rng.nextDouble() * 3.4,
      color: [
        const Color(0xFFFF4500),
        const Color(0xFFFF6B35),
        const Color(0xFFFF8C00),
        const Color(0xFFFFD700),
        const Color(0xFFFF3300),
        const Color(0xFFFFA500),
        const Color(0xFFFFEC00),
        const Color(0xFFFF2200),
      ][i % 8],
    );
  });

  _FireParticlePainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0 || progress >= 1) return;

    final center = Offset(size.width / 2, size.height / 2);
    final eased = Curves.easeOut.transform(progress);
    final fade = (1 - Curves.easeIn.transform(progress)).clamp(0.0, 1.0);

    for (final s in _sparks) {
      final dist = s.speed * eased;
      canvas.drawCircle(
        Offset(center.dx + cos(s.angle) * dist,
            center.dy + sin(s.angle) * dist),
        s.radius * (1 - progress * 0.45),
        Paint()..color = s.color.withValues(alpha: fade),
      );
    }
  }

  @override
  bool shouldRepaint(_FireParticlePainter old) =>
      old.progress != progress;
}

class _Spark {
  final double angle, speed, radius;
  final Color color;
  const _Spark(
      {required this.angle,
      required this.speed,
      required this.radius,
      required this.color});
}
