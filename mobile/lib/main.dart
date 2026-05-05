import 'dart:ui' show PointerDeviceKind;

import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanamaaro_mobile/screens/login_screen.dart';
import 'package:tanamaaro_mobile/services/auth_service.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/widgets/auth_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  runApp(
    ProviderScope(
      child: const TanaMaaroApp(),
    ),
  );
}

class TanaMaaroApp extends ConsumerWidget {
  const TanaMaaroApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateChangesProvider);

    return MaterialApp(
      title: 'Tana Maaro',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      scrollBehavior: const _TanaScrollBehavior(),
      navigatorKey: DeepLinkService.navigatorKey,
      home: authState.when(
        data: (user) {
          return DeepLinkBootstrapper(
            child: user != null ? const AuthWrapper() : const LoginScreen(),
          );
        },
        loading: () => const Scaffold(
          body: Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor)),
        ),
        error: (err, stack) => Scaffold(
          body: Center(
              child: Text('Error: $err',
                  style: const TextStyle(color: Colors.white))),
        ),
      ),
    );
  }
}

class _TanaScrollBehavior extends MaterialScrollBehavior {
  const _TanaScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => const {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.trackpad,
        PointerDeviceKind.stylus,
        PointerDeviceKind.unknown,
      };

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const ClampingScrollPhysics();
  }
}
