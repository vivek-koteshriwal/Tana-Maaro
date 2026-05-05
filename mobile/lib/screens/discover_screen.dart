import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';

class DiscoverScreen extends StatelessWidget {
  const DiscoverScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ParentBackScope(
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'DISCOVER',
                style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -1),
              ),
              const SizedBox(height: 6),
              Text(
                'Everything Tana Maaro.',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4), fontSize: 14),
              ),
              const SizedBox(height: 40),
              _buildSection('LIVE EVENTS',
                  'Roasting shows, webinars, and open stages coming to your city.'),
              _buildSection('ROAST BATTLES',
                  'Head-to-head battle rooms across categories — college, city, creator.'),
              _buildSection('CONTENT WALL',
                  'Browse the freshest roasts submitted by the community.'),
              _buildSection('HALL OF FAME',
                  'Top performers go viral on our social channels.'),
              const SizedBox(height: 48),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.darkGrey,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: AppTheme.primaryColor.withValues(alpha: 0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'FROM SCREEN TO STAGE',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Tana Maaro is taking roasting offline. Get a real stage, a real crowd, and real chaos. Check our Events tab to see when we\'re coming to your city!',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          height: 1.5,
                          fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 28),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(width: 3, height: 40, color: AppTheme.primaryColor),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                      letterSpacing: 0.5),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontSize: 13,
                      height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
