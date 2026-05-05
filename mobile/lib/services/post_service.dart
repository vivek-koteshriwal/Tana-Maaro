import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'dart:async';
import 'dart:io';
import '../core/post_ranking.dart';
import '../core/media_upload_policy.dart';
import '../models/post_model.dart';

class PostService {
  static const int maxPostLength = 1000;
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  static const Set<String> _hiddenAccountStatuses = <String>{
    'pending_deletion',
    'deactivated',
    'deleted',
  };

  String _normalizedHandleValue(
    Object? value, {
    String fallback = 'roaster',
  }) {
    final raw = value?.toString().trim().replaceAll('@', '') ?? '';
    return raw.isEmpty ? fallback : raw.toLowerCase();
  }

  String _publicHandle(
    Object? value, {
    String fallback = 'roaster',
  }) {
    return '@${_normalizedHandleValue(value, fallback: fallback)}';
  }

  String _fileExtension(
    String path, {
    required String fallback,
  }) {
    final sanitizedPath = path.split('?').first;
    final lastDot = sanitizedPath.lastIndexOf('.');
    if (lastDot == -1 || lastDot == sanitizedPath.length - 1) {
      return fallback;
    }
    return sanitizedPath.substring(lastDot + 1).toLowerCase();
  }

  String _resolveMediaType(
    File? media, {
    String? explicitType,
  }) {
    final normalizedExplicit = explicitType?.trim().toLowerCase();
    if (normalizedExplicit == 'image' ||
        normalizedExplicit == 'video' ||
        normalizedExplicit == 'text') {
      return normalizedExplicit!;
    }
    if (media == null) {
      return 'text';
    }

    return MediaUploadPolicy.isSupportedVideoPath(media.path)
        ? 'video'
        : 'image';
  }

  String _contentTypeForMedia(
    String mediaType,
    String extension,
  ) {
    if (mediaType == 'video') {
      switch (extension) {
        case 'mov':
          return 'video/quicktime';
        case 'webm':
          return 'video/webm';
        default:
          return 'video/mp4';
      }
    }

    switch (extension) {
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      default:
        return 'image/jpeg';
    }
  }

  bool _isVisibleAuthorStatus(Object? status) {
    final normalizedStatus = status?.toString().trim().toLowerCase() ?? 'active';
    return !_hiddenAccountStatuses.contains(normalizedStatus);
  }

  Stream<List<PostModel>> getFeed({
    String? battleId,
    bool trending = false,
    int? limit,
  }) {
    Query<Map<String, dynamic>> query = _firestore.collection('posts');
    if (battleId != null && battleId.isNotEmpty) {
      query = query.where('battleId', isEqualTo: battleId);
    } else {
      query = query.orderBy('createdAt', descending: true);
    }
    if (limit != null && limit > 0) {
      query = query.limit(limit);
    }
    final postsStream = query.snapshots().map((snapshot) {
      final posts = snapshot.docs
          .where((doc) => _isVisibleAuthorStatus(doc.data()['authorStatus']))
          .map(_safePostFromSnapshot)
          .whereType<PostModel>()
          .where((post) {
        if (battleId != null && battleId.isNotEmpty) {
          return post.battleId == battleId;
        }
        return post.battleId == null || post.battleId!.isEmpty;
      });
      return _sortPosts(posts, trending: trending);
    });

    if (battleId != null && battleId.isNotEmpty) {
      return postsStream;
    }

    return _combineLatest(
      postsStream,
      _hiddenPostIdsStream(),
      (posts, hiddenPostIds) => posts
          .where((post) => !hiddenPostIds.contains(post.id))
          .toList(growable: false),
    );
  }

  Stream<List<PostModel>> getUserPosts(String userId) {
    return _firestore
        .collection('posts')
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
      final posts = snapshot.docs
          .where((doc) => _isVisibleAuthorStatus(doc.data()['authorStatus']))
          .map(_safePostFromSnapshot)
          .whereType<PostModel>()
          .where((post) => post.battleId == null || post.battleId!.isEmpty);
      return _sortPosts(posts);
    });
  }

  Stream<PostModel?> watchPost(String postId) {
    return _firestore.collection('posts').doc(postId).snapshots().map((doc) {
      if (!doc.exists) {
        return null;
      }
      if (!_isVisibleAuthorStatus(doc.data()?['authorStatus'])) {
        return null;
      }
      return _safePostFromSnapshot(doc);
    });
  }

  Future<PostModel> createPost(
    String content,
    File? media, {
    String? mediaType,
    bool anonymous = false,
    String? battleId,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw StateError('Sign in to create a roast.');
    }

    final trimmedContent = content.trim();
    if (trimmedContent.isEmpty && media == null) {
      throw StateError('Add text or attach media before posting.');
    }
    if (trimmedContent.length > maxPostLength) {
      throw StateError('Roast must stay within $maxPostLength characters.');
    }

    final userDoc = await _firestore.collection('users').doc(user.uid).get();
    final userData = userDoc.data() ?? {};
    final publicHandle = _publicHandle(
      userData['handle'] ?? userData['username'],
      fallback: 'roaster',
    );

    final resolvedMediaType = _resolveMediaType(
      media,
      explicitType: mediaType,
    );

    String? mediaUrl;
    if (media != null) {
      final validationError = await MediaUploadPolicy.validateFile(
        media,
        mediaType: resolvedMediaType,
      );
      if (validationError != null) {
        throw StateError(validationError);
      }

      final extension = _fileExtension(
        media.path,
        fallback: resolvedMediaType == 'video' ? 'mp4' : 'jpg',
      );
      final ref = _storage.ref().child(
            'posts/${user.uid}/${DateTime.now().millisecondsSinceEpoch}.$extension',
          );
      await ref.putFile(
        media,
        SettableMetadata(
          contentType: _contentTypeForMedia(
            resolvedMediaType,
            extension,
          ),
        ),
      );
      mediaUrl = await ref.getDownloadURL();
    }

    final batch = _firestore.batch();
    final isBattlePost = battleId != null && battleId.isNotEmpty;
    final countsTowardProfile = !anonymous && !isBattlePost;

    final postRef = _firestore.collection('posts').doc();
    batch.set(postRef, {
      'content': trimmedContent,
      'image': mediaUrl,
      'mediaUrl': mediaUrl,
      'userId': anonymous ? 'anon' : user.uid,
      'userName': anonymous ? '@anonymous' : publicHandle,
      'userHandle': anonymous ? '@anonymous' : publicHandle,
      'userAvatar':
          anonymous ? '' : (userData['profileImage'] as String? ?? ''),
      'authorStatus': 'active',
      'createdAt': FieldValue.serverTimestamp(),
      'lastEngagementAt': FieldValue.serverTimestamp(),
      'likes': 0,
      'dislikes': 0,
      'comments': 0,
      'shares': 0,
      'likedBy': [],
      'dislikedBy': [],
      'type': mediaUrl == null ? 'text' : resolvedMediaType,
      'mediaType': mediaUrl == null ? 'text' : resolvedMediaType,
      'isAnonymous': anonymous,
      'countsTowardProfile': countsTowardProfile,
      if (resolvedMediaType == 'video' && mediaUrl != null)
        'videoUrl': mediaUrl,
      if (battleId != null && battleId.isNotEmpty) 'battleId': battleId,
    });

    // Only main feed/profile posts contribute to the public roast count.
    if (countsTowardProfile) {
      final userRef = _firestore.collection('users').doc(user.uid);
      batch.update(userRef, {'postsCount': FieldValue.increment(1)});
    }

    await batch.commit();

    return PostModel(
      id: postRef.id,
      userId: anonymous ? 'anon' : user.uid,
      userName: anonymous ? 'Anonymous' : publicHandle,
      userHandle: anonymous ? '@anonymous' : publicHandle,
      userAvatar: anonymous ? '' : (userData['profileImage'] as String? ?? ''),
      content: trimmedContent,
      image: mediaUrl,
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      views: 0,
      ctr: 0,
      likedBy: const <String>[],
      dislikedBy: const <String>[],
      createdAt: DateTime.now(),
      lastEngagementAt: DateTime.now(),
      type: mediaUrl == null ? 'text' : resolvedMediaType,
      battleId: battleId != null && battleId.isNotEmpty ? battleId : null,
      isAnonymous: anonymous,
    );
  }

  /// Edit a post's content. Only the original author can call this.
  Future<void> updatePost(String postId, String newContent) async {
    final user = _auth.currentUser;
    if (user == null) throw StateError('Sign in to edit a roast.');

    final trimmed = newContent.trim();
    if (trimmed.isEmpty) throw StateError('Post content cannot be empty.');
    if (trimmed.length > maxPostLength) {
      throw StateError('Roast must stay within $maxPostLength characters.');
    }

    final postRef = _firestore.collection('posts').doc(postId);
    final doc = await postRef.get();
    if (!doc.exists) throw StateError('Post not found.');
    if ((doc.data()?['userId'] as String?) != user.uid) {
      throw StateError('You can only edit your own roasts.');
    }

    await postRef.update({
      'content': trimmed,
      'editedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Atomically toggles like. One like per user enforced via Firestore transaction.
  Future<void> likePost(String postId) async {
    final user = _auth.currentUser;
    if (user == null) return;

    final postRef = _firestore.collection('posts').doc(postId);
    String? ownerId;
    bool wasLiked = false;

    await _firestore.runTransaction((transaction) async {
      final postDoc = await transaction.get(postRef);
      if (!postDoc.exists) return;

      final data = postDoc.data()!;
      final likedBy = List<String>.from(data['likedBy'] ?? []);
      final dislikedBy = List<String>.from(data['dislikedBy'] ?? []);
      final isAlreadyLiked = likedBy.contains(user.uid);
      final isAlreadyDisliked = dislikedBy.contains(user.uid);
      ownerId = data['userId'] as String?;
      wasLiked = isAlreadyLiked;

      if (isAlreadyLiked) {
        // Toggle off
        transaction.update(postRef, {
          'likes': FieldValue.increment(-1),
          'likedBy': FieldValue.arrayRemove([user.uid]),
          'lastEngagementAt': FieldValue.serverTimestamp(),
        });
      } else {
        // Add like, remove any existing dislike atomically
        final Map<String, dynamic> updates = {
          'likes': FieldValue.increment(1),
          'likedBy': FieldValue.arrayUnion([user.uid]),
          'dislikedBy': FieldValue.arrayRemove([user.uid]),
          'lastEngagementAt': FieldValue.serverTimestamp(),
        };
        if (isAlreadyDisliked) {
          updates['dislikes'] = FieldValue.increment(-1);
        }
        transaction.update(postRef, updates);
      }
    });

    // Send notification when liking (outside transaction)
    if (!wasLiked &&
        ownerId != null &&
        ownerId != user.uid &&
        ownerId != 'anon') {
      final actorDoc = await _firestore.collection('users').doc(user.uid).get();
      final actorData = actorDoc.data() ?? {};
      final actorHandle = _publicHandle(
        actorData['handle'] ?? actorData['username'],
        fallback: 'someone',
      );
      await _firestore.collection('notifications').add({
        'userId': ownerId,
        'actorId': user.uid,
        'actorName': actorHandle,
        'actorAvatar': actorData['profileImage'] as String? ?? '',
        'type': 'like',
        'postId': postId,
        'timestamp': FieldValue.serverTimestamp(),
        'read': false,
        'message': 'liked your roast',
      });
    }
  }

  /// Atomically toggles dislike. One dislike per user enforced via Firestore transaction.
  Future<void> dislikePost(String postId) async {
    final user = _auth.currentUser;
    if (user == null) return;

    final postRef = _firestore.collection('posts').doc(postId);

    await _firestore.runTransaction((transaction) async {
      final postDoc = await transaction.get(postRef);
      if (!postDoc.exists) return;

      final data = postDoc.data()!;
      final likedBy = List<String>.from(data['likedBy'] ?? []);
      final dislikedBy = List<String>.from(data['dislikedBy'] ?? []);
      final isAlreadyDisliked = dislikedBy.contains(user.uid);
      final isAlreadyLiked = likedBy.contains(user.uid);

      if (isAlreadyDisliked) {
        // Toggle off
        transaction.update(postRef, {
          'dislikes': FieldValue.increment(-1),
          'dislikedBy': FieldValue.arrayRemove([user.uid]),
          'lastEngagementAt': FieldValue.serverTimestamp(),
        });
      } else {
        // Add dislike, remove any existing like atomically
        final Map<String, dynamic> updates = {
          'dislikes': FieldValue.increment(1),
          'dislikedBy': FieldValue.arrayUnion([user.uid]),
          'likedBy': FieldValue.arrayRemove([user.uid]),
          'lastEngagementAt': FieldValue.serverTimestamp(),
        };
        if (isAlreadyLiked) {
          updates['likes'] = FieldValue.increment(-1);
        }
        transaction.update(postRef, updates);
      }
    });
  }

  /// Delete a post. Only the post owner can delete their own post.
  Future<void> deletePost(String postId) async {
    final user = _auth.currentUser;
    if (user == null) return;

    final postRef = _firestore.collection('posts').doc(postId);
    final postDoc = await postRef.get();
    if (!postDoc.exists) return;

    final ownerId = postDoc.data()?['userId'];
    if (ownerId != user.uid) return; // Security check — not the owner

    final data = postDoc.data() ?? {};
    final battleId = data['battleId'] as String?;
    final countsTowardProfile = data['countsTowardProfile'] as bool?;
    final shouldDecrementPostCount = countsTowardProfile ??
        (data['isAnonymous'] != true && (battleId == null || battleId.isEmpty));

    await _deletePostTree(
      postRef,
      postId: postId,
      decrementUserId: shouldDecrementPostCount ? user.uid : null,
    );
  }

  Future<void> sharePost(String postId) async {
    final user = _auth.currentUser;
    if (user == null) return;
    await _firestore.collection('posts').doc(postId).update({
      'shares': FieldValue.increment(1),
      'lastEngagementAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> sharePostInternally({
    required PostModel post,
    required String recipientUserId,
  }) async {
    final user = _auth.currentUser;
    if (user == null || recipientUserId == user.uid) return;

    final actorDoc = await _firestore.collection('users').doc(user.uid).get();
    final actorData = actorDoc.data() ?? {};
    final actorHandle = _publicHandle(
      actorData['handle'] ?? actorData['username'],
      fallback: 'someone',
    );

    final batch = _firestore.batch();
    final postRef = _firestore.collection('posts').doc(post.id);
    final notificationRef = _firestore.collection('notifications').doc();

    batch.update(postRef, {
      'shares': FieldValue.increment(1),
      'lastEngagementAt': FieldValue.serverTimestamp(),
    });
    batch.set(notificationRef, {
      'userId': recipientUserId,
      'actorId': user.uid,
      'actorName': actorHandle,
      'actorAvatar': actorData['profileImage'] as String? ?? '',
      'type': 'share',
      'postId': post.id,
      'timestamp': FieldValue.serverTimestamp(),
      'read': false,
      'message': 'shared a roast with you',
    });

    await batch.commit();
  }

  Future<void> hidePost(String postId) async {
    final user = _auth.currentUser;
    if (user == null) return;

    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('hiddenPosts')
        .doc(postId)
        .set({
      'postId': postId,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> unhidePost(String postId) async {
    final user = _auth.currentUser;
    if (user == null) return;

    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('hiddenPosts')
        .doc(postId)
        .delete();
  }

  Future<void> reportPost({
    required PostModel post,
    required String reason,
    String? details,
  }) async {
    final user = _auth.currentUser;
    if (user == null) return;

    await _firestore.collection('reports').add({
      'type': 'post',
      'postId': post.id,
      'reportedUserId': post.userId,
      'reporterId': user.uid,
      'reason': reason,
      'details': details?.trim() ?? '',
      'contentPreview': post.content,
      'createdAt': FieldValue.serverTimestamp(),
      'status': 'pending',
    });
  }

  Future<void> addComment(String postId, String commentContent) async {
    final user = _auth.currentUser;
    if (user == null) return;

    final userDoc = await _firestore.collection('users').doc(user.uid).get();
    final userData = userDoc.data() ?? {};
    final publicHandle = _publicHandle(
      userData['handle'] ?? userData['username'],
      fallback: 'roaster',
    );

    final commentRef =
        _firestore.collection('posts').doc(postId).collection('comments').doc();
    await commentRef.set({
      'content': commentContent,
      'userId': user.uid,
      'userName': publicHandle,
      'userHandle': publicHandle,
      'userAvatar': userData['profileImage'] as String? ?? '',
      'authorStatus': 'active',
      'createdAt': FieldValue.serverTimestamp(),
    });

    await _firestore.collection('posts').doc(postId).update({
      'comments': FieldValue.increment(1),
      'lastEngagementAt': FieldValue.serverTimestamp(),
    });

    final postDoc = await _firestore.collection('posts').doc(postId).get();
    if (postDoc.exists) {
      final data = postDoc.data()!;
      final ownerId = data['userId'];
      if (ownerId != null && ownerId != user.uid && ownerId != 'anon') {
        await _firestore.collection('notifications').add({
          'userId': ownerId,
          'actorId': user.uid,
          'actorName': publicHandle,
          'actorAvatar': userData['profileImage'] as String? ?? '',
          'type': 'comment',
          'message': 'commented on your roast',
          'postId': postId,
          'timestamp': FieldValue.serverTimestamp(),
          'read': false,
        });
      }
    }
  }

  Stream<List<Map<String, dynamic>>> getComments(String postId) {
    return _firestore
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .where((doc) => _isVisibleAuthorStatus(doc.data()['authorStatus']))
          .map((doc) => {...doc.data(), 'id': doc.id})
          .toList();
    });
  }

  Future<PostModel?> getPostById(String postId) async {
    final doc = await _firestore.collection('posts').doc(postId).get();
    if (!doc.exists) return null;
    if (!_isVisibleAuthorStatus(doc.data()?['authorStatus'])) {
      return null;
    }
    return _safePostFromSnapshot(doc);
  }

  Stream<List<PostModel>> getTaggedPosts(String hashtag) {
    final normalizedHashtag = hashtag.trim().replaceFirst(RegExp(r'^#'), '');
    if (normalizedHashtag.isEmpty) {
      return Stream.value(const <PostModel>[]);
    }

    return getFeed().map((posts) {
      return posts
          .where(
            (post) => _containsHashtag(post.content, normalizedHashtag),
          )
          .toList(growable: false);
    });
  }

  Future<bool> deleteComment(String postId, String commentId) async {
    final user = _auth.currentUser;
    if (user == null) return false;

    final postRef = _firestore.collection('posts').doc(postId);
    final commentRef = postRef.collection('comments').doc(commentId);
    var deleted = false;

    await _firestore.runTransaction((transaction) async {
      final commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists) return;

      final ownerId = commentDoc.data()?['userId'] as String?;
      if (ownerId != user.uid) return;

      final postDoc = await transaction.get(postRef);
      transaction.delete(commentRef);
      deleted = true;

      if (postDoc.exists) {
        final commentCount =
            (postDoc.data()?['comments'] as num?)?.toInt() ?? 0;
        if (commentCount > 0) {
          transaction.update(postRef, {
            'comments': FieldValue.increment(-1),
          });
        }
      }
    });

    return deleted;
  }

  Future<void> _deletePostTree(
    DocumentReference<Map<String, dynamic>> postRef, {
    required String postId,
    String? decrementUserId,
  }) async {
    final commentsSnapshot = await postRef.collection('comments').get();
    final notificationSnapshot = await _firestore
        .collection('notifications')
        .where('postId', isEqualTo: postId)
        .get();

    WriteBatch batch = _firestore.batch();
    var operationCount = 0;

    Future<void> flush() async {
      if (operationCount == 0) return;
      await batch.commit();
      batch = _firestore.batch();
      operationCount = 0;
    }

    Future<void> queueDelete(DocumentReference ref) async {
      batch.delete(ref);
      operationCount++;
      if (operationCount >= 400) {
        await flush();
      }
    }

    Future<void> queueUpdate(
      DocumentReference<Map<String, dynamic>> ref,
      Map<String, dynamic> data,
    ) async {
      batch.set(ref, data, SetOptions(merge: true));
      operationCount++;
      if (operationCount >= 400) {
        await flush();
      }
    }

    for (final comment in commentsSnapshot.docs) {
      await queueDelete(comment.reference);
    }

    for (final notification in notificationSnapshot.docs) {
      await queueDelete(notification.reference);
    }

    await queueDelete(postRef);

    if (decrementUserId != null) {
      await queueUpdate(
        _firestore.collection('users').doc(decrementUserId),
        {'postsCount': FieldValue.increment(-1)},
      );
    }

    await flush();
  }

  List<PostModel> _sortPosts(
    Iterable<PostModel> posts, {
    bool trending = false,
  }) {
    return PostRanking.sort(
      posts,
      mode: trending ? PostSortMode.trending : PostSortMode.latest,
    );
  }

  Stream<Set<String>> _hiddenPostIdsStream() {
    final user = _auth.currentUser;
    if (user == null) {
      return Stream.value(const <String>{});
    }

    return _firestore
        .collection('users')
        .doc(user.uid)
        .collection('hiddenPosts')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.id).toSet());
  }

  Stream<T> _combineLatest<A, B, T>(
    Stream<A> streamA,
    Stream<B> streamB,
    T Function(A valueA, B valueB) combiner,
  ) {
    final controller = StreamController<T>();
    StreamSubscription<A>? subscriptionA;
    StreamSubscription<B>? subscriptionB;
    A? latestA;
    B? latestB;
    var hasA = false;
    var hasB = false;

    void emit() {
      if (!hasA || !hasB) {
        return;
      }
      controller.add(combiner(latestA as A, latestB as B));
    }

    controller.onListen = () {
      subscriptionA = streamA.listen(
        (value) {
          latestA = value;
          hasA = true;
          emit();
        },
        onError: controller.addError,
      );
      subscriptionB = streamB.listen(
        (value) {
          latestB = value;
          hasB = true;
          emit();
        },
        onError: controller.addError,
      );
    };

    controller.onCancel = () async {
      await subscriptionA?.cancel();
      await subscriptionB?.cancel();
    };

    return controller.stream;
  }

  bool _containsHashtag(String content, String hashtag) {
    final matcher = RegExp(
      '(?:^|\\s)#${RegExp.escape(hashtag)}\\b',
      caseSensitive: false,
    );
    return matcher.hasMatch(content);
  }

  PostModel? _safePostFromSnapshot(DocumentSnapshot<Map<String, dynamic>> doc) {
    try {
      return PostModel.fromFirestore(doc);
    } catch (error, stackTrace) {
      debugPrint('Post parse failed for ${doc.id}: $error');
      debugPrintStack(stackTrace: stackTrace);
      return null;
    }
  }
}
