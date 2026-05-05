import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanamaaro_mobile/core/post_ranking.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/services/roast_wall_api.dart';

enum RoastWallTab {
  latest,
  trending,
}

class RoastWallFeedState {
  final List<PostModel> posts;
  final bool isLoading;
  final bool isRefreshing;
  final bool isLoadingMore;
  final bool hasMore;
  final bool hasLoadedOnce;
  final int nextOffset;
  final String? errorMessage;
  final DocumentSnapshot<Map<String, dynamic>>? cursor;

  const RoastWallFeedState({
    required this.posts,
    required this.isLoading,
    required this.isRefreshing,
    required this.isLoadingMore,
    required this.hasMore,
    required this.hasLoadedOnce,
    required this.nextOffset,
    required this.errorMessage,
    required this.cursor,
  });

  const RoastWallFeedState.initial()
      : posts = const <PostModel>[],
        isLoading = false,
        isRefreshing = false,
        isLoadingMore = false,
        hasMore = true,
        hasLoadedOnce = false,
        nextOffset = 0,
        errorMessage = null,
        cursor = null;

  RoastWallFeedState copyWith({
    List<PostModel>? posts,
    bool? isLoading,
    bool? isRefreshing,
    bool? isLoadingMore,
    bool? hasMore,
    bool? hasLoadedOnce,
    int? nextOffset,
    Object? errorMessage = _stateSentinel,
    Object? cursor = _stateSentinel,
  }) {
    return RoastWallFeedState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      hasLoadedOnce: hasLoadedOnce ?? this.hasLoadedOnce,
      nextOffset: nextOffset ?? this.nextOffset,
      errorMessage: identical(errorMessage, _stateSentinel)
          ? this.errorMessage
          : errorMessage as String?,
      cursor: identical(cursor, _stateSentinel)
          ? this.cursor
          : cursor as DocumentSnapshot<Map<String, dynamic>>?,
    );
  }
}

class RoastWallState {
  final RoastWallTab activeTab;
  final Map<RoastWallTab, RoastWallFeedState> feeds;

  const RoastWallState({
    required this.activeTab,
    required this.feeds,
  });

  factory RoastWallState.initial() {
    return const RoastWallState(
      activeTab: RoastWallTab.latest,
      feeds: <RoastWallTab, RoastWallFeedState>{
        RoastWallTab.latest: RoastWallFeedState.initial(),
        RoastWallTab.trending: RoastWallFeedState.initial(),
      },
    );
  }

  RoastWallFeedState feedFor(RoastWallTab tab) {
    return feeds[tab] ?? const RoastWallFeedState.initial();
  }

  RoastWallFeedState get activeFeed => feedFor(activeTab);

  RoastWallState copyWith({
    RoastWallTab? activeTab,
    Map<RoastWallTab, RoastWallFeedState>? feeds,
  }) {
    return RoastWallState(
      activeTab: activeTab ?? this.activeTab,
      feeds: feeds ?? this.feeds,
    );
  }
}

final roastWallApiProvider = Provider<RoastWallApi>((ref) {
  return RoastWallApi();
});

final roastWallControllerProvider =
    StateNotifierProvider<RoastWallController, RoastWallState>((ref) {
  return RoastWallController(
    api: ref.watch(roastWallApiProvider),
    auth: FirebaseAuth.instance,
  );
});

class RoastWallController extends StateNotifier<RoastWallState> {
  RoastWallController({
    required RoastWallApi api,
    required FirebaseAuth auth,
  })  : _api = api,
        _auth = auth,
        super(RoastWallState.initial()) {
    _subscribeToLiveFeeds();
    unawaited(_loadInitial(RoastWallTab.latest));
  }

  final RoastWallApi _api;
  final FirebaseAuth _auth;
  StreamSubscription<List<PostModel>>? _latestSubscription;
  StreamSubscription<List<PostModel>>? _trendingSubscription;

  @override
  void dispose() {
    unawaited(_latestSubscription?.cancel());
    unawaited(_trendingSubscription?.cancel());
    super.dispose();
  }

  Future<void> setTab(RoastWallTab tab) async {
    if (state.activeTab == tab) {
      return;
    }

    state = state.copyWith(activeTab: tab);
    final feed = state.feedFor(tab);
    if (!feed.hasLoadedOnce && !feed.isLoading) {
      await _loadInitial(tab);
    }
  }

  Future<void> refreshActive() {
    return _refresh(state.activeTab);
  }

  Future<void> refreshAll() async {
    state = RoastWallState.initial().copyWith(activeTab: state.activeTab);
    await _loadInitial(state.activeTab, force: true);
  }

  Future<void> loadMore() async {
    final tab = state.activeTab;
    final feed = state.feedFor(tab);
    if (feed.isLoading ||
        feed.isRefreshing ||
        feed.isLoadingMore ||
        !feed.hasMore) {
      return;
    }

    _setFeed(
      tab,
      feed.copyWith(
        isLoadingMore: true,
        errorMessage: null,
      ),
    );

    try {
      final page = await _fetchPage(
        tab,
        after: feed.cursor,
        offset: feed.nextOffset,
      );
      final merged = _mergeUnique(feed.posts, page.posts);
      _setFeed(
        tab,
        feed.copyWith(
          posts: _sortForTab(tab, merged),
          isLoadingMore: false,
          hasLoadedOnce: true,
          hasMore: page.hasMore,
          cursor: page.nextCursor,
          nextOffset: merged.length,
          errorMessage: null,
        ),
      );
    } catch (_) {
      _setFeed(
        tab,
        state.feedFor(tab).copyWith(
              isLoadingMore: false,
            ),
      );
    }
  }

  Future<void> firePost(PostModel post) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) {
      return;
    }

    _replacePostEverywhere(_optimisticFire(post, userId));
    try {
      await _api.firePost(post.id);
    } finally {
      await syncPost(post.id);
    }
  }

  Future<void> downPost(PostModel post) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) {
      return;
    }

    _replacePostEverywhere(_optimisticDown(post, userId));
    try {
      await _api.downPost(post.id);
    } finally {
      await syncPost(post.id);
    }
  }

  Future<void> sharePost(PostModel post) async {
    _replacePostEverywhere(post.copyWith(shares: post.shares + 1));
    try {
      await _api.sharePost(post.id);
    } finally {
      await syncPost(post.id);
    }
  }

  Future<void> deletePost(PostModel post) async {
    _removePostEverywhere(post.id);
    try {
      await _api.deletePost(post.id);
    } catch (_) {
      await refreshActive();
      rethrow;
    }
  }

  void hidePost(String postId) {
    _removePostEverywhere(postId);
  }

  void insertCreatedPost(PostModel post) {
    if (post.battleId?.isNotEmpty ?? false) {
      return;
    }

    final nextFeeds = <RoastWallTab, RoastWallFeedState>{};

    for (final tab in RoastWallTab.values) {
      final feed = state.feedFor(tab);
      final posts = _sortForTab(tab, _mergeUnique(feed.posts, [post]));
      nextFeeds[tab] = feed.copyWith(
        posts: posts,
        hasLoadedOnce: true,
        isLoading: false,
        isRefreshing: false,
        errorMessage: null,
        nextOffset: posts.length,
      );
    }

    state = state.copyWith(feeds: nextFeeds);
  }

  Future<void> syncPost(String postId) async {
    final updated = await _api.getPost(postId);
    if (updated == null || (updated.battleId?.isNotEmpty ?? false)) {
      _removePostEverywhere(postId);
      return;
    }

    _replacePostEverywhere(updated);
  }

  Future<void> _loadInitial(
    RoastWallTab tab, {
    bool force = false,
  }) async {
    final feed = state.feedFor(tab);
    if (feed.isLoading) {
      return;
    }
    if (!force && feed.hasLoadedOnce && feed.posts.isNotEmpty) {
      return;
    }

    _setFeed(
      tab,
      feed.copyWith(
        posts: force ? const <PostModel>[] : feed.posts,
        isLoading: true,
        isRefreshing: false,
        isLoadingMore: false,
        hasMore: true,
        hasLoadedOnce: true,
        errorMessage: null,
        cursor: null,
      ),
    );

    try {
      final page = await _fetchPage(tab);
      _setFeed(
        tab,
        RoastWallFeedState(
          posts: _sortForTab(tab, page.posts),
          isLoading: false,
          isRefreshing: false,
          isLoadingMore: false,
          hasMore: page.hasMore,
          hasLoadedOnce: true,
          nextOffset: page.posts.length,
          errorMessage: null,
          cursor: page.nextCursor,
        ),
      );
    } catch (_) {
      _setFeed(
        tab,
        state.feedFor(tab).copyWith(
              isLoading: false,
              hasMore: false,
              errorMessage: _defaultErrorMessage,
            ),
      );
    }
  }

  Future<void> _refresh(RoastWallTab tab) async {
    final feed = state.feedFor(tab);
    _setFeed(
      tab,
      feed.copyWith(
        isRefreshing: true,
        errorMessage: null,
        hasMore: true,
        cursor: null,
      ),
    );

    try {
      final page = await _fetchPage(tab);
      _setFeed(
        tab,
        RoastWallFeedState(
          posts: _sortForTab(tab, page.posts),
          isLoading: false,
          isRefreshing: false,
          isLoadingMore: false,
          hasMore: page.hasMore,
          hasLoadedOnce: true,
          nextOffset: page.posts.length,
          errorMessage: null,
          cursor: page.nextCursor,
        ),
      );
    } catch (_) {
      _setFeed(
        tab,
        state.feedFor(tab).copyWith(
              isRefreshing: false,
              errorMessage: state.feedFor(tab).posts.isEmpty
                  ? _defaultErrorMessage
                  : null,
            ),
      );
    }
  }

  Future<RoastWallPage> _fetchPage(
    RoastWallTab tab, {
    DocumentSnapshot<Map<String, dynamic>>? after,
    int offset = 0,
  }) {
    return switch (tab) {
      RoastWallTab.latest => _api.fetchLatestPage(after: after),
      RoastWallTab.trending => _api.fetchTrendingPage(offset: offset),
    };
  }

  void _setFeed(RoastWallTab tab, RoastWallFeedState nextFeed) {
    state = state.copyWith(
      feeds: {
        ...state.feeds,
        tab: nextFeed,
      },
    );
  }

  void _replacePostEverywhere(PostModel updated) {
    final nextFeeds = <RoastWallTab, RoastWallFeedState>{};

    for (final tab in RoastWallTab.values) {
      final feed = state.feedFor(tab);
      if (feed.posts.isEmpty) {
        nextFeeds[tab] = feed;
        continue;
      }

      var found = false;
      final posts = feed.posts.map((post) {
        if (post.id != updated.id) {
          return post;
        }
        found = true;
        return updated;
      }).toList(growable: false);

      nextFeeds[tab] =
          found
              ? feed.copyWith(
                  posts: _sortForTab(tab, posts),
                  nextOffset: posts.length,
                )
              : feed;
    }

    state = state.copyWith(feeds: nextFeeds);
  }

  void _removePostEverywhere(String postId) {
    final nextFeeds = <RoastWallTab, RoastWallFeedState>{};

    for (final tab in RoastWallTab.values) {
      final feed = state.feedFor(tab);
      final posts =
          feed.posts.where((post) => post.id != postId).toList(growable: false);
      nextFeeds[tab] = feed.copyWith(
        posts: posts,
        nextOffset: posts.length,
      );
    }

    state = state.copyWith(feeds: nextFeeds);
  }

  List<PostModel> _mergeUnique(
      List<PostModel> existing, List<PostModel> fresh) {
    final byId = <String, PostModel>{
      for (final post in existing) post.id: post,
    };

    for (final post in fresh) {
      byId[post.id] = post;
    }

    return byId.values.toList(growable: false);
  }

  List<PostModel> _sortForTab(RoastWallTab tab, List<PostModel> posts) {
    return PostRanking.sort(
      posts,
      mode: tab == RoastWallTab.trending
          ? PostSortMode.trending
          : PostSortMode.latest,
    );
  }

  void _subscribeToLiveFeeds() {
    _latestSubscription = _api.watchLatestFeed().listen(
      (posts) => _applyLiveFeed(RoastWallTab.latest, posts),
      onError: (_) {},
    );
    _trendingSubscription = _api.watchTrendingFeed().listen(
      (posts) => _applyLiveFeed(RoastWallTab.trending, posts),
      onError: (_) {},
    );
  }

  void _applyLiveFeed(RoastWallTab tab, List<PostModel> livePosts) {
    final feed = state.feedFor(tab);
    final sortedLivePosts = _sortForTab(tab, livePosts);
    final shouldReplace =
        !feed.hasLoadedOnce || feed.posts.length <= RoastWallApi.defaultPageSize;
    final nextPosts = shouldReplace
        ? sortedLivePosts
        : _sortForTab(tab, _mergeUnique(feed.posts, sortedLivePosts));

    _setFeed(
      tab,
      feed.copyWith(
        posts: nextPosts,
        isLoading: false,
        isRefreshing: false,
        hasLoadedOnce: true,
        hasMore: feed.hasMore || sortedLivePosts.length >= RoastWallApi.defaultPageSize,
        errorMessage: null,
        nextOffset: nextPosts.length,
      ),
    );
  }

  PostModel _optimisticFire(PostModel post, String userId) {
    final likedBy = List<String>.from(post.likedBy);
    final dislikedBy = List<String>.from(post.dislikedBy);
    var likes = post.likes;
    var dislikes = post.dislikes;

    if (likedBy.contains(userId)) {
      likedBy.remove(userId);
      likes = likes > 0 ? likes - 1 : 0;
    } else {
      likedBy.add(userId);
      likes += 1;
      if (dislikedBy.remove(userId)) {
        dislikes = dislikes > 0 ? dislikes - 1 : 0;
      }
    }

    return post.copyWith(
      likes: likes,
      dislikes: dislikes,
      likedBy: likedBy,
      dislikedBy: dislikedBy,
    );
  }

  PostModel _optimisticDown(PostModel post, String userId) {
    final likedBy = List<String>.from(post.likedBy);
    final dislikedBy = List<String>.from(post.dislikedBy);
    var likes = post.likes;
    var dislikes = post.dislikes;

    if (dislikedBy.contains(userId)) {
      dislikedBy.remove(userId);
      dislikes = dislikes > 0 ? dislikes - 1 : 0;
    } else {
      dislikedBy.add(userId);
      dislikes += 1;
      if (likedBy.remove(userId)) {
        likes = likes > 0 ? likes - 1 : 0;
      }
    }

    return post.copyWith(
      likes: likes,
      dislikes: dislikes,
      likedBy: likedBy,
      dislikedBy: dislikedBy,
    );
  }
}

const Object _stateSentinel = Object();
const String _defaultErrorMessage =
    'Could not load the wall. Pull to refresh and try again.';
