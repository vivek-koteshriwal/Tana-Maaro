import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:tanamaaro_mobile/core/media_upload_policy.dart';

// ─── Models ──────────────────────────────────────────────────────────────────

class EventModel {
  final String id;
  final String title;
  final String description;
  final DateTime date;
  final String location;
  final String type;
  final String city;
  final String status; // 'upcoming' | 'announced' | 'live' | 'ended'
  final String? prizePool;
  final String? format;
  final bool isFeatured;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.location,
    required this.type,
    required this.city,
    required this.status,
    this.prizePool,
    this.format,
    this.isFeatured = false,
  });

  /// Registration is open when status is 'live' or 'announced'
  bool get registrationOpen => status == 'live' || status == 'announced';

  factory EventModel.fromFirestore(DocumentSnapshot doc) {
    final raw = doc.data();
    final data = raw is Map<String, dynamic> ? raw : <String, dynamic>{};
    return EventModel(
      id: doc.id,
      title: data['title'] ?? 'Tana Maaro Event',
      description: data['description'] ?? 'Join the chaos live.',
      date: parseDate(data['date']) ??
          DateTime.now().add(const Duration(days: 7)),
      location: data['location'] ?? 'Underground Arena',
      type: data['type'] ?? 'roast',
      city: data['city'] ?? '',
      status: data['status'] ?? 'upcoming',
      prizePool: data['prizePool'] as String?,
      format: data['format'] as String?,
      isFeatured: data['isFeatured'] as bool? ?? false,
    );
  }

  static DateTime? parseDate(dynamic value) {
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
    if (value is num) return DateTime.fromMillisecondsSinceEpoch(value.toInt());
    if (value is String) return DateTime.tryParse(value);
    return null;
  }
}

class CityStats {
  final DateTime? nextEventDate;
  final String? eventStatus;
  final int registrationCount;

  const CityStats({
    this.nextEventDate,
    this.eventStatus,
    required this.registrationCount,
  });

  bool get registrationOpen =>
      eventStatus == 'live' || eventStatus == 'announced';
}

// ─── Service ─────────────────────────────────────────────────────────────────

class EventService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String _fileExtension(File file, {required String fallback}) {
    final path = file.path.split('?').first;
    final dotIndex = path.lastIndexOf('.');
    if (dotIndex == -1 || dotIndex == path.length - 1) {
      return fallback;
    }
    return path.substring(dotIndex + 1).toLowerCase();
  }

  String _contentTypeForMedia(String mediaType, String extension) {
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
      case 'avif':
        return 'image/avif';
      case 'heic':
        return 'image/heic';
      default:
        return 'image/jpeg';
    }
  }

  /// All events ordered by date
  Stream<List<EventModel>> getUpcomingEvents() {
    return _firestore.collection('events').orderBy('date').snapshots().map(
        (s) => s.docs
            .map(_safeEventFromSnapshot)
            .whereType<EventModel>()
            .toList(growable: false));
  }

  /// Events filtered by city
  Stream<List<EventModel>> getEventsByCity(String city) {
    return _firestore
        .collection('events')
        .where('city', isEqualTo: city)
        .orderBy('date')
        .snapshots()
        .map((s) => s.docs
            .map(_safeEventFromSnapshot)
            .whereType<EventModel>()
            .toList(growable: false));
  }

  Future<EventModel?> getEventById(String eventId) async {
    final doc = await _firestore.collection('events').doc(eventId).get();
    if (!doc.exists) {
      return null;
    }
    return _safeEventFromSnapshot(doc);
  }

  /// Fetch next event date + registration count for a city (for city cards)
  Future<CityStats> getCityStats(String city) async {
    final eventsSnap = await _firestore
        .collection('events')
        .where('city', isEqualTo: city)
        .orderBy('date')
        .limit(1)
        .get();

    DateTime? nextDate;
    String? status;
    if (eventsSnap.docs.isNotEmpty) {
      final data = eventsSnap.docs.first.data();
      nextDate = EventModel.parseDate(data['date']);
      status = data['status'] as String?;
    }

    // Count attendee + performer registrations
    final aSnap = await _firestore
        .collection('eventRegistrations')
        .where('city', isEqualTo: city)
        .count()
        .get();
    final pSnap = await _firestore
        .collection('performerRegistrations')
        .where('city', isEqualTo: city)
        .count()
        .get();

    return CityStats(
      nextEventDate: nextDate,
      eventStatus: status,
      registrationCount: (aSnap.count ?? 0) + (pSnap.count ?? 0),
    );
  }

  /// Check if current user's email is already registered (attendee)
  Future<bool> isRegistered(String eventId) async {
    final user = _auth.currentUser;
    if (user == null) return false;
    final snap = await _firestore
        .collection('eventRegistrations')
        .where('eventId', isEqualTo: eventId)
        .where('email', isEqualTo: user.email)
        .limit(1)
        .get();
    return snap.docs.isNotEmpty;
  }

  /// Register as Attendee.
  /// Success message: "We will call you back regarding payment and confirmation."
  Future<void> registerAttendee({
    required String eventId,
    required String eventName,
    required String name,
    required String email,
    required String phone,
    required String city,
  }) async {
    final existing = await _firestore
        .collection('eventRegistrations')
        .where('eventId', isEqualTo: eventId)
        .where('email', isEqualTo: email)
        .limit(1)
        .get();
    if (existing.docs.isNotEmpty) throw Exception('already_registered');

    final user = _auth.currentUser;
    await _firestore.collection('eventRegistrations').add({
      'eventId': eventId,
      'eventName': eventName,
      'userId': user?.uid,
      'name': name,
      'email': email,
      'phone': phone,
      'city': city,
      'role': 'attendee',
      'registeredAt': FieldValue.serverTimestamp(),
    });
  }

  /// Register as Performer with optional content submission.
  /// Success message: "We will review your submission and get back to you."
  Future<void> registerPerformer({
    required String eventId,
    required String eventName,
    required String name,
    required String email,
    required String phone,
    required String city,
    required String youtubeChannel,
    required String tanamaroHandle,
    String? contentText,
    String? contentLink, // audio link or external
    File? contentFile, // video / image upload
    String? contentType, // 'video' | 'image' | 'audio_link' | 'text'
  }) async {
    final existing = await _firestore
        .collection('performerRegistrations')
        .where('eventId', isEqualTo: eventId)
        .where('email', isEqualTo: email)
        .limit(1)
        .get();
    if (existing.docs.isNotEmpty) throw Exception('already_registered');

    String? uploadedUrl;
    if (contentFile != null) {
      final validationError = await MediaUploadPolicy.validateFile(
        contentFile,
        mediaType: contentType == 'video' ? 'video' : 'image',
      );
      if (validationError != null) {
        throw Exception(validationError);
      }

      final user = _auth.currentUser;
      final mediaType = contentType == 'video' ? 'video' : 'image';
      final ext = _fileExtension(
        contentFile,
        fallback: mediaType == 'video' ? 'mp4' : 'jpg',
      );
      final ref = _storage.ref().child(
          'performerSubmissions/$eventId/${user?.uid ?? DateTime.now().millisecondsSinceEpoch}.$ext');
      await ref.putFile(
        contentFile,
        SettableMetadata(
          contentType: _contentTypeForMedia(mediaType, ext),
        ),
      );
      uploadedUrl = await ref.getDownloadURL();
    }

    final user = _auth.currentUser;
    await _firestore.collection('performerRegistrations').add({
      'eventId': eventId,
      'eventName': eventName,
      'userId': user?.uid,
      'name': name,
      'email': email,
      'phone': phone,
      'city': city,
      'youtubeChannel': youtubeChannel,
      'tanamaroHandle': tanamaroHandle,
      'contentType': contentType,
      'contentText': contentText,
      'contentUrl': uploadedUrl ?? contentLink,
      'registeredAt': FieldValue.serverTimestamp(),
    });
  }

  EventModel? _safeEventFromSnapshot(
      DocumentSnapshot<Map<String, dynamic>> doc) {
    try {
      return EventModel.fromFirestore(doc);
    } catch (error, stackTrace) {
      debugPrint('Event parse failed for ${doc.id}: $error');
      debugPrintStack(stackTrace: stackTrace);
      return null;
    }
  }
}
