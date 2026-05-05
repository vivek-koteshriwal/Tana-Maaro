import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/models/post_model.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/widgets/roast_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final PostService _postService = PostService();
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
          title: TextField(
            controller: _searchController,
            autofocus: true,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Search roasts or users...',
              hintStyle: TextStyle(color: Colors.white24),
              border: InputBorder.none,
            ),
            onChanged: (value) {
              // Real search logic would query Firestore
              setState(() {
                _isSearching = value.isNotEmpty;
              });
            },
          ),
          actions: [
            if (_searchController.text.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () {
                  _searchController.clear();
                  setState(() => _isSearching = false);
                },
              ),
          ],
        ),
        body: ResponsiveContent(
          child:
              !_isSearching ? _buildTrendingSection() : _buildSearchResults(),
        ),
      ),
    );
  }

  Widget _buildTrendingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(20.0),
          child: Text(
            'TRENDING TOPICS',
            style: TextStyle(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 13,
                letterSpacing: 1.2),
          ),
        ),
        _buildTrendItem('#SavageBattles', '4.2K Roasts'),
        _buildTrendItem('#ChaosCreator', '1.8K Roasts'),
        _buildTrendItem('#TanaMaaroLive', '950 Roasts'),
        _buildTrendItem('#ReactConfRoast', '420 Roasts'),
      ],
    );
  }

  Widget _buildTrendItem(String tag, String count) {
    return ListTile(
      title: Text(tag,
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.bold)),
      subtitle:
          Text(count, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      onTap: () {
        _searchController.text = tag;
        setState(() => _isSearching = true);
      },
    );
  }

  Widget _buildSearchResults() {
    return StreamBuilder<List<PostModel>>(
      stream: _postService.getFeed(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor));
        }

        final posts = snapshot.data
                ?.where((p) =>
                    p.content
                        .toLowerCase()
                        .contains(_searchController.text.toLowerCase()) ||
                    p.userHandle
                        .toLowerCase()
                        .contains(_searchController.text.toLowerCase()))
                .toList() ??
            [];

        if (posts.isEmpty) {
          return const Center(
              child: Text('No results found.',
                  style: TextStyle(color: Colors.white24)));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: posts.length,
          itemBuilder: (context, index) => RoastCard(post: posts[index]),
        );
      },
    );
  }
}
