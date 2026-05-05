import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/screens/edit_profile_screen.dart';
import 'package:tanamaaro_mobile/screens/partnership_screen.dart';
import 'package:tanamaaro_mobile/screens/discover_screen.dart';
import 'package:tanamaaro_mobile/screens/privacy_policy_screen.dart';
import 'package:tanamaaro_mobile/screens/terms_of_chaos_screen.dart';
import 'package:tanamaaro_mobile/screens/delete_account_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isSendingReset = false;

  Future<void> _sendPasswordReset() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user?.email == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No email address linked to this account.'),
        ),
      );
      return;
    }
    setState(() => _isSendingReset = true);
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: user!.email!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Password reset email sent. Check your inbox.'),
            backgroundColor: Colors.green[800],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red[800],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSendingReset = false);
    }
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
          title: const Text(
            'SETTINGS',
            style: TextStyle(
              letterSpacing: 2,
              fontSize: 15,
              fontWeight: FontWeight.w900,
            ),
          ),
          centerTitle: true,
        ),
        body: ListView(
          padding: const EdgeInsets.symmetric(vertical: 10),
          children: [
            _buildGroupHeader('ACCOUNT'),
            _buildSettingsTile(
              icon: Icons.person_outline,
              title: 'Change Username',
              onTap:
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const EditProfileScreen(),
                    ),
                  ),
            ),
            _buildSettingsTile(
              icon: Icons.lock_outline,
              title: 'Change Password',
              onTap: _isSendingReset ? () {} : _sendPasswordReset,
              trailing:
                  _isSendingReset
                      ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          color: AppTheme.primaryColor,
                          strokeWidth: 2,
                        ),
                      )
                      : null,
            ),
            _buildGroupHeader('EXPLORE'),
            _buildSettingsTile(
              icon: Icons.explore_outlined,
              title: 'Discover',
              subtitle: 'Find new roasters and trending content',
              onTap:
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const DiscoverScreen()),
                  ),
            ),
            _buildGroupHeader('ABOUT TANA MAARO'),
            _buildSettingsTile(
              icon: Icons.handshake_outlined,
              title: 'Partnerships',
              subtitle: 'Collaborate and grow with us',
              onTap:
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const PartnershipScreen(),
                    ),
                  ),
            ),
            _buildSettingsTile(
              icon: Icons.description_outlined,
              title: 'Terms of Chaos',
              onTap:
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const TermsOfChaosScreen(),
                    ),
                  ),
            ),
            _buildSettingsTile(
              icon: Icons.privacy_tip_outlined,
              title: 'Privacy Policy',
              onTap:
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const PrivacyPolicyScreen(),
                    ),
                  ),
            ),
            _buildGroupHeader('DANGER ZONE'),
            _buildSettingsTile(
              icon: Icons.delete_forever_outlined,
              title: 'Delete Account',
              onTap:
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const DeleteAccountScreen(),
                    ),
                  ),
              color: Colors.redAccent,
            ),
            _buildSettingsTile(
              icon: Icons.logout_outlined,
              title: 'Logout',
              onTap: () async {
                await FirebaseAuth.instance.signOut();
                if (context.mounted) {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                }
              },
              color: Colors.redAccent,
              showChevron: false,
            ),
            const SizedBox(height: 60),
            Center(
              child: Column(
                children: [
                  const Text(
                    'Tana Maaro Mobile',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'v1.0.0 · Arena Ready',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildGroupHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
      child: Text(
        title,
        style: const TextStyle(
          color: AppTheme.primaryColor,
          fontWeight: FontWeight.bold,
          fontSize: 11,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
    Color? color,
    bool showChevron = true,
    Widget? trailing,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Icon(
        icon,
        color: color ?? Colors.white.withValues(alpha: 0.7),
        size: 22,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: color ?? Colors.white,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle:
          subtitle != null
              ? Text(
                subtitle,
                style: const TextStyle(color: Colors.white24, fontSize: 12),
              )
              : null,
      trailing:
          trailing ??
          (showChevron
              ? Icon(
                Icons.chevron_right,
                color: Colors.white.withValues(alpha: 0.2),
                size: 18,
              )
              : null),
      onTap: onTap,
    );
  }
}
