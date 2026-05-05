import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:tanamaaro_mobile/controllers/roast_wall_controller.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/screens/create_post_screen.dart';
import 'package:tanamaaro_mobile/screens/notifications_screen.dart';
import 'package:tanamaaro_mobile/screens/search_screen.dart';
import 'package:tanamaaro_mobile/services/notification_service.dart';
import 'package:tanamaaro_mobile/widgets/landing_feed_card.dart';

class RoastWallScreen extends ConsumerStatefulWidget {
  const RoastWallScreen({super.key});

  @override
  ConsumerState<RoastWallScreen> createState() => _RoastWallScreenState();
}

class _RoastWallScreenState extends ConsumerState<RoastWallScreen>
    with AutomaticKeepAliveClientMixin {
  final ScrollController _scrollController = ScrollController();
  final NotificationService _notificationService = NotificationService();

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_handleScroll);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleScroll)
      ..dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) {
      return;
    }

    if (_scrollController.position.extentAfter < 520) {
      ref.read(roastWallControllerProvider.notifier).loadMore();
    }
  }

  Future<void> _switchTab(RoastWallTab tab) async {
    await ref.read(roastWallControllerProvider.notifier).setTab(tab);
    if (!mounted || !_scrollController.hasClients) {
      return;
    }

    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOutCubic,
    );
  }

  Future<void> _openComposer() async {
    final created = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const CreatePostScreen()),
    );

    if (!mounted || created != true) {
      return;
    }

    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _openNotifications() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
    );
  }

  void _openSearch() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SearchScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    final state = ref.watch(roastWallControllerProvider);
    final controller = ref.read(roastWallControllerProvider.notifier);
    final activeFeed = state.activeFeed;
    final horizontalPadding = ResponsiveLayout.isTablet(context) ? 24.0 : 12.0;
    const maxContentWidth = 560.0;

    return ColoredBox(
      color: landingBackground,
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    landingPrimary.withValues(alpha: 0.08),
                    landingBackground,
                    landingBackground,
                  ],
                  stops: const [0, 0.24, 1],
                ),
              ),
            ),
          ),
          RefreshIndicator(
            color: landingPrimary,
            backgroundColor: landingSurface,
            onRefresh: controller.refreshActive,
            child: CustomScrollView(
              key: PageStorageKey<String>('roast-wall-${state.activeTab.name}'),
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(
                parent: ClampingScrollPhysics(),
              ),
              slivers: [
                SliverAppBar(
                  pinned: true,
                  automaticallyImplyLeading: false,
                  toolbarHeight: 66,
                  backgroundColor: landingBackground.withValues(alpha: 0.88),
                  surfaceTintColor: Colors.transparent,
                  elevation: 0,
                  flexibleSpace: ClipRect(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                      child: SafeArea(
                        bottom: false,
                        child: Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(
                              maxWidth: maxContentWidth + 32,
                            ),
                            child: Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: horizontalPadding + 4,
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Image.asset(
                                      'assets/images/tana_maaro_full_logo.png',
                                      height: 36,
                                      alignment: Alignment.centerLeft,
                                      fit: BoxFit.contain,
                                    ),
                                  ),
                                  StreamBuilder<List<NotificationModel>>(
                                    stream:
                                        _notificationService.getNotifications(),
                                    builder: (context, snapshot) {
                                      final unreadCount = snapshot.data
                                              ?.where((item) => !item.read)
                                              .length ??
                                          0;
                                      return Stack(
                                        clipBehavior: Clip.none,
                                        children: [
                                          IconButton(
                                            onPressed: _openNotifications,
                                            splashRadius: 20,
                                            icon: const Icon(
                                              Icons.notifications_rounded,
                                              color: landingMuted,
                                              size: 19,
                                            ),
                                          ),
                                          if (unreadCount > 0)
                                            Positioned(
                                              right: 11,
                                              top: 10,
                                              child: Container(
                                                width: 8,
                                                height: 8,
                                                decoration: const BoxDecoration(
                                                  color: landingPrimarySoft,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                            ),
                                        ],
                                      );
                                    },
                                  ),
                                  IconButton(
                                    onPressed: _openSearch,
                                    splashRadius: 20,
                                    icon: const Icon(
                                      Icons.search_rounded,
                                      color: landingMuted,
                                      size: 20,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _TabsHeaderDelegate(
                    minExtentValue: 56,
                    maxExtentValue: 56,
                    child: ClipRect(
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                        child: Container(
                          color: landingBackground.withValues(alpha: 0.86),
                          padding: EdgeInsets.fromLTRB(
                            horizontalPadding,
                            8,
                            horizontalPadding,
                            6,
                          ),
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(
                                maxWidth: maxContentWidth,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  _LandingTabButton(
                                    icon: Icons.bolt_rounded,
                                    label: 'ROAST WALL',
                                    active:
                                        state.activeTab == RoastWallTab.latest,
                                    onTap: () =>
                                        _switchTab(RoastWallTab.latest),
                                  ),
                                  const SizedBox(width: 22),
                                  _LandingTabButton(
                                    icon: Icons.trending_up_rounded,
                                    label: 'TRENDING',
                                    active: state.activeTab ==
                                        RoastWallTab.trending,
                                    onTap: () =>
                                        _switchTab(RoastWallTab.trending),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(
                    horizontalPadding,
                    14,
                    horizontalPadding,
                    120,
                  ),
                  sliver: _buildFeedSliver(
                    activeFeed: activeFeed,
                    controller: controller,
                    maxContentWidth: maxContentWidth,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _centered({
    required Widget child,
    required double maxContentWidth,
  }) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxContentWidth),
        child: child,
      ),
    );
  }

  Widget _buildFeedSliver({
    required RoastWallFeedState activeFeed,
    required RoastWallController controller,
    required double maxContentWidth,
  }) {
    if (activeFeed.isLoading && activeFeed.posts.isEmpty) {
      return SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => _centered(
            maxContentWidth: maxContentWidth,
            child: const _LandingSkeletonCard(),
          ),
          childCount: 3,
        ),
      );
    }

    if (activeFeed.errorMessage != null && activeFeed.posts.isEmpty) {
      return SliverToBoxAdapter(
        child: _centered(
          maxContentWidth: maxContentWidth,
          child: _LandingStateCard(
            title: 'Feed offline.',
            subtitle:
                'The arena did not load. Pull to refresh or try again in a moment.',
            actionLabel: 'Retry',
            onAction: () => controller.refreshActive(),
          ),
        ),
      );
    }

    if (!activeFeed.isLoading &&
        activeFeed.posts.isEmpty &&
        !activeFeed.isRefreshing) {
      return SliverToBoxAdapter(
        child: _centered(
          maxContentWidth: maxContentWidth,
          child: _LandingStateCard(
            title: 'No roasts yet.',
            subtitle:
                'Drop the first shot and light up the wall before anyone else does.',
            actionLabel: 'Create Post',
            onAction: () => _openComposer(),
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index >= activeFeed.posts.length) {
            return _centered(
              maxContentWidth: maxContentWidth,
              child: activeFeed.isLoadingMore
                  ? const _PaginationLoader()
                  : const SizedBox(height: 32),
            );
          }

          final post = activeFeed.posts[index];
          return _centered(
            maxContentWidth: maxContentWidth,
            child: LandingFeedCard(
              post: post,
              onFire: controller.firePost,
              onDown: controller.downPost,
              onShare: controller.sharePost,
              onDelete: controller.deletePost,
              onHidden: (hiddenPost) => controller.hidePost(hiddenPost.id),
            ),
          );
        },
        childCount: activeFeed.posts.length +
            ((activeFeed.isLoadingMore || activeFeed.hasMore) ? 1 : 0),
      ),
    );
  }
}

class _LandingTabButton extends StatelessWidget {
  const _LandingTabButton({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? Colors.white : landingMuted;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 15, color: color),
                  const SizedBox(width: 8),
                  Text(
                    label,
                    style: GoogleFonts.epilogue(
                      color: color,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.2,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                curve: Curves.easeOutCubic,
                width: active ? 86 : 0,
                height: 3,
                decoration: BoxDecoration(
                  color: landingPrimary,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabsHeaderDelegate extends SliverPersistentHeaderDelegate {
  _TabsHeaderDelegate({
    required this.child,
    required this.minExtentValue,
    required this.maxExtentValue,
  });

  final Widget child;
  final double minExtentValue;
  final double maxExtentValue;

  @override
  double get minExtent => minExtentValue;

  @override
  double get maxExtent => maxExtentValue;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return child;
  }

  @override
  bool shouldRebuild(covariant _TabsHeaderDelegate oldDelegate) {
    return oldDelegate.child != child ||
        oldDelegate.minExtentValue != minExtentValue ||
        oldDelegate.maxExtentValue != maxExtentValue;
  }
}

class _LandingStateCard extends StatelessWidget {
  const _LandingStateCard({
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: landingSurface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.epilogue(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.8,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            subtitle,
            style: GoogleFonts.manrope(
              color: landingMuted,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 18),
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              backgroundColor: landingPrimarySoft,
              foregroundColor: const Color(0xFF650007),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              actionLabel.toUpperCase(),
              style: GoogleFonts.epilogue(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LandingSkeletonCard extends StatelessWidget {
  const _LandingSkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 288,
      margin: const EdgeInsets.only(bottom: 18),
      decoration: BoxDecoration(
        color: landingSurface,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: landingSurfaceHigh,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 120,
                        height: 12,
                        color: landingSurfaceHigh,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 86,
                        height: 10,
                        color: landingSurfaceHigh,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Column(
              children: [
                Container(height: 12, color: landingSurfaceHigh),
                const SizedBox(height: 8),
                Container(height: 12, color: landingSurfaceHigh),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: Container(color: landingSurfaceHigh),
          ),
        ],
      ),
    );
  }
}

class _PaginationLoader extends StatelessWidget {
  const _PaginationLoader();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 16),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2.3,
            valueColor: AlwaysStoppedAnimation<Color>(
              landingPrimarySoft.withValues(alpha: 0.9),
            ),
          ),
        ),
      ),
    );
  }
}
