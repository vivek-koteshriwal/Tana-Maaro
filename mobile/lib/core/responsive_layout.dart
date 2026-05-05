import 'package:flutter/material.dart';

class ResponsiveLayout {
  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= 700;

  static bool isCompact(BuildContext context) =>
      MediaQuery.sizeOf(context).width < 360;

  static bool isLandscape(BuildContext context) =>
      MediaQuery.orientationOf(context) == Orientation.landscape;

  static double scaledFontSize(
    BuildContext context, {
    required double base,
    double minScale = 0.88,
    double maxScale = 1.18,
  }) {
    final shortestSide = MediaQuery.sizeOf(context).shortestSide;
    final scale = (shortestSide / 390).clamp(minScale, maxScale);
    return base * scale;
  }

  static double contentMaxWidth(
    BuildContext context, {
    double phoneMaxWidth = double.infinity,
    double tabletMaxWidth = 820,
    double desktopMaxWidth = 960,
  }) {
    final width = MediaQuery.sizeOf(context).width;
    if (width >= 1100) {
      return desktopMaxWidth;
    }
    if (width >= 700) {
      return tabletMaxWidth;
    }
    return phoneMaxWidth;
  }

  static EdgeInsets screenPadding(
    BuildContext context, {
    double compact = 12,
    double phone = 16,
    double tablet = 24,
  }) {
    final width = MediaQuery.sizeOf(context).width;
    final horizontal = width >= 700
        ? tablet
        : width < 360
            ? compact
            : phone;
    return EdgeInsets.symmetric(horizontal: horizontal);
  }
}

class ResponsiveContent extends StatelessWidget {
  final Widget child;
  final double? maxWidth;

  const ResponsiveContent({
    super.key,
    required this.child,
    this.maxWidth,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: maxWidth ?? ResponsiveLayout.contentMaxWidth(context),
        ),
        child: child,
      ),
    );
  }

  static int adaptiveColumns(
    BuildContext context, {
    required double minTileWidth,
    int minCount = 1,
    int maxCount = 4,
    double spacing = 12,
  }) {
    final width = ResponsiveLayout.contentMaxWidth(context);
    final effectiveWidth =
        width.isFinite ? width : MediaQuery.sizeOf(context).width;
    final columns =
        ((effectiveWidth + spacing) / (minTileWidth + spacing)).floor();
    return columns.clamp(minCount, maxCount);
  }
}
