import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/models/user_model.dart';
import 'package:tanamaaro_mobile/screens/battle_room_screen.dart';
import 'package:tanamaaro_mobile/screens/city_event_screen.dart';
import 'package:tanamaaro_mobile/screens/post_detail_screen.dart';
import 'package:tanamaaro_mobile/screens/profile_screen.dart';
import 'package:tanamaaro_mobile/screens/tag_feed_screen.dart';
import 'package:tanamaaro_mobile/services/battle_service.dart';
import 'package:tanamaaro_mobile/services/event_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/services/user_service.dart';

class DeepLinkService {
  DeepLinkService._();

  static const String appScheme = 'tanamaaro';
  static const String legacyAppScheme = 'app';
  static const String webHost = 'tanamaaro.com';
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();
  static final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
    app: Firebase.app(),
    databaseId: 'tanamaaro',
  );

  static String normalizeUsername(String username) {
    return username.trim().toLowerCase().replaceAll('@', '');
  }

  static String normalizeHashtag(String hashtag) {
    return hashtag.trim().replaceFirst(RegExp(r'^#'), '').toLowerCase();
  }

  static Uri profileUri(String username) => Uri(
        scheme: appScheme,
        host: 'user',
        path: '/${normalizeUsername(username)}',
      );

  static Uri postUri(String postId) => Uri(
        scheme: appScheme,
        host: 'post',
        path: '/$postId',
      );

  static Uri hashtagUri(String hashtag) => Uri(
        scheme: appScheme,
        host: 'tag',
        path: '/${Uri.encodeComponent(normalizeHashtag(hashtag))}',
      );

  static Uri categoryUri(String category) => Uri(
        scheme: appScheme,
        host: 'category',
        path: '/${Uri.encodeComponent(normalizeHashtag(category))}',
      );

  static Uri eventUri(String eventId) => Uri(
        scheme: appScheme,
        host: 'event',
        path: '/$eventId',
      );

  static Uri eventCityUri(String citySlug) => Uri(
        scheme: appScheme,
        host: 'events',
        path: '/${Uri.encodeComponent(citySlug.trim().toLowerCase())}',
      );

  static Uri battleUri(String battleId) => Uri(
        scheme: appScheme,
        host: 'battle',
        path: '/$battleId',
      );

  static Uri profileShareUri(String username) => Uri.https(
        webHost,
        '/user/${normalizeUsername(username)}',
      );

  static Uri postShareUri(String postId) => Uri.https(
        webHost,
        '/post/$postId',
      );

  static Uri hashtagShareUri(String hashtag) => Uri.https(
        webHost,
        '/tag/${Uri.encodeComponent(normalizeHashtag(hashtag))}',
      );

  static Uri eventShareUri(EventModel event) => Uri.https(
        webHost,
        '/events/${Uri.encodeComponent(event.city.trim().toLowerCase())}',
        {'eventId': event.id},
      );

  static Uri battleShareUri(String battleId) => Uri.https(
        webHost,
        '/battles/$battleId',
      );

  static String buildProfileLinkText(UserModel user) {
    final username = user.username ?? user.handle;
    return _buildLinkBlock(
      profileUri(username),
      profileShareUri(username),
    );
  }

  static String buildProfileShareText(UserModel user) {
    final username = user.username ?? user.handle;
    return 'Enter @${normalizeUsername(username)} on Tana Maaro 🔥\n\n'
        '${buildProfileLinkText(user)}';
  }

  static String buildPostLinkText(PostModel post) {
    return _buildLinkBlock(postUri(post.id), postShareUri(post.id));
  }

  static String buildPostShareText(PostModel post) {
    final handle = post.isAnonymous ? '@anonymous' : post.userHandle;
    return 'Check out this roast by $handle on Tana Maaro 🔥\n\n'
        '"${post.content}"\n\n'
        '${buildPostLinkText(post)}';
  }

  static String buildHashtagShareText(String hashtag) {
    final cleanHashtag = normalizeHashtag(hashtag);
    return 'Dive into #$cleanHashtag on Tana Maaro 🔥\n\n'
        '${_buildLinkBlock(
      hashtagUri(cleanHashtag),
      hashtagShareUri(cleanHashtag),
    )}';
  }

  static String buildEventShareText(EventModel event) {
    return 'Tana Maaro is pulling up in ${event.city} 🔥\n\n'
        '${event.title}\n\n'
        '${_buildLinkBlock(
      eventUri(event.id),
      eventShareUri(event),
    )}';
  }

  static String buildBattleShareText(BattleModel battle) {
    return 'Arena live now: ${battle.title.toUpperCase()} ⚔️\n\n'
        '${_buildLinkBlock(
      battleUri(battle.id),
      battleShareUri(battle.id),
    )}';
  }

  static Future<void> trackShare({
    required String targetType,
    required String targetId,
    required Uri appLink,
    required Uri fallbackLink,
    required String destination,
    Map<String, Object?> extra = const {},
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return;
    }

    await _firestore.collection('shareAnalytics').add({
      'actorId': user.uid,
      'targetType': targetType,
      'targetId': targetId,
      'destination': destination,
      'appLink': appLink.toString(),
      'fallbackLink': fallbackLink.toString(),
      'timestamp': FieldValue.serverTimestamp(),
      ...extra,
    });
  }

  static Future<void> trackLinkOpen({
    required String targetType,
    required String targetId,
    required Uri sourceUri,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return;
    }

    await _firestore.collection('deepLinkOpens').add({
      'userId': user.uid,
      'targetType': targetType,
      'targetId': targetId,
      'sourceUri': sourceUri.toString(),
      'openedAt': FieldValue.serverTimestamp(),
    });
  }

  static String _buildLinkBlock(Uri appLink, Uri fallbackLink) {
    return 'Open in app: $appLink\nWeb fallback: $fallbackLink';
  }
}

class DeepLinkBootstrapper extends StatefulWidget {
  final Widget child;

  const DeepLinkBootstrapper({
    super.key,
    required this.child,
  });

  @override
  State<DeepLinkBootstrapper> createState() => _DeepLinkBootstrapperState();
}

class _DeepLinkBootstrapperState extends State<DeepLinkBootstrapper> {
  final AppLinks _appLinks = AppLinks();
  final BattleService _battleService = BattleService();
  final EventService _eventService = EventService();
  final PostService _postService = PostService();
  final UserService _userService = UserService();

  StreamSubscription<Uri>? _uriSubscription;
  Uri? _pendingUri;
  bool _isHandlingUri = false;

  @override
  void initState() {
    super.initState();
    unawaited(_initializeDeepLinks());
  }

  @override
  void dispose() {
    _uriSubscription?.cancel();
    super.dispose();
  }

  Future<void> _initializeDeepLinks() async {
    final initialUri = await _appLinks.getInitialLink();
    if (initialUri != null) {
      await _handleIncomingUri(initialUri);
    }

    _uriSubscription = _appLinks.uriLinkStream.listen((uri) {
      unawaited(_handleIncomingUri(uri));
    });
  }

  Future<void> _handleIncomingUri(Uri rawUri) async {
    final uri = _normalizeUri(rawUri);
    if (uri == null) {
      return;
    }
    if (DeepLinkService.navigatorKey.currentState == null) {
      _pendingUri = uri;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final nextPendingUri = _pendingUri;
        if (nextPendingUri == null) {
          return;
        }
        _pendingUri = null;
        unawaited(_handleIncomingUri(nextPendingUri));
      });
      return;
    }
    if (_isHandlingUri) {
      _pendingUri = uri;
      return;
    }

    _isHandlingUri = true;
    try {
      switch (uri.host) {
        case 'user':
          final identifier =
              uri.pathSegments.isEmpty ? '' : uri.pathSegments[0];
          if (identifier.isEmpty) return;
          if (uri.pathSegments.length >= 2) {
            await _openPost(uri.pathSegments[1], uri);
            break;
          }
          await _openUser(identifier, uri);
          break;
        case 'profile':
          final username = uri.pathSegments.isEmpty ? '' : uri.pathSegments[0];
          if (username.isEmpty) return;
          await _openUser(username, uri);
          break;
        case 'post':
          final postId = uri.pathSegments.isEmpty ? '' : uri.pathSegments[0];
          if (postId.isEmpty) return;
          await _openPost(postId, uri);
          break;
        case 'tag':
        case 'category':
          final hashtag = uri.pathSegments.isEmpty
              ? ''
              : Uri.decodeComponent(uri.pathSegments[0]);
          if (hashtag.isEmpty) return;
          _pushScreen(TagFeedScreen(hashtag: hashtag));
          _showLoginPromptIfNeeded();
          await DeepLinkService.trackLinkOpen(
            targetType: 'tag',
            targetId: hashtag,
            sourceUri: uri,
          );
          break;
        case 'event':
          final eventId = uri.pathSegments.isEmpty ? '' : uri.pathSegments[0];
          if (eventId.isEmpty) return;
          await _openEvent(eventId, uri);
          break;
        case 'events':
          final city = uri.pathSegments.isEmpty
              ? ''
              : Uri.decodeComponent(uri.pathSegments[0]);
          if (city.isEmpty) return;
          _pushScreen(CityEventScreen(city: city));
          _showLoginPromptIfNeeded();
          await DeepLinkService.trackLinkOpen(
            targetType: 'event_city',
            targetId: city,
            sourceUri: uri,
          );
          break;
        case 'battle':
          final battleId = uri.pathSegments.isEmpty ? '' : uri.pathSegments[0];
          if (battleId.isEmpty) return;
          await _openBattle(battleId, uri);
          break;
      }
    } finally {
      _isHandlingUri = false;
      final nextPendingUri = _pendingUri;
      if (nextPendingUri != null && nextPendingUri != rawUri) {
        _pendingUri = null;
        unawaited(_handleIncomingUri(nextPendingUri));
      }
    }
  }

  Uri? _normalizeUri(Uri uri) {
    final scheme = uri.scheme.toLowerCase();
    if (scheme == DeepLinkService.appScheme ||
        scheme == DeepLinkService.legacyAppScheme) {
      return Uri(
        scheme: DeepLinkService.appScheme,
        host: uri.host.toLowerCase(),
        path: uri.path,
        queryParameters:
            uri.queryParameters.isEmpty ? null : uri.queryParameters,
      );
    }

    final isWebLink = (uri.scheme == 'https' || uri.scheme == 'http') &&
        uri.host.toLowerCase() == DeepLinkService.webHost;
    if (!isWebLink) {
      return null;
    }

    final segments =
        uri.pathSegments.where((segment) => segment.isNotEmpty).toList();
    if (segments.isEmpty) {
      return null;
    }

    final route = segments[0].toLowerCase();
    if ((route == 'user' || route == 'profile') && segments.length >= 2) {
      return DeepLinkService.profileUri(segments[1]);
    }
    if (route == 'post' && segments.length >= 2) {
      return DeepLinkService.postUri(segments[1]);
    }
    if (route == 'tag' && segments.length >= 2) {
      return DeepLinkService.hashtagUri(Uri.decodeComponent(segments[1]));
    }
    if (route == 'event' && segments.length >= 2) {
      return DeepLinkService.eventUri(segments[1]);
    }
    if (route == 'events' && segments.length >= 2) {
      final eventId = uri.queryParameters['eventId'];
      if (eventId != null && eventId.isNotEmpty) {
        return DeepLinkService.eventUri(eventId);
      }
      return DeepLinkService.eventCityUri(Uri.decodeComponent(segments[1]));
    }
    if ((route == 'battle' || route == 'battles') && segments.length >= 2) {
      return DeepLinkService.battleUri(segments[1]);
    }

    return null;
  }

  Future<void> _openUser(String identifier, Uri sourceUri) async {
    final user = await _userService.resolveUser(identifier);
    if (user == null) {
      _showSnack('This roaster no longer exists.');
      return;
    }
    _pushScreen(ProfileScreen(userId: user.uid));
    _showLoginPromptIfNeeded();
    await DeepLinkService.trackLinkOpen(
      targetType: 'profile',
      targetId: user.uid,
      sourceUri: sourceUri,
    );
  }

  Future<void> _openPost(String postId, Uri sourceUri) async {
    final post = await _postService.getPostById(postId);
    if (post == null) {
      _showSnack('This roast is no longer available.');
      return;
    }
    _pushScreen(PostDetailScreen(post: post));
    _showLoginPromptIfNeeded();
    await DeepLinkService.trackLinkOpen(
      targetType: 'post',
      targetId: post.id,
      sourceUri: sourceUri,
    );
  }

  Future<void> _openEvent(String eventId, Uri sourceUri) async {
    final event = await _eventService.getEventById(eventId);
    if (event == null) {
      _showSnack('This event is no longer available.');
      return;
    }
    _pushScreen(CityEventScreen(city: event.city, event: event));
    _showLoginPromptIfNeeded();
    await DeepLinkService.trackLinkOpen(
      targetType: 'event',
      targetId: event.id,
      sourceUri: sourceUri,
    );
  }

  Future<void> _openBattle(String battleId, Uri sourceUri) async {
    final battle = await _battleService.getBattleById(battleId);
    if (battle == null) {
      _showSnack('This battle expired. Open the latest arena instead.');
      return;
    }
    _pushScreen(BattleRoomScreen(battle: battle));
    _showLoginPromptIfNeeded();
    await DeepLinkService.trackLinkOpen(
      targetType: 'battle',
      targetId: battle.id,
      sourceUri: sourceUri,
    );
  }

  void _pushScreen(Widget screen) {
    final navigator = DeepLinkService.navigatorKey.currentState;
    if (navigator == null) {
      return;
    }
    navigator.push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  void _showLoginPromptIfNeeded() {
    if (FirebaseAuth.instance.currentUser != null) {
      return;
    }
    final context = DeepLinkService.navigatorKey.currentContext;
    if (context == null) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: const Text('Sign in to react, follow, and join battles.'),
          backgroundColor: const Color(0xFF1A1A1A),
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'LOGIN',
            textColor: AppTheme.primaryColor,
            onPressed: () {
              DeepLinkService.navigatorKey.currentState
                  ?.popUntil((route) => route.isFirst);
            },
          ),
        ),
      );
  }

  void _showSnack(String message) {
    final context = DeepLinkService.navigatorKey.currentContext;
    if (context == null) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF1A1A1A),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.all(16),
        showCloseIcon: true,
        closeIconColor: AppTheme.primaryColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
