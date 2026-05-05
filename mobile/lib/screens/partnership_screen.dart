import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/screens/partnership_form_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

class PartnershipScreen extends StatefulWidget {
  const PartnershipScreen({super.key});

  @override
  State<PartnershipScreen> createState() => _PartnershipScreenState();
}

class _PartnershipScreenState extends State<PartnershipScreen> {
  final _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  bool _isCheckingStatus = true;
  String?
      _applicationStatus; // null = none, 'pending' / 'approved' / 'rejected'

  @override
  void initState() {
    super.initState();
    _checkApplicationStatus();
  }

  Future<void> _checkApplicationStatus() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      if (mounted) setState(() => _isCheckingStatus = false);
      return;
    }
    try {
      final snap = await _firestore
          .collection('partnerships')
          .where('userId', isEqualTo: uid)
          .limit(1)
          .get();
      if (mounted) {
        setState(() {
          _applicationStatus = snap.docs.isNotEmpty
              ? (snap.docs.first.data()['status'] as String? ?? 'pending')
              : null;
          _isCheckingStatus = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isCheckingStatus = false);
    }
  }

  Future<void> _openForm() async {
    final submitted = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (context) => const PartnershipFormScreen()),
    );
    if (submitted == true) {
      setState(() {
        _applicationStatus = 'pending';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ParentBackScope(
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 30.0),
          child: Column(
            children: [
              const Icon(Icons.handshake_outlined,
                  color: AppTheme.primaryColor, size: 64),
              const SizedBox(height: 24),
              const Text(
                'TANA MAARO PARTNERS',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -1),
              ),
              const SizedBox(height: 8),
              const Text(
                'Join India\'s most savage comedy ecosystem. Let\'s build chaos together.',
                textAlign: TextAlign.center,
                style:
                    TextStyle(color: Colors.white54, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 48),
              _buildSectionHeader('EVENT PARTNERSHIPS'),
              _buildPartnerCard(
                title: 'VENUE COLLABORATIONS',
                description:
                    'Host Tana Maaro live battles at your club, cafe, or auditorium. We bring the crowd, you provide the arena.',
                icon: Icons.location_on_outlined,
              ),
              const SizedBox(height: 16),
              _buildPartnerCard(
                title: 'COLLEGE FESTS',
                description:
                    'Bring the Roast Arena to your campus. Dedicated college vs college showdowns with live voting.',
                icon: Icons.school_outlined,
              ),
              const SizedBox(height: 40),
              _buildSectionHeader('BRAND COLLABORATIONS'),
              _buildPartnerCard(
                title: 'DIGITAL & ON-STAGE',
                description:
                    'Access 2.5M+ monthly impressions through organic brand placements in our viral roast clips.',
                icon: Icons.trending_up_outlined,
              ),
              const SizedBox(height: 16),
              _buildPartnerCard(
                title: 'INFLUENCER CONNECT',
                description:
                    'Partner with our top roasters and creators for authentic, savage brand endorsements.',
                icon: Icons.people_outline,
              ),
              const SizedBox(height: 60),
              if (_isCheckingStatus)
                const CircularProgressIndicator(color: AppTheme.primaryColor)
              else if (_applicationStatus != null)
                _buildStatusBanner(_applicationStatus!)
              else
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _openForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                      elevation: 8,
                      shadowColor: AppTheme.primaryColor.withValues(alpha: 0.3),
                    ),
                    child: const Text(
                      'APPLY FOR PARTNERSHIP',
                      style: TextStyle(
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          fontSize: 15,
                          letterSpacing: 1),
                    ),
                  ),
                ),
              const SizedBox(height: 50),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBanner(String status) {
    final isApproved = status == 'approved';
    final isRejected = status == 'rejected';
    final color = isApproved
        ? Colors.green[700]!
        : isRejected
            ? Colors.red[800]!
            : Colors.orange[800]!;
    final icon = isApproved
        ? Icons.check_circle_outline
        : isRejected
            ? Icons.cancel_outlined
            : Icons.hourglass_top_rounded;
    final label = isApproved
        ? 'PARTNERSHIP APPROVED'
        : isRejected
            ? 'APPLICATION DECLINED'
            : 'APPLICATION UNDER REVIEW';
    final sub = isApproved
        ? 'Congratulations! Our team will reach out to you soon.'
        : isRejected
            ? 'Thank you for your interest. This application was not selected.'
            : 'We\'ve received your application. Our team will review it and contact you shortly.';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 36),
          const SizedBox(height: 12),
          Text(label,
              style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  letterSpacing: 1)),
          const SizedBox(height: 8),
          Text(sub,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: Colors.white54, fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Container(width: 4, height: 16, color: AppTheme.primaryColor),
          const SizedBox(width: 12),
          Text(title,
              style: const TextStyle(
                  color: Colors.white24,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 1.5)),
        ],
      ),
    );
  }

  Widget _buildPartnerCard(
      {required String title,
      required String description,
      required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.darkGrey,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: AppTheme.primaryColor, size: 24),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        color: Colors.white,
                        letterSpacing: -0.5)),
                const SizedBox(height: 8),
                Text(description,
                    style: const TextStyle(
                        color: Colors.white54, fontSize: 13, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
