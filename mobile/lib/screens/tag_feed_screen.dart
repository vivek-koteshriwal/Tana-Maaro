import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/widgets/roast_card.dart';

class TagFeedScreen extends StatelessWidget {
  final String hashtag;

  const TagFeedScreen({
    super.key,
    required this.hashtag,
  });

  String get _cleanHashtag => DeepLinkService.normalizeHashtag(hashtag);

  @override
  Widget build(BuildContext context) {
    final postService = PostService();

    return ParentBackScope(
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          leading: IconButton(
            onPressed: () => navigateToParentRoute(context),
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          title: Text(
            '#${_cleanHashtag.toUpperCase()}',
            style: const TextStyle(
              letterSpacing: 1.2,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          centerTitle: true,
          actions: [
            IconButton(
              onPressed: () async {
                await Share.share(
                  DeepLinkService.buildHashtagShareText(_cleanHashtag),
                );
                await DeepLinkService.trackShare(
                  targetType: 'tag',
                  targetId: _cleanHashtag,
                  appLink: DeepLinkService.hashtagUri(_cleanHashtag),
                  fallbackLink: DeepLinkService.hashtagShareUri(_cleanHashtag),
                  destination: 'external',
                );
              },
              icon: const Icon(Icons.ios_share_rounded, color: Colors.white),
            ),
          ],
        ),
        body: ResponsiveContent(
          child: StreamBuilder<List<PostModel>>(
            stream: postService.getTaggedPosts(_cleanHashtag),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(
                  child:
                      CircularProgressIndicator(color: AppTheme.primaryColor),
                );
              }

              final posts = snapshot.data ?? [];
              if (posts.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Text(
                      'No roasts found for #$_cleanHashtag yet.',
                      textAlign: TextAlign.center,
                      style:
                          const TextStyle(color: Colors.white38, fontSize: 14),
                    ),
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(12),
                cacheExtent: 1200,
                physics: const AlwaysScrollableScrollPhysics(
                  parent: ClampingScrollPhysics(),
                ),
                itemCount: posts.length,
                itemBuilder: (context, index) => RoastCard(post: posts[index]),
              );
            },
          ),
        ),
      ),
    );
  }
}
