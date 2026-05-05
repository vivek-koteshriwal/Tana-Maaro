import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanamaaro_mobile/screens/main_layout.dart';
import 'package:tanamaaro_mobile/screens/username_setup_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/screens/pending_deletion_screen.dart';
import 'package:tanamaaro_mobile/services/account_management_service.dart';

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = FirebaseAuth.instance.currentUser;
    final accountManagement = ref.watch(accountManagementServiceProvider);
    if (user == null)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instanceFor(
              app: Firebase.app(), databaseId: 'tanamaaro')
          .collection('users')
          .doc(user.uid)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
              body: Center(
                  child:
                      CircularProgressIndicator(color: AppTheme.primaryColor)));
        }

        if (snapshot.hasError) {
          return Scaffold(
              body: Center(
                  child: Text('Error: ${snapshot.error}',
                      style: const TextStyle(color: Colors.white))));
        }

        if (!snapshot.hasData || !snapshot.data!.exists) {
          return const PendingDeletionScreen(
            scheduledDeletionAt: null,
            expired: true,
          );
        }

        final userData = snapshot.data?.data() as Map<String, dynamic>? ?? {};
        if (accountManagement.isPendingDeletionActive(userData)) {
          return PendingDeletionScreen(
            scheduledDeletionAt: userData['scheduledDeletionAt']?.toString(),
          );
        }

        if (accountManagement.hasPendingDeletionExpired(userData)) {
          return PendingDeletionScreen(
            scheduledDeletionAt: userData['scheduledDeletionAt']?.toString(),
            expired: true,
          );
        }

        final hasPublicIdentity =
            (userData['username'] as String?)?.trim().isNotEmpty == true ||
                (userData['handle'] as String?)?.trim().isNotEmpty == true;

        // If public identity is missing, force setup
        if (!hasPublicIdentity) {
          return const UsernameSetupScreen();
        }

        return MainLayout(key: mainLayoutKey);
      },
    );
  }
}
