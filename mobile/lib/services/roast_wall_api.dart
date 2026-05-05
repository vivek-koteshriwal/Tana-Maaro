import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:tanamaaro_mobile/core/post_ranking.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';

class RoastWallPage {
  final List<PostModel> posts;
  final DocumentSnapshot<Map<String, dynamic>>? nextCursor;
  final bool hasMore;

  const RoastWallPage({
    required this.posts,
    required this.nextCursor,
    required this.hasMore,
  });
}

class RoastWallApi {
  RoastWallApi({
    FirebaseFirestore? firestore,
    PostService? postService,
    FirebaseAuth? auth,
  })  : _firestore = firestore ??
            FirebaseFirestore.instanceFor(
              app: Firebase.app(),
              databaseId: 'tanamaaro',
            ),
        _postService = postService ?? PostService(),
        _auth = auth ?? FirebaseAuth.instance;

  static const int defaultPageSize = 10;
  static const int _queryBatchSize = 24;
  static const int _liveLatestLimit = 40;
  static const int _liveTrendingLimit = 120;
  static const int _maxTrendingCandidateLimit = 240;

  final FirebaseFirestore _firestore;
  final PostService _postService;
  final FirebaseAuth _auth;

  Stream<List<PostModel>> watchLatestFeed({int limit = _liveLatestLimit}) {
    return _postService.getFeed(limit: limit);
  }

  Stream<List<PostModel>> watchTrendingFeed({int limit = _liveTrendingLimit}) {
    return _postService.getFeed(trending: true, limit: limit);
  }

  Future<RoastWallPage> fetchLatestPage({
    DocumentSnapshot<Map<String, dynamic>>? after,
    int limit = defaultPageSize,
  }) {
    return _fetchLatestPage(
      after: after,
      limit: limit,
    );
  }

  Future<RoastWallPage> fetchTrendingPage({
    int offset = 0,
    int limit = defaultPageSize,
  }) async {
    final hiddenPostIds = await _hiddenPostIds();
    final candidateLimit =
        ((offset + limit) * 8).clamp(_liveTrendingLimit, _maxTrendingCandidateLimit);
    final snapshot = await _firestore
        .collection('posts')
        .orderBy('createdAt', descending: true)
        .limit(candidateLimit)
        .get();

    final rankedPosts = PostRanking.sort(
      snapshot.docs
          .map(_safePost)
          .whereType<PostModel>()
          .where((post) => !(post.battleId?.isNotEmpty ?? false))
          .where((post) => !hiddenPostIds.contains(post.id)),
      mode: PostSortMode.trending,
    );
    final pagePosts = rankedPosts
        .skip(offset)
        .take(limit)
        .toList(growable: false);

    return RoastWallPage(
      posts: pagePosts,
      nextCursor: null,
      hasMore: rankedPosts.length > offset + pagePosts.length,
    );
  }

  Future<PostModel?> getPost(String postId) {
    return _postService.getPostById(postId);
  }

  Future<void> firePost(String postId) {
    return _postService.likePost(postId);
  }

  Future<void> downPost(String postId) {
    return _postService.dislikePost(postId);
  }

  Future<void> sharePost(String postId) {
    return _postService.sharePost(postId);
  }

  Future<void> deletePost(String postId) {
    return _postService.deletePost(postId);
  }

  Future<RoastWallPage> _fetchLatestPage({
    required int limit,
    DocumentSnapshot<Map<String, dynamic>>? after,
  }) async {
    final hiddenPostIds = await _hiddenPostIds();
    final posts = <PostModel>[];
    DocumentSnapshot<Map<String, dynamic>>? cursor = after;
    var hasMore = false;

    while (posts.length < limit) {
      Query<Map<String, dynamic>> query = _firestore
          .collection('posts')
          .orderBy('createdAt', descending: true)
          .limit(_queryBatchSize);

      if (cursor != null) {
        query = query.startAfterDocument(cursor);
      }

      final snapshot = await query.get();
      if (snapshot.docs.isEmpty) {
        hasMore = false;
        break;
      }

      for (final doc in snapshot.docs) {
        cursor = doc;
        final post = _safePost(doc);
        if (post == null) {
          continue;
        }
        if (post.battleId?.isNotEmpty ?? false) {
          continue;
        }
        if (hiddenPostIds.contains(post.id)) {
          continue;
        }

        posts.add(post);
        if (posts.length >= limit) {
          break;
        }
      }

      if (snapshot.docs.length < _queryBatchSize) {
        hasMore = false;
        break;
      }

      hasMore = true;
      if (posts.length >= limit) {
        break;
      }
    }

    return RoastWallPage(
      posts: PostRanking.sort(posts, mode: PostSortMode.latest),
      nextCursor: cursor,
      hasMore: hasMore,
    );
  }

  Future<Set<String>> _hiddenPostIds() async {
    final user = _auth.currentUser;
    if (user == null) {
      return const <String>{};
    }

    final snapshot = await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('hiddenPosts')
        .get();
    return snapshot.docs.map((doc) => doc.id).toSet();
  }
  PostModel? _safePost(DocumentSnapshot<Map<String, dynamic>> doc) {
    try {
      return PostModel.fromFirestore(doc);
    } catch (error, stackTrace) {
      debugPrint('RoastWall post parse failed for ${doc.id}: $error');
      debugPrintStack(stackTrace: stackTrace);
      return null;
    }
  }
}
