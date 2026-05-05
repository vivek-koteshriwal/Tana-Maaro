import 'package:cloud_firestore/cloud_firestore.dart';

class PostModel {
  final String id;
  final String userId;
  final String userName;
  final String userHandle;
  final String userAvatar;
  final String content;
  final String? image;
  final int likes;
  final int dislikes;
  final int comments;
  final int shares;
  final int saves;
  final int views;
  final double ctr;
  final List<String> likedBy;
  final List<String> dislikedBy;
  final DateTime createdAt;
  final DateTime? lastEngagementAt;
  final String type;
  final String? battleId;
  final bool isAnonymous;

  PostModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userHandle,
    required this.userAvatar,
    required this.content,
    this.image,
    required this.likes,
    required this.dislikes,
    required this.comments,
    required this.shares,
    this.saves = 0,
    this.views = 0,
    this.ctr = 0,
    required this.likedBy,
    required this.dislikedBy,
    required this.createdAt,
    this.lastEngagementAt,
    required this.type,
    this.battleId,
    this.isAnonymous = false,
  });

  factory PostModel.fromFirestore(DocumentSnapshot doc) {
    final raw = doc.data();
    final data = raw is Map<String, dynamic> ? raw : <String, dynamic>{};
    return _fromMap(data, id: doc.id);
  }

  factory PostModel.fromJson(Map<String, dynamic> json, {String? id}) {
    return _fromMap(json, id: id ?? _stringValue(json['id']));
  }

  static PostModel _fromMap(Map<String, dynamic> data, {required String id}) {
    final likedBy = _stringList(data['likedBy']);
    final dislikedBy = _stringList(data['dislikedBy']);
    final image = _optionalString(
      data['image'] ?? data['imageUrl'] ?? data['mediaUrl'] ?? data['videoUrl'],
    );
    final handle = _normalizeHandle(
      _stringValue(
        data['userHandle'] ?? data['username'] ?? data['handle'],
        fallback: 'anon',
      ),
    );
    final userId = _stringValue(data['userId'], fallback: '');
    final isAnonymous = _boolValue(data['isAnonymous']) ||
        userId == 'anon' ||
        handle.toLowerCase() == '@anonymous';

    return PostModel(
      id: id,
      userId: userId,
      userName: isAnonymous ? 'Anonymous' : handle,
      userHandle: handle,
      userAvatar: _stringValue(
        data['userAvatar'] ?? data['profileImage'] ?? data['avatar'],
        fallback: '',
      ),
      content: _stringValue(data['content'] ?? data['caption'], fallback: ''),
      image: image,
      likes: _intValue(data['likes'], fallback: likedBy.length),
      dislikes: _intValue(data['dislikes'], fallback: dislikedBy.length),
      comments: _countValue(data['comments']),
      shares: _countValue(data['shares']),
      saves: _countValue(
        data['saveCount'] ?? data['savedCount'] ?? data['saves'],
      ),
      views: _countValue(
        data['viewCount'] ?? data['views'] ?? data['impressions'],
      ),
      ctr: _doubleValue(
        data['ctr'] ?? data['clickThroughRate'] ?? data['engagementRate'],
      ),
      likedBy: likedBy,
      dislikedBy: dislikedBy,
      createdAt: _dateTimeValue(data['createdAt'] ?? data['timestamp']),
      lastEngagementAt: data['lastEngagementAt'] == null
          ? null
          : _dateTimeValue(data['lastEngagementAt']),
      type: _stringValue(
        data['mediaType'] ?? data['type'],
        fallback: image == null ? 'text' : _inferMediaType(image),
      ),
      battleId: _optionalString(data['battleId']),
      isAnonymous: isAnonymous,
    );
  }

  PostModel copyWith({
    String? id,
    String? userId,
    String? userName,
    String? userHandle,
    String? userAvatar,
    String? content,
    Object? image = _copyWithSentinel,
    int? likes,
    int? dislikes,
    int? comments,
    int? shares,
    int? saves,
    int? views,
    double? ctr,
    List<String>? likedBy,
    List<String>? dislikedBy,
    DateTime? createdAt,
    Object? lastEngagementAt = _copyWithSentinel,
    String? type,
    Object? battleId = _copyWithSentinel,
    bool? isAnonymous,
  }) {
    return PostModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      userHandle: userHandle ?? this.userHandle,
      userAvatar: userAvatar ?? this.userAvatar,
      content: content ?? this.content,
      image:
          identical(image, _copyWithSentinel) ? this.image : image as String?,
      likes: likes ?? this.likes,
      dislikes: dislikes ?? this.dislikes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      saves: saves ?? this.saves,
      views: views ?? this.views,
      ctr: ctr ?? this.ctr,
      likedBy: likedBy ?? this.likedBy,
      dislikedBy: dislikedBy ?? this.dislikedBy,
      createdAt: createdAt ?? this.createdAt,
      lastEngagementAt: identical(lastEngagementAt, _copyWithSentinel)
          ? this.lastEngagementAt
          : lastEngagementAt as DateTime?,
      type: type ?? this.type,
      battleId: identical(battleId, _copyWithSentinel)
          ? this.battleId
          : battleId as String?,
      isAnonymous: isAnonymous ?? this.isAnonymous,
    );
  }

  int get fireCount => likes;
  int get tauntCount => comments;
  int get downCount => dislikes;
  int get shareCount => shares;
  bool get hasMedia => image != null && image!.trim().isNotEmpty;
  bool get isVideo =>
      _normalizeMediaType(type) == 'video' || _inferMediaType(image) == 'video';
  bool get isImage => hasMedia && !isVideo;

  bool isFiredBy(String? userId) => userId != null && likedBy.contains(userId);

  bool isDownedBy(String? userId) =>
      userId != null && dislikedBy.contains(userId);

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'userName': userName,
      'userHandle': userHandle,
      'userAvatar': userAvatar,
      'content': content,
      'image': image,
      'likes': likes,
      'dislikes': dislikes,
      'comments': comments,
      'shares': shares,
      'saves': saves,
      'views': views,
      'ctr': ctr,
      'likedBy': likedBy,
      'dislikedBy': dislikedBy,
      'createdAt': FieldValue.serverTimestamp(),
      'lastEngagementAt': lastEngagementAt != null
          ? Timestamp.fromDate(lastEngagementAt!)
          : FieldValue.serverTimestamp(),
      'type': type,
      'battleId': battleId,
      'isAnonymous': isAnonymous,
    };
  }

  static String _stringValue(Object? value, {String fallback = ''}) {
    if (value == null) {
      return fallback;
    }
    final stringValue = value.toString().trim();
    return stringValue.isEmpty ? fallback : stringValue;
  }

  static String? _optionalString(Object? value) {
    final stringValue = _stringValue(value);
    return stringValue.isEmpty ? null : stringValue;
  }

  static int _intValue(Object? value, {int fallback = 0}) {
    if (value == null) {
      return fallback;
    }
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    if (value is List) {
      return value.length;
    }
    return int.tryParse(value.toString()) ?? fallback;
  }

  static int _countValue(Object? value) {
    return _intValue(value, fallback: 0);
  }

  static double _doubleValue(Object? value, {double fallback = 0}) {
    if (value == null) {
      return fallback;
    }
    if (value is double) {
      return value;
    }
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value.toString()) ?? fallback;
  }

  static List<String> _stringList(Object? value) {
    if (value is Iterable) {
      return value
          .map((entry) => entry?.toString() ?? '')
          .where((entry) => entry.isNotEmpty)
          .toList(growable: false);
    }
    return const <String>[];
  }

  static bool _boolValue(Object? value) {
    if (value is bool) {
      return value;
    }
    if (value is String) {
      return value.toLowerCase() == 'true';
    }
    return false;
  }

  static DateTime _dateTimeValue(Object? value) {
    if (value is Timestamp) {
      return value.toDate();
    }
    if (value is DateTime) {
      return value;
    }
    if (value is int) {
      return DateTime.fromMillisecondsSinceEpoch(value);
    }
    if (value is num) {
      return DateTime.fromMillisecondsSinceEpoch(value.toInt());
    }
    if (value is String) {
      return DateTime.tryParse(value) ?? DateTime.now();
    }
    return DateTime.now();
  }

  static String _normalizeHandle(String handle) {
    final trimmed = handle.trim();
    if (trimmed.isEmpty) {
      return '@anon';
    }
    return trimmed.startsWith('@') ? trimmed : '@$trimmed';
  }

  static String _normalizeMediaType(String mediaType) {
    final normalized = mediaType.trim().toLowerCase();
    if (normalized == 'image' ||
        normalized == 'video' ||
        normalized == 'text') {
      return normalized;
    }
    return normalized == 'mixed' ? 'image' : 'text';
  }

  static String _inferMediaType(String? mediaUrl) {
    if (mediaUrl == null || mediaUrl.isEmpty) {
      return 'text';
    }

    final normalized = mediaUrl.toLowerCase().split('?').first;
    const videoExtensions = <String>{
      '.mp4',
      '.mov',
      '.m4v',
      '.webm',
      '.mkv',
      '.avi',
    };

    for (final extension in videoExtensions) {
      if (normalized.endsWith(extension)) {
        return 'video';
      }
    }

    return 'image';
  }
}

const Object _copyWithSentinel = Object();
