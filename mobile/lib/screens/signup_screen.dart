import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/screens/privacy_policy_screen.dart';
import 'package:tanamaaro_mobile/services/auth_service.dart';
import 'package:intl/intl.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  DateTime? _selectedDob;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _agreedToGuidelines = false;

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primaryColor,
              onPrimary: Colors.white,
              surface: AppTheme.darkGrey,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDob) {
      setState(() => _selectedDob = picked);
    }
  }

  bool _is18Plus(DateTime dob) {
    final today = DateTime.now();
    int age = today.year - dob.year;
    if (today.month < dob.month ||
        (today.month == dob.month && today.day < dob.day)) {
      age--;
    }
    return age >= 18;
  }

  Future<void> _handleSignUp() async {
    if (!_formKey.currentState!.validate() || _selectedDob == null) {
      if (_selectedDob == null)
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Date of Birth is required.')));
      return;
    }

    if (!_is18Plus(_selectedDob!)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Access Denied: You must be at least 18 years old to join Tana Maaro.'),
          backgroundColor: Colors.red));
      return;
    }

    if (!_agreedToGuidelines) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Please accept the Community Guidelines to continue.'),
          backgroundColor: Colors.red));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _authService.signUp(
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        password: _passwordController.text.trim(),
        dob: _selectedDob!,
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Sign up failed: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('CREATE ROASTER ACCOUNT',
            style: TextStyle(
                letterSpacing: 1.5, fontSize: 13, fontWeight: FontWeight.w900)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('JOIN THE ROSTER',
                  style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: Colors.white)),
              const SizedBox(height: 8),
              const Text(
                  'Create your account first. You will claim your public handle right after this.',
                  style: TextStyle(
                      color: Colors.white54, fontSize: 14, height: 1.5)),
              const SizedBox(height: 40),
              _buildDobField(),
              const SizedBox(height: 20),
              _buildTextField(_emailController, 'EMAIL ADDRESS',
                  'you@email.com', Icons.mail_outline,
                  isEmail: true),
              const SizedBox(height: 20),
              _buildTextField(_phoneController, 'PHONE NUMBER', '9876543210',
                  Icons.phone_android,
                  isPhone: true),
              const SizedBox(height: 20),
              _buildTextField(_passwordController, 'PASSWORD', '••••••••',
                  Icons.lock_outline,
                  isPassword: true,
                  obscureText: _obscurePassword,
                  onToggleVisibility: () =>
                      setState(() => _obscurePassword = !_obscurePassword)),
              const SizedBox(height: 32),
              _GuidelinesCheckbox(
                agreed: _agreedToGuidelines,
                onChanged: (v) => setState(() => _agreedToGuidelines = v),
                onViewGuidelines: () => _showGuidelines(context),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSignUp,
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
                      : const Text('CREATE ACCOUNT',
                          style: TextStyle(
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                              color: Colors.white)),
                ),
              ),
              const SizedBox(height: 14),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const PrivacyPolicyScreen(),
                    ),
                  ),
                  child: const Text(
                    'READ PRIVACY POLICY',
                    style: TextStyle(
                      color: Colors.white38,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label,
      String hint, IconData icon,
      {bool isEmail = false,
      bool isPhone = false,
      bool isPassword = false,
      bool obscureText = false,
      String? prefix,
      VoidCallback? onToggleVisibility}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Colors.white24,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1.5)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white10),
            prefixIcon: Icon(icon, color: Colors.white24, size: 20),
            prefixText: prefix,
            prefixStyle: const TextStyle(
                color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                        obscureText ? Icons.visibility_off : Icons.visibility,
                        color: Colors.white24,
                        size: 20),
                    onPressed: onToggleVisibility)
                : null,
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
            if (value == null || value.trim().isEmpty) return 'Required';
            if (isEmail && !value.contains('@')) return 'Invalid email';
            if (isPhone && (value.length < 10)) return 'Invalid phone';
            if (isPassword && value.length < 6) return 'Min 6 characters';
            return null;
          },
        ),
      ],
    );
  }

  void _showGuidelines(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const _GuidelinesSheet(),
    );
  }

  Widget _buildDobField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('DATE OF BIRTH',
            style: TextStyle(
                color: Colors.white24,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1.5)),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _selectDate(context),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12)),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined,
                    color: Colors.white24, size: 20),
                const SizedBox(width: 12),
                Text(
                  _selectedDob == null
                      ? 'Select Date'
                      : DateFormat('yyyy-MM-dd').format(_selectedDob!),
                  style: TextStyle(
                      color:
                          _selectedDob == null ? Colors.white10 : Colors.white,
                      fontSize: 15),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guidelines checkbox row
// ─────────────────────────────────────────────────────────────────────────────

class _GuidelinesCheckbox extends StatelessWidget {
  final bool agreed;
  final ValueChanged<bool> onChanged;
  final VoidCallback onViewGuidelines;

  const _GuidelinesCheckbox({
    required this.agreed,
    required this.onChanged,
    required this.onViewGuidelines,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: agreed,
            onChanged: (v) => onChanged(v ?? false),
            activeColor: AppTheme.primaryColor,
            side: const BorderSide(color: Colors.white38, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GestureDetector(
            onTap: () => onChanged(!agreed),
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 13,
                  height: 1.5,
                ),
                children: [
                  const TextSpan(text: 'I agree to the '),
                  WidgetSpan(
                    child: GestureDetector(
                      onTap: onViewGuidelines,
                      child: const Text(
                        'Community Guidelines',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          decoration: TextDecoration.underline,
                          decorationColor: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                  ),
                  const TextSpan(
                    text:
                        '. Roasting must be fun and respectful — no hate speech, no threats.',
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Community Guidelines bottom sheet
// ─────────────────────────────────────────────────────────────────────────────

class _GuidelinesSheet extends StatelessWidget {
  const _GuidelinesSheet();

  static const _guidelines = [
    (
      icon: Icons.local_fire_department_rounded,
      title: 'Keep It Fun',
      body:
          'Roasting is about wit and humour. Keep it playful — if it stops being fun, you\'ve gone too far.',
    ),
    (
      icon: Icons.block_rounded,
      title: 'No Hate Speech',
      body:
          'Content targeting race, religion, gender, sexuality, disability, or ethnicity is strictly banned.',
    ),
    (
      icon: Icons.gavel_rounded,
      title: 'No Threats or Violence',
      body:
          'Any posts containing threats, calls to violence, or content that endangers others will be removed immediately.',
    ),
    (
      icon: Icons.privacy_tip_outlined,
      title: 'Respect Privacy',
      body:
          'Don\'t share someone\'s personal information, private photos, or contact details without consent.',
    ),
    (
      icon: Icons.campaign_rounded,
      title: 'No Spam or Scams',
      body:
          'Spam, phishing links, fake accounts, and deceptive promotions are not allowed.',
    ),
    (
      icon: Icons.handshake_outlined,
      title: 'Punch Up, Not Down',
      body:
          'Roast ideas, opinions, and public personas — not people in vulnerable situations.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.82,
        ),
        decoration: const BoxDecoration(
          color: Color(0xFF0D0D0D),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(top: 14, bottom: 6),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
              child: Row(
                children: [
                  const Text(
                    '📜  COMMUNITY GUIDELINES',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close,
                        color: Colors.white38, size: 20),
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Text(
                'Tana Maaro is a roast arena — not a hate platform. '
                'These rules keep the arena alive.',
                style:
                    TextStyle(color: Colors.white38, fontSize: 12, height: 1.5),
              ),
            ),
            const Divider(color: Colors.white10, height: 1),
            Flexible(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                shrinkWrap: true,
                itemCount: _guidelines.length,
                separatorBuilder: (_, __) =>
                    const Divider(color: Colors.white10, height: 24),
                itemBuilder: (context, i) {
                  final g = _guidelines[i];
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(g.icon,
                            color: AppTheme.primaryColor, size: 18),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              g.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              g.body,
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 12,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
