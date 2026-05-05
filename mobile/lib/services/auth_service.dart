import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:tanamaaro_mobile/core/avatar_config.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final authStateChangesProvider = StreamProvider<User?>((ref) {
  return ref.watch(authServiceProvider).authStateChanges;
});

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  String _normalizeUsername(String value) {
    return value.trim().toLowerCase().replaceAll('@', '');
  }

  String _normalizeEmail(String value) {
    return value.trim().toLowerCase();
  }

  String _normalizePhone(String value) {
    return value.replaceAll(RegExp(r'\D'), '');
  }

  Future<void> _clearFirebaseProfileMetadata(User user) async {
    await user.updateDisplayName(null);
    await user.updatePhotoURL(null);
  }

  bool _looksLikePhone(String value) {
    final normalized = _normalizePhone(value);
    return normalized.length >= 10 && normalized.length <= 15;
  }

  Future<String> _lookupEmailFromRegistry(
      DocumentReference<Map<String, dynamic>> ref) async {
    final snapshot = await ref.get();
    if (!snapshot.exists) {
      throw FirebaseAuthException(
          code: 'user-not-found', message: 'Account does not exist.');
    }

    final data = snapshot.data() ?? const {};
    final email = data['email'] as String?;
    if (email != null && email.isNotEmpty) {
      return email;
    }

    final uid = data['uid'] as String?;
    if (uid == null || uid.isEmpty) {
      throw FirebaseAuthException(
          code: 'user-not-found', message: 'Account lookup is incomplete.');
    }

    final userDoc = await _firestore.collection('users').doc(uid).get();
    final resolvedEmail = userDoc.data()?['email'] as String?;
    if (resolvedEmail == null || resolvedEmail.isEmpty) {
      throw FirebaseAuthException(
          code: 'user-not-found',
          message: 'No account email found for this identifier.');
    }
    return resolvedEmail;
  }

  Future<bool> isUnique(String type, String value) async {
    final cleanValue = _normalizeUsername(value);
    if (type == 'username') {
      final doc =
          await _firestore.collection('usernames').doc(cleanValue).get();
      return !doc.exists;
    } else if (type == 'phone') {
      final doc = await _firestore
          .collection('phones')
          .doc(_normalizePhone(value))
          .get();
      return !doc.exists;
    }
    return true;
  }

  /// Single Gateway Login (Username OR Email OR Phone)
  Future<UserCredential> signInUnified(
      String identifier, String password) async {
    final rawIdentifier = identifier.trim();
    String email = _normalizeEmail(rawIdentifier);

    if (email.contains('@')) {
      // It's an email
    } else if (_looksLikePhone(rawIdentifier)) {
      final normalizedPhone = _normalizePhone(rawIdentifier);
      try {
        email = await _lookupEmailFromRegistry(
            _firestore.collection('phones').doc(normalizedPhone));
      } on FirebaseAuthException {
        rethrow;
      } on FirebaseException {
        final snapshot = await _firestore
            .collection('users')
            .where('phone', isEqualTo: normalizedPhone)
            .limit(1)
            .get();
        if (snapshot.docs.isEmpty) {
          throw FirebaseAuthException(
              code: 'user-not-found',
              message: 'No account found with this phone number.');
        }
        email = snapshot.docs.first.get('email');
      }
    } else {
      email = await _lookupEmailFromRegistry(_firestore
          .collection('usernames')
          .doc(_normalizeUsername(rawIdentifier)));
    }

    return await _auth.signInWithEmailAndPassword(
        email: email, password: password);
  }

  /// Email sign-up. Public handle is claimed separately in onboarding.
  Future<UserCredential> signUp({
    required String email,
    required String phone,
    required String password,
    required DateTime dob,
  }) async {
    final normalizedEmail = _normalizeEmail(email);
    final normalizedPhone = _normalizePhone(phone);
    UserCredential? credential;

    try {
      credential = await _auth.createUserWithEmailAndPassword(
          email: normalizedEmail, password: password);
      final uid = credential.user!.uid;

      await _clearFirebaseProfileMetadata(credential.user!);
      await credential.user!.getIdToken(true);

      final userRef = _firestore.collection('users').doc(uid);
      final phoneRef = _firestore.collection('phones').doc(normalizedPhone);

      final phoneDoc = await phoneRef.get();
      if (phoneDoc.exists) {
        throw Exception('Phone number already in use.');
      }

      final batch = _firestore.batch();

      batch.set(userRef, {
        'uid': uid,
        'email': normalizedEmail,
        'phone': normalizedPhone,
        'dob': dob.toIso8601String(),
        'createdAt': FieldValue.serverTimestamp(),
        'profileImage': randomAvatarUrl(), // Unique robot avatar, no real photo
        'postsCount': 0,
        'followerCount': 0,
        'followingCount': 0,
        'bio': '',
        'status': 'active',
        'deletionRequestedAt': null,
        'scheduledDeletionAt': null,
        'deletionReason': null,
        'deletionFeedback': null,
        'reactivatedAt': null,
        'deletedAt': null,
      });

      batch.set(phoneRef, {'uid': uid, 'email': normalizedEmail});

      await batch.commit();
      return credential;
    } on FirebaseAuthException {
      rethrow;
    } on FirebaseException catch (e) {
      if (credential?.user != null) {
        await credential!.user!.delete().catchError((_) {});
      }
      if (e.code == 'unavailable') {
        throw Exception(
            'Cloud Firestore is unreachable. Check internet and try again.');
      }
      if (e.code == 'permission-denied') {
        throw Exception(
            'Firestore rules are blocking signup. Update the rules for users/usernames/phones.');
      }
      throw Exception('Firestore error: ${e.message ?? e.code}');
    } catch (e) {
      if (credential?.user != null) {
        await credential!.user!.delete().catchError((_) {});
      }
      rethrow;
    }
  }

  /// Google Sign-In — stores email only and forces handle onboarding.
  Future<void> signInWithGoogle() async {
    await _googleSignIn.signOut();
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) return;

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final userCredential = await _auth.signInWithCredential(credential);
    final user = userCredential.user;
    if (user == null) {
      throw Exception('Google Sign-In completed without a Firebase user.');
    }

    await _clearFirebaseProfileMetadata(user);

    final userRef = _firestore.collection('users').doc(user.uid);
    final userDoc = await userRef.get();

    if (!userDoc.exists) {
      // New user — assign system avatar and wait for username setup.
      await userRef.set({
        'uid': user.uid,
        'email': user.email,
        'profileImage':
            randomAvatarUrl(), // Random avatar from 30 curated seeds
        'createdAt': FieldValue.serverTimestamp(),
        'postsCount': 0,
        'followerCount': 0,
        'followingCount': 0,
        'bio': '',
        'status': 'active',
        'deletionRequestedAt': null,
        'scheduledDeletionAt': null,
        'deletionReason': null,
        'deletionFeedback': null,
        'reactivatedAt': null,
        'deletedAt': null,
      }, SetOptions(merge: true));
    } else {
      await userRef.set({
        'email': user.email,
        'name': FieldValue.delete(),
        'displayName': FieldValue.delete(),
      }, SetOptions(merge: true));
    }
  }

  Future<void> completeUsernameSetup(String username) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('You need to be signed in before claiming a handle.');
    }

    final normalizedUsername = _normalizeUsername(username);
    if (normalizedUsername.isEmpty) {
      throw Exception('Username is required.');
    }

    try {
      final usernameRef =
          _firestore.collection('usernames').doc(normalizedUsername);
      final usernameDoc = await usernameRef.get();
      if (usernameDoc.exists) {
        throw Exception('Username already taken. Try another one.');
      }

      final userRef = _firestore.collection('users').doc(user.uid);
      final userDoc = await userRef.get();

      // Keep existing profileImage if already set, otherwise assign robot avatar
      final existingImage = userDoc.data()?['profileImage'] as String?;
      final avatarUrl = (existingImage != null && existingImage.isNotEmpty)
          ? existingImage
          : randomAvatarUrl();

      final batch = _firestore.batch();

      batch.set(
          userRef,
          {
            'uid': user.uid,
            'username': normalizedUsername,
            'handle': normalizedUsername,
            'email': user.email,
            'createdAt': FieldValue.serverTimestamp(),
            'profileImage': avatarUrl,
            'postsCount': 0,
            'followerCount': 0,
            'followingCount': 0,
            'bio': userDoc.data()?['bio'] ?? '',
            'name': FieldValue.delete(),
            'displayName': FieldValue.delete(),
          },
          SetOptions(merge: true));

      batch.set(usernameRef, {
        'uid': user.uid,
        'email': user.email,
      });

      await batch.commit();
      await _clearFirebaseProfileMetadata(user);
    } on FirebaseException catch (e) {
      final message = e.message ?? '';
      if (e.code == 'permission-denied') {
        throw Exception(
            'Firestore rules are blocking handle setup. Update the rules for users and usernames.');
      }
      if (e.code == 'not-found' ||
          message.contains('database (default) does not exist')) {
        throw Exception(
            'Cloud Firestore has not been created yet. Open Firebase Console > Firestore Database and create it first.');
      }
      if (e.code == 'unavailable') {
        throw Exception(
            'Cloud Firestore is unreachable. Check internet and try again.');
      }
      throw Exception('Firestore error: ${e.message ?? e.code}');
    }
  }

  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    await _auth.signOut();
  }
}
