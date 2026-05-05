import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/models/user_model.dart';
import 'package:tanamaaro_mobile/screens/profile_screen.dart';
import 'package:tanamaaro_mobile/services/user_service.dart';
import 'package:tanamaaro_mobile/widgets/landing_feed_card.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';

enum ProfileConnectionType {
  followers,
  following,
}

class ProfileConnectionsScreen extends StatelessWidget {
  const ProfileConnectionsScreen({
    super.key,
    required this.userId,
    required this.type,
  });

  final String userId;
  final ProfileConnectionType type;

  String get _title {
    return switch (type) {
      ProfileConnectionType.followers => 'FOLLOWERS',
      ProfileConnectionType.following => 'FOLLOWING',
    };
  }

  @override
  Widget build(BuildContext context) {
    final userService = UserService();
    final stream = type == ProfileConnectionType.followers
        ? userService.getFollowers(userId)
        : userService.getFollowing(userId);

    return ParentBackScope(
      child: Scaffold(
        backgroundColor: landingBackground,
        appBar: AppBar(
          backgroundColor: landingBackground,
          leading: IconButton(
            onPressed: () => navigateToParentRoute(context),
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          title: Text(
            _title,
            style: GoogleFonts.epilogue(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
            ),
          ),
          centerTitle: true,
        ),
        body: StreamBuilder<List<UserModel>>(
          stream: stream,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(color: landingPrimary),
              );
            }

            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Could not load this list right now.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.manrope(
                      color: landingMuted,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              );
            }

            final users = snapshot.data ?? const <UserModel>[];
            if (users.isEmpty) {
              final subtitle = type == ProfileConnectionType.followers
                  ? 'No followers yet.'
                  : 'Not following anyone yet.';
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        type == ProfileConnectionType.followers
                            ? Icons.people_outline_rounded
                            : Icons.person_add_alt_1_rounded,
                        color: Colors.white24,
                        size: 40,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        _title,
                        style: GoogleFonts.epilogue(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        subtitle,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.manrope(
                          color: landingMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
              itemCount: users.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final user = users[index];
                return Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProfileScreen(userId: user.uid),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Ink(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: landingSurface,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          RoastAvatar(
                            avatarId: user.profileImage,
                            radius: 22,
                            fallbackSeed: user.uid,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user.publicHandle,
                                  style: GoogleFonts.epilogue(
                                    color: landingPrimary,
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  (user.bio?.trim().isNotEmpty ?? false)
                                      ? user.bio!.trim()
                                      : 'Arena handle',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.manrope(
                                    color: landingMuted,
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.chevron_right_rounded,
                            color: landingMuted,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
