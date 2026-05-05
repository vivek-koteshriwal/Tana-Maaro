import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

class NotificationModel {
  final String id;
  final String actorId;
  final String actorName;
  final String actorAvatar;
  final String type;
  final String message;
  final String postId;
  final DateTime timestamp;
  final bool read;

  NotificationModel({
    required this.id,
    required this.actorId,
    required this.actorName,
    required this.actorAvatar,
    required this.type,
    required this.message,
    required this.postId,
    required this.timestamp,
    required this.read,
  });

  factory NotificationModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return NotificationModel(
      id: doc.id,
      actorId: data['actorId'] ?? '',
      actorName: _normalizeHandleValue(data['actorName']),
      actorAvatar: data['actorAvatar'] ?? '',
      type: data['type'] ?? 'like',
      message: data['message'] ??
          (data['type'] == 'like'
              ? 'liked your roast'
              : 'interacted with your roast'),
      postId: data['postId'] ?? '',
      timestamp: (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
      read: data['read'] ?? false,
    );
  }

  NotificationModel copyWith({
    String? actorName,
    String? actorAvatar,
  }) {
    return NotificationModel(
      id: id,
      actorId: actorId,
      actorName: actorName ?? this.actorName,
      actorAvatar: actorAvatar ?? this.actorAvatar,
      type: type,
      message: message,
      postId: postId,
      timestamp: timestamp,
      read: read,
    );
  }

  static String _normalizeHandleValue(Object? value) {
    final raw = value?.toString().trim().replaceAll('@', '') ?? '';
    if (raw.isEmpty) {
      return '@someone';
    }
    return '@$raw';
  }
}

class NotificationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Stream<List<NotificationModel>> getNotifications() {
    final user = _auth.currentUser;
    if (user == null) return Stream.value([]);

    return _firestore
        .collection('notifications')
        .where('userId', isEqualTo: user.uid)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .asyncMap((snapshot) async {
      final notifications = snapshot.docs
          .map((doc) => NotificationModel.fromFirestore(doc))
          .toList(growable: false);

      return Future.wait(
        notifications.map((notification) async {
          if (notification.actorId.isEmpty) {
            return notification;
          }

          final actorDoc = await _firestore
              .collection('users')
              .doc(notification.actorId)
              .get();
          final actorData = actorDoc.data() ?? const <String, dynamic>{};
          final actorHandle = actorData['handle'] ??
              actorData['username'] ??
              notification.actorName;
          final actorAvatar =
              actorData['profileImage'] as String? ?? notification.actorAvatar;

          return notification.copyWith(
            actorName: NotificationModel._normalizeHandleValue(actorHandle),
            actorAvatar: actorAvatar,
          );
        }),
      );
    });
  }

  Future<void> markAsRead(String notificationId) async {
    await _firestore
        .collection('notifications')
        .doc(notificationId)
        .update({'read': true});
  }

  Future<void> markAllAsRead() async {
    final user = _auth.currentUser;
    if (user == null) return;

    final unread = await _firestore
        .collection('notifications')
        .where('userId', isEqualTo: user.uid)
        .where('read', isEqualTo: false)
        .get();

    final batch = _firestore.batch();
    for (var doc in unread.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }
}
