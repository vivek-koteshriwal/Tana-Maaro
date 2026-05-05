import 'dart:io';

class MediaUploadPolicy {
  static const int maxVideoUploadBytes = 100 * 1024 * 1024;
  static const String videoUploadLimitMessage =
      'Your video exceeds the 100 MB upload limit. Please compress or reduce the file size before uploading.';

  static const Set<String> supportedImageExtensions = <String>{
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'avif',
    'heic',
  };

  static const Set<String> supportedVideoExtensions = <String>{
    'mp4',
    'mov',
    'm4v',
    'webm',
  };

  static String extensionForPath(String path) {
    final sanitizedPath = path.split('?').first;
    final dotIndex = sanitizedPath.lastIndexOf('.');
    if (dotIndex == -1 || dotIndex == sanitizedPath.length - 1) {
      return '';
    }
    return sanitizedPath.substring(dotIndex + 1).toLowerCase();
  }

  static bool isSupportedImagePath(String path) {
    return supportedImageExtensions.contains(extensionForPath(path));
  }

  static bool isSupportedVideoPath(String path) {
    return supportedVideoExtensions.contains(extensionForPath(path));
  }

  static Future<String?> validateFile(
    File file, {
    required String mediaType,
  }) async {
    final normalizedType = mediaType.trim().toLowerCase();
    if (normalizedType == 'video') {
      if (!isSupportedVideoPath(file.path)) {
        return 'Unsupported video format. Please upload MP4, MOV, M4V, or WebM.';
      }

      final fileSize = await file.length();
      if (fileSize > maxVideoUploadBytes) {
        return videoUploadLimitMessage;
      }
    }

    if (normalizedType == 'image' && !isSupportedImagePath(file.path)) {
      return 'Unsupported image format. Please upload JPG, PNG, GIF, WebP, AVIF, or HEIC.';
    }

    return null;
  }
}
