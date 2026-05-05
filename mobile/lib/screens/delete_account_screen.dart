import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/services/account_management_service.dart';

class DeleteAccountScreen extends ConsumerStatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  ConsumerState<DeleteAccountScreen> createState() =>
      _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends ConsumerState<DeleteAccountScreen> {
  static const List<String> _reasons = <String>[
    'Taking a break',
    'Privacy concerns',
    'Too many notifications',
    'Found another platform',
    'Not useful anymore',
    'Temporary issue',
    'Other',
  ];

  int _step = 1;
  String _selectedReason = _reasons.first;
  final TextEditingController _feedbackController = TextEditingController();
  final TextEditingController _confirmationController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _feedbackController.dispose();
    _confirmationController.dispose();
    super.dispose();
  }

  Future<void> _goToConfirmation() async {
    if (_selectedReason == 'Other' &&
        _feedbackController.text.trim().isEmpty) {
      setState(() {
        _error = 'Tell us why you are leaving before continuing.';
      });
      return;
    }

    setState(() {
      _error = null;
      _step = 2;
    });
  }

  Future<void> _submitDeletion() async {
    if (_confirmationController.text.trim().toUpperCase() != 'DELETE') {
      setState(() {
        _error = 'Type DELETE exactly to confirm account deletion.';
      });
      return;
    }

    final service = ref.read(accountManagementServiceProvider);
    setState(() {
      _error = null;
      _isSubmitting = true;
    });

    try {
      final scheduledDeletionAt =
          DateTime.now().toUtc().add(AccountManagementService.deletionWindow);
      await service.requestAccountDeletion(
        reason: _selectedReason,
        feedback: _feedbackController.text.trim(),
      );

      if (!mounted) {
        return;
      }

      final formattedDate = DateFormat('MMM d, yyyy • h:mm a')
          .format(scheduledDeletionAt.toLocal());

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.darkGrey,
          title: Text(
            'ACCOUNT SCHEDULED FOR DELETION',
            style: AppTheme.headline(size: 18, letterSpacing: -0.2),
          ),
          content: Text(
            'Your account is scheduled for permanent deletion in 7 days. '
            'If you log back in before $formattedDate, you can reactivate it.',
            style: AppTheme.body(
              size: 14,
              color: Colors.white70,
              height: 1.55,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'OK',
                style: TextStyle(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );

      await FirebaseAuth.instance.signOut();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOther = _selectedReason == 'Other';

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(
          _step == 1 ? 'DELETE ACCOUNT' : 'FINAL CONFIRMATION',
          style: AppTheme.label(size: 13, letterSpacing: 1.6),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0x33DC2626),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0x66DC2626)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      color: AppTheme.primaryColor,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _step == 1
                            ? 'We will deactivate your account first and give you a 7-day recovery window before permanent deletion.'
                            : 'Once you confirm, your profile becomes inactive immediately. Sign back in within 7 days if you want to restore access.',
                        style: AppTheme.body(
                          size: 14,
                          color: Colors.white70,
                          height: 1.55,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text(
                _step == 1
                    ? 'Why do you want to delete your account?'
                    : 'Type DELETE to confirm your request.',
                style: AppTheme.headline(size: 24),
              ),
              const SizedBox(height: 10),
              Text(
                _step == 1
                    ? 'This helps us understand what went wrong and improve the experience.'
                    : 'This step prevents accidental deletion. You can still reactivate during the 7-day recovery window.',
                style: AppTheme.body(
                  size: 14,
                  color: Colors.white54,
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 24),
              if (_step == 1) ...[
                ..._reasons.map(
                  (reason) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: () => setState(() {
                        _selectedReason = reason;
                      }),
                      borderRadius: BorderRadius.circular(18),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          color: _selectedReason == reason
                              ? const Color(0x33DC2626)
                              : AppTheme.darkGrey,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: _selectedReason == reason
                                ? AppTheme.primaryColor
                                : Colors.white10,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                reason,
                                style: AppTheme.body(
                                  size: 15,
                                  color: Colors.white,
                                  weight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Icon(
                              _selectedReason == reason
                                  ? Icons.check_circle_rounded
                                  : Icons.radio_button_unchecked_rounded,
                              color: _selectedReason == reason
                                  ? AppTheme.primaryColor
                                  : Colors.white24,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _feedbackController,
                  maxLines: 5,
                  decoration: InputDecoration(
                    hintText: isOther
                        ? 'Write your reason here...'
                        : 'Additional feedback (optional)',
                  ),
                ),
              ] else ...[
                TextField(
                  controller: _confirmationController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    hintText: 'DELETE',
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.darkGrey,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Selected reason',
                        style: AppTheme.label(
                          size: 11,
                          color: AppTheme.primaryColor,
                          letterSpacing: 1.4,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _selectedReason,
                        style: AppTheme.body(
                          size: 15,
                          color: Colors.white,
                          weight: FontWeight.w700,
                        ),
                      ),
                      if (_feedbackController.text.trim().isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(
                          _feedbackController.text.trim(),
                          style: AppTheme.body(
                            size: 14,
                            color: Colors.white60,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0x33B91C1C),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0x66EF4444)),
                  ),
                  child: Text(
                    _error!,
                    style: AppTheme.body(
                      size: 13,
                      color: const Color(0xFFFCA5A5),
                      height: 1.45,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 28),
              Row(
                children: [
                  if (_step == 2) ...[
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isSubmitting
                            ? null
                            : () => setState(() {
                                  _step = 1;
                                  _error = null;
                                }),
                        child: const Text('BACK'),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: ElevatedButton(
                      onPressed:
                          _isSubmitting ? null : _step == 1 ? _goToConfirmation : _submitDeletion,
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(_step == 1 ? 'CONTINUE' : 'SCHEDULE DELETION'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
