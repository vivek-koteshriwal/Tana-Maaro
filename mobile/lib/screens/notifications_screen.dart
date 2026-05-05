import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/screens/post_detail_screen.dart';
import 'package:tanamaaro_mobile/services/notification_service.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';
import 'package:timeago/timeago.dart' as timeago;

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notificationService = NotificationService();
    final postService = PostService();

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
            'NOTIFICATIONS',
            style: TextStyle(
              letterSpacing: 2,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          centerTitle: true,
          actions: [
            TextButton(
              onPressed: () => notificationService.markAllAsRead(),
              child: const Text(
                'Mark Read',
                style: TextStyle(color: AppTheme.primaryColor, fontSize: 12),
              ),
            ),
          ],
        ),
        body: StreamBuilder<List<NotificationModel>>(
          stream: notificationService.getNotifications(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                  child:
                      CircularProgressIndicator(color: AppTheme.primaryColor));
            }

            final notifications = snapshot.data ?? [];

            if (notifications.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.notifications_off_outlined,
                        size: 48, color: Colors.white10),
                    SizedBox(height: 16),
                    Text('No updates yet. Stay savage!',
                        style: TextStyle(color: Colors.white24)),
                  ],
                ),
              );
            }

            return ListView.separated(
              itemCount: notifications.length,
              separatorBuilder: (context, index) =>
                  const Divider(color: Colors.white10, height: 1, indent: 70),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return _buildNotificationTile(
                  context,
                  notification,
                  notificationService,
                  postService,
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildNotificationTile(
    BuildContext context,
    NotificationModel notification,
    NotificationService service,
    PostService postService,
  ) {
    return ListTile(
      onTap: () async {
        await service.markAsRead(notification.id);
        if (notification.postId.isEmpty) return;

        final post = await postService.getPostById(notification.postId);
        if (!context.mounted) return;

        if (post == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('This roast is no longer available.'),
              backgroundColor: Color(0xFF1A1A1A),
            ),
          );
          return;
        }

        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => PostDetailScreen(post: post)),
        );
      },
      tileColor: notification.read
          ? Colors.transparent
          : AppTheme.primaryColor.withValues(alpha: 0.05),
      leading: RoastAvatar(
        avatarId: notification.actorAvatar,
        radius: 20,
        fallbackSeed: notification.actorName,
      ),
      title: RichText(
        text: TextSpan(
          style: const TextStyle(color: Colors.white, fontSize: 14),
          children: [
            TextSpan(
                text: notification.actorName,
                style: const TextStyle(fontWeight: FontWeight.bold)),
            TextSpan(text: ' ${notification.message}'),
          ],
        ),
      ),
      subtitle: Text(
        timeago.format(notification.timestamp),
        style:
            TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 11),
      ),
      trailing: notification.read
          ? null
          : Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                  color: AppTheme.primaryColor, shape: BoxShape.circle)),
    );
  }
}
