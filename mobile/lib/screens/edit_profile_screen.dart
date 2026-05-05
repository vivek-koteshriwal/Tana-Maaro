import 'dart:io';
import 'package:flutter/material.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/avatar_config.dart';
import 'package:tanamaaro_mobile/core/media_upload_policy.dart';
import 'package:tanamaaro_mobile/widgets/roast_avatar.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({
    super.key,
    this.openAvatarPickerOnLoad = false,
  });

  final bool openAvatarPickerOnLoad;

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final TextEditingController _handleController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instanceFor(
      app: Firebase.app(), databaseId: 'tanamaaro');
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final ImagePicker _picker = ImagePicker();

  bool _isLoading = false;
  bool _isInit = true;
  bool _didAutoOpenAvatarPicker = false;
  String _currentAvatarUrl = '';
  String _originalHandle = '';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _handleController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    final user = _auth.currentUser;
    if (user == null) return;

    setState(() => _isLoading = true);

    final doc = await _firestore.collection('users').doc(user.uid).get();
    if (doc.exists) {
      final data = doc.data()!;
      _originalHandle = (data['handle'] ?? data['username'] ?? '')
          .toString()
          .replaceAll('@', '');
      _handleController.text = _originalHandle;
      _bioController.text = data['bio'] ?? '';
      _currentAvatarUrl = normalizeAvatarValue(
        data['profileImage'] as String? ?? '',
        fallbackSeed: user.uid,
      );
    } else {
      _currentAvatarUrl = avatarUrlFromSeed(user.uid);
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
        _isInit = false;
      });
      _maybeAutoOpenAvatarPicker();
    }
  }

  void _maybeAutoOpenAvatarPicker() {
    if (!widget.openAvatarPickerOnLoad || _didAutoOpenAvatarPicker) {
      return;
    }
    _didAutoOpenAvatarPicker = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _openAvatarPicker();
      }
    });
  }

  Future<void> _saveProfile() async {
    if (_handleController.text.trim().isEmpty) {
      _showSnack('Handle cannot be empty', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = _auth.currentUser;
      if (user != null) {
        final normalizedHandle =
            _handleController.text.trim().replaceAll('@', '').toLowerCase();
        final previousHandle =
            _originalHandle.replaceAll('@', '').toLowerCase();
        final userRef = _firestore.collection('users').doc(user.uid);
        final usernameRef =
            _firestore.collection('usernames').doc(normalizedHandle);

        if (normalizedHandle != previousHandle) {
          final existingUsernameDoc = await usernameRef.get();
          final mappedUid = existingUsernameDoc.data()?['uid'] as String?;
          if (existingUsernameDoc.exists && mappedUid != user.uid) {
            _showSnack('Handle already taken', isError: true);
            if (mounted) {
              setState(() => _isLoading = false);
            }
            return;
          }
        }

        final batch = _firestore.batch();
        batch.set(
            userRef,
            {
              'username': normalizedHandle,
              'handle': normalizedHandle,
              'bio': _bioController.text.trim(),
              'profileImage': _currentAvatarUrl,
              'updatedAt': FieldValue.serverTimestamp(),
              'name': FieldValue.delete(),
              'displayName': FieldValue.delete(),
            },
            SetOptions(merge: true));

        if (previousHandle.isNotEmpty && previousHandle != normalizedHandle) {
          batch.delete(_firestore.collection('usernames').doc(previousHandle));
        }

        batch.set(usernameRef, {
          'uid': user.uid,
          'email': user.email,
        });

        await batch.commit();
        await user.updateDisplayName(null);

        await _syncPublicIdentity(
          uid: user.uid,
          normalizedHandle: normalizedHandle,
          avatarValue: _currentAvatarUrl,
        );
        _originalHandle = normalizedHandle;
      }
      if (mounted) {
        Navigator.pop(context);
        _showSnack('Profile updated!');
      }
    } catch (e) {
      if (mounted) _showSnack('Error: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _syncPublicIdentity({
    required String uid,
    required String normalizedHandle,
    required String avatarValue,
  }) async {
    final publicHandle = normalizedHandle.startsWith('@')
        ? normalizedHandle
        : '@$normalizedHandle';

    final postsFuture =
        _firestore.collection('posts').where('userId', isEqualTo: uid).get();
    final commentsFuture = _firestore
        .collectionGroup('comments')
        .where('userId', isEqualTo: uid)
        .get();
    final notificationsFuture = _firestore
        .collection('notifications')
        .where('actorId', isEqualTo: uid)
        .get();

    final List<QuerySnapshot<Map<String, dynamic>>> results =
        await Future.wait([
      postsFuture,
      commentsFuture,
      notificationsFuture,
    ]);

    final postSnapshot = results[0];
    final commentSnapshot = results[1];
    final notificationSnapshot = results[2];

    final operations = <MapEntry<DocumentReference<Map<String, dynamic>>,
        Map<String, dynamic>>>[];

    for (final doc in postSnapshot.docs) {
      operations.add(MapEntry(
        doc.reference,
        {
          'userName': publicHandle,
          'userHandle': publicHandle,
          'userAvatar': avatarValue,
        },
      ));
    }

    for (final doc in commentSnapshot.docs) {
      operations.add(MapEntry(
        doc.reference,
        {
          'userName': publicHandle,
          'userHandle': publicHandle,
          'userAvatar': avatarValue,
        },
      ));
    }

    for (final doc in notificationSnapshot.docs) {
      operations.add(MapEntry(
        doc.reference,
        {
          'actorName': publicHandle,
          'actorAvatar': avatarValue,
        },
      ));
    }

    if (operations.isEmpty) return;

    var batch = _firestore.batch();
    var count = 0;
    final commits = <Future<void>>[];

    for (final operation in operations) {
      batch.update(operation.key, operation.value);
      count += 1;

      if (count == 350) {
        commits.add(batch.commit());
        batch = _firestore.batch();
        count = 0;
      }
    }

    if (count > 0) {
      commits.add(batch.commit());
    }

    await Future.wait(commits);
  }

  Future<void> _pickCustomPhoto() async {
    final XFile? image =
        await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (image == null) return;

    setState(() => _isLoading = true);
    try {
      final user = _auth.currentUser!;
      final imageFile = File(image.path);
      final validationError = await MediaUploadPolicy.validateFile(
        imageFile,
        mediaType: 'image',
      );
      if (validationError != null) {
        _showSnack(validationError, isError: true);
        return;
      }

      final ref = _storage.ref().child('avatars/${user.uid}.jpg');
      await ref.putFile(
        imageFile,
        SettableMetadata(contentType: 'image/jpeg'),
      );
      final url = await ref.getDownloadURL();
      if (mounted) setState(() => _currentAvatarUrl = url);
      _showSnack('Photo selected. Tap SAVE to apply.');
    } catch (e) {
      if (mounted) _showSnack('Upload failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openAvatarPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF111111),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (_) => _AvatarPickerSheet(
        currentUrl: _currentAvatarUrl,
        onSelected: (url) => setState(() => _currentAvatarUrl = url),
        onPickCustom: _pickCustomPhoto,
      ),
    );
  }

  void _showSnack(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: isError ? Colors.red[800] : Colors.green[800],
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
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
            'EDIT PROFILE',
            style: TextStyle(
              letterSpacing: 2,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          centerTitle: true,
          actions: [
            TextButton(
              onPressed: _isLoading ? null : _saveProfile,
              child: _isLoading
                  ? const SizedBox(
                      width: 15,
                      height: 15,
                      child: CircularProgressIndicator(
                        color: AppTheme.primaryColor,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'SAVE',
                      style: TextStyle(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
            ),
          ],
        ),
        body: _isInit
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primaryColor),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    // Avatar
                    Center(
                      child: Stack(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: AppTheme.primaryColor, width: 3),
                            ),
                            child: RoastAvatar(
                              avatarId: _currentAvatarUrl,
                              radius: 52,
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: _openAvatarPicker,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(
                                    color: AppTheme.primaryColor,
                                    shape: BoxShape.circle),
                                child: const Icon(Icons.edit,
                                    size: 16, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _openAvatarPicker,
                      child: const Text('CHOOSE AVATAR',
                          style: TextStyle(
                              color: AppTheme.primaryColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5)),
                    ),
                    const SizedBox(height: 24),

                    _buildTextField(
                      label: 'Arena Handle',
                      controller: _handleController,
                      hint: 'e.g. savage_roast_king',
                      prefix: '@',
                    ),
                    const SizedBox(height: 24),
                    _buildTextField(
                      label: 'Bio / Status',
                      controller: _bioController,
                      hint: 'Tell us how savage you are...',
                      maxLines: 3,
                    ),

                    const SizedBox(height: 40),
                    const Text(
                      'Your public identity is your handle only. Real names never appear on Tana Maaro.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white24, fontSize: 12),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String hint,
    String? prefix,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
              color: AppTheme.primaryColor,
              fontWeight: FontWeight.w900,
              fontSize: 11,
              letterSpacing: 1.5),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white10),
            prefixText: prefix,
            prefixStyle: const TextStyle(
                color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
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
        ),
      ],
    );
  }
}

class _AvatarPickerSheet extends StatelessWidget {
  final String currentUrl;
  final ValueChanged<String> onSelected;
  final VoidCallback onPickCustom;

  const _AvatarPickerSheet({
    required this.currentUrl,
    required this.onSelected,
    required this.onPickCustom,
  });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (_, scrollController) {
        return Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(4)),
            ),
            const SizedBox(height: 16),
            const Text('CHOOSE YOUR AVATAR',
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 2)),
            const SizedBox(height: 4),
            const Text('Roast-culture identities for the arena',
                style: TextStyle(color: Colors.white38, fontSize: 12)),
            const SizedBox(height: 16),

            // Custom photo button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    onPickCustom();
                  },
                  icon: const Icon(Icons.photo_library_outlined,
                      size: 18, color: Colors.white70),
                  label: const Text('UPLOAD CUSTOM PHOTO',
                      style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(child: Divider(color: Colors.white10)),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('OR PICK AN IDENTITY',
                        style: TextStyle(
                            color: Colors.white24,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5)),
                  ),
                  Expanded(child: Divider(color: Colors.white10)),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Avatar grid
            Expanded(
              child: GridView.builder(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.82,
                ),
                itemCount: kRoastAvatars.length,
                itemBuilder: (_, i) {
                  final avatarId = avatarIdFromIndex(i);
                  final data = kRoastAvatars[i];
                  final isSelected = currentUrl == avatarId;
                  return GestureDetector(
                    onTap: () {
                      onSelected(avatarId);
                      Navigator.pop(context);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.primaryColor.withValues(alpha: 0.12)
                            : Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isSelected
                              ? AppTheme.primaryColor
                              : Colors.white10,
                          width: isSelected ? 2 : 1,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                    color: AppTheme.primaryColor
                                        .withValues(alpha: 0.4),
                                    blurRadius: 12)
                              ]
                            : null,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            RoastAvatar(
                              avatarId: avatarId,
                              radius: 28,
                            ),
                            const SizedBox(height: 10),
                            Text(
                              data.name.toUpperCase(),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color:
                                    isSelected ? Colors.white : Colors.white70,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.7,
                                height: 1.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}
