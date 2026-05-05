import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tanamaaro_mobile/core/avatar_config.dart';

class UserModel {
  final String uid;
  final String? username;
  final String handle;
  final String email;
  final String? phone;
  final String? bio;
  final String profileImage;
  final int postsCount;
  final int followerCount;
  final int followingCount;
  final DateTime createdAt;

  // ── Battle gamification fields ──────────────────────────────────────────────
  final int battleParticipations;
  final int battleWins;
  final int battleLosses;
  final int winRate;              // 0–100
  final int currentWinStreak;
  final int maxWinStreak;
  final int bestScore;
  final List<String> badges;
  final bool eligiblePerformer;
  final String currentRank;       // unranked | bronze | silver | gold | platinum | legend

  UserModel({
    required this.uid,
    this.username,
    required this.handle,
    required this.email,
    this.phone,
    this.bio,
    required this.profileImage,
    required this.postsCount,
    required this.followerCount,
    required this.followingCount,
    required this.createdAt,
    this.battleParticipations = 0,
    this.battleWins = 0,
    this.battleLosses = 0,
    this.winRate = 0,
    this.currentWinStreak = 0,
    this.maxWinStreak = 0,
    this.bestScore = 0,
    this.badges = const [],
    this.eligiblePerformer = false,
    this.currentRank = 'unranked',
  });

  String get publicHandle {
    final raw = (username ?? handle).trim().replaceAll('@', '');
    if (raw.isEmpty) return '@ROASTER';
    return '@${raw.toUpperCase()}';
  }

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    final uid = data['uid'] ?? doc.id;
    final rawHandle =
        (data['handle'] ?? data['username'] ?? 'roaster').toString();
    final normalizedHandle = rawHandle.trim().replaceAll('@', '').toLowerCase();
    return UserModel(
      uid: uid,
      username: normalizedHandle,
      handle: normalizedHandle,
      email: data['email'] ?? '',
      phone: data['phone'],
      bio: data['bio'] ?? 'Tana Maaro Challenger',
      profileImage: normalizeAvatarValue(
        data['profileImage'] as String? ?? '',
        fallbackSeed: uid,
      ),
      postsCount: data['postsCount'] ?? 0,
      followerCount: data['followerCount'] ?? 0,
      followingCount: data['followingCount'] ?? 0,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      // Battle stats
      battleParticipations: (data['battleParticipations'] as num?)?.toInt() ?? 0,
      battleWins:           (data['battleWins']           as num?)?.toInt() ?? 0,
      battleLosses:         (data['battleLosses']         as num?)?.toInt() ?? 0,
      winRate:              (data['winRate']               as num?)?.toInt() ?? 0,
      currentWinStreak:     (data['currentWinStreak']     as num?)?.toInt() ?? 0,
      maxWinStreak:         (data['maxWinStreak']         as num?)?.toInt() ?? 0,
      bestScore:            (data['bestScore']            as num?)?.toInt() ?? 0,
      badges: (data['badges'] as List<dynamic>?)
              ?.map((b) => b.toString())
              .toList() ??
          const [],
      eligiblePerformer: data['eligiblePerformer'] as bool? ?? false,
      currentRank:       data['currentRank']       as String? ?? 'unranked',
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'username': username,
      'handle': handle,
      'email': email,
      'phone': phone,
      'bio': bio,
      'profileImage': profileImage,
      'postsCount': postsCount,
      'followerCount': followerCount,
      'followingCount': followingCount,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}
