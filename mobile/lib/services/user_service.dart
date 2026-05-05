import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';

final userServiceProvider = Provider<UserService>((ref) => UserService());

class UserService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final FirebaseAuth _auth = FirebaseAuth.instance;
  static const Set<String> _hiddenAccountStatuses = <String>{
    'pending_deletion',
    'deactivated',
    'deleted',
  };

  bool _isVisibleStatus(Object? status) {
    final normalizedStatus = status?.toString().trim().toLowerCase() ?? 'active';
    return !_hiddenAccountStatuses.contains(normalizedStatus);
  }

  Stream<UserModel?> getUserData(String uid) {
    return _firestore.collection('users').doc(uid).snapshots().map((snapshot) {
      if (!snapshot.exists) return null;
      final data = snapshot.data() ?? const <String, dynamic>{};
      final isOwnProfile = _auth.currentUser?.uid == uid;
      if (!isOwnProfile && !_isVisibleStatus(data['status'])) {
        return null;
      }
      return UserModel.fromFirestore(snapshot);
    });
  }

  Future<UserModel?> getUserById(String uid) async {
    final doc = await _firestore.collection('users').doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    final data = doc.data() ?? const <String, dynamic>{};
    final isOwnProfile = _auth.currentUser?.uid == uid;
    if (!isOwnProfile && !_isVisibleStatus(data['status'])) {
      return null;
    }
    return UserModel.fromFirestore(doc);
  }

  /// Calculates "People Roasting Us" by summing comments on all user's posts
  Stream<int> getRoastedByCount(String uid) {
    return _firestore
        .collection('posts')
        .where('userId', isEqualTo: uid)
        .snapshots()
        .map((snapshot) {
      int totalComments = 0;
      for (var doc in snapshot.docs) {
        totalComments += (doc.data()['comments'] as int? ?? 0);
      }
      return totalComments;
    });
  }

  Future<void> updateProfile({
    required String handle,
    required String bio,
  }) async {
    final user = _auth.currentUser;
    if (user == null) return;

    final batch = _firestore.batch();
    final userRef = _firestore.collection('users').doc(user.uid);
    final normalizedHandle = handle.toLowerCase().replaceAll('@', '');

    batch.update(userRef, {
      'username': normalizedHandle,
      'handle': normalizedHandle,
      'bio': bio,
      'updatedAt': FieldValue.serverTimestamp(),
      'name': FieldValue.delete(),
      'displayName': FieldValue.delete(),
    });

    await batch.commit();
    await user.updateDisplayName(null);
  }

  Future<void> toggleFollow(String targetUserId, bool isFollowing) async {
    final currentUser = _auth.currentUser;
    if (currentUser == null || currentUser.uid == targetUserId) return;

    final batch = _firestore.batch();
    final followRef = _firestore
        .collection('users')
        .doc(currentUser.uid)
        .collection('following')
        .doc(targetUserId);
    final followerRef = _firestore
        .collection('users')
        .doc(targetUserId)
        .collection('followers')
        .doc(currentUser.uid);

    final currentUserRef = _firestore.collection('users').doc(currentUser.uid);
    final targetUserRef = _firestore.collection('users').doc(targetUserId);

    if (isFollowing) {
      batch.delete(followRef);
      batch.delete(followerRef);
      batch
          .update(currentUserRef, {'followingCount': FieldValue.increment(-1)});
      batch.update(targetUserRef, {'followerCount': FieldValue.increment(-1)});
    } else {
      batch.set(followRef, {'timestamp': FieldValue.serverTimestamp()});
      batch.set(followerRef, {'timestamp': FieldValue.serverTimestamp()});
      batch.update(currentUserRef, {'followingCount': FieldValue.increment(1)});
      batch.update(targetUserRef, {'followerCount': FieldValue.increment(1)});
    }

    await batch.commit();
  }

  Stream<bool> isFollowing(String targetUserId) {
    final currentUser = _auth.currentUser;
    if (currentUser == null) return Stream.value(false);

    return _firestore
        .collection('users')
        .doc(currentUser.uid)
        .collection('following')
        .doc(targetUserId)
        .snapshots()
        .map((snapshot) => snapshot.exists);
  }

  Stream<List<UserModel>> getFollowers(String uid) {
    return _getConnectionUsers(uid, 'followers');
  }

  Stream<List<UserModel>> getFollowing(String uid) {
    return _getConnectionUsers(uid, 'following');
  }

  Future<UserModel?> getUserByUsername(String username) async {
    final cleanUsername = username.trim().toLowerCase().replaceAll('@', '');
    if (cleanUsername.isEmpty) {
      return null;
    }

    final usernameDoc =
        await _firestore.collection('usernames').doc(cleanUsername).get();
    final mappedUid = usernameDoc.data()?['uid'] as String?;
    if (mappedUid != null && mappedUid.isNotEmpty) {
      final userDoc = await _firestore.collection('users').doc(mappedUid).get();
      if (userDoc.exists &&
          (_auth.currentUser?.uid == mappedUid ||
              _isVisibleStatus(userDoc.data()?['status']))) {
        return UserModel.fromFirestore(userDoc);
      }
    }

    final handleSnapshot = await _firestore
        .collection('users')
        .where('handle', isEqualTo: cleanUsername)
        .limit(1)
        .get();
    if (handleSnapshot.docs.isNotEmpty) {
      final doc = handleSnapshot.docs.first;
      if (_auth.currentUser?.uid == doc.id || _isVisibleStatus(doc.data()['status'])) {
        return UserModel.fromFirestore(doc);
      }
    }

    final usernameSnapshot = await _firestore
        .collection('users')
        .where('username', isEqualTo: cleanUsername)
        .limit(1)
        .get();
    if (usernameSnapshot.docs.isNotEmpty) {
      final doc = usernameSnapshot.docs.first;
      if (_auth.currentUser?.uid == doc.id || _isVisibleStatus(doc.data()['status'])) {
        return UserModel.fromFirestore(doc);
      }
    }

    return null;
  }

  Future<UserModel?> resolveUser(String identifier) async {
    final cleanIdentifier = identifier.trim().replaceAll('@', '');
    if (cleanIdentifier.isEmpty) {
      return null;
    }

    final byId = await getUserById(cleanIdentifier);
    if (byId != null) {
      return byId;
    }

    return getUserByUsername(cleanIdentifier);
  }

  Future<List<UserModel>> searchUsers(
    String query, {
    int limit = 20,
  }) async {
    final cleanQuery = query.trim().toLowerCase().replaceAll('@', '');
    Query<Map<String, dynamic>> firestoreQuery =
        _firestore.collection('users').orderBy('handle').limit(limit);

    if (cleanQuery.isNotEmpty) {
      firestoreQuery =
          firestoreQuery.startAt([cleanQuery]).endAt(['$cleanQuery\uf8ff']);
    }

    final snapshot = await firestoreQuery.get();
    return snapshot.docs
        .where((doc) => _isVisibleStatus(doc.data()['status']))
        .map(UserModel.fromFirestore)
        .toList();
  }

  // ── Block ──────────────────────────────────────────────────────────────

  Future<void> blockUser(String targetUserId) async {
    final user = _auth.currentUser;
    if (user == null || user.uid == targetUserId) return;
    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('blocked')
        .doc(targetUserId)
        .set({'timestamp': FieldValue.serverTimestamp()});
  }

  Future<void> unblockUser(String targetUserId) async {
    final user = _auth.currentUser;
    if (user == null) return;
    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('blocked')
        .doc(targetUserId)
        .delete();
  }

  Stream<bool> isBlocked(String targetUserId) {
    final user = _auth.currentUser;
    if (user == null) return Stream.value(false);
    return _firestore
        .collection('users')
        .doc(user.uid)
        .collection('blocked')
        .doc(targetUserId)
        .snapshots()
        .map((s) => s.exists);
  }

  // ── Mute ───────────────────────────────────────────────────────────────

  Future<void> muteUser(String targetUserId) async {
    final user = _auth.currentUser;
    if (user == null || user.uid == targetUserId) return;
    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('muted')
        .doc(targetUserId)
        .set({'timestamp': FieldValue.serverTimestamp()});
  }

  Future<void> unmuteUser(String targetUserId) async {
    final user = _auth.currentUser;
    if (user == null) return;
    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('muted')
        .doc(targetUserId)
        .delete();
  }

  Stream<bool> isMuted(String targetUserId) {
    final user = _auth.currentUser;
    if (user == null) return Stream.value(false);
    return _firestore
        .collection('users')
        .doc(user.uid)
        .collection('muted')
        .doc(targetUserId)
        .snapshots()
        .map((s) => s.exists);
  }

  Stream<List<UserModel>> _getConnectionUsers(
    String uid,
    String collectionName,
  ) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection(collectionName)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .asyncMap((snapshot) async {
      if (snapshot.docs.isEmpty) return <UserModel>[];

      final userDocs = await Future.wait(
        snapshot.docs.map(
          (doc) => _firestore.collection('users').doc(doc.id).get(),
        ),
      );

      return userDocs
          .where((doc) => doc.exists)
          .where((doc) => _isVisibleStatus(doc.data()?['status']))
          .map(UserModel.fromFirestore)
          .toList();
    });
  }
}
