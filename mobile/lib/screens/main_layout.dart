import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanamaaro_mobile/screens/battles_screen.dart';
import 'package:tanamaaro_mobile/screens/create_post_screen.dart';
import 'package:tanamaaro_mobile/screens/events_screen.dart';
import 'package:tanamaaro_mobile/screens/profile_screen.dart';
import 'package:tanamaaro_mobile/screens/roast_wall_screen.dart';
import 'package:tanamaaro_mobile/widgets/landing_feed_card.dart';

final GlobalKey<MainLayoutState> mainLayoutKey = GlobalKey<MainLayoutState>();

class MainLayout extends ConsumerStatefulWidget {
  const MainLayout({
    super.key,
    this.initialTab = 0,
  });

  final int initialTab;

  @override
  ConsumerState<MainLayout> createState() => MainLayoutState();
}

class MainLayoutState extends ConsumerState<MainLayout> {
  static const _pageKeys = <PageStorageKey<String>>[
    PageStorageKey<String>('main-home-page'),
    PageStorageKey<String>('main-battle-page'),
    PageStorageKey<String>('main-events-page'),
    PageStorageKey<String>('main-profile-page'),
  ];

  int _selectedIndex = 0;
  late final PageController _pageController;
  late final List<Widget?> _screenCache;
  DateTime? _lastBackPressedAt;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialTab.clamp(0, _pageKeys.length - 1);
    _pageController = PageController(initialPage: _selectedIndex);
    _screenCache =
        List<Widget?>.filled(_pageKeys.length, null, growable: false);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) {
      return;
    }

    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  void setTabIndex(int index, {bool animate = true}) {
    if (_selectedIndex == index) {
      return;
    }

    if (!_pageController.hasClients || !animate) {
      if (mounted) {
        setState(() => _selectedIndex = index);
      } else {
        _selectedIndex = index;
      }
      if (_pageController.hasClients) {
        _pageController.jumpToPage(index);
      }
      return;
    }

    _onItemTapped(index);
  }

  Future<void> _handleRootBackPress() async {
    if (_selectedIndex != 0) {
      setTabIndex(0, animate: false);
      return;
    }

    final now = DateTime.now();
    final shouldExit = _lastBackPressedAt != null &&
        now.difference(_lastBackPressedAt!) <= const Duration(seconds: 2);

    if (shouldExit) {
      await SystemNavigator.pop();
      return;
    }

    _lastBackPressedAt = now;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Press back again to exit'),
          duration: Duration(seconds: 2),
        ),
      );
  }

  Widget _buildScreen(int index) {
    final cached = _screenCache[index];
    if (cached != null) {
      return cached;
    }

    final screen = switch (index) {
      0 => RoastWallScreen(key: _pageKeys[index]),
      1 => BattlesScreen(
          key: _pageKeys[index],
          onNavigateToTab: setTabIndex,
        ),
      2 => EventsScreen(key: _pageKeys[index]),
      3 => ProfileScreen(
          key: _pageKeys[index],
          onNavigateToTab: setTabIndex,
        ),
      _ => const SizedBox.shrink(),
    };

    _screenCache[index] = screen;
    return screen;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope<void>(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          return;
        }
        _handleRootBackPress();
      },
      child: Scaffold(
        backgroundColor: landingBackground,
        body: PageView.builder(
          controller: _pageController,
          itemCount: _pageKeys.length,
          allowImplicitScrolling: true,
          onPageChanged: (index) => setState(() => _selectedIndex = index),
          physics: const PageScrollPhysics(parent: ClampingScrollPhysics()),
          itemBuilder: (context, index) => _buildScreen(index),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        floatingActionButton: _selectedIndex == 0
            ? SizedBox(
                width: 52,
                height: 52,
                child: FloatingActionButton(
                  onPressed: () async {
                    final created = await Navigator.push<bool>(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const CreatePostScreen(),
                      ),
                    );
                    if (created == true && _pageController.hasClients) {
                      _pageController.jumpToPage(0);
                    }
                  },
                  backgroundColor: landingPrimary,
                  elevation: 12,
                  shape: const CircleBorder(),
                  child: const Icon(
                    Icons.add_rounded,
                    size: 28,
                    color: Colors.white,
                  ),
                ),
              )
            : null,
        bottomNavigationBar: _MainGlassBottomNav(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
        ),
      ),
    );
  }
}

class _MainGlassBottomNav extends StatelessWidget {
  const _MainGlassBottomNav({
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final safeBottom = MediaQuery.paddingOf(context).bottom;
    const navItemHeight = 52.0;
    const navTopPadding = 8.0;
    final navBottomPadding = safeBottom > 0 ? safeBottom + 6.0 : 12.0;
    final navHeight = navItemHeight + navTopPadding + navBottomPadding;
    const items = [
      _NavDestinationData(
        label: 'Home',
        icon: Icons.home_outlined,
        activeIcon: Icons.home_rounded,
      ),
      _NavDestinationData(
        label: 'Battle',
        icon: Icons.flash_on_outlined,
        activeIcon: Icons.flash_on_rounded,
        size: 19,
      ),
      _NavDestinationData(
        label: 'Events',
        icon: Icons.event_outlined,
        activeIcon: Icons.event,
      ),
      _NavDestinationData(
        label: 'Profile',
        icon: Icons.person_outline_rounded,
        activeIcon: Icons.person_rounded,
      ),
    ];

    return SizedBox(
      height: navHeight,
      child: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: Container(
            height: navHeight,
            padding: EdgeInsets.fromLTRB(
              14,
              navTopPadding,
              14,
              navBottomPadding,
            ),
            decoration: BoxDecoration(
              color: landingBackground.withValues(alpha: 0.96),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(18),
              ),
              border: Border(
                top: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
              ),
              boxShadow: [
                BoxShadow(
                  color: landingPrimary.withValues(alpha: 0.05),
                  blurRadius: 24,
                  offset: const Offset(0, -8),
                ),
              ],
            ),
            child: SizedBox(
              height: navItemHeight,
              child: Row(
                children: List.generate(
                  items.length,
                  (index) => _NavIconButton(
                    label: items[index].label,
                    icon: items[index].icon,
                    activeIcon: items[index].activeIcon,
                    selected: currentIndex == index,
                    onTap: () => onTap(index),
                    size: items[index].size,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavDestinationData {
  const _NavDestinationData({
    required this.label,
    required this.icon,
    required this.activeIcon,
    this.size = 21,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final double size;
}

class _NavIconButton extends StatelessWidget {
  const _NavIconButton({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.selected,
    required this.onTap,
    this.size = 22,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final bool selected;
  final VoidCallback onTap;
  final double size;

  @override
  Widget build(BuildContext context) {
    final color = selected ? landingPrimary : landingMuted;

    return Expanded(
      child: Center(
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(14),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutCubic,
              width: 56,
              height: 52,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Semantics(
                button: true,
                label: label,
                selected: selected,
                child: AnimatedScale(
                  duration: const Duration(milliseconds: 180),
                  scale: selected ? 1.08 : 1,
                  child: Icon(
                    selected ? activeIcon : icon,
                    size: size,
                    color: color,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
