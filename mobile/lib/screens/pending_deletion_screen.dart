import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/services/account_management_service.dart';

class PendingDeletionScreen extends ConsumerStatefulWidget {
  const PendingDeletionScreen({
    super.key,
    required this.scheduledDeletionAt,
    this.expired = false,
  });

  final String? scheduledDeletionAt;
  final bool expired;

  @override
  ConsumerState<PendingDeletionScreen> createState() =>
      _PendingDeletionScreenState();
}

class _PendingDeletionScreenState
    extends ConsumerState<PendingDeletionScreen> {
  bool _isSubmitting = false;

  Future<void> _reactivate() async {
    setState(() => _isSubmitting = true);
    try {
      await ref.read(accountManagementServiceProvider).reactivateAccount();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Your account has been reactivated.'),
          backgroundColor: Colors.green[800],
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red[800],
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _signOut() async {
    setState(() => _isSubmitting = true);
    await FirebaseAuth.instance.signOut();
  }

  @override
  Widget build(BuildContext context) {
    final parsedDate = widget.scheduledDeletionAt == null
        ? null
        : DateTime.tryParse(widget.scheduledDeletionAt!);
    final formattedDate = parsedDate == null
        ? 'within 7 days'
        : DateFormat('MMM d, yyyy • h:mm a').format(parsedDate.toLocal());

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: const Color(0x33DC2626),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: AppTheme.primaryColor,
                  size: 34,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                widget.expired
                    ? 'ACCOUNT NO LONGER AVAILABLE'
                    : 'ACCOUNT SCHEDULED FOR DELETION',
                style: AppTheme.label(
                  size: 12,
                  color: AppTheme.primaryColor,
                  letterSpacing: 1.8,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.expired
                    ? 'The recovery window has expired.'
                    : 'Would you like to reactivate your account?',
                style: AppTheme.headline(size: 28, letterSpacing: -0.8),
              ),
              const SizedBox(height: 14),
              Text(
                widget.expired
                    ? 'This account was scheduled for deletion and can no longer be restored here. Sign out to continue.'
                    : 'Your account is scheduled for permanent deletion on $formattedDate. Reactivating now cancels the deletion request and restores full access immediately.',
                style: AppTheme.body(
                  size: 15,
                  color: Colors.white70,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
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
                      'DELETION STATUS',
                      style: AppTheme.label(
                        size: 11,
                        color: AppTheme.primaryColor,
                        letterSpacing: 1.6,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      widget.expired
                          ? 'Recovery window expired'
                          : 'Scheduled for $formattedDate',
                      style: AppTheme.body(
                        size: 16,
                        color: Colors.white,
                        weight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      widget.expired
                          ? 'The account remains unavailable until the backend deletion cleanup finishes.'
                          : 'If you choose continue deletion, we will keep the deletion request active and sign you out now.',
                      style: AppTheme.body(
                        size: 13,
                        color: Colors.white54,
                        height: 1.55,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (!widget.expired) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _reactivate,
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('REACTIVATE ACCOUNT'),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _isSubmitting ? null : _signOut,
                  child: Text(widget.expired ? 'SIGN OUT' : 'CONTINUE DELETION'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
