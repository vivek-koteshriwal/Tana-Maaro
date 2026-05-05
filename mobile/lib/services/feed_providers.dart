import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';

final postServiceProvider = Provider<PostService>((ref) => PostService());

final feedProvider = StreamProvider.family<List<PostModel>, String?>((ref, battleId) {
  final postService = ref.watch(postServiceProvider);
  return postService.getFeed(battleId: battleId);
});

// For Trending/Latest logic (if based on simple Firestore sorting)
final latestFeedProvider = StreamProvider<List<PostModel>>((ref) {
  final postService = ref.watch(postServiceProvider);
  return postService.getFeed();
});

final trendingFeedProvider = StreamProvider<List<PostModel>>((ref) {
  final postService = ref.watch(postServiceProvider);
  return postService.getFeed(trending: true);
});
