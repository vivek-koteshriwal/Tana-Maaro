import 'dart:io';
import 'dart:ui';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:tanamaaro_mobile/controllers/roast_wall_controller.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/media_upload_policy.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/models/user_model.dart';
import 'package:tanamaaro_mobile/services/post_service.dart';
import 'package:tanamaaro_mobile/services/user_service.dart';
import 'package:tanamaaro_mobile/widgets/landing_feed_card.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final TextEditingController _contentController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final PostService _postService = PostService();
  final ImagePicker _picker = ImagePicker();

  File? _selectedMedia;
  String? _selectedMediaType;
  bool _isUploading = false;
  bool _isRecording = false;
  bool _isAnonymous = false;
  bool _showUtilityTray = false;

  int get _characterCount => _contentController.text.length;
  bool get _isOverLimit => _characterCount > PostService.maxPostLength;
  bool get _canSubmit =>
      !_isUploading &&
      !_isOverLimit &&
      (_contentController.text.trim().isNotEmpty || _selectedMedia != null);

  @override
  void initState() {
    super.initState();
    _contentController.addListener(_handleDraftChanged);
    _focusNode.addListener(_handleDraftChanged);
  }

  @override
  void dispose() {
    _contentController
      ..removeListener(_handleDraftChanged)
      ..dispose();
    _focusNode
      ..removeListener(_handleDraftChanged)
      ..dispose();
    super.dispose();
  }

  void _handleDraftChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 82,
    );
    if (pickedFile == null) {
      return;
    }

    final file = File(pickedFile.path);
    final validationError = await MediaUploadPolicy.validateFile(
      file,
      mediaType: 'image',
    );
    if (validationError != null) {
      _showMessage(validationError);
      return;
    }

    setState(() {
      _selectedMedia = file;
      _selectedMediaType = 'image';
    });
  }

  Future<void> _pickVideo() async {
    final pickedFile = await _picker.pickVideo(source: ImageSource.gallery);
    if (pickedFile == null) {
      return;
    }

    final file = File(pickedFile.path);
    final validationError = await MediaUploadPolicy.validateFile(
      file,
      mediaType: 'video',
    );
    if (validationError != null) {
      _showMessage(validationError);
      return;
    }

    setState(() {
      _selectedMedia = file;
      _selectedMediaType = 'video';
    });
  }

  void _clearSelectedMedia() {
    setState(() {
      _selectedMedia = null;
      _selectedMediaType = null;
    });
  }

  void _toggleMic() {
    setState(() {
      _isRecording = !_isRecording;
    });

    if (!_isRecording) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Recording voice roast...',
          style: GoogleFonts.manrope(fontWeight: FontWeight.w700),
        ),
        backgroundColor: landingSurface,
      ),
    );

    Future<void>.delayed(const Duration(seconds: 2), () {
      if (!mounted || !_isRecording) {
        return;
      }
      setState(() {
        _contentController.text += ' [🎤 Voice Note Attached] ';
        _isRecording = false;
      });
    });
  }

  Future<void> _submitPost() async {
    if (_isOverLimit) {
      _showMessage(
        'Roast must stay within ${PostService.maxPostLength} characters.',
      );
      return;
    }

    if (!_canSubmit) {
      return;
    }

    setState(() => _isUploading = true);

    try {
      final createdPost = await _postService.createPost(
        _contentController.text,
        _selectedMedia,
        mediaType: _selectedMediaType,
        anonymous: _isAnonymous,
      );
      ref
          .read(roastWallControllerProvider.notifier)
          .insertCreatedPost(createdPost);
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showMessage(
        error is StateError ? error.message : 'Could not create roast.',
      );
      setState(() => _isUploading = false);
      return;
    }

    if (mounted) {
      setState(() => _isUploading = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: landingSurface,
        content: Text(
          message,
          style: GoogleFonts.manrope(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;
    final safeBottom = MediaQuery.viewPaddingOf(context).bottom;
    final footerBottomInset =
        keyboardInset > 0 ? keyboardInset + 8.0 : safeBottom + 12.0;
    final toolbarStackHeight = _showUtilityTray ? 132.0 : 78.0;
    final scrollBottomPadding = keyboardInset > 0
        ? toolbarStackHeight + keyboardInset + 24
        : toolbarStackHeight + safeBottom + 36;
    final currentUserId = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      landingPrimary.withValues(alpha: 0.04),
                      Colors.black,
                      Colors.black,
                    ],
                    stops: const [0, 0.16, 1],
                  ),
                ),
              ),
            ),
            ResponsiveContent(
              maxWidth: 620,
              child: Column(
                children: [
                  _ComposerHeader(
                    canSubmit: _canSubmit,
                    isUploading: _isUploading,
                    onClose: () => Navigator.pop(context),
                    onSubmit: _submitPost,
                  ),
                  Expanded(
                    child: ListView(
                      keyboardDismissBehavior:
                          ScrollViewKeyboardDismissBehavior.onDrag,
                      padding: EdgeInsets.fromLTRB(
                        18,
                        18,
                        18,
                        scrollBottomPadding,
                      ),
                      children: [
                        if (currentUserId != null)
                          StreamBuilder<UserModel?>(
                            stream: ref
                                .watch(userServiceProvider)
                                .getUserData(currentUserId),
                            builder: (context, snapshot) {
                              return _IdentityRow(
                                userId: currentUserId,
                                user: snapshot.data,
                                isAnonymous: _isAnonymous,
                              );
                            },
                          )
                        else
                          const _IdentityRow(
                            userId: 'guest',
                            user: null,
                            isAnonymous: false,
                          ),
                        const SizedBox(height: 18),
                        _ComposerCard(
                          controller: _contentController,
                          focusNode: _focusNode,
                          selectedMedia: _selectedMedia,
                          selectedMediaType: _selectedMediaType,
                          onRemoveMedia: _clearSelectedMedia,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            AnimatedPositioned(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              left: 0,
              right: 0,
              bottom: footerBottomInset,
              child: ResponsiveContent(
                maxWidth: 620,
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                    18,
                    0,
                    18,
                    0,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: _showUtilityTray
                            ? Padding(
                                key: const ValueKey('utility-open'),
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _UtilityTray(
                                  isRecording: _isRecording,
                                  isAnonymous: _isAnonymous,
                                  hasMedia: _selectedMedia != null,
                                  onVoiceTap: _toggleMic,
                                  onAnonymousTap: () => setState(
                                    () => _isAnonymous = !_isAnonymous,
                                  ),
                                  onRemoveMedia: _selectedMedia == null
                                      ? null
                                      : _clearSelectedMedia,
                                ),
                              )
                            : const SizedBox.shrink(
                                key: ValueKey('utility-closed'),
                              ),
                      ),
                      _BottomMediaBar(
                        expanded: _showUtilityTray,
                        onPickImage: _pickImage,
                        onPickVideo: _pickVideo,
                        onToggleExpand: () => setState(
                          () => _showUtilityTray = !_showUtilityTray,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ComposerHeader extends StatelessWidget {
  const _ComposerHeader({
    required this.canSubmit,
    required this.isUploading,
    required this.onClose,
    required this.onSubmit,
  });

  final bool canSubmit;
  final bool isUploading;
  final VoidCallback onClose;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: Row(
        children: [
          IconButton(
            onPressed: onClose,
            splashRadius: 20,
            icon: const Icon(
              Icons.close_rounded,
              color: landingMuted,
              size: 30,
            ),
          ),
          Expanded(
            child: Text(
              'CREATE SAVAGE ROAST',
              overflow: TextOverflow.ellipsis,
              style: AppTheme.headline(
                color: Colors.white,
                size: 16,
                weight: FontWeight.w900,
                letterSpacing: -0.7,
              ),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              boxShadow: canSubmit
                  ? [
                      BoxShadow(
                        color: landingPrimary.withValues(alpha: 0.38),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ]
                  : null,
            ),
            child: ElevatedButton(
              onPressed: canSubmit && !isUploading ? onSubmit : null,
              style: ElevatedButton.styleFrom(
                elevation: 0,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                backgroundColor:
                    canSubmit ? landingPrimary : landingSurfaceHigh,
                disabledBackgroundColor: landingSurfaceHigh,
                foregroundColor: Colors.white,
                disabledForegroundColor: Colors.white38,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              child: isUploading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'POST',
                      style: AppTheme.label(
                        size: 13,
                        weight: FontWeight.w800,
                        letterSpacing: 1.8,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IdentityRow extends StatelessWidget {
  const _IdentityRow({
    required this.userId,
    required this.user,
    required this.isAnonymous,
  });

  final String userId;
  final UserModel? user;
  final bool isAnonymous;

  @override
  Widget build(BuildContext context) {
    final handle =
        isAnonymous ? '@ANONYMOUS' : (user?.publicHandle ?? '@ROASTER');

    return Row(
      children: [
        Container(
          width: 50,
          height: 50,
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: landingPrimary, width: 2),
          ),
          child: RoastAvatar(
            avatarId: isAnonymous ? '' : (user?.profileImage ?? ''),
            radius: 22,
            isAnonymous: isAnonymous,
            fallbackSeed: userId,
            showAccentChip: false,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            handle,
            overflow: TextOverflow.ellipsis,
            style: AppTheme.label(
              color: landingPrimary,
              size: 14,
              weight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
        ),
      ],
    );
  }
}

class _ComposerCard extends StatelessWidget {
  const _ComposerCard({
    required this.controller,
    required this.focusNode,
    required this.selectedMedia,
    required this.selectedMediaType,
    required this.onRemoveMedia,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final File? selectedMedia;
  final String? selectedMediaType;
  final VoidCallback onRemoveMedia;

  @override
  Widget build(BuildContext context) {
    final isFocused = focusNode.hasFocus;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: const Color(0xFF111111),
        border: Border.all(
          color: isFocused
              ? landingPrimary.withValues(alpha: 0.48)
              : Colors.white.withValues(alpha: 0.08),
          width: isFocused ? 1.2 : 1.0,
        ),
        boxShadow: isFocused
            ? [
                BoxShadow(
                  color: landingPrimary.withValues(alpha: 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        children: [
          ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: selectedMedia == null ? 120 : 104,
              maxHeight: ResponsiveLayout.isTablet(context) ? 260 : 220,
            ),
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              autofocus: true,
              maxLength: PostService.maxPostLength,
              maxLengthEnforcement: MaxLengthEnforcement.enforced,
              minLines: 4,
              maxLines: null,
              scrollPhysics: const ClampingScrollPhysics(),
              textAlignVertical: TextAlignVertical.top,
              cursorColor: landingPrimary,
              style: AppTheme.headline(
                color: Colors.white,
                size: 17,
                weight: FontWeight.w800,
                height: 1.32,
                letterSpacing: -0.2,
              ),
              decoration: InputDecoration(
                isDense: true,
                filled: false,
                fillColor: Colors.transparent,
                contentPadding: EdgeInsets.zero,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                disabledBorder: InputBorder.none,
                counterText: '',
                hintText: "What's annoying you today?",
                hintStyle: AppTheme.headline(
                  color: Colors.white.withValues(alpha: 0.20),
                  size: 17,
                  weight: FontWeight.w800,
                  height: 1.32,
                  letterSpacing: -0.2,
                ),
              ),
            ),
          ),
          if (selectedMedia != null) ...[
            const SizedBox(height: 12),
            _SelectedMediaPreview(
              file: selectedMedia!,
              mediaType: selectedMediaType ?? 'image',
              onRemove: onRemoveMedia,
            ),
          ],
        ],
      ),
    );
  }
}

class _BottomMediaBar extends StatelessWidget {
  const _BottomMediaBar({
    required this.expanded,
    required this.onPickImage,
    required this.onPickVideo,
    required this.onToggleExpand,
  });

  final bool expanded;
  final VoidCallback onPickImage;
  final VoidCallback onPickVideo;
  final VoidCallback onToggleExpand;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: BoxDecoration(
            color: const Color(0xFF262626).withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: Row(
            children: [
              _MediaActionButton(
                icon: Icons.image_rounded,
                onTap: onPickImage,
              ),
              const SizedBox(width: 8),
              _MediaActionButton(
                icon: Icons.videocam_rounded,
                onTap: onPickVideo,
              ),
              Container(
                width: 1,
                height: 30,
                margin: const EdgeInsets.symmetric(horizontal: 12),
                color: Colors.white.withValues(alpha: 0.12),
              ),
              const Spacer(),
              IconButton(
                onPressed: onToggleExpand,
                splashRadius: 18,
                icon: Icon(
                  expanded
                      ? Icons.expand_more_rounded
                      : Icons.expand_less_rounded,
                  color: landingPrimary,
                  size: 24,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MediaActionButton extends StatelessWidget {
  const _MediaActionButton({
    required this.icon,
    required this.onTap,
  });

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: const Color(0xFF111111),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(
            icon,
            color: Colors.white,
            size: 20,
          ),
        ),
      ),
    );
  }
}

class _UtilityTray extends StatelessWidget {
  const _UtilityTray({
    required this.isRecording,
    required this.isAnonymous,
    required this.hasMedia,
    required this.onVoiceTap,
    required this.onAnonymousTap,
    this.onRemoveMedia,
  });

  final bool isRecording;
  final bool isAnonymous;
  final bool hasMedia;
  final VoidCallback onVoiceTap;
  final VoidCallback onAnonymousTap;
  final VoidCallback? onRemoveMedia;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: landingSurface.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Row(
            children: [
              Expanded(
                child: _UtilityChip(
                  active: isRecording,
                  icon: Icons.mic_rounded,
                  label: isRecording ? 'RECORDING' : 'VOICE NOTE',
                  onTap: onVoiceTap,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _UtilityChip(
                  active: isAnonymous,
                  icon: isAnonymous
                      ? Icons.visibility_off_rounded
                      : Icons.person_outline_rounded,
                  label: isAnonymous ? 'ANONYMOUS' : 'POST AS YOU',
                  onTap: onAnonymousTap,
                ),
              ),
              if (hasMedia && onRemoveMedia != null) ...[
                const SizedBox(width: 10),
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: onRemoveMedia,
                    borderRadius: BorderRadius.circular(14),
                    child: Ink(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.close_rounded,
                        color: Colors.white70,
                        size: 20,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _UtilityChip extends StatelessWidget {
  const _UtilityChip({
    required this.active,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool active;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(
            color: active
                ? landingPrimary.withValues(alpha: 0.14)
                : Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 18,
                color: active ? landingPrimarySoft : Colors.white70,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.manrope(
                    color: active ? landingPrimarySoft : Colors.white70,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SelectedMediaPreview extends StatelessWidget {
  const _SelectedMediaPreview({
    required this.file,
    required this.mediaType,
    required this.onRemove,
  });

  final File file;
  final String mediaType;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final isVideo = mediaType == 'video';
    final fileName = file.path.split(Platform.pathSeparator).last;

    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: isVideo
              ? Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        landingPrimary.withValues(alpha: 0.12),
                        const Color(0xFF171717),
                      ],
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.28),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.play_arrow_rounded,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'VIDEO READY',
                              style: GoogleFonts.epilogue(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.8,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              fileName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.manrope(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )
              : Image.file(
                  file,
                  width: double.infinity,
                  height: 132,
                  fit: BoxFit.cover,
                ),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onRemove,
              borderRadius: BorderRadius.circular(999),
              child: Ink(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.58),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
