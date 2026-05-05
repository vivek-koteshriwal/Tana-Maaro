import 'package:flutter/material.dart';

void navigateToParentRoute(BuildContext context) {
  final navigator = Navigator.of(context);
  if (navigator.canPop()) {
    navigator.pop();
  }
}

Future<void> handleParentBack(BuildContext context) async {
  navigateToParentRoute(context);
}

class ParentBackScope extends StatelessWidget {
  const ParentBackScope({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return PopScope<void>(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          return;
        }
        handleParentBack(context);
      },
      child: child,
    );
  }
}
