import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final accountManagementServiceProvider =
    Provider<AccountManagementService>((ref) => AccountManagementService());

class AccountManagementService {
  AccountManagementService();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
    app: Firebase.app(),
    databaseId: 'tanamaaro',
  );

  static const Duration deletionWindow = Duration(days: 7);
  static const Set<String> hiddenStatuses = <String>{
    'pending_deletion',
    'deactivated',
    'deleted',
  };

  bool isPendingDeletionActive(
    Map<String, dynamic>? userData, {
    DateTime? now,
  }) {
    final data = userData ?? const <String, dynamic>{};
    final status = (data['status'] as String?)?.trim().toLowerCase() ?? 'active';
    if (status != 'pending_deletion') {
      return false;
    }

    final scheduledDeletionAt = data['scheduledDeletionAt']?.toString();
    if (scheduledDeletionAt == null || scheduledDeletionAt.isEmpty) {
      return true;
    }

    final scheduledDate = DateTime.tryParse(scheduledDeletionAt)?.toUtc();
    if (scheduledDate == null) {
      return true;
    }

    return scheduledDate.isAfter((now ?? DateTime.now()).toUtc());
  }

  bool hasPendingDeletionExpired(
    Map<String, dynamic>? userData, {
    DateTime? now,
  }) {
    final data = userData ?? const <String, dynamic>{};
    final status = (data['status'] as String?)?.trim().toLowerCase() ?? 'active';
    if (status != 'pending_deletion') {
      return false;
    }

    final scheduledDeletionAt = data['scheduledDeletionAt']?.toString();
    if (scheduledDeletionAt == null || scheduledDeletionAt.isEmpty) {
      return false;
    }

    final scheduledDate = DateTime.tryParse(scheduledDeletionAt)?.toUtc();
    if (scheduledDate == null) {
      return false;
    }

    return !scheduledDate.isAfter((now ?? DateTime.now()).toUtc());
  }

  Future<void> requestAccountDeletion({
    required String reason,
    String feedback = '',
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw StateError('You need to be signed in to delete your account.');
    }

    final userRef = _firestore.collection('users').doc(user.uid);
    final userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      throw StateError('Account profile not found.');
    }

    final userData = userSnapshot.data() ?? const <String, dynamic>{};
    final now = DateTime.now().toUtc();
    final scheduledDeletionAt = now.add(deletionWindow);

    final postsSnapshot = await _firestore
        .collection('posts')
        .where('userId', isEqualTo: user.uid)
        .get();
    final rootCommentsSnapshot = await _firestore
        .collection('comments')
        .where('userId', isEqualTo: user.uid)
        .get();
    final groupedCommentsSnapshot = await _firestore
        .collectionGroup('comments')
        .where('userId', isEqualTo: user.uid)
        .get();

    final commentDocs = _dedupeByPath([
      ...rootCommentsSnapshot.docs,
      ...groupedCommentsSnapshot.docs,
    ]);

    final operations = <void Function(WriteBatch)>[
      (batch) => batch.set(
            userRef,
            {
              'status': 'pending_deletion',
              'deletionRequestedAt': now.toIso8601String(),
              'scheduledDeletionAt': scheduledDeletionAt.toIso8601String(),
              'deletionReason': reason,
              'deletionFeedback': feedback.trim(),
              'reactivatedAt': null,
              'deletedAt': null,
              'updatedAt': now.toIso8601String(),
            },
            SetOptions(merge: true),
          ),
      (batch) => batch.set(
            _firestore.collection('account_deletion_records').doc(user.uid),
            {
              'id': user.uid,
              'userId': user.uid,
              'status': 'pending_deletion',
              'username': userData['username'] ?? userData['handle'],
              'emailMasked': _maskEmail(userData['email'] as String?),
              'requestedAt': now.toIso8601String(),
              'scheduledDeletionAt': scheduledDeletionAt.toIso8601String(),
              'reason': reason,
              'feedback': feedback.trim(),
              'reactivatedAt': null,
              'deletedAt': null,
              'updatedAt': now.toIso8601String(),
            },
            SetOptions(merge: true),
          ),
    ];

    for (final doc in postsSnapshot.docs) {
      operations.add(
        (batch) => batch.set(
          doc.reference,
          {
            'authorStatus': 'pending_deletion',
            'updatedAt': now.toIso8601String(),
          },
          SetOptions(merge: true),
        ),
      );
    }

    for (final doc in commentDocs) {
      operations.add(
        (batch) => batch.set(
          doc.reference,
          {
            'authorStatus': 'pending_deletion',
            'updatedAt': now.toIso8601String(),
          },
          SetOptions(merge: true),
        ),
      );
    }

    await _commitChunked(operations);
  }

  Future<void> reactivateAccount() async {
    final user = _auth.currentUser;
    if (user == null) {
      throw StateError('You need to be signed in to reactivate your account.');
    }

    final userRef = _firestore.collection('users').doc(user.uid);
    final userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      throw StateError('Account profile not found.');
    }

    final userData = userSnapshot.data() ?? const <String, dynamic>{};
    final now = DateTime.now().toUtc();
    final postsSnapshot = await _firestore
        .collection('posts')
        .where('userId', isEqualTo: user.uid)
        .get();
    final rootCommentsSnapshot = await _firestore
        .collection('comments')
        .where('userId', isEqualTo: user.uid)
        .get();
    final groupedCommentsSnapshot = await _firestore
        .collectionGroup('comments')
        .where('userId', isEqualTo: user.uid)
        .get();

    final commentDocs = _dedupeByPath([
      ...rootCommentsSnapshot.docs,
      ...groupedCommentsSnapshot.docs,
    ]);

    final operations = <void Function(WriteBatch)>[
      (batch) => batch.set(
            userRef,
            {
              'status': 'active',
              'scheduledDeletionAt': null,
              'reactivatedAt': now.toIso8601String(),
              'updatedAt': now.toIso8601String(),
            },
            SetOptions(merge: true),
          ),
      (batch) => batch.set(
            _firestore.collection('account_deletion_records').doc(user.uid),
            {
              'id': user.uid,
              'userId': user.uid,
              'status': 'reactivated',
              'username': userData['username'] ?? userData['handle'],
              'emailMasked': _maskEmail(userData['email'] as String?),
              'reactivatedAt': now.toIso8601String(),
              'updatedAt': now.toIso8601String(),
            },
            SetOptions(merge: true),
          ),
    ];

    for (final doc in postsSnapshot.docs) {
      operations.add(
        (batch) => batch.set(
          doc.reference,
          {
            'authorStatus': 'active',
            'updatedAt': now.toIso8601String(),
          },
          SetOptions(merge: true),
        ),
      );
    }

    for (final doc in commentDocs) {
      operations.add(
        (batch) => batch.set(
          doc.reference,
          {
            'authorStatus': 'active',
            'updatedAt': now.toIso8601String(),
          },
          SetOptions(merge: true),
        ),
      );
    }

    await _commitChunked(operations);
  }

  Future<void> _commitChunked(
    List<void Function(WriteBatch)> operations,
  ) async {
    if (operations.isEmpty) {
      return;
    }

    WriteBatch batch = _firestore.batch();
    var count = 0;

    for (final operation in operations) {
      operation(batch);
      count += 1;
      if (count >= 350) {
        await batch.commit();
        batch = _firestore.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  }

  Iterable<QueryDocumentSnapshot<Map<String, dynamic>>> _dedupeByPath(
    Iterable<QueryDocumentSnapshot<Map<String, dynamic>>> docs,
  ) sync* {
    final seenPaths = <String>{};

    for (final doc in docs) {
      if (seenPaths.add(doc.reference.path)) {
        yield doc;
      }
    }
  }

  String? _maskEmail(String? email) {
    if (email == null || email.trim().isEmpty || !email.contains('@')) {
      return email;
    }

    final parts = email.split('@');
    if (parts.length != 2) {
      return email;
    }

    final local = parts.first;
    if (local.isEmpty) {
      return email;
    }
    if (local.length <= 2) {
      return '${local[0]}*@${parts.last}';
    }

    final prefix = local.substring(0, 2);
    final maskedLength = local.length - 2;
    return '$prefix${'*' * maskedLength}@${parts.last}';
  }
}
