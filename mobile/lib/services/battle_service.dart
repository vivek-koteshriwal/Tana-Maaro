import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

// ─── Duration constants (mirrors web DURATION_MS) ────────────────────────────

const Duration kBattleDurationShort    = Duration(minutes: 15);
const Duration kBattleDurationStandard = Duration(hours: 24);

// ─── Models ──────────────────────────────────────────────────────────────────

class BattleModel {
  final String id;
  final String title;
  final String type;
  final String duration; // 'short' | 'standard'
  final DateTime startTime;
  final DateTime endTime;
  final List<String> participants;
  final String? winnerId;
  final String? winnerUsername;

  BattleModel({
    required this.id,
    required this.title,
    required this.type,
    this.duration = 'standard',
    required this.startTime,
    required this.endTime,
    required this.participants,
    this.winnerId,
    this.winnerUsername,
  });

  int get participantsCount => participants.length;

  String get computedStatus {
    final now = DateTime.now();
    if (now.isAfter(endTime)) return 'ended';
    if (now.isAfter(startTime)) return 'live';
    return 'upcoming';
  }

  factory BattleModel.fromFirestore(DocumentSnapshot doc) {
    final raw  = doc.data();
    final data = raw is Map<String, dynamic> ? raw : <String, dynamic>{};
    return BattleModel(
      id:             doc.id,
      title:          data['title']          ?? 'Battle Arena',
      type:           data['type']           ?? 'general',
      duration:       data['duration']       ?? 'standard',
      startTime:      _parseTime(data['startTime']) ?? DateTime.now(),
      endTime:        _parseTime(data['endTime'])   ?? DateTime.now().add(kBattleDurationStandard),
      participants:   (data['participants'] as Iterable?)
                          ?.map((e) => e.toString())
                          .where((e) => e.isNotEmpty)
                          .toList(growable: false) ?? const [],
      winnerId:        data['winnerId']        as String?,
      winnerUsername:  data['winnerUsername']  as String?,
    );
  }

  static DateTime? _parseTime(dynamic v) {
    if (v is Timestamp) return v.toDate();
    if (v is DateTime)  return v;
    if (v is int)       return DateTime.fromMillisecondsSinceEpoch(v);
    if (v is num)       return DateTime.fromMillisecondsSinceEpoch(v.toInt());
    if (v is String)    return DateTime.tryParse(v);
    return null;
  }
}

// ─── Score breakdown (mirrors web 3-layer formula) ───────────────────────────
//
//   Layer 1 – Engagement (×0.4) : likes×2 + comments×3 + shares×4
//   Layer 2 – Voting     (×0.4) : votesReceived × 10
//   Layer 3 – Quality    (×0.2) : replyChains×3 + uniqueCommenters×2
//
//   finalScore = (eng×0.4) + (vote×0.4) + (qual×0.2)

class LeaderboardEntry {
  final String userId;
  final String username;
  final String avatar;
  final int totalLikes;
  final int totalComments;
  final int totalShares;
  final int votesReceived;
  final int replyChains;
  final int engagementScore;
  final int votingScore;
  final int qualityScore;
  final int finalScore;
  final int rank;
  final String delta; // 'leading' | 'catching_up' | 'trailing'

  const LeaderboardEntry({
    required this.userId,
    required this.username,
    required this.avatar,
    this.totalLikes = 0,
    this.totalComments = 0,
    this.totalShares = 0,
    this.votesReceived = 0,
    this.replyChains = 0,
    required this.engagementScore,
    required this.votingScore,
    required this.qualityScore,
    required this.finalScore,
    required this.rank,
    this.delta = 'trailing',
  });

  // Simple getter for backward compat
  int get score => finalScore;
}

// ─── Vote model ───────────────────────────────────────────────────────────────

class BattleVote {
  final String battleId;
  final String voterId;
  final String votedForId;
  final DateTime createdAt;

  const BattleVote({
    required this.battleId,
    required this.voterId,
    required this.votedForId,
    required this.createdAt,
  });

  factory BattleVote.fromMap(Map<String, dynamic> data) {
    return BattleVote(
      battleId:   data['battleId']  ?? '',
      voterId:    data['voterId']   ?? '',
      votedForId: data['votedForId'] ?? '',
      createdAt:  (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}

// ─── Battle stats (read from user doc) ───────────────────────────────────────

class UserBattleStats {
  final int battleParticipations;
  final int battleWins;
  final int battleLosses;
  final int winRate;
  final int currentWinStreak;
  final int maxWinStreak;
  final int bestScore;
  final List<String> badges;
  final bool eligiblePerformer;
  final String currentRank;

  const UserBattleStats({
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

  factory UserBattleStats.fromMap(Map<String, dynamic> data) {
    return UserBattleStats(
      battleParticipations: (data['battleParticipations'] as num?)?.toInt() ?? 0,
      battleWins:           (data['battleWins']           as num?)?.toInt() ?? 0,
      battleLosses:         (data['battleLosses']         as num?)?.toInt() ?? 0,
      winRate:              (data['winRate']               as num?)?.toInt() ?? 0,
      currentWinStreak:     (data['currentWinStreak']     as num?)?.toInt() ?? 0,
      maxWinStreak:         (data['maxWinStreak']         as num?)?.toInt() ?? 0,
      bestScore:            (data['bestScore']            as num?)?.toInt() ?? 0,
      badges:               (data['badges'] as List<dynamic>?)
                                ?.map((b) => b.toString()).toList() ?? const [],
      eligiblePerformer:    data['eligiblePerformer'] as bool? ?? false,
      currentRank:          data['currentRank']       as String? ?? 'unranked',
    );
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

class BattleService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final FirebaseAuth _auth = FirebaseAuth.instance;

  static Future<void>? _maintenanceTask;
  static DateTime?      _lastMaintenanceAt;
  static const Duration _maintenanceCooldown = Duration(seconds: 20);

  // ── Streams ─────────────────────────────────────────────────────────────────

  Stream<List<BattleModel>> getActiveBattles() {
    unawaited(_runBattleMaintenance());
    return _battleStream().map(
      (battles) => battles.where((b) => b.computedStatus != 'ended').toList(),
    );
  }

  Stream<List<BattleModel>> getBattlesForCategory(String categoryId, {String? typeKey}) {
    unawaited(_runBattleMaintenance());
    return _battleStream().map(
      (battles) => battles.where((b) => matchesCategory(b, categoryId, typeKey: typeKey)).toList(),
    );
  }

  Stream<BattleModel?> getBattle(String battleId) {
    unawaited(_runBattleMaintenance());
    return _firestore.collection('battles').doc(battleId).snapshots().map((doc) {
      if (!doc.exists) return null;
      final battle = _safeBattleFromSnapshot(doc);
      if (battle == null) return null;
      // Return battle even if ended so we can show winner banner
      return battle;
    });
  }

  // ── One-shot fetch ──────────────────────────────────────────────────────────

  Future<BattleModel?> getBattleById(String battleId) async {
    await _runBattleMaintenance();
    final doc = await _firestore.collection('battles').doc(battleId).get();
    if (!doc.exists) return null;
    return _safeBattleFromSnapshot(doc);
  }

  // ── Join / Leave ─────────────────────────────────────────────────────────────

  Future<void> ensureBattleForType(String type, String displayTitle) async {
    await _runBattleMaintenance(force: true);
    await _ensureFreshBattleForType(type, displayTitle);
  }

  Future<void> joinBattle(String battleId) async {
    final user = _auth.currentUser;
    if (user == null) return;
    await _runBattleMaintenance(force: true);

    final battleRef = _firestore.collection('battles').doc(battleId);
    final battleDoc = await battleRef.get();
    if (!battleDoc.exists) {
      throw StateError('This battle just reset. Go back and enter the live arena.');
    }
    final battle = _safeBattleFromSnapshot(battleDoc);
    if (battle == null) throw StateError('This battle data is invalid. Please try again.');
    if (battle.computedStatus == 'ended') {
      throw StateError('This battle expired. Go back and enter the latest arena.');
    }
    await battleRef.update({'participants': FieldValue.arrayUnion([user.uid])});
  }

  Future<void> leaveBattle(String battleId) async {
    final user = _auth.currentUser;
    if (user == null) return;
    await _runBattleMaintenance();
    await _firestore.collection('battles').doc(battleId).update({
      'participants': FieldValue.arrayRemove([_auth.currentUser!.uid]),
    });
  }

  // ── Voting ───────────────────────────────────────────────────────────────────

  /// Cast a vote for [votedForId] in [battleId].
  /// One vote per user per battle — throws if already voted.
  Future<void> castVote(String battleId, String votedForId) async {
    final user = _auth.currentUser;
    if (user == null) throw StateError('Sign in to vote.');

    final voteId  = '${battleId}_${user.uid}';
    final voteRef = _firestore.collection('battle_votes').doc(voteId);
    final existing = await voteRef.get();
    if (existing.exists) throw StateError('You have already voted in this battle.');

    if (votedForId == user.uid) throw StateError('You cannot vote for yourself.');

    await voteRef.set({
      'id':         voteId,
      'battleId':   battleId,
      'voterId':    user.uid,
      'votedForId': votedForId,
      'createdAt':  FieldValue.serverTimestamp(),
    });
  }

  /// Returns this user's vote for [battleId], or null if not voted.
  Future<BattleVote?> getMyVote(String battleId) async {
    final user = _auth.currentUser;
    if (user == null) return null;
    final voteId  = '${battleId}_${user.uid}';
    final doc = await _firestore.collection('battle_votes').doc(voteId).get();
    if (!doc.exists) return null;
    return BattleVote.fromMap(doc.data()!);
  }

  // ── 3-Layer Leaderboard ──────────────────────────────────────────────────────

  Future<({List<LeaderboardEntry> leaderboard, int totalVotes})> getLeaderboard(
      String battleId) async {
    // Fetch posts and votes in parallel
    final results = await Future.wait([
      _firestore.collection('posts').where('battleId', isEqualTo: battleId).get(),
      _firestore.collection('battle_votes').where('battleId', isEqualTo: battleId).get(),
    ]);

    final postsSnap = results[0] as QuerySnapshot;
    final votesSnap = results[1] as QuerySnapshot;

    // Tally votes per userId
    final voteCounts = <String, int>{};
    for (final doc in votesSnap.docs) {
      final data      = doc.data() as Map<String, dynamic>;
      final votedFor  = data['votedForId'] as String? ?? '';
      if (votedFor.isNotEmpty) {
        voteCounts[votedFor] = (voteCounts[votedFor] ?? 0) + 1;
      }
    }

    // Aggregate post signals per user
    final Map<String, Map<String, dynamic>> userMap = {};

    for (final doc in postsSnap.docs) {
      final data   = doc.data() as Map<String, dynamic>;
      final userId = data['userId'] as String? ?? '';
      if (userId.isEmpty || userId == 'anon') continue;

      final likes    = (data['likes']    as num?)?.toInt() ?? 0;
      final shares   = (data['shares']   as num?)?.toInt() ?? 0;
      final comments = (data['comments'] as num?)?.toInt() ?? 0;

      if (!userMap.containsKey(userId)) {
        userMap[userId] = {
          'username':  data['userHandle'] as String? ?? '@anon',
          'avatar':    data['userAvatar'] as String? ?? '',
          'likes':     0, 'comments': 0, 'shares': 0, 'replyChains': 0,
        };
      }

      userMap[userId]!['likes']    = (userMap[userId]!['likes']    as int) + likes;
      userMap[userId]!['comments'] = (userMap[userId]!['comments'] as int) + comments;
      userMap[userId]!['shares']   = (userMap[userId]!['shares']   as int) + shares;
      if (comments > 0) {
        userMap[userId]!['replyChains'] = (userMap[userId]!['replyChains'] as int) + 1;
      }
    }

    // Compute 3-layer scores
    final entries = userMap.entries.map((e) {
      final uid  = e.key;
      final u    = e.value;
      final l    = u['likes']       as int;
      final c    = u['comments']    as int;
      final s    = u['shares']      as int;
      final rc   = u['replyChains'] as int;
      final v    = voteCounts[uid]  ?? 0;

      final engRaw  = l * 2 + c * 3 + s * 4;
      final voteRaw = v * 10;
      final qualRaw = rc * 3;

      final engScore  = (engRaw  * 0.4).round();
      final voteScore = (voteRaw * 0.4).round();
      final qualScore = (qualRaw * 0.2).round();
      final total     = engScore + voteScore + qualScore;

      return {
        'userId': uid, 'username': u['username'], 'avatar': u['avatar'],
        'totalLikes': l, 'totalComments': c, 'totalShares': s,
        'votesReceived': v, 'replyChains': rc,
        'engagementScore': engScore, 'votingScore': voteScore,
        'qualityScore': qualScore, 'finalScore': total,
      };
    }).toList()
      ..sort((a, b) => (b['finalScore'] as int).compareTo(a['finalScore'] as int));

    final leaderboard = entries.asMap().entries.map((e) {
      final i    = e.key;
      final data = e.value;
      final topScore = entries.isNotEmpty ? (entries[0]['finalScore'] as int) : 0;
      final mine     = data['finalScore'] as int;
      final delta    = i == 0 ? 'leading'
          : mine >= topScore * 0.8 ? 'catching_up'
          : 'trailing';

      return LeaderboardEntry(
        userId:          data['userId']          as String,
        username:        data['username']        as String,
        avatar:          data['avatar']          as String,
        totalLikes:      data['totalLikes']      as int,
        totalComments:   data['totalComments']   as int,
        totalShares:     data['totalShares']     as int,
        votesReceived:   data['votesReceived']   as int,
        replyChains:     data['replyChains']     as int,
        engagementScore: data['engagementScore'] as int,
        votingScore:     data['votingScore']     as int,
        qualityScore:    data['qualityScore']    as int,
        finalScore:      data['finalScore']      as int,
        rank:            i + 1,
        delta:           delta,
      );
    }).toList();

    return (leaderboard: leaderboard, totalVotes: votesSnap.size);
  }

  // ── User battle stats & history ──────────────────────────────────────────────

  Future<UserBattleStats> getUserBattleStats(String userId) async {
    final doc = await _firestore.collection('users').doc(userId).get();
    if (!doc.exists) return const UserBattleStats();
    return UserBattleStats.fromMap(doc.data() ?? {});
  }

  Future<List<BattleModel>> getUserBattleHistory(String userId,
      {int limit = 20}) async {
    final snap = await _firestore
        .collection('battles')
        .where('participants', arrayContains: userId)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .get();
    return snap.docs
        .map(_safeBattleFromSnapshot)
        .whereType<BattleModel>()
        .toList();
  }

  // ── Category matching ────────────────────────────────────────────────────────

  bool matchesCategory(BattleModel battle, String categoryId, {String? typeKey}) {
    final raw        = battle.type.toLowerCase().trim();
    final normalized = raw.replaceAll(' vs. ', '_').replaceAll(' vs ', '_').replaceAll(' ', '_');
    final normCat    = categoryId.toLowerCase().trim();
    final normKey    = typeKey?.toLowerCase().trim();

    if (normalized == normCat || raw == normCat) return true;
    if (normKey != null && (normalized == normKey || raw == normKey)) return true;
    // Legacy compound keys: 'college_college' matches category 'college'
    if (normalized.startsWith(normCat)) return true;
    return raw.contains(normCat);
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  Future<void> _ensureFreshBattleForType(String type, String displayTitle) async {
    final snap = await _firestore.collection('battles').where('type', isEqualTo: type).get();
    final hasActive = snap.docs.any((doc) {
      final m = _safeBattleFromSnapshot(doc);
      return m != null && m.computedStatus != 'ended';
    });
    if (hasActive) return;
    await _createBattle(type, displayTitle);
  }

  Future<void> _createBattle(String type, String displayTitle,
      {Duration duration = kBattleDurationStandard}) async {
    final now = DateTime.now();
    await _firestore.collection('battles').add({
      'title':        displayTitle,
      'type':         type,
      'status':       'live',
      'duration':     duration == kBattleDurationShort ? 'short' : 'standard',
      'startTime':    Timestamp.fromDate(now),
      'endTime':      Timestamp.fromDate(now.add(duration)),
      'participants': [],
      'createdAt':    FieldValue.serverTimestamp(),
    });
  }

  Future<void> _runBattleMaintenance({bool force = false}) async {
    final now = DateTime.now();
    if (!force &&
        _lastMaintenanceAt != null &&
        now.difference(_lastMaintenanceAt!) < _maintenanceCooldown) return;

    final inFlight = _maintenanceTask;
    if (inFlight != null) { await inFlight; return; }

    final task = _performBattleMaintenance();
    _maintenanceTask = task;
    try {
      await task;
    } finally {
      _lastMaintenanceAt = DateTime.now();
      if (identical(_maintenanceTask, task)) _maintenanceTask = null;
    }
  }

  Future<void> _performBattleMaintenance() async {
    final endedSnap = await _firestore
        .collection('battles')
        .where('endTime', isLessThanOrEqualTo: Timestamp.fromDate(DateTime.now()))
        .get();

    if (endedSnap.docs.isEmpty) return;

    final replacements = <String, String>{};
    for (final doc in endedSnap.docs) {
      final battle = _safeBattleFromSnapshot(doc);
      if (battle == null) continue;
      // Only replace if no manual winner declared (admin-managed battles stay)
      if (battle.winnerId != null) continue;
      replacements.putIfAbsent(battle.type, () => battle.title);
      await _deleteBattleTree(doc.reference, battle);
    }

    for (final entry in replacements.entries) {
      await _ensureFreshBattleForType(entry.key, entry.value);
    }
  }

  Future<void> _deleteBattleTree(
    DocumentReference<Map<String, dynamic>> battleRef,
    BattleModel battle,
  ) async {
    final postsSnap = await _firestore
        .collection('posts')
        .where('battleId', isEqualTo: battle.id)
        .get();

    final userPostDecrements = <String, int>{};
    WriteBatch batch = _firestore.batch();
    var opCount = 0;

    Future<void> flush() async {
      if (opCount == 0) return;
      await batch.commit();
      batch = _firestore.batch();
      opCount = 0;
    }

    Future<void> queueDelete(DocumentReference ref) async {
      batch.delete(ref);
      opCount++;
      if (opCount >= 400) await flush();
    }

    Future<void> queueUpdate(DocumentReference<Map<String, dynamic>> ref,
        Map<String, dynamic> data) async {
      batch.set(ref, data, SetOptions(merge: true));
      opCount++;
      if (opCount >= 400) await flush();
    }

    for (final post in postsSnap.docs) {
      final data   = post.data();
      final userId = data['userId'] as String?;
      final isAnon = data['isAnonymous'] == true || userId == 'anon';
      final counts = data['countsTowardProfile'] as bool?;

      if (!isAnon && (counts ?? true) && userId != null && userId.isNotEmpty) {
        userPostDecrements[userId] = (userPostDecrements[userId] ?? 0) + 1;
      }

      final commentsSnap = await post.reference.collection('comments').get();
      for (final c in commentsSnap.docs) await queueDelete(c.reference);

      final notifSnap = await _firestore.collection('notifications')
          .where('postId', isEqualTo: post.id).get();
      for (final n in notifSnap.docs) await queueDelete(n.reference);

      await queueDelete(post.reference);
    }

    await queueDelete(battleRef);

    for (final entry in userPostDecrements.entries) {
      await queueUpdate(_firestore.collection('users').doc(entry.key),
          {'postsCount': FieldValue.increment(-entry.value)});
    }

    await flush();
  }

  Stream<List<BattleModel>> _battleStream() {
    return _firestore
        .collection('battles')
        .orderBy('startTime', descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map(_safeBattleFromSnapshot).whereType<BattleModel>().toList());
  }

  BattleModel? _safeBattleFromSnapshot(DocumentSnapshot<Map<String, dynamic>> doc) {
    try {
      return BattleModel.fromFirestore(doc);
    } catch (e, st) {
      debugPrint('Battle parse failed for ${doc.id}: $e');
      debugPrintStack(stackTrace: st);
      return null;
    }
  }
}
