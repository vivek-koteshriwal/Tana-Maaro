import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const String _lastUpdated = 'April 22, 2026';

  static const List<_PolicySection> _sections = [
    _PolicySection(
      number: '1',
      title: 'Information We Collect',
      description:
          'We collect the information you provide directly, the content you choose to publish, and the technical data required to operate and secure Tanamaaro.',
      items: [
        _PolicyItem(
          title: 'Content you post',
          body:
              'When you post on Tanamaaro, we collect the content itself, including roasts, memes, confessions, captions, media uploads, tags, college name when provided, and whether you choose to post anonymously.',
        ),
        _PolicyItem(
          title: 'Event and competition submissions',
          body:
              'For event entries and creator submissions, we may collect your name or creator name, Instagram handle, college name, uploaded content, and any extra details you provide.',
        ),
        _PolicyItem(
          title: 'Automatically collected technical data',
          body:
              'Like most online platforms, we collect technical usage data when you access Tanamaaro.',
          bullets: [
            'IP address and approximate location such as city or region',
            'Device type, browser, operating system, and app version',
            'Page views, screen views, time spent, scroll depth, taps, and clicks',
            'Cookies or similar technologies used for sessions, security, and analytics',
          ],
        ),
        _PolicyItem(
          title: 'Engagement and interaction data',
          body:
              'We track how you interact with content, including reactions, comments, shares, posts viewed, categories explored, and creators or topics you follow.',
        ),
      ],
    ),
    _PolicySection(
      number: '2',
      title: 'How We Use Your Information',
      description:
          'We use information to operate the product, personalize the feed, run events, and keep the community safe.',
      items: [
        _PolicyItem(
          title: 'Platform operations',
          body:
              'Your information is used to display your content, moderate submissions, organize posts by topic or event, and keep account features working across mobile and web.',
          bullets: [
            'Showing your posts, comments, profiles, and battle activity',
            'Moderating content for compliance with community guidelines',
            'Tracking engagement metrics such as views, reactions, comments, and shares',
          ],
        ),
        _PolicyItem(
          title: 'Feed ranking and recommendations',
          body:
              'We may use engagement signals, interests, and platform activity to sort the Roast Wall, trending sections, event placements, and battle recommendations.',
        ),
        _PolicyItem(
          title: 'Events, competitions, and partnerships',
          body:
              'Submission details may be used to review entries, contact participants, shortlist creators, coordinate event activity, and run brand or campus collaborations.',
        ),
        _PolicyItem(
          title: 'Support, safety, and abuse prevention',
          body:
              'We use account and device data to investigate suspicious activity, enforce rules, prevent fraud, respond to support requests, and protect users and the platform.',
        ),
      ],
    ),
    _PolicySection(
      number: '3',
      title: 'How We Share Information',
      description:
          'We do not sell your personal information. We only share information when it is needed to run the service, comply with law, or make public platform features work.',
      items: [
        _PolicyItem(
          title: 'Public-facing content',
          body:
              'Posts, usernames, avatars, reactions, comments, battle participation, and profile details you make public may be visible to other users on the platform.',
        ),
        _PolicyItem(
          title: 'Service providers',
          body:
              'We may share information with infrastructure, analytics, storage, authentication, moderation, and communication providers that help us operate Tanamaaro.',
        ),
        _PolicyItem(
          title: 'Legal and safety reasons',
          body:
              'We may disclose information when required by law, when responding to valid legal requests, or when necessary to investigate abuse, fraud, threats, or harmful activity.',
        ),
        _PolicyItem(
          title: 'Business changes',
          body:
              'If Tanamaaro is involved in a merger, acquisition, financing, or asset sale, information may be transferred as part of that transaction subject to applicable legal obligations.',
        ),
      ],
    ),
    _PolicySection(
      number: '4',
      title: 'Retention and Security',
      description:
          'We retain information only for as long as needed to operate the service, comply with legal obligations, resolve disputes, and protect the platform.',
      items: [
        _PolicyItem(
          title: 'Retention',
          body:
              'Account records, posts, comments, moderation logs, and related operational data may be retained while your account is active and for a reasonable period afterward where required for safety, backup, legal, or administrative purposes.',
        ),
        _PolicyItem(
          title: 'Security measures',
          body:
              'We use technical and organizational safeguards designed to protect information from unauthorized access, misuse, or loss. No platform can promise absolute security, so you should also use strong passwords and protect your device access.',
        ),
      ],
    ),
    _PolicySection(
      number: '5',
      title: 'Your Choices and Rights',
      description:
          'You keep control over key parts of your account and content through the product experience and your device settings.',
      items: [
        _PolicyItem(
          title: 'Profile and content controls',
          body:
              'You can update profile details, change your password when applicable, edit or delete content where those actions are available, and manage what you publish publicly.',
        ),
        _PolicyItem(
          title: 'Cookies and device controls',
          body:
              'Your device and browser may let you control cookies, storage, permissions, and notifications. Restricting them may affect how parts of the product work.',
        ),
        _PolicyItem(
          title: 'Age restrictions',
          body:
              'Tanamaaro is intended for users who are 18 years of age or older. If we learn that an underage user has provided personal information, we may remove the account or related content.',
        ),
      ],
    ),
    _PolicySection(
      number: '6',
      title: 'Contact Us',
      description:
          'If you have questions about this Privacy Policy, account data, or safety concerns, contact the team directly.',
      items: [
        _PolicyItem(
          title: 'Support contact',
          body:
              'Email us at support@tanamaaro.com for privacy-related questions, account support, or requests connected to this policy.',
        ),
      ],
    ),
  ];

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
          title: const Text(
            'PRIVACY POLICY',
            style: TextStyle(
              letterSpacing: 1.7,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          centerTitle: true,
        ),
        body: SelectionArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 40),
            children: [
              _HeroCard(lastUpdated: _lastUpdated),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: const [
                  _CoverageChip(label: 'Website'),
                  _CoverageChip(label: 'Web App'),
                  _CoverageChip(label: 'Android App'),
                  _CoverageChip(label: 'iOS App'),
                ],
              ),
              const SizedBox(height: 18),
              ..._sections.map((section) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _PolicySectionCard(section: section),
                  )),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppTheme.darkGrey,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Need help?',
                      style: AppTheme.label(
                        size: 11,
                        color: const Color(0xFFFF8E84),
                        letterSpacing: 1.8,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'For privacy questions, account data concerns, or safety issues, contact support@tanamaaro.com and include the email address or username connected to your account.',
                      style: AppTheme.body(
                        size: 13,
                        color: Colors.white70,
                        height: 1.65,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.lastUpdated});

  final String lastUpdated;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: Colors.white10),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0x26FF3B3B),
            Color(0x00141414),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PRIVACY POLICY',
            style: AppTheme.label(
              size: 11,
              color: const Color(0xFFFF8E84),
              letterSpacing: 2.2,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Your arena data,\nexplained clearly.',
            style: AppTheme.headline(
              size: 28,
              letterSpacing: -1.2,
              height: 1.0,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'Tanamaaro is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, who we share it with, and the rights available to you across the website, web app, and mobile applications.',
            style: AppTheme.body(
              size: 14,
              color: Colors.white.withValues(alpha: 0.92),
              height: 1.7,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'By using the platform, you consent to the data practices described in this policy.',
            style: AppTheme.body(
              size: 13,
              color: Colors.white54,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.schedule_rounded,
                  color: Color(0xFFFF8E84),
                  size: 18,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Last updated: $lastUpdated',
                    style: AppTheme.body(
                      size: 12,
                      color: Colors.white70,
                      weight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CoverageChip extends StatelessWidget {
  const _CoverageChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
        border:
            Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.24)),
      ),
      child: Text(
        label.toUpperCase(),
        style: AppTheme.label(
          size: 10,
          color: Colors.white,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}

class _PolicySectionCard extends StatelessWidget {
  const _PolicySectionCard({required this.section});

  final _PolicySection section;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SECTION ${section.number}',
            style: AppTheme.label(
              size: 10,
              color: const Color(0xFFFF8E84),
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${section.number}. ${section.title}',
            style: AppTheme.headline(
              size: 22,
              letterSpacing: -0.8,
              height: 1.02,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            section.description,
            style: AppTheme.body(
              size: 13,
              color: Colors.white60,
              height: 1.65,
            ),
          ),
          const SizedBox(height: 16),
          ...section.items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PolicyItemCard(item: item),
              )),
        ],
      ),
    );
  }
}

class _PolicyItemCard extends StatelessWidget {
  const _PolicyItemCard({required this.item});

  final _PolicyItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.22),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.title.toUpperCase(),
            style: AppTheme.label(
              size: 10,
              color: Colors.white,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            item.body,
            style: AppTheme.body(
              size: 13,
              color: Colors.white70,
              height: 1.65,
            ),
          ),
          if (item.bullets.isNotEmpty) ...[
            const SizedBox(height: 10),
            ...item.bullets.map((bullet) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        margin: const EdgeInsets.only(top: 7),
                        decoration: const BoxDecoration(
                          color: AppTheme.primaryColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          bullet,
                          style: AppTheme.body(
                            size: 12,
                            color: Colors.white60,
                            height: 1.6,
                            weight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

class _PolicySection {
  const _PolicySection({
    required this.number,
    required this.title,
    required this.description,
    required this.items,
  });

  final String number;
  final String title;
  final String description;
  final List<_PolicyItem> items;
}

class _PolicyItem {
  const _PolicyItem({
    required this.title,
    required this.body,
    this.bullets = const [],
  });

  final String title;
  final String body;
  final List<String> bullets;
}
