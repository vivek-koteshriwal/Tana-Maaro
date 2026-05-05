import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/screens/battle_arena_screen.dart';
import 'package:tanamaaro_mobile/screens/battle_library_screen.dart';
import 'package:tanamaaro_mobile/services/battle_service.dart';

const Color _arenaBackground = Color(0xFF0E0E0E);
const Color _arenaSurfaceHigh = Color(0xFF1F1F1F);
const Color _arenaPrimary = Color(0xFFFF3B3B);
const Color _arenaPrimarySoft = Color(0xFFFF8E84);
const Color _arenaMuted = Color(0xFFABABAB);
const Color _arenaOutline = Color(0xFF484848);

class BattlesScreen extends StatefulWidget {
  const BattlesScreen({
    super.key,
    this.onNavigateToTab,
  });

  final ValueChanged<int>? onNavigateToTab;

  @override
  State<BattlesScreen> createState() => _BattlesScreenState();
}

class _BattlesScreenState extends State<BattlesScreen> {
  final BattleService _battleService = BattleService();
  final GlobalKey _categoriesKey = GlobalKey();

  bool _seeding = true;
  String? _seedError;

  static const List<String> _categoryOrder = [
    'college',
    'city',
    'creator',
    'memer',
  ];

  List<BattleCategoryDescriptor> get _categories {
    return _categoryOrder.map(battleCategoryById).toList(growable: false);
  }

  @override
  void initState() {
    super.initState();
    _seedBattles();
  }

  Future<void> _seedBattles() async {
    try {
      await Future.wait(
        _categories.map(
          (category) => _battleService.ensureBattleForType(
            category.typeKey.toUpperCase(),
            '${category.title} Arena',
          ),
        ),
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _seeding = false;
        _seedError = null;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _seeding = false;
        _seedError = error.toString();
      });
    }
  }

  Future<void> _scrollTo(GlobalKey key) async {
    final targetContext = key.currentContext;
    if (targetContext == null) {
      return;
    }
    await Scrollable.ensureVisible(
      targetContext,
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOutCubic,
      alignment: 0.04,
    );
  }

  int _battlePriority(BattleModel battle) {
    return switch (battle.computedStatus) {
      'live' => 0,
      'upcoming' => 1,
      _ => 2,
    };
  }

  BattleModel? _featuredBattle(List<BattleModel> battles) {
    if (battles.isEmpty) {
      return null;
    }

    final sorted = [...battles]..sort((a, b) {
        final priorityCompare =
            _battlePriority(a).compareTo(_battlePriority(b));
        if (priorityCompare != 0) {
          return priorityCompare;
        }
        return a.startTime.compareTo(b.startTime);
      });
    return sorted.first;
  }

  BattleModel? _battleForCategory(
    BattleCategoryDescriptor category,
    List<BattleModel> battles,
  ) {
    final categoryBattles = battles
        .where(
          (battle) => _battleService.matchesCategory(
            battle,
            category.id,
            typeKey: category.typeKey,
          ),
        )
        .toList(growable: false);
    if (categoryBattles.isEmpty) {
      return null;
    }

    final sorted = [...categoryBattles]..sort((a, b) {
        final priorityCompare =
            _battlePriority(a).compareTo(_battlePriority(b));
        if (priorityCompare != 0) {
          return priorityCompare;
        }
        return a.startTime.compareTo(b.startTime);
      });
    return sorted.first;
  }

  void _openBattle(BattleModel battle) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BattleArenaScreen(battleId: battle.id),
      ),
    );
  }

  void _openCategory(BattleCategoryDescriptor category) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BattleLibraryScreen(categoryId: category.id),
      ),
    );
  }

  void _handleJoinBattle(List<BattleModel> battles) {
    final featured = _featuredBattle(battles);
    if (featured != null) {
      _openBattle(featured);
      return;
    }
    _scrollTo(_categoriesKey);
  }

  void _handleViewSchedule() {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!(2);
      return;
    }
    _scrollTo(_categoriesKey);
  }

  @override
  Widget build(BuildContext context) {
    final screenPadding = ResponsiveLayout.screenPadding(context);

    return Scaffold(
      backgroundColor: _arenaBackground,
      body: ResponsiveContent(
        maxWidth: 1040,
        child: StreamBuilder<List<BattleModel>>(
          stream: _battleService.getActiveBattles(),
          builder: (context, snapshot) {
            final battles = snapshot.data ?? const <BattleModel>[];
            final liveCount = battles
                .where((battle) => battle.computedStatus == 'live')
                .length;

            return CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: ClampingScrollPhysics(),
              ),
              slivers: [
                SliverAppBar(
                  pinned: true,
                  elevation: 0,
                  toolbarHeight: 62,
                  backgroundColor: _arenaBackground.withValues(alpha: 0.94),
                  surfaceTintColor: Colors.transparent,
                  automaticallyImplyLeading: false,
                  titleSpacing: 16,
                  title: const _BattleAppBarTitle(),
                ),
                SliverToBoxAdapter(
                  child: _BattleHeroSection(
                    liveCount: liveCount,
                    visibleArenaCount: _categories.length,
                    isLoading: _seeding && battles.isEmpty,
                    errorMessage: snapshot.hasError
                        ? snapshot.error.toString()
                        : _seedError,
                    onRetry: _seedBattles,
                    onJoinBattle: () => _handleJoinBattle(battles),
                    onViewSchedule: _handleViewSchedule,
                  ),
                ),
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(
                    screenPadding.left,
                    22,
                    screenPadding.right,
                    144,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: _BattleCategorySection(
                      sectionKey: _categoriesKey,
                      categories: _categories,
                      battleForCategory: (category) =>
                          _battleForCategory(category, battles),
                      onCategoryTap: _openCategory,
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _BattleAppBarTitle extends StatelessWidget {
  const _BattleAppBarTitle();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: _arenaPrimary.withValues(alpha: 0.16),
            borderRadius: BorderRadius.circular(4),
          ),
          alignment: Alignment.center,
          child: const Icon(
            Icons.flash_on_rounded,
            size: 13,
            color: _arenaPrimary,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'BATTLE ARENA',
          style: AppTheme.headline(
            size: 15,
            weight: FontWeight.w900,
            letterSpacing: -0.3,
          ),
        ),
      ],
    );
  }
}

class _BattleHeroSection extends StatelessWidget {
  const _BattleHeroSection({
    required this.liveCount,
    required this.visibleArenaCount,
    required this.isLoading,
    required this.errorMessage,
    required this.onRetry,
    required this.onJoinBattle,
    required this.onViewSchedule,
  });

  final int liveCount;
  final int visibleArenaCount;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onRetry;
  final VoidCallback onJoinBattle;
  final VoidCallback onViewSchedule;

  @override
  Widget build(BuildContext context) {
    final heroFontSize = ResponsiveLayout.scaledFontSize(
      context,
      base: 32,
      minScale: 0.92,
      maxScale: 1.12,
    );

    return Container(
      constraints: const BoxConstraints(minHeight: 330),
      decoration: const BoxDecoration(
        color: Colors.black,
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _arenaBackground,
                    _arenaBackground,
                    Colors.black,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: -18,
            right: -38,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _arenaPrimary.withValues(alpha: 0.16),
              ),
            ),
          ),
          Positioned(
            top: -10,
            right: 18,
            child: Transform.rotate(
              angle: 0.74,
              child: Container(
                width: 220,
                height: 2,
                color: _arenaPrimary.withValues(alpha: 0.22),
              ),
            ),
          ),
          Positioned(
            top: 46,
            right: -24,
            child: Transform.rotate(
              angle: 0.74,
              child: Container(
                width: 210,
                height: 18,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _arenaPrimary.withValues(alpha: 0.0),
                      _arenaPrimary.withValues(alpha: 0.34),
                      _arenaPrimary.withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 54,
            right: -12,
            child: Container(
              width: 110,
              height: 110,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    _arenaPrimary.withValues(alpha: 0.14),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: _arenaPrimary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'LIVE ENGAGEMENT',
                      style: AppTheme.label(
                        size: 10.5,
                        color: _arenaPrimarySoft,
                        weight: FontWeight.w900,
                        letterSpacing: 1.35,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: 'ENTER THE\n',
                        style: AppTheme.headline(
                          size: heroFontSize,
                          weight: FontWeight.w900,
                          letterSpacing: -1.2,
                          height: 0.88,
                        ),
                      ),
                      TextSpan(
                        text: 'ARENA',
                        style: AppTheme.headline(
                          size: heroFontSize,
                          color: _arenaPrimary,
                          weight: FontWeight.w900,
                          letterSpacing: -1.2,
                          height: 0.88,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 320),
                  child: Text(
                    'Choose your faction. Defend your pride. This is the digital colosseum where only the strongest communities survive.',
                    style: AppTheme.body(
                      size: 13.5,
                      color: _arenaMuted,
                      weight: FontWeight.w600,
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 138,
                      child: _HeroButton(
                        label: 'JOIN BATTLE',
                        filled: true,
                        onTap: onJoinBattle,
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: 138,
                      child: _HeroButton(
                        label: 'VIEW SCHEDULE',
                        filled: false,
                        onTap: onViewSchedule,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _HeroPill(
                      label: '$visibleArenaCount ARENAS',
                      icon: Icons.stadium_rounded,
                    ),
                    _HeroPill(
                      label: liveCount > 0 ? '$liveCount LIVE NOW' : 'LIVE NOW',
                      icon: Icons.radio_button_checked_rounded,
                    ),
                  ],
                ),
                if (isLoading || errorMessage != null) ...[
                  const SizedBox(height: 18),
                  _BattleSeedStatus(
                    isLoading: isLoading,
                    errorMessage: errorMessage,
                    onRetry: onRetry,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroButton extends StatelessWidget {
  const _HeroButton({
    required this.label,
    required this.filled,
    required this.onTap,
  });

  final String label;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final foreground = filled ? Colors.white : Colors.white;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Ink(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            gradient: filled
                ? const LinearGradient(
                    colors: [_arenaPrimarySoft, _arenaPrimary],
                  )
                : null,
            color: filled ? null : Colors.transparent,
            border: Border.all(
              color: filled
                  ? Colors.transparent
                  : _arenaPrimary.withValues(alpha: 0.38),
            ),
            boxShadow: filled
                ? [
                    BoxShadow(
                      color: _arenaPrimary.withValues(alpha: 0.22),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: Text(
              label,
              style: AppTheme.label(
                size: 11.2,
                color: foreground,
                weight: FontWeight.w900,
                letterSpacing: 0.95,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeroPill extends StatelessWidget {
  const _HeroPill({
    required this.label,
    required this.icon,
  });

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 30,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: _arenaPrimary.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: _arenaPrimary.withValues(alpha: 0.18),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: _arenaPrimarySoft, size: 13),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTheme.label(
              size: 9.8,
              color: _arenaPrimarySoft,
              weight: FontWeight.w900,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}

class _BattleSeedStatus extends StatelessWidget {
  const _BattleSeedStatus({
    required this.isLoading,
    required this.errorMessage,
    required this.onRetry,
  });

  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(
              color: _arenaPrimary,
              strokeWidth: 2,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            'SYNCING ARENAS',
            style: AppTheme.label(
              size: 10,
              color: Colors.white70,
              weight: FontWeight.w800,
              letterSpacing: 1.0,
            ),
          ),
        ],
      );
    }

    if (errorMessage == null) {
      return const SizedBox.shrink();
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onRetry,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Text(
            'ARENA SYNC FAILED. TAP TO RETRY.',
            style: AppTheme.label(
              size: 10,
              color: Colors.white70,
              weight: FontWeight.w800,
              letterSpacing: 0.9,
            ),
          ),
        ),
      ),
    );
  }
}

class _BattleCategorySection extends StatelessWidget {
  const _BattleCategorySection({
    required this.sectionKey,
    required this.categories,
    required this.battleForCategory,
    required this.onCategoryTap,
  });

  final Key sectionKey;
  final List<BattleCategoryDescriptor> categories;
  final BattleModel? Function(BattleCategoryDescriptor category)
      battleForCategory;
  final ValueChanged<BattleCategoryDescriptor> onCategoryTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: sectionKey,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final columns = constraints.maxWidth >= 760 ? 2 : 1;
          final spacing = 16.0;
          final cardWidth = columns == 1
              ? constraints.maxWidth
              : (constraints.maxWidth - spacing) / 2;

          return Wrap(
            spacing: spacing,
            runSpacing: spacing,
            children: categories.map((category) {
              final battle = battleForCategory(category);
              return SizedBox(
                width: cardWidth,
                child: _BattleCategoryCard(
                  category: category,
                  battle: battle,
                  onTap: () => onCategoryTap(category),
                ),
              );
            }).toList(growable: false),
          );
        },
      ),
    );
  }
}

class _BattleCategoryCard extends StatelessWidget {
  const _BattleCategoryCard({
    required this.category,
    required this.battle,
    required this.onTap,
  });

  final BattleCategoryDescriptor category;
  final BattleModel? battle;
  final VoidCallback onTap;

  _CategoryCardSpec get _spec {
    return switch (category.id) {
      'college' => const _CategoryCardSpec(
          title: 'COLLEGE VS\nCOLLEGE',
          description:
              'Settle the campus rivalry. Represent your university in massive scale social skirmishes.',
          buttonLabel: 'ENTER WAR ROOM',
          filledButton: false,
          icon: Icons.school_rounded,
          gradientColors: [Color(0xFF111111), Color(0xFF171717)],
          accentGlow: Color(0x22000000),
        ),
      'city' => const _CategoryCardSpec(
          title: 'CITY VS CITY',
          description:
              'Territorial dominance. Which skyline rules the feed? Rally your locals and take over.',
          buttonLabel: 'CLAIM TERRITORY',
          filledButton: false,
          icon: Icons.location_city_rounded,
          gradientColors: [Color(0xFF240D10), Color(0xFF1A0F11)],
          accentGlow: Color(0x22FF3B3B),
        ),
      'creator' => const _CategoryCardSpec(
          title: 'CREATOR VS\nCREATOR',
          description:
              'Influence is the weapon. Fanbases clash to decide the ultimate digital kingpin.',
          buttonLabel: 'JOIN SQUAD',
          filledButton: true,
          icon: Icons.stars_rounded,
          gradientColors: [Color(0xFF0F0F10), Color(0xFF191112)],
          accentGlow: Color(0x1FFF3B3B),
        ),
      'memer' => const _CategoryCardSpec(
          title: 'MEEMER VS\nMEEMER',
          description:
              'Meme reflexes. Brutal timing. Whoever blinks first gets ratioed.',
          buttonLabel: 'ENTER CHAOS',
          filledButton: false,
          icon: Icons.sentiment_very_satisfied_rounded,
          gradientColors: [Color(0xFF111114), Color(0xFF17171A)],
          accentGlow: Color(0x16FF3B3B),
        ),
      _ => _CategoryCardSpec(
          title: category.title.toUpperCase(),
          description: category.subtitle,
          buttonLabel: 'ENTER',
          filledButton: false,
          icon: category.icon,
          gradientColors: const [Color(0xFF111111), Color(0xFF171717)],
          accentGlow: const Color(0x1AFF3B3B),
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final statusText = switch (battle?.computedStatus) {
      'live' => 'LIVE NOW',
      'upcoming' => 'UP NEXT',
      _ => 'ROOM READY',
    };

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: _spec.gradientColors,
            ),
            boxShadow: [
              BoxShadow(
                color: _spec.accentGlow,
                blurRadius: 26,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 218),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Stack(
                children: [
                  Positioned(
                    top: -18,
                    right: -10,
                    child: Container(
                      width: 130,
                      height: 130,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _arenaPrimary.withValues(alpha: 0.09),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -16,
                    right: -8,
                    child: Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            _arenaPrimary.withValues(alpha: 0.09),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Align(
                          alignment: Alignment.topRight,
                          child: Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: _arenaPrimary.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              _spec.icon,
                              color: _arenaPrimary,
                              size: 18,
                            ),
                          ),
                        ),
                        const SizedBox(height: 42),
                        Text(
                          _spec.title,
                          style: AppTheme.headline(
                            size: 19,
                            weight: FontWeight.w900,
                            letterSpacing: -0.7,
                            height: 0.95,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _spec.description,
                          style: AppTheme.body(
                            size: 12.4,
                            color: _arenaMuted,
                            weight: FontWeight.w600,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          statusText,
                          style: AppTheme.label(
                            size: 9.4,
                            color: _arenaPrimarySoft,
                            weight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _CategoryButton(
                          label: _spec.buttonLabel,
                          filled: _spec.filledButton,
                          onTap: onTap,
                        ),
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

class _CategoryCardSpec {
  const _CategoryCardSpec({
    required this.title,
    required this.description,
    required this.buttonLabel,
    required this.filledButton,
    required this.icon,
    required this.gradientColors,
    required this.accentGlow,
  });

  final String title;
  final String description;
  final String buttonLabel;
  final bool filledButton;
  final IconData icon;
  final List<Color> gradientColors;
  final Color accentGlow;
}

class _CategoryButton extends StatelessWidget {
  const _CategoryButton({
    required this.label,
    required this.filled,
    required this.onTap,
  });

  final String label;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Ink(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            gradient: filled
                ? const LinearGradient(
                    colors: [_arenaPrimarySoft, _arenaPrimary],
                  )
                : null,
            color: filled ? null : _arenaSurfaceHigh,
            border: Border.all(
              color: filled
                  ? Colors.transparent
                  : _arenaOutline.withValues(alpha: 0.5),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: AppTheme.label(
                    size: 10.7,
                    color: Colors.white,
                    weight: FontWeight.w900,
                    letterSpacing: 0.95,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white,
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
