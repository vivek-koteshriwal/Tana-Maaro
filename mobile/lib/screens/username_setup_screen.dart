import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/services/auth_service.dart';
import 'dart:math';

class UsernameSetupScreen extends StatefulWidget {
  const UsernameSetupScreen({super.key});

  @override
  State<UsernameSetupScreen> createState() => _UsernameSetupScreenState();
}

class _UsernameSetupScreenState extends State<UsernameSetupScreen> {
  final _usernameController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  List<String> _suggestions = [];

  static const _adjectives = [
    'savage',
    'blazing',
    'silent',
    'wild',
    'ruthless',
    'bold',
    'phantom',
    'rogue',
    'lethal',
    'fierce',
    'shadow',
    'dark',
    'neon',
    'atomic',
    'rapid',
    'grim',
    'iron',
    'solo',
    'cosmic',
    'stealth',
  ];

  static const _nouns = [
    'roaster',
    'cobra',
    'phoenix',
    'viper',
    'wolf',
    'hawk',
    'legend',
    'warrior',
    'ghost',
    'panther',
    'titan',
    'raven',
    'storm',
    'spark',
    'blade',
    'rider',
    'fox',
    'lynx',
    'dagger',
    'torch',
  ];

  @override
  void initState() {
    super.initState();
    _generateSuggestions();
  }

  void _generateSuggestions() {
    final rng = Random();
    setState(() {
      _suggestions = List.generate(4, (_) {
        final adj = _adjectives[rng.nextInt(_adjectives.length)];
        final noun = _nouns[rng.nextInt(_nouns.length)];
        final num = rng.nextInt(90) + 10; // 10–99
        return '${adj}_${noun}_$num';
      });
    });
  }

  Future<void> _handleSetup() async {
    final username =
        _usernameController.text.trim().toLowerCase().replaceAll('@', '');
    if (username.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Username is required.')));
      return;
    }
    if (username.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Username must be at least 3 characters.')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _authService.completeUsernameSetup(username);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('$e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppTheme.primaryColor.withValues(alpha: 0.4)),
                ),
                child: const Icon(Icons.shield_outlined,
                    color: AppTheme.primaryColor, size: 48),
              ),
              const SizedBox(height: 32),

              const Text(
                'CLAIM YOUR HANDLE',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -0.5),
              ),
              const SizedBox(height: 10),
              const Text(
                'Your arena identity — anonymous by default.\nYou can change this any time.',
                textAlign: TextAlign.center,
                style:
                    TextStyle(color: Colors.white38, fontSize: 13, height: 1.5),
              ),

              const SizedBox(height: 40),

              // Input
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'YOUR USERNAME',
                    style: TextStyle(
                        color: Colors.white24,
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                        letterSpacing: 1.5),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _usernameController,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      hintText: 'e.g. savage_cobra_42',
                      hintStyle: const TextStyle(color: Colors.white10),
                      prefixText: '@  ',
                      prefixStyle: const TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.05),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(
                              color: AppTheme.primaryColor, width: 2)),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Suggestions label + refresh
              Row(
                children: [
                  const Text(
                    'SUGGESTED HANDLES',
                    style: TextStyle(
                        color: Colors.white24,
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                        letterSpacing: 1),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: _generateSuggestions,
                    icon: const Icon(Icons.refresh,
                        size: 14, color: AppTheme.primaryColor),
                    label: const Text('Regenerate',
                        style: TextStyle(
                            color: AppTheme.primaryColor, fontSize: 11)),
                    style: TextButton.styleFrom(
                        minimumSize: Size.zero, padding: EdgeInsets.zero),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _suggestions
                    .map((s) => InkWell(
                          onTap: () =>
                              setState(() => _usernameController.text = s),
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.12)),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text('@$s',
                                style: const TextStyle(
                                    color: Colors.white70, fontSize: 12)),
                          ),
                        ))
                    .toList(),
              ),

              const SizedBox(height: 48),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSetup,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('ENTER THE ARENA',
                          style: TextStyle(
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                              color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
