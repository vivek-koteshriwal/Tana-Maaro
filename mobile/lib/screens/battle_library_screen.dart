import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/screens/battle_arena_screen.dart';
import 'package:tanamaaro_mobile/services/battle_service.dart';

class BattleCategoryDescriptor {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final String emoji;
  final String typeKey;

  const BattleCategoryDescriptor({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.emoji,
    required this.typeKey,
  });
}

const battleCategoryDescriptors = <BattleCategoryDescriptor>[
  BattleCategoryDescriptor(
    id: 'college',
    title: 'College vs College',
    subtitle: 'Campus pride meets live roast warfare.',
    icon: Icons.school_rounded,
    emoji: '🎓',
    typeKey: 'college',
  ),
  BattleCategoryDescriptor(
    id: 'city',
    title: 'City vs City',
    subtitle: 'Neighborhood heat. City-wide chaos.',
    icon: Icons.location_city_rounded,
    emoji: '🏙️',
    typeKey: 'city',
  ),
  BattleCategoryDescriptor(
    id: 'creator',
    title: 'Creator vs Creator',
    subtitle: 'Clout, content, and direct callouts.',
    icon: Icons.videocam_rounded,
    emoji: '🎥',
    typeKey: 'creator',
  ),
  BattleCategoryDescriptor(
    id: 'memer',
    title: 'Meemer vs Meemer',
    subtitle: 'Meme reflexes and zero mercy.',
    icon: Icons.emoji_emotions_rounded,
    emoji: '😂',
    typeKey: 'memer',
  ),
];

BattleCategoryDescriptor battleCategoryById(String categoryId) {
  return battleCategoryDescriptors.firstWhere(
    (category) => category.id == categoryId,
    orElse: () => battleCategoryDescriptors.first,
  );
}

enum _BattleLibraryFilter {
  liveNow,
  upcoming,
  past,
}

class BattleLibraryScreen extends StatefulWidget {
  final String categoryId;

  const BattleLibraryScreen({
    super.key,
    required this.categoryId,
  });

  @override
  State<BattleLibraryScreen> createState() => _BattleLibraryScreenState();
}

class _BattleLibraryScreenState extends State<BattleLibraryScreen> {
  final BattleService _battleService = BattleService();
  late final BattleCategoryDescriptor _category;
  _BattleLibraryFilter _activeFilter = _BattleLibraryFilter.liveNow;

  @override
  void initState() {
    super.initState();
    _category = battleCategoryById(widget.categoryId);
    _battleService.ensureBattleForType(
      _category.typeKey.toUpperCase(),
      '${_category.title} Arena',
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenPadding = ResponsiveLayout.screenPadding(context);

    return ParentBackScope(
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          leading: IconButton(
            onPressed: () => navigateToParentRoute(context),
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          titleSpacing: 0,
          title: Text(
            _category.title.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
          ),
          actions: [
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.search, color: Colors.white),
            ),
          ],
        ),
        body: ResponsiveContent(
          maxWidth: 920,
          child: StreamBuilder<List<BattleModel>>(
            stream: _battleService.getBattlesForCategory(
              _category.id,
              typeKey: _category.typeKey,
            ),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(
                  child: CircularProgressIndicator(
                    color: AppTheme.primaryColor,
                  ),
                );
              }

              if (snapshot.hasError) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Text(
                      snapshot.error.toString(),
                      style: const TextStyle(color: Colors.white54),
                      textAlign: TextAlign.center,
                    ),
                  ),
                );
              }

              final battles =
                  _filteredBattles(snapshot.data ?? const <BattleModel>[]);
              if (battles.isEmpty) {
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: ClampingScrollPhysics(),
                  ),
                  cacheExtent: 640,
                  padding: EdgeInsets.fromLTRB(
                    screenPadding.left,
                    18,
                    screenPadding.right,
                    28,
                  ),
                  children: [
                    _LibraryFilterBar(
                      activeFilter: _activeFilter,
                      onChanged: (filter) =>
                          setState(() => _activeFilter = filter),
                    ),
                    const SizedBox(height: 18),
                    _LibraryEmptyState(filter: _activeFilter),
                  ],
                );
              }

              return ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: ClampingScrollPhysics(),
                ),
                cacheExtent: 640,
                padding: EdgeInsets.fromLTRB(
                  screenPadding.left,
                  18,
                  screenPadding.right,
                  28,
                ),
                itemCount: battles.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: _LibraryFilterBar(
                        activeFilter: _activeFilter,
                        onChanged: (filter) =>
                            setState(() => _activeFilter = filter),
                      ),
                    );
                  }

                  final battle = battles[index - 1];
                  return RepaintBoundary(
                    key: ValueKey('battle-library-${battle.id}'),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _BattleLibraryCard(
                        battle: battle,
                        category: _category,
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  List<BattleModel> _filteredBattles(List<BattleModel> battles) {
    return battles.where((battle) {
      final status = battle.computedStatus;
      return switch (_activeFilter) {
        _BattleLibraryFilter.liveNow => status == 'live',
        _BattleLibraryFilter.upcoming => status == 'upcoming',
        _BattleLibraryFilter.past => status == 'ended',
      };
    }).toList(growable: false);
  }
}

class _LibraryFilterBar extends StatelessWidget {
  final _BattleLibraryFilter activeFilter;
  final ValueChanged<_BattleLibraryFilter> onChanged;

  const _LibraryFilterBar({
    required this.activeFilter,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _FilterChip(
              label: 'LIVE NOW',
              active: activeFilter == _BattleLibraryFilter.liveNow,
              onTap: () => onChanged(_BattleLibraryFilter.liveNow),
            ),
          ),
          Expanded(
            child: _FilterChip(
              label: 'UPCOMING',
              active: activeFilter == _BattleLibraryFilter.upcoming,
              onTap: () => onChanged(_BattleLibraryFilter.upcoming),
            ),
          ),
          Expanded(
            child: _FilterChip(
              label: 'PAST',
              active: activeFilter == _BattleLibraryFilter.past,
              onTap: () => onChanged(_BattleLibraryFilter.past),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          decoration: BoxDecoration(
            color: active
                ? AppTheme.primaryColor.withValues(alpha: 0.16)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (label == 'LIVE NOW')
                Container(
                  width: 7,
                  height: 7,
                  margin: const EdgeInsets.only(right: 6),
                  decoration: BoxDecoration(
                    color: active ? Colors.redAccent : Colors.white24,
                    shape: BoxShape.circle,
                  ),
                ),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: active ? Colors.white : Colors.white38,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
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

class _BattleLibraryCard extends StatelessWidget {
  final BattleModel battle;
  final BattleCategoryDescriptor category;

  const _BattleLibraryCard({
    required this.battle,
    required this.category,
  });

  @override
  Widget build(BuildContext context) {
    final isLive = battle.computedStatus == 'live';
    final isPast = battle.computedStatus == 'ended';

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A1A1A), Color(0xFF0D0D0D)],
        ),
        border: Border.all(
          color: isLive
              ? AppTheme.primaryColor.withValues(alpha: 0.42)
              : Colors.white.withValues(alpha: 0.06),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: isLive
                        ? Colors.red.withValues(alpha: 0.16)
                        : isPast
                            ? Colors.white.withValues(alpha: 0.08)
                            : Colors.blue.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    battle.computedStatus.toUpperCase(),
                    style: TextStyle(
                      color: isLive
                          ? Colors.redAccent
                          : isPast
                              ? Colors.white38
                              : Colors.blueAccent,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.9,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  category.emoji,
                  style: const TextStyle(fontSize: 18),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              battle.title.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w900,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              '${battle.participantsCount} roasters in arena',
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              category.subtitle,
              style: const TextStyle(
                color: Colors.white38,
                fontSize: 12,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: isPast
                    ? null
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => BattleArenaScreen(
                              battleId: battle.id,
                            ),
                          ),
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isPast ? Colors.white10 : AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.white10,
                  disabledForegroundColor: Colors.white38,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  isPast ? 'ARENA CLOSED' : 'VIEW ARENA',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 1.1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LibraryEmptyState extends StatelessWidget {
  final _BattleLibraryFilter filter;

  const _LibraryEmptyState({
    required this.filter,
  });

  @override
  Widget build(BuildContext context) {
    final message = switch (filter) {
      _BattleLibraryFilter.liveNow => 'No live arenas in this category yet.',
      _BattleLibraryFilter.upcoming =>
        'No upcoming arenas scheduled right now.',
      _BattleLibraryFilter.past => 'No past arenas have been archived yet.',
    };

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          const FaIcon(
            FontAwesomeIcons.boltLightning,
            color: Colors.white12,
            size: 42,
          ),
          const SizedBox(height: 18),
          const Text(
            'NOTHING HERE YET',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white38,
              fontSize: 13,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
