import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/services/battle_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/widgets/roast_card.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';
import 'package:share_plus/share_plus.dart';

// ─── BattleRoomScreen ─────────────────────────────────────────────────────────

class BattleRoomScreen extends StatefulWidget {
  final BattleModel battle;
  const BattleRoomScreen({super.key, required this.battle});

  @override
  State<BattleRoomScreen> createState() => _BattleRoomScreenState();
}

class _BattleRoomScreenState extends State<BattleRoomScreen>
    with SingleTickerProviderStateMixin {
  final BattleService _battleService = BattleService();
  final PostService   _postService   = PostService();
  final FirebaseAuth  _auth          = FirebaseAuth.instance;

  late TabController _tabController;
  late BattleModel   _battle;
  Timer? _timer;
  Timer? _lbRefreshTimer;
  int    _timeLeft = 0;
  bool   _isJoining = false;

  // Leaderboard state
  List<LeaderboardEntry> _leaderboard = [];
  int  _totalVotes       = 0;
  bool _leaderboardLoading = true;
  bool _scoreBreakdown   = false; // toggle between score / breakdown view

  // Vote state
  BattleVote? _myVote;
  bool        _voteLoading = false;

  // Post compose
  final TextEditingController _postController = TextEditingController();
  bool _isPosting = false;

  @override
  void initState() {
    super.initState();
    _battle = widget.battle;
    _tabController = TabController(length: 2, vsync: this);
    _startTimer();
    _refreshLeaderboard();
    _loadMyVote();
    // Poll every 20s (down from 30s)
    _lbRefreshTimer =
        Timer.periodic(const Duration(seconds: 20), (_) => _refreshLeaderboard());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _lbRefreshTimer?.cancel();
    _tabController.dispose();
    _postController.dispose();
    super.dispose();
  }

  // ── Timer ──────────────────────────────────────────────────────────────────

  void _startTimer() {
    _updateTimeLeft();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) _updateTimeLeft();
    });
  }

  void _updateTimeLeft() {
    final now    = DateTime.now();
    final status = _battle.computedStatus;
    int secs = 0;
    if (status == 'live') {
      secs = _battle.endTime.difference(now).inSeconds.clamp(0, 999999);
    } else if (status == 'upcoming') {
      secs = _battle.startTime.difference(now).inSeconds.clamp(0, 999999);
    }
    setState(() => _timeLeft = secs);
  }

  String _formatTime(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    if (h > 0) return '${h}h ${m.toString().padLeft(2, '0')}m';
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  // ── Data loaders ───────────────────────────────────────────────────────────

  Future<void> _refreshLeaderboard() async {
    setState(() => _leaderboardLoading = true);
    final result = await _battleService.getLeaderboard(_battle.id);
    if (mounted) {
      setState(() {
        _leaderboard   = result.leaderboard;
        _totalVotes    = result.totalVotes;
        _leaderboardLoading = false;
      });
    }
  }

  Future<void> _loadMyVote() async {
    final vote = await _battleService.getMyVote(_battle.id);
    if (mounted) setState(() => _myVote = vote);
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  bool get _isParticipant {
    final uid = _auth.currentUser?.uid;
    return uid != null && _battle.participants.contains(uid);
  }

  Future<void> _handleJoin() async {
    if (_auth.currentUser == null) {
      _snack('Sign in to join the battle');
      return;
    }
    setState(() => _isJoining = true);
    try {
      await _battleService.joinBattle(_battle.id);
    } catch (e) {
      if (mounted) _snack(e.toString().replaceFirst('Bad state: ', ''), error: true);
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

  Future<void> _handleLeave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Leave Arena?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
        content: const Text('You will no longer be listed as a participant.',
            style: TextStyle(color: Colors.white54)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false),
              child: const Text('CANCEL', style: TextStyle(color: Colors.white38))),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('LEAVE',
                  style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w900))),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _isJoining = true);
    try {
      await _battleService.leaveBattle(_battle.id);
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

  Future<void> _handleVote(String votedForId, String username) async {
    if (_auth.currentUser == null) { _snack('Sign in to vote'); return; }
    final uid = _auth.currentUser!.uid;
    if (votedForId == uid) { _snack('You cannot vote for yourself'); return; }

    setState(() => _voteLoading = true);
    try {
      await _battleService.castVote(_battle.id, votedForId);
      final vote = await _battleService.getMyVote(_battle.id);
      if (mounted) {
        setState(() {
          _myVote     = vote;
          _totalVotes = _totalVotes + 1;
        });
        _snack('Your vote for $username was counted! ✅');
        _refreshLeaderboard();
      }
    } catch (e) {
      if (mounted) _snack(e.toString().replaceFirst('Bad state: ', ''), error: true);
    } finally {
      if (mounted) setState(() => _voteLoading = false);
    }
  }

  Future<void> _submitPost() async {
    final content = _postController.text.trim();
    if (content.isEmpty) return;
    setState(() => _isPosting = true);
    try {
      await _postService.createPost(content, null, battleId: _battle.id);
      _postController.clear();
      FocusScope.of(context).unfocus();
      _refreshLeaderboard();
    } catch (e) {
      if (mounted) _snack('Failed to post: $e', error: true);
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? Colors.red[800] : const Color(0xFF1A1A1A),
    ));
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<BattleModel?>(
      stream: _battleService.getBattle(_battle.id),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting &&
            snapshot.data == null) {
          return const Scaffold(
            backgroundColor: Colors.black,
            body: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
          );
        }

        if (snapshot.hasData && snapshot.data != null) {
          _battle = snapshot.data!;
        }

        final status = _battle.computedStatus;
        final isLive = status == 'live';
        final isEnded = status == 'ended';

        return ParentBackScope(
          child: Scaffold(
            backgroundColor: Colors.black,
            appBar: _buildAppBar(status, isLive),
            body: Column(
              children: [
                // Winner banner (shown when battle ends)
                if (isEnded) _buildWinnerBanner(),

                // Vote notice banner
                if (isLive && _myVote == null && _auth.currentUser != null && !_isParticipant)
                  _buildVoteNoticeBanner(),
                if (isLive && _myVote != null)
                  _buildVoteCastBanner(),

                // Battle header card
                _buildBattleHeader(status, isLive),

                // Tabs
                Container(
                  color: const Color(0xFF0D0D0D),
                  child: TabBar(
                    controller: _tabController,
                    indicatorColor: AppTheme.primaryColor,
                    indicatorWeight: 2,
                    labelColor: AppTheme.primaryColor,
                    unselectedLabelColor: Colors.white38,
                    labelStyle: const TextStyle(
                        fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.5),
                    tabs: const [
                      Tab(text: 'ARENA FEED'),
                      Tab(text: 'LEADERBOARD'),
                    ],
                  ),
                ),

                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildArenaFeed(isLive),
                      _buildLeaderboard(isLive),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── AppBar ─────────────────────────────────────────────────────────────────

  AppBar _buildAppBar(String status, bool isLive) {
    return AppBar(
      backgroundColor: Colors.black,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
        onPressed: () => navigateToParentRoute(context),
      ),
      title: Text(
        _battle.title.toUpperCase(),
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1.2),
        overflow: TextOverflow.ellipsis,
      ),
      centerTitle: true,
      actions: [
        IconButton(
          onPressed: () async {
            await Share.share(DeepLinkService.buildBattleShareText(_battle));
            await DeepLinkService.trackShare(
              targetType: 'battle', targetId: _battle.id,
              appLink: DeepLinkService.battleUri(_battle.id),
              fallbackLink: DeepLinkService.battleShareUri(_battle.id),
              destination: 'external',
            );
          },
          icon: const Icon(Icons.ios_share_rounded, color: Colors.white),
        ),
        // Timer chip
        Container(
          margin: const EdgeInsets.only(right: 12),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: status == 'ended'
                ? Colors.white.withValues(alpha: 0.06)
                : isLive ? Colors.red.withValues(alpha: 0.15) : Colors.blue.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: status == 'ended'
                  ? Colors.white12
                  : isLive ? Colors.red.withValues(alpha: 0.5) : Colors.blue.withValues(alpha: 0.5),
            ),
          ),
          child: Row(children: [
            Icon(Icons.access_time_rounded,
                size: 12,
                color: status == 'ended' ? Colors.white24 : isLive ? Colors.redAccent : Colors.blueAccent),
            const SizedBox(width: 5),
            Text(
              status == 'ended' ? 'ENDED' : _formatTime(_timeLeft),
              style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w900,
                  color: status == 'ended' ? Colors.white24 : isLive ? Colors.redAccent : Colors.blueAccent),
            ),
          ]),
        ),
      ],
    );
  }

  // ── Winner banner ──────────────────────────────────────────────────────────

  Widget _buildWinnerBanner() {
    final myUid  = _auth.currentUser?.uid;
    final isYou  = _battle.winnerId != null && _battle.winnerId == myUid;
    final winner = _battle.winnerUsername ?? 'Champion';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isYou
            ? const Color(0xFFFFD700).withValues(alpha: 0.08)
            : const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isYou
              ? const Color(0xFFFFD700).withValues(alpha: 0.4)
              : Colors.white12,
        ),
      ),
      child: Row(children: [
        Container(
          width: 48, height: 48,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFFFFD700).withValues(alpha: 0.12),
            border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.4)),
          ),
          child: Center(
            child: Text(
              _battle.winnerId != null ? '👑' : '⚔️',
              style: const TextStyle(fontSize: 22),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('BATTLE CONCLUDED',
                style: TextStyle(
                    color: Color(0xFFFFD700),
                    fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
            const SizedBox(height: 4),
            Text(
              _battle.winnerId == null
                  ? 'No winner declared'
                  : isYou ? '🎉 YOU WON!' : '$winner Wins!',
              style: TextStyle(
                  color: isYou ? const Color(0xFFFFD700) : Colors.white,
                  fontSize: 17, fontWeight: FontWeight.w900, letterSpacing: 0.5),
            ),
            const SizedBox(height: 2),
            Text(
              isYou
                  ? 'You dominated the arena. The crowd roared for you.'
                  : _battle.winnerId != null
                      ? 'The arena bowed to $winner.'
                      : 'Check the leaderboard for final scores.',
              style: const TextStyle(color: Colors.white38, fontSize: 12, height: 1.4),
            ),
          ]),
        ),
      ]),
    );
  }

  // ── Vote notice banners ────────────────────────────────────────────────────

  Widget _buildVoteNoticeBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        const Icon(Icons.how_to_vote_rounded, color: Colors.orange, size: 16),
        const SizedBox(width: 10),
        const Expanded(
          child: Text(
            'Vote for the best roaster — one vote per battle, counted in the leaderboard.',
            style: TextStyle(color: Colors.orange, fontSize: 12, height: 1.4),
          ),
        ),
      ]),
    );
  }

  Widget _buildVoteCastBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.green.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        const Icon(Icons.check_circle_outline_rounded, color: Colors.green, size: 16),
        const SizedBox(width: 10),
        const Text('Your vote has been counted. Watch the leaderboard update live.',
            style: TextStyle(color: Colors.green, fontSize: 12)),
      ]),
    );
  }

  // ── Battle header ──────────────────────────────────────────────────────────

  Widget _buildBattleHeader(String status, bool isLive) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isLive
              ? AppTheme.primaryColor.withValues(alpha: 0.3)
              : Colors.white.withValues(alpha: 0.06),
        ),
      ),
      child: Row(children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: status == 'live'
                  ? Colors.red.withValues(alpha: 0.2)
                  : status == 'upcoming'
                      ? Colors.blue.withValues(alpha: 0.2)
                      : Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(children: [
              if (isLive)
                Container(
                  width: 6, height: 6,
                  margin: const EdgeInsets.only(right: 6),
                  decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                ),
              Text(status.toUpperCase(),
                  style: TextStyle(
                      color: status == 'live' ? Colors.redAccent
                          : status == 'upcoming' ? Colors.blueAccent : Colors.white38,
                      fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ]),
          ),
          const SizedBox(height: 6),
          Row(children: [
            const FaIcon(FontAwesomeIcons.users, size: 11, color: Colors.white38),
            const SizedBox(width: 6),
            Text('${_battle.participantsCount} in arena · $_totalVotes votes',
                style: const TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
          ]),
        ]),
        const Spacer(),
        // Join / Leave / Concluded
        if (status != 'ended')
          _isParticipant
              ? Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
                    ),
                    child: const Row(children: [
                      Icon(Icons.check_circle_outline, color: Colors.green, size: 14),
                      SizedBox(width: 6),
                      Text('ENTERED',
                          style: TextStyle(color: Colors.green, fontSize: 11,
                              fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ]),
                  ),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: _isJoining ? null : _handleLeave,
                    child: const Text('Leave Arena',
                        style: TextStyle(
                            color: Colors.white24, fontSize: 10,
                            decoration: TextDecoration.underline,
                            decorationColor: Colors.white24)),
                  ),
                ])
              : SizedBox(
                  height: 42,
                  child: ElevatedButton.icon(
                    onPressed: _isJoining ? null : _handleJoin,
                    icon: _isJoining
                        ? const SizedBox(width: 14, height: 14,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const FaIcon(FontAwesomeIcons.boltLightning, size: 13),
                    label: const Text('JOIN BATTLE',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor, foregroundColor: Colors.white,
                      elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                )
        else
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white12),
            ),
            child: const Text('CONCLUDED',
                style: TextStyle(color: Colors.white24, fontSize: 11,
                    fontWeight: FontWeight.w900, letterSpacing: 1)),
          ),
      ]),
    );
  }

  // ── Arena Feed ─────────────────────────────────────────────────────────────

  Widget _buildArenaFeed(bool isLive) {
    return CustomScrollView(
      cacheExtent: 720,
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: isLive
                ? (_isParticipant ? _buildComposeBox() : _buildJoinPrompt())
                : _buildStatusBanner(),
          ),
        ),
        StreamBuilder(
          stream: _postService.getFeed(battleId: _battle.id),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
              );
            }
            final posts = snapshot.data ?? [];
            if (posts.isEmpty) {
              return SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const FaIcon(FontAwesomeIcons.boltLightning, size: 48, color: Colors.white10),
                      const SizedBox(height: 20),
                      const Text('AWAITING FIRST STRIKE',
                          style: TextStyle(color: Colors.white, fontSize: 16,
                              fontWeight: FontWeight.w900, letterSpacing: 1)),
                      const SizedBox(height: 10),
                      Text(isLive ? 'Drop the first roast and claim the throne.'
                          : 'Roasts will appear here once the battle starts.',
                          style: const TextStyle(color: Colors.white38, fontSize: 13),
                          textAlign: TextAlign.center),
                    ]),
                  ),
                ),
              );
            }
            return SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => RepaintBoundary(
                    key: ValueKey('battle-post-${posts[i].id}'),
                    child: RoastCard(post: posts[i]),
                  ),
                  childCount: posts.length,
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildComposeBox() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.25)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('DROP YOUR ROAST',
            style: TextStyle(color: AppTheme.primaryColor, fontSize: 10,
                fontWeight: FontWeight.w900, letterSpacing: 1.5)),
        const SizedBox(height: 10),
        TextField(
          controller: _postController,
          maxLines: 3,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Roast hard. Win the arena...',
            hintStyle: const TextStyle(color: Colors.white12, fontSize: 14),
            filled: true, fillColor: Colors.white.withValues(alpha: 0.04),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.all(12),
          ),
        ),
        const SizedBox(height: 10),
        Align(
          alignment: Alignment.centerRight,
          child: SizedBox(
            height: 38,
            child: ElevatedButton(
              onPressed: _isPosting ? null : _submitPost,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor, foregroundColor: Colors.white,
                elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 20),
              ),
              child: _isPosting
                  ? const SizedBox(width: 14, height: 14,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('FIRE 🔥',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _buildJoinPrompt() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(children: [
        const FaIcon(FontAwesomeIcons.boltLightning, color: AppTheme.primaryColor, size: 18),
        const SizedBox(width: 12),
        const Expanded(child: Text('Join the battle first to drop your roast.',
            style: TextStyle(color: Colors.white54, fontSize: 13, height: 1.4))),
        const SizedBox(width: 12),
        ElevatedButton(
          onPressed: _isJoining ? null : _handleJoin,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor, foregroundColor: Colors.white,
            elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          ),
          child: const Text('JOIN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
        ),
      ]),
    );
  }

  Widget _buildStatusBanner() {
    final isUpcoming = _battle.computedStatus == 'upcoming';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(children: [
        Text(isUpcoming ? 'THE ARENA IS SEALED' : 'THE DUST HAS SETTLED',
            style: const TextStyle(color: Colors.white, fontSize: 14,
                fontWeight: FontWeight.w900, letterSpacing: 1)),
        const SizedBox(height: 6),
        Text(
          isUpcoming
              ? 'Wait for the countdown to drop your roasts.'
              : 'This battle is officially over. No new roasts.',
          style: const TextStyle(color: Colors.white38, fontSize: 12, height: 1.4),
          textAlign: TextAlign.center,
        ),
      ]),
    );
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────

  Widget _buildLeaderboard(bool isLive) {
    if (_leaderboardLoading && _leaderboard.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor));
    }
    if (_leaderboard.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: const [
            Icon(Icons.emoji_events_outlined, size: 56, color: Colors.white10),
            SizedBox(height: 20),
            Text('NO SCORES YET',
                style: TextStyle(color: Colors.white, fontSize: 16,
                    fontWeight: FontWeight.w900, letterSpacing: 1)),
            SizedBox(height: 8),
            Text('Engagement adds points. Start roasting!',
                style: TextStyle(color: Colors.white38, fontSize: 13)),
          ]),
        ),
      );
    }

    final myUid     = _auth.currentUser?.uid;
    final hasVoted  = _myVote != null;
    final canVote   = isLive && !hasVoted && myUid != null;

    return Column(children: [
      // Score / Breakdown toggle
      Container(
        color: const Color(0xFF0D0D0D),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(children: [
          const Text('SCORES',
              style: TextStyle(color: Colors.white54, fontSize: 10,
                  fontWeight: FontWeight.w900, letterSpacing: 1.2)),
          const Spacer(),
          GestureDetector(
            onTap: () => setState(() => _scoreBreakdown = !_scoreBreakdown),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: _scoreBreakdown
                    ? AppTheme.primaryColor.withValues(alpha: 0.2)
                    : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _scoreBreakdown
                      ? AppTheme.primaryColor.withValues(alpha: 0.5)
                      : Colors.white12,
                ),
              ),
              child: Text(
                _scoreBreakdown ? 'BREAKDOWN' : 'FINAL SCORE',
                style: TextStyle(
                    color: _scoreBreakdown ? AppTheme.primaryColor : Colors.white54,
                    fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text('$_totalVotes votes',
              style: const TextStyle(color: Colors.white24, fontSize: 10)),
        ]),
      ),
      Expanded(
        child: ListView.builder(
          cacheExtent: 640,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          itemCount: _leaderboard.length,
          itemBuilder: (_, i) => _buildLeaderboardEntry(
            _leaderboard[i], canVote, myUid, hasVoted),
        ),
      ),
      // Scoring formula footer
      Container(
        color: const Color(0xFF0D0D0D),
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: const Center(
          child: Text('Engagement ×0.4  ·  Votes ×0.4  ·  Quality ×0.2',
              style: TextStyle(color: Colors.white24, fontSize: 9,
                  fontWeight: FontWeight.w900, letterSpacing: 0.8)),
        ),
      ),
    ]);
  }

  Widget _buildLeaderboardEntry(
      LeaderboardEntry entry, bool canVote, String? myUid, bool hasVoted) {
    final rank     = entry.rank;
    final isTop3   = rank <= 3;
    final votedFor = _myVote?.votedForId;

    final rankColor = rank == 1 ? const Color(0xFFFFD700)
        : rank == 2 ? const Color(0xFFB0BEC5)
        : rank == 3 ? const Color(0xFFBF8970)
        : Colors.white24;

    // Delta indicator
    Widget? deltaWidget;
    if (entry.delta == 'leading') {
      deltaWidget = const Text('🔥 Leading',
          style: TextStyle(color: Color(0xFFFFD700), fontSize: 9, fontWeight: FontWeight.w900));
    } else if (entry.delta == 'catching_up') {
      deltaWidget = const Text('⚡ Catching Up',
          style: TextStyle(color: Colors.orange, fontSize: 9, fontWeight: FontWeight.w900));
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: rank == 1
            ? const Color(0xFFFFD700).withValues(alpha: 0.05)
            : const Color(0xFF111111),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: rank == 1
              ? const Color(0xFFFFD700).withValues(alpha: 0.2)
              : Colors.white.withValues(alpha: 0.05),
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          // Rank
          SizedBox(
            width: 32,
            child: Text('#$rank',
                style: TextStyle(
                    color: rankColor, fontSize: isTop3 ? 18 : 13,
                    fontWeight: FontWeight.w900),
                textAlign: TextAlign.center),
          ),
          const SizedBox(width: 12),
          // Avatar
          RoastAvatar(avatarId: entry.avatar, radius: 20, fallbackSeed: entry.userId),
          const SizedBox(width: 12),
          // Handle + delta
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                entry.username.startsWith('@')
                    ? entry.username.toUpperCase()
                    : '@${entry.username.toUpperCase()}',
                style: const TextStyle(color: Colors.white, fontSize: 13,
                    fontWeight: FontWeight.w800),
                overflow: TextOverflow.ellipsis,
              ),
              if (deltaWidget != null) ...[const SizedBox(height: 2), deltaWidget],
            ]),
          ),
          const SizedBox(width: 8),
          // Score
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(
              _scoreBreakdown
                  ? 'E:${entry.engagementScore} V:${entry.votingScore} Q:${entry.qualityScore}'
                  : '${entry.finalScore} PTS',
              style: TextStyle(
                  color: _scoreBreakdown ? Colors.white54 : AppTheme.primaryColor,
                  fontSize: _scoreBreakdown ? 10 : 13,
                  fontWeight: FontWeight.w900),
            ),
            if (_scoreBreakdown)
              Text('${entry.finalScore} PTS',
                  style: const TextStyle(
                      color: AppTheme.primaryColor, fontSize: 10, fontWeight: FontWeight.w900)),
          ]),
          const SizedBox(width: 8),
          // Vote button
          _buildVoteButton(entry, canVote, myUid, votedFor),
        ]),

        // Score breakdown row (visible when toggle is on)
        if (_scoreBreakdown)
          Padding(
            padding: const EdgeInsets.only(top: 8, left: 44),
            child: Row(children: [
              _scorePill('👍 ${entry.totalLikes}', Colors.white24),
              const SizedBox(width: 6),
              _scorePill('💬 ${entry.totalComments}', Colors.white24),
              const SizedBox(width: 6),
              _scorePill('🗳️ ${entry.votesReceived}', Colors.green.withValues(alpha: 0.7)),
            ]),
          ),
      ]),
    );
  }

  Widget _buildVoteButton(
      LeaderboardEntry entry, bool canVote, String? myUid, String? votedFor) {
    final isMe       = entry.userId == myUid;
    final votedThis  = votedFor == entry.userId;

    if (votedThis) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.green.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
        ),
        child: const Text('✅ VOTED',
            style: TextStyle(color: Colors.green, fontSize: 9, fontWeight: FontWeight.w900)),
      );
    }

    if (!canVote || isMe) return const SizedBox.shrink();

    return GestureDetector(
      onTap: _voteLoading
          ? null
          : () => _handleVote(entry.userId, entry.username),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.4)),
        ),
        child: _voteLoading
            ? const SizedBox(width: 12, height: 12,
                child: CircularProgressIndicator(color: AppTheme.primaryColor, strokeWidth: 1.5))
            : const Text('VOTE',
                style: TextStyle(color: AppTheme.primaryColor, fontSize: 9,
                    fontWeight: FontWeight.w900, letterSpacing: 0.5)),
      ),
    );
  }

  Widget _scorePill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700)),
    );
  }
}
