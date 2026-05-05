import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/screens/battle_room_screen.dart';
import 'package:tanamaaro_mobile/services/battle_service.dart';

class BattleArenaScreen extends StatelessWidget {
  final String battleId;

  const BattleArenaScreen({
    super.key,
    required this.battleId,
  });

  @override
  Widget build(BuildContext context) {
    final battleService = BattleService();

    return FutureBuilder<BattleModel?>(
      future: battleService.getBattleById(battleId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: Colors.black,
            body: Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor),
            ),
          );
        }

        final battle = snapshot.data;
        if (battle == null) {
          return ParentBackScope(
            child: Scaffold(
              backgroundColor: Colors.black,
              appBar: AppBar(
                backgroundColor: Colors.black,
                leading: IconButton(
                  onPressed: () => navigateToParentRoute(context),
                  icon: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),
              body: Center(
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.bolt_outlined,
                        color: Colors.white24,
                        size: 44,
                      ),
                      const SizedBox(height: 18),
                      const Text(
                        'THIS ARENA IS NO LONGER LIVE',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Go back to the category library and jump into the current arena.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white38,
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 22),
                      ElevatedButton(
                        onPressed: () => navigateToParentRoute(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text(
                          'GO BACK',
                          style: TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        return BattleRoomScreen(battle: battle);
      },
    );
  }
}
