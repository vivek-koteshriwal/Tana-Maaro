import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Savage Red Palette - Web Parity
  static const Color primaryColor = Color(0xFFDC2626); // Savage Red (red-600)
  static const Color accentColor = Color(0xFF991B1B); // Deep Red (red-800)
  static const Color darkGrey = Color(0xFF171717); // Neutral-900
  static const Color surfaceColor = Color(0xFF0A0A0A); // True Chaos Black

  static TextStyle headline({
    required double size,
    Color color = Colors.white,
    FontWeight weight = FontWeight.w900,
    double letterSpacing = -0.4,
    double? height,
  }) {
    return GoogleFonts.epilogue(
      color: color,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  static TextStyle body({
    required double size,
    Color color = Colors.white,
    FontWeight weight = FontWeight.w600,
    double letterSpacing = 0,
    double? height,
  }) {
    return GoogleFonts.manrope(
      color: color,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  static TextStyle label({
    required double size,
    Color color = Colors.white,
    FontWeight weight = FontWeight.w800,
    double letterSpacing = 1,
    double? height,
  }) {
    return GoogleFonts.manrope(
      color: color,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  static ThemeData get darkTheme {
    final base = ThemeData.dark(useMaterial3: false);
    final bodyTextTheme = GoogleFonts.manropeTextTheme(base.textTheme).apply(
      bodyColor: Colors.white,
      displayColor: Colors.white,
    );

    return base.copyWith(
      brightness: Brightness.dark,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: Colors.black,
      cardColor: darkGrey,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.black,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: headline(
          size: 18,
          letterSpacing: -0.6,
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceColor,
        onSurface: Colors.white,
        onPrimary: Colors.white,
      ),
      textTheme: bodyTextTheme.copyWith(
        headlineLarge: headline(
          size: 32,
          color: primaryColor,
          letterSpacing: -1,
        ),
        headlineMedium: headline(
          size: 24,
          letterSpacing: -0.6,
        ),
        titleLarge: headline(
          size: 18,
          weight: FontWeight.w800,
          letterSpacing: -0.3,
        ),
        bodyLarge: body(
          size: 16,
          color: Colors.white70,
          height: 1.5,
        ),
        bodyMedium: body(
          size: 14,
          color: Colors.white60,
          height: 1.45,
        ),
        labelLarge: label(
          size: 12,
          letterSpacing: 1.1,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          textStyle: label(
            size: 14,
            weight: FontWeight.w900,
            letterSpacing: 1,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor, width: 2),
          textStyle: label(
            size: 13,
            weight: FontWeight.w900,
            letterSpacing: 1,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkGrey,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        hintStyle: body(
          size: 14,
          color: Colors.white24,
        ),
      ),
    );
  }
}
