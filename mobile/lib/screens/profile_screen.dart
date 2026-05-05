import 'dart:ui';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/models/user_model.dart';
import 'package:tanamaaro_mobile/screens/battles_screen.dart';
import 'package:tanamaaro_mobile/screens/edit_profile_screen.dart';
import 'package:tanamaaro_mobile/screens/profile_connections_screen.dart';
import 'package:tanamaaro_mobile/screens/settings_screen.dart';
import 'package:tanamaaro_mobile/services/battle_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/services/user_service.dart';
import 'package:tanamaaro_mobile/widgets/landing_feed_card.dart';
import 'package:tanamaaro_mobile/widgets/post_action_button.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';

enum _ProfileTab {
  roasts,
  challenges,
}

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({
    super.key,
    this.userId,
    this.onNavigateToTab,
  });

  final String? userId;
  final ValueChanged<int>? onNavigateToTab;

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen>
    with AutomaticKeepAliveClientMixin {
  final PostService _postService = PostService();
  _ProfileTab _activeTab = _ProfileTab.roasts;

  @override
  bool get wantKeepAlive => true;

  Future<void> _openSettings() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SettingsScreen()),
    );
  }

  Future<void> _openManageIdentity({bool openAvatarPicker = false}) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => EditProfileScreen(
          openAvatarPickerOnLoad: openAvatarPicker,
        ),
      ),
    );
  }

  Future<void> _confirmDelete(String postId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: landingSurface,
        title: Text(
          'Delete Roast?',
          style: GoogleFonts.epilogue(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
        content: Text(
          'This roast will be permanently deleted and cannot be recovered.',
          style: GoogleFonts.manrope(
            color: landingMuted,
            fontSize: 14,
            height: 1.45,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'CANCEL',
              style: GoogleFonts.manrope(
                color: Colors.white54,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'DELETE',
              style: GoogleFonts.manrope(
                color: landingPrimary,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _postService.deletePost(postId);
    }
  }

  void _openBattles() {
    if (widget.onNavigateToTab != null) {
      widget.onNavigateToTab!.call(1);
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const BattlesScreen()),
    );
  }

  void _openFollowers(String userId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileConnectionsScreen(
          userId: userId,
          type: ProfileConnectionType.followers,
        ),
      ),
    );
  }

  void _openFollowing(String userId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileConnectionsScreen(
          userId: userId,
          type: ProfileConnectionType.following,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    final userService = ref.watch(userServiceProvider);
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;
    final targetUserId = widget.userId ?? currentUserId;

    if (targetUserId == null) {
      return const Scaffold(
        backgroundColor: landingBackground,
        body: Center(
          child: Text(
            'Please login to view profile',
            style: TextStyle(color: Colors.white54),
          ),
        ),
      );
    }

    final isOwnProfile = targetUserId == currentUserId;
    final postsStream = _postService.getUserPosts(targetUserId);

    return StreamBuilder<UserModel?>(
      stream: userService.getUserData(targetUserId),
      builder: (context, userSnapshot) {
        final user = userSnapshot.data;
        if (user == null) {
          return const Scaffold(
            backgroundColor: landingBackground,
            body: Center(
              child: CircularProgressIndicator(color: landingPrimary),
            ),
          );
        }

        final scaffold = Scaffold(
          backgroundColor: landingBackground,
          body: ColoredBox(
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
                        stops: const [0, 0.22, 1],
                      ),
                    ),
                  ),
                ),
                ResponsiveContent(
                  maxWidth: 560,
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: ClampingScrollPhysics(),
                    ),
                    slivers: [
                      SliverAppBar(
                        pinned: true,
                        automaticallyImplyLeading: false,
                        toolbarHeight: 66,
                        backgroundColor: landingBackground.withValues(
                          alpha: 0.88,
                        ),
                        surfaceTintColor: Colors.transparent,
                        elevation: 0,
                        flexibleSpace: ClipRect(
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                            child: SafeArea(
                              bottom: false,
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 16),
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: 96,
                                      child: Align(
                                        alignment: Alignment.centerLeft,
                                        child: widget.userId != null
                                            ? IconButton(
                                                onPressed: () =>
                                                    navigateToParentRoute(
                                                        context),
                                                splashRadius: 20,
                                                icon: const Icon(
                                                  Icons.arrow_back_rounded,
                                                  color: landingMuted,
                                                  size: 22,
                                                ),
                                              )
                                            : const SizedBox.shrink(),
                                      ),
                                    ),
                                    Expanded(
                                      child: Center(
                                        child: Text(
                                          isOwnProfile
                                              ? 'MY PROFILE'
                                              : 'PROFILE',
                                          overflow: TextOverflow.ellipsis,
                                          style: AppTheme.label(
                                            color: Colors.white,
                                            size: 11.5,
                                            weight: FontWeight.w900,
                                            letterSpacing: 2.1,
                                          ),
                                        ),
                                      ),
                                    ),
                                    SizedBox(
                                      width: 96,
                                      child: Align(
                                        alignment: Alignment.centerRight,
                                        child: isOwnProfile
                                            ? IconButton(
                                                onPressed: _openSettings,
                                                splashRadius: 20,
                                                icon: const Icon(
                                                  Icons.settings_outlined,
                                                  color: landingMuted,
                                                  size: 21,
                                                ),
                                              )
                                            : const SizedBox.shrink(),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
                        sliver: SliverToBoxAdapter(
                          child: _ProfileHeroSection(
                            user: user,
                            isOwnProfile: isOwnProfile,
                            postsStream: postsStream,
                            onManageIdentity: () => _openManageIdentity(),
                            onAvatarTap: isOwnProfile
                                ? () => _openManageIdentity(
                                      openAvatarPicker: true,
                                    )
                                : null,
                            onStartBattle: _openBattles,
                            onFollowersTap: () => _openFollowers(user.uid),
                            onFollowingTap: () => _openFollowing(user.uid),
                            followStream: isOwnProfile
                                ? null
                                : userService.isFollowing(user.uid),
                            onToggleFollow: isOwnProfile
                                ? null
                                : (isFollowing) => userService.toggleFollow(
                                      user.uid,
                                      isFollowing,
                                    ),
                          ),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                        sliver: SliverToBoxAdapter(
                          child: _ProfileTabs(
                            activeTab: _activeTab,
                            onChanged: (tab) =>
                                setState(() => _activeTab = tab),
                          ),
                        ),
                      ),
                      if (_activeTab == _ProfileTab.roasts)
                        _buildRoastsSliver(
                          userId: targetUserId,
                          isOwnProfile: isOwnProfile,
                        )
                      else
                        _ChallengesTabSliver(
                          userId: targetUserId,
                          isOwnProfile: isOwnProfile,
                          onStartBattle: _openBattles,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );

        if (widget.userId != null) {
          return ParentBackScope(child: scaffold);
        }
        return scaffold;
      },
    );
  }

  Widget _buildRoastsSliver({
    required String userId,
    required bool isOwnProfile,
  }) {
    return StreamBuilder<List<PostModel>>(
      stream: _postService.getUserPosts(userId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: CircularProgressIndicator(color: landingPrimary),
            ),
          );
        }

        final posts = snapshot.data ?? const <PostModel>[];
        if (posts.isEmpty) {
          return SliverFillRemaining(
            hasScrollBody: false,
            child: _ProfileEmptyState(
              icon: Icons.block_rounded,
              title: 'NO ROASTS YET',
              subtitle:
                  'The arena is quiet. Your verbal arsenal is currently empty.',
              buttonLabel: 'START BATTLE',
              onPressed: _openBattles,
            ),
          );
        }

        return SliverPadding(
          padding: const EdgeInsets.fromLTRB(8, 14, 8, 116),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final post = posts[index];
                return LandingFeedCard(
                  post: post,
                  margin: const EdgeInsets.only(bottom: 18),
                  onFire: (value) => _postService.likePost(value.id),
                  onDown: (value) => _postService.dislikePost(value.id),
                  onShare: (value) => _postService.sharePost(value.id),
                  onDelete:
                      isOwnProfile ? (value) => _confirmDelete(value.id) : null,
                );
              },
              childCount: posts.length,
            ),
          ),
        );
      },
    );
  }
}

class _ProfileHeroSection extends StatelessWidget {
  const _ProfileHeroSection({
    required this.user,
    required this.isOwnProfile,
    required this.postsStream,
    required this.onManageIdentity,
    required this.onAvatarTap,
    required this.onStartBattle,
    required this.onFollowersTap,
    required this.onFollowingTap,
    this.followStream,
    this.onToggleFollow,
  });

  final UserModel user;
  final bool isOwnProfile;
  final Stream<List<PostModel>> postsStream;
  final Future<void> Function() onManageIdentity;
  final VoidCallback? onAvatarTap;
  final VoidCallback onStartBattle;
  final VoidCallback onFollowersTap;
  final VoidCallback onFollowingTap;
  final Stream<bool>? followStream;
  final Future<void> Function(bool isFollowing)? onToggleFollow;

  @override
  Widget build(BuildContext context) {
    final bio = (user.bio?.trim().isNotEmpty ?? false)
        ? user.bio!.trim()
        : 'The arena is quiet. The flame never dies.';
    final displayHandle = user.publicHandle.replaceFirst('@', '');

    return Column(
      children: [
        const SizedBox(height: 8),
        _ProfileAvatar(
          user: user,
          editable: isOwnProfile,
          onTap: onAvatarTap,
        ),
        const SizedBox(height: 28),
        Text(
          displayHandle,
          textAlign: TextAlign.center,
          style: GoogleFonts.epilogue(
            color: Colors.white,
            fontSize: 30,
            fontWeight: FontWeight.w900,
            height: 0.98,
            letterSpacing: -1.5,
          ),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            bio,
            textAlign: TextAlign.center,
            style: GoogleFonts.manrope(
              color: landingMuted,
              fontSize: 15,
              fontWeight: FontWeight.w500,
              height: 1.55,
            ),
          ),
        ),
        const SizedBox(height: 34),
        StreamBuilder<List<PostModel>>(
          stream: postsStream,
          builder: (context, snapshot) {
            final postCount = snapshot.data?.length ?? user.postsCount;
            return Row(
              children: [
                Expanded(
                  child: _ProfileStat(
                    value: formatCompactCount(postCount),
                    label: 'ROASTS',
                    emphasize: true,
                  ),
                ),
                Expanded(
                  child: _ProfileStat(
                    value: formatCompactCount(user.followerCount),
                    label: 'FOLLOWERS',
                    onTap: onFollowersTap,
                  ),
                ),
                Expanded(
                  child: _ProfileStat(
                    value: formatCompactCount(user.followingCount),
                    label: 'FOLLOWING',
                    onTap: onFollowingTap,
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 34),
        SizedBox(
          width: double.infinity,
          child: isOwnProfile
              ? _PrimaryArenaButton(
                  label: 'MANAGE IDENTITY',
                  manageVariant: true,
                  onPressed: () {
                    onManageIdentity();
                  },
                )
              : StreamBuilder<bool>(
                  stream: followStream,
                  builder: (context, snapshot) {
                    final isFollowing = snapshot.data ?? false;
                    return _PrimaryArenaButton(
                      label: isFollowing ? 'FOLLOWING' : 'FOLLOW ROASTER',
                      filled: !isFollowing,
                      onPressed: () {
                        onToggleFollow?.call(isFollowing);
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.user,
    required this.editable,
    this.onTap,
  });

  final UserModel user;
  final bool editable;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final avatar = DecoratedBox(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: landingPrimary.withValues(alpha: 0.22),
            blurRadius: 34,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 138,
            height: 138,
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  landingPrimarySoft,
                  landingPrimary,
                ],
              ),
            ),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: landingBackground,
              ),
              child: RoastAvatar(
                avatarId: user.profileImage,
                radius: 62,
                fallbackSeed: user.uid,
              ),
            ),
          ),
          if (editable)
            Positioned(
              right: 4,
              bottom: 6,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: landingPrimary,
                  shape: BoxShape.circle,
                  border: Border.all(color: landingBackground, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: landingPrimary.withValues(alpha: 0.18),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.edit_rounded,
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
        ],
      ),
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: avatar,
      ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({
    required this.value,
    required this.label,
    this.emphasize = false,
    this.onTap,
  });

  final String value;
  final String label;
  final bool emphasize;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(onTap != null ? 12 : 0),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: GoogleFonts.epilogue(
                  color: emphasize ? landingPrimarySoft : Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.8,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: GoogleFonts.manrope(
                  color: landingMuted,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrimaryArenaButton extends StatelessWidget {
  const _PrimaryArenaButton({
    required this.label,
    required this.onPressed,
    this.filled = true,
    this.manageVariant = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool filled;
  final bool manageVariant;

  @override
  Widget build(BuildContext context) {
    final background = manageVariant
        ? landingBackground
        : filled
            ? landingPrimarySoft
            : Colors.transparent;
    final foreground = manageVariant
        ? Colors.white
        : filled
            ? const Color(0xFF3F0508)
            : Colors.white;
    final side = manageVariant
        ? BorderSide(
            color: landingPrimary.withValues(alpha: 0.92),
            width: 1.4,
          )
        : filled
            ? BorderSide.none
            : BorderSide(color: landingPrimarySoft.withValues(alpha: 0.45));
    final minimumHeight = manageVariant ? 54.0 : 60.0;
    final borderRadius = manageVariant ? 16.0 : 14.0;

    return DecoratedBox(
      decoration: BoxDecoration(
        boxShadow: manageVariant
            ? [
                BoxShadow(
                  color: landingPrimary.withValues(alpha: 0.10),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ]
            : filled
                ? [
                    BoxShadow(
                      color: landingPrimarySoft.withValues(alpha: 0.16),
                      blurRadius: 28,
                      offset: const Offset(0, 12),
                    ),
                  ]
                : null,
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ButtonStyle(
          elevation: const WidgetStatePropertyAll(0),
          foregroundColor: WidgetStatePropertyAll(foreground),
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (manageVariant) {
              if (states.contains(WidgetState.pressed)) {
                return landingSurfaceHigh;
              }
              if (states.contains(WidgetState.hovered)) {
                return landingSurface;
              }
            }
            return background;
          }),
          overlayColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed)) {
              return landingPrimary.withValues(alpha: 0.16);
            }
            if (states.contains(WidgetState.hovered)) {
              return landingPrimary.withValues(alpha: 0.08);
            }
            return null;
          }),
          minimumSize: WidgetStatePropertyAll(Size.fromHeight(minimumHeight)),
          side: WidgetStatePropertyAll(side),
          padding: const WidgetStatePropertyAll(
            EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          ),
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(borderRadius),
            ),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.epilogue(
            color: foreground,
            fontSize: manageVariant ? 13 : 14,
            fontWeight: FontWeight.w800,
            letterSpacing: manageVariant ? 1.7 : 1.4,
          ),
        ),
      ),
    );
  }
}

class _ProfileTabs extends StatelessWidget {
  const _ProfileTabs({
    required this.activeTab,
    required this.onChanged,
  });

  final _ProfileTab activeTab;
  final ValueChanged<_ProfileTab> onChanged;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.white.withValues(alpha: 0.08),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ProfileTabButton(
              label: 'ROASTS',
              icon: Icons.mic_rounded,
              active: activeTab == _ProfileTab.roasts,
              onTap: () => onChanged(_ProfileTab.roasts),
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: _ProfileTabButton(
              label: 'CHALLENGES',
              icon: Icons.emoji_events_rounded,
              active: activeTab == _ProfileTab.challenges,
              onTap: () => onChanged(_ProfileTab.challenges),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileTabButton extends StatelessWidget {
  const _ProfileTabButton({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Column(
            children: [
              SizedBox(
                height: 22,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      icon,
                      size: 14,
                      color: active ? Colors.white : landingMuted,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: GoogleFonts.epilogue(
                        color: active ? Colors.white : landingMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                curve: Curves.easeOutCubic,
                height: 2.4,
                width: double.infinity,
                color: active ? landingPrimary : Colors.transparent,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileEmptyState extends StatelessWidget {
  const _ProfileEmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.onPressed,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String buttonLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(32, 36, 32, 116),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Transform.rotate(
                  angle: 0.78,
                  child: Container(
                    width: 104,
                    height: 104,
                    decoration: BoxDecoration(
                      color: landingSurfaceHigh.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(26),
                    ),
                  ),
                ),
                Positioned.fill(
                  child: Center(
                    child: Transform.rotate(
                      angle: -0.78,
                      child: Icon(
                        icon,
                        color: Colors.white38,
                        size: 44,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 34),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.epilogue(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.manrope(
                color: landingMuted,
                fontSize: 15,
                fontWeight: FontWeight.w500,
                height: 1.55,
              ),
            ),
            const SizedBox(height: 28),
            OutlinedButton.icon(
              onPressed: onPressed,
              icon: const Icon(
                Icons.bolt_rounded,
                color: landingPrimarySoft,
                size: 18,
              ),
              label: Text(
                buttonLabel,
                style: GoogleFonts.manrope(
                  color: landingPrimarySoft,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.4,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: landingPrimarySoft,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                side: BorderSide(
                  color: landingPrimarySoft.withValues(alpha: 0.45),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Badge & rank helpers ─────────────────────────────────────────────────────

const Map<String, String> _badgeEmoji = {
  'savage_king': '🔥',
  'roast_master': '🎤',
  'arena_champion': '⚔️',
  'battle_veteran': '🛡️',
  'win_streak_3': '🔥',
  'win_streak_5': '💥',
  'win_streak_10': '👑',
  'first_blood': '🩸',
};

const Map<String, String> _badgeLabel = {
  'savage_king': 'Savage King',
  'roast_master': 'Roast Master',
  'arena_champion': 'Arena Champion',
  'battle_veteran': 'Battle Veteran',
  'win_streak_3': 'On Fire',
  'win_streak_5': 'Unstoppable',
  'win_streak_10': 'Godmode',
  'first_blood': 'First Blood',
};

Color _rankColor(String rank) {
  switch (rank) {
    case 'legend':
      return const Color(0xFFFFD700);
    case 'platinum':
      return const Color(0xFF67E8F9);
    case 'gold':
      return const Color(0xFFFBBF24);
    case 'silver':
      return const Color(0xFFD1D5DB);
    case 'bronze':
      return const Color(0xFFF97316);
    default:
      return Colors.white24;
  }
}

String _rankEmoji(String rank) {
  switch (rank) {
    case 'legend':
      return '👑';
    case 'platinum':
      return '💎';
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'bronze':
      return '🥉';
    default:
      return '🛡️';
  }
}

// ─── _ChallengesTabSliver ─────────────────────────────────────────────────────

class _ChallengesTabSliver extends StatefulWidget {
  final String userId;
  final bool isOwnProfile;
  final VoidCallback onStartBattle;

  const _ChallengesTabSliver({
    required this.userId,
    required this.isOwnProfile,
    required this.onStartBattle,
  });

  @override
  State<_ChallengesTabSliver> createState() => _ChallengesTabSliverState();
}

class _ChallengesTabSliverState extends State<_ChallengesTabSliver> {
  final BattleService _battleService = BattleService();
  UserBattleStats? _stats;
  List<BattleModel>? _history;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final statsResult =
          await _battleService.getUserBattleStats(widget.userId);
      final historyResult =
          await _battleService.getUserBattleHistory(widget.userId);
      if (mounted) {
        setState(() {
          _stats = statsResult;
          _history = historyResult;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: CircularProgressIndicator(color: landingPrimary),
        ),
      );
    }

    final stats = _stats;
    if (stats == null || stats.battleParticipations == 0) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: _ProfileEmptyState(
          icon: Icons.emoji_events_outlined,
          title: 'NO CHALLENGES YET',
          subtitle: widget.isOwnProfile
              ? 'Jump into an arena to start building your battle record.'
              : 'No challenge runs are live on this profile yet.',
          buttonLabel: 'START BATTLE',
          onPressed: widget.onStartBattle,
        ),
      );
    }

    final history = _history ?? const [];

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 116),
      sliver: SliverList(
        delegate: SliverChildListDelegate([
          // ── Rank badge ──────────────────────────────────────────────────────
          _RankBadgeCard(rank: stats.currentRank),
          const SizedBox(height: 16),

          // ── Eligible Performer banner ────────────────────────────────────
          if (stats.eligiblePerformer) ...[
            _EligiblePerformerBanner(isOwnProfile: widget.isOwnProfile),
            const SizedBox(height: 16),
          ],

          // ── Stats grid ──────────────────────────────────────────────────
          _StatsGrid(stats: stats),
          const SizedBox(height: 20),

          // ── Badges ──────────────────────────────────────────────────────
          if (stats.badges.isNotEmpty) ...[
            _SectionLabel(label: 'BADGES'),
            const SizedBox(height: 12),
            _BadgesRow(badges: stats.badges),
            const SizedBox(height: 20),
          ],

          // ── Battle history ───────────────────────────────────────────────
          _SectionLabel(label: 'BATTLE HISTORY'),
          const SizedBox(height: 12),
          if (history.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'No battle history yet.',
                  style: GoogleFonts.manrope(
                    color: landingMuted,
                    fontSize: 13,
                  ),
                ),
              ),
            )
          else
            ...history.map((battle) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _BattleHistoryRow(
                    battle: battle,
                    userId: widget.userId,
                  ),
                )),
        ]),
      ),
    );
  }
}

// ─── _RankBadgeCard ───────────────────────────────────────────────────────────

class _RankBadgeCard extends StatelessWidget {
  final String rank;
  const _RankBadgeCard({required this.rank});

  @override
  Widget build(BuildContext context) {
    final color = _rankColor(rank);
    final emoji = _rankEmoji(rank);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: landingSurface,
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 32)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rank.toUpperCase(),
                  style: GoogleFonts.epilogue(
                    color: color,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
                Text(
                  'Current Battle Rank',
                  style: GoogleFonts.manrope(
                    color: landingMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── _EligiblePerformerBanner ─────────────────────────────────────────────────

class _EligiblePerformerBanner extends StatelessWidget {
  final bool isOwnProfile;
  const _EligiblePerformerBanner({required this.isOwnProfile});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: const Color(0xFFFF6B00).withValues(alpha: 0.12),
        border: Border.all(
          color: const Color(0xFFFF6B00).withValues(alpha: 0.30),
        ),
      ),
      child: Row(
        children: [
          const Text('⚡', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isOwnProfile
                  ? 'You are an Eligible Performer — 5+ wins earned!'
                  : 'This roaster is an Eligible Performer.',
              style: GoogleFonts.manrope(
                color: const Color(0xFFFF6B00),
                fontSize: 13,
                fontWeight: FontWeight.w700,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── _StatsGrid ───────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  final UserBattleStats stats;
  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.15,
      children: [
        _StatTile(value: '${stats.battleParticipations}', label: 'BATTLES'),
        _StatTile(value: '${stats.battleWins}', label: 'WINS'),
        _StatTile(value: '${stats.battleLosses}', label: 'LOSSES'),
        _StatTile(value: '${stats.winRate}%', label: 'WIN RATE'),
        _StatTile(value: '${stats.currentWinStreak}', label: 'STREAK'),
        _StatTile(value: '${stats.maxWinStreak}', label: 'BEST STK'),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final String value;
  final String label;
  const _StatTile({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: landingSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: GoogleFonts.epilogue(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.manrope(
              color: landingMuted,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── _BadgesRow ───────────────────────────────────────────────────────────────

class _BadgesRow extends StatelessWidget {
  final List<String> badges;
  const _BadgesRow({required this.badges});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: badges.map((badge) {
        final emoji = _badgeEmoji[badge] ?? '🏅';
        final label = _badgeLabel[badge] ?? badge;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: landingSurface,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: landingPrimary.withValues(alpha: 0.22),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.manrope(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ─── _BattleHistoryRow ────────────────────────────────────────────────────────

class _BattleHistoryRow extends StatelessWidget {
  final BattleModel battle;
  final String userId;
  const _BattleHistoryRow({required this.battle, required this.userId});

  @override
  Widget build(BuildContext context) {
    final hasWinner = battle.winnerId != null && battle.winnerId!.isNotEmpty;
    final won = hasWinner && battle.winnerId == userId;
    final lost = hasWinner && battle.winnerId != userId;
    final resultColor = won
        ? Colors.greenAccent
        : lost
            ? Colors.redAccent
            : Colors.white38;
    final resultLabel = won
        ? 'WIN'
        : lost
            ? 'LOSS'
            : battle.computedStatus.toUpperCase();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: landingSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  battle.title.toUpperCase(),
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.epilogue(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  battle.type.toUpperCase(),
                  style: GoogleFonts.manrope(
                    color: landingMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: resultColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              resultLabel,
              style: GoogleFonts.epilogue(
                color: resultColor,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── _SectionLabel ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: GoogleFonts.epilogue(
        color: Colors.white54,
        fontSize: 10,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.8,
      ),
    );
  }
}
