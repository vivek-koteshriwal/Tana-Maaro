import 'package:tanamaaro_mobile/models/post_model.dart';

enum PostSortMode {
  latest,
  trending,
}

class PostRanking {
  static const Duration trendingWindow = Duration(days: 7);

  static bool isTrendingEligible(
    PostModel post, {
    DateTime? now,
  }) {
    final reference = now ?? DateTime.now();
    final anchor = post.lastEngagementAt ?? post.createdAt;
    final age = reference.difference(anchor);
    return age.inMilliseconds >= -(5 * 60 * 1000) &&
        age <= trendingWindow;
  }

  static double trendingScore(
    PostModel post, {
    DateTime? now,
  }) {
    final reference = now ?? DateTime.now();
    if (!isTrendingEligible(post, now: reference)) {
      return double.negativeInfinity;
    }

    final anchor = post.lastEngagementAt ?? post.createdAt;
    final ageMs = reference.difference(anchor).inMilliseconds;
    final clampedAgeMs = ageMs < 0 ? 0 : ageMs;
    final ageHours = (clampedAgeMs / Duration.millisecondsPerHour).clamp(
      1,
      double.infinity,
    );
    final totalActions =
        post.likes + post.comments + post.shares + post.saves + post.views;
    final weightedEngagement = (post.likes * 4.5) +
        (post.comments * 7.5) +
        (post.shares * 10) +
        (post.saves * 6.5) +
        (post.views > 1000 ? 40 : post.views * 0.04);
    final velocityBoost = (totalActions / ageHours) * 28;
    final freshnessBoost =
        ((trendingWindow.inMilliseconds - clampedAgeMs) /
                trendingWindow.inMilliseconds) *
            42;
    final spikeBoost = ageHours <= 6
        ? totalActions * 5
        : ageHours <= 24
            ? totalActions * 2.4
            : ageHours <= 72
                ? totalActions * 1.15
                : 0;
    final ctrBoost = post.ctr * 24;
    final dislikePenalty = post.dislikes * 2.2;

    return weightedEngagement +
        velocityBoost +
        freshnessBoost +
        spikeBoost +
        ctrBoost -
        dislikePenalty;
  }

  static int compare(
    PostModel left,
    PostModel right, {
    required PostSortMode mode,
    DateTime? now,
  }) {
    if (mode == PostSortMode.latest) {
      return right.createdAt.compareTo(left.createdAt);
    }

    final reference = now ?? DateTime.now();
    final scoreDelta =
        trendingScore(right, now: reference).compareTo(
      trendingScore(left, now: reference),
    );
    if (scoreDelta != 0) {
      return scoreDelta;
    }

    final rightActions = right.likes + right.comments + right.shares;
    final leftActions = left.likes + left.comments + left.shares;
    if (rightActions != leftActions) {
      return rightActions.compareTo(leftActions);
    }

    return right.createdAt.compareTo(left.createdAt);
  }

  static List<PostModel> sort(
    Iterable<PostModel> posts, {
    required PostSortMode mode,
    DateTime? now,
  }) {
    final reference = now ?? DateTime.now();
    final filtered = mode == PostSortMode.trending
        ? posts.where((post) => isTrendingEligible(post, now: reference))
        : posts;

    final sorted = filtered.toList(growable: false);
    sorted.sort((left, right) => compare(
          left,
          right,
          mode: mode,
          now: reference,
        ));
    return sorted;
  }
}
