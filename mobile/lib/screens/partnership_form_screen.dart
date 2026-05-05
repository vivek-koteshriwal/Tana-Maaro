import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

class PartnershipFormScreen extends StatefulWidget {
  const PartnershipFormScreen({super.key});

  @override
  State<PartnershipFormScreen> createState() => _PartnershipFormScreenState();
}

class _PartnershipFormScreenState extends State<PartnershipFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _companyController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Pre-fill email from Firebase Auth if available
    final user = FirebaseAuth.instance.currentUser;
    if (user?.email != null) {
      _emailController.text = user!.email!;
    }
    if (user?.displayName != null) {
      _nameController.text = user!.displayName!;
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      await _firestore.collection('partnerships').add({
        'name': _nameController.text.trim(),
        'company': _companyController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'message': _messageController.text.trim(),
        'timestamp': FieldValue.serverTimestamp(),
        'status': 'pending',
        'userId': uid,
      });

      if (mounted) {
        _showSuccessDialog();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed to submit application: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.darkGrey,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('APPLICATION SUBMITTED!',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
        content: const Text(
          'Your partnership application has been received. Our team will review it and get back to you shortly.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(
                  context, true); // Return true → triggers status refresh
            },
            child: const Text('DONE',
                style: TextStyle(
                    color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
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
            'APPLY FOR PARTNERSHIP',
            style: TextStyle(
              letterSpacing: 1.5,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          centerTitle: true,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'PARTNER WITH CHAOS',
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Colors.white),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Are you a brand that isn\'t afraid to get roasted? Let\'s build something legendary.',
                  style: TextStyle(color: Colors.white54, fontSize: 14),
                ),
                const SizedBox(height: 32),
                _buildLabel('FULL NAME'),
                _buildTextField(_nameController, 'Savage Person',
                    required: true),
                const SizedBox(height: 20),
                _buildLabel('COMPANY / BRAND'),
                _buildTextField(_companyController, 'The Cool Brand'),
                const SizedBox(height: 20),
                _buildLabel('EMAIL ADDRESS'),
                _buildTextField(_emailController, 'partner@chaos.com',
                    required: true, isEmail: true),
                const SizedBox(height: 20),
                _buildLabel('PHONE NUMBER'),
                _buildTextField(_phoneController, '+91-00000-00000'),
                const SizedBox(height: 20),
                _buildLabel('YOUR VISION / MESSAGE'),
                _buildTextField(
                    _messageController, 'Tell us how we can collab...',
                    maxLines: 4, required: true),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('INITIALIZE PARTNERSHIP',
                            style: TextStyle(
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                                color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: const TextStyle(
            color: Colors.white24,
            fontWeight: FontWeight.w900,
            fontSize: 11,
            letterSpacing: 1.5),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint,
      {bool required = false, bool isEmail = false, int maxLines = 1}) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white10),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide:
                const BorderSide(color: AppTheme.primaryColor, width: 1)),
      ),
      validator: (value) {
        if (required && (value == null || value.trim().isEmpty))
          return 'This field is required';
        if (isEmail && value != null && !value.contains('@'))
          return 'Please enter a valid email';
        return null;
      },
    );
  }
}
