import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/avatar_config.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';

/// A roast-culture emoji tray that inserts emojis at the cursor position.
///
/// Renders as a compact horizontal strip. Tap the expand button to reveal
/// the full 5-column grid panel — tap again (or tap outside) to collapse.
class RoastEmojiTray extends StatefulWidget {
  final TextEditingController controller;

  const RoastEmojiTray({super.key, required this.controller});

  @override
  State<RoastEmojiTray> createState() => _RoastEmojiTrayState();
}

class _RoastEmojiTrayState extends State<RoastEmojiTray>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;
  late AnimationController _anim;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _fade = CurvedAnimation(parent: _anim, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _expanded = !_expanded);
    _expanded ? _anim.forward() : _anim.reverse();
  }

  void _insert(String emoji) {
    final ctrl = widget.controller;
    final text = ctrl.text;
    final sel = ctrl.selection;
    final start = sel.start < 0 ? text.length : sel.start;
    final end = sel.end < 0 ? text.length : sel.end;
    final newText = text.replaceRange(start, end, emoji);
    ctrl.value = ctrl.value.copyWith(
      text: newText,
      selection: TextSelection.collapsed(offset: start + emoji.length),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // ── Horizontal strip + expand toggle ───────────────────────────────
        Container(
          height: 46,
          decoration: BoxDecoration(
            color: const Color(0xFF0D0D0D),
            border: Border(
              top: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  itemCount: kRoastEmojis.length,
                  itemBuilder: (_, i) => InkWell(
                    onTap: () => _insert(kRoastEmojis[i]),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 5),
                      child: Text(kRoastEmojis[i],
                          style: const TextStyle(fontSize: 22)),
                    ),
                  ),
                ),
              ),
              // Expand / collapse
              GestureDetector(
                onTap: _toggle,
                child: Container(
                  width: 42,
                  height: 46,
                  decoration: BoxDecoration(
                    color: _expanded
                        ? AppTheme.primaryColor.withValues(alpha: 0.12)
                        : Colors.transparent,
                    border: Border(
                      left: BorderSide(
                          color: Colors.white.withValues(alpha: 0.06)),
                    ),
                  ),
                  child: Icon(
                    _expanded ? Icons.keyboard_arrow_down_rounded : Icons.apps_rounded,
                    color: _expanded ? AppTheme.primaryColor : Colors.white24,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Expanded grid panel ────────────────────────────────────────────
        FadeTransition(
          opacity: _fade,
          child: SizeTransition(
            sizeFactor: _fade,
            child: Container(
              color: const Color(0xFF0D0D0D),
              padding: const EdgeInsets.fromLTRB(8, 4, 8, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(4, 4, 0, 8),
                    child: Text(
                      'ROAST ARSENAL',
                      style: TextStyle(
                        color: AppTheme.primaryColor,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7,
                      mainAxisSpacing: 2,
                      crossAxisSpacing: 2,
                      childAspectRatio: 1,
                    ),
                    itemCount: kRoastEmojis.length,
                    itemBuilder: (_, i) => InkWell(
                      onTap: () => _insert(kRoastEmojis[i]),
                      borderRadius: BorderRadius.circular(8),
                      child: Center(
                        child: Text(kRoastEmojis[i],
                            style: const TextStyle(fontSize: 24)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
