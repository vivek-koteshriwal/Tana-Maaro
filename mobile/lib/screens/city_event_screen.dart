import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:tanamaaro_mobile/core/app_navigation.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/media_upload_policy.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/services/deep_link_service.dart';
import 'package:tanamaaro_mobile/services/event_service.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

class CityEventScreen extends StatefulWidget {
  final String city;
  final EventModel? event;

  const CityEventScreen({super.key, required this.city, this.event});

  @override
  State<CityEventScreen> createState() => _CityEventScreenState();
}

class _CityEventScreenState extends State<CityEventScreen> {
  final EventService _service = EventService();
  EventModel? _shareableEvent;

  @override
  Widget build(BuildContext context) {
    _shareableEvent ??= widget.event;
    final screenPadding = ResponsiveLayout.screenPadding(context);

    return ParentBackScope(
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_new,
              color: Colors.white,
              size: 18,
            ),
            onPressed: () => navigateToParentRoute(context),
          ),
          title: Text(
            '${widget.city.toUpperCase()} ROAST SHOWDOWN',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          centerTitle: true,
          actions: [
            if (_shareableEvent != null)
              IconButton(
                onPressed: () async {
                  final event = _shareableEvent!;
                  await Share.share(DeepLinkService.buildEventShareText(event));
                  await DeepLinkService.trackShare(
                    targetType: 'event',
                    targetId: event.id,
                    appLink: DeepLinkService.eventUri(event.id),
                    fallbackLink: DeepLinkService.eventShareUri(event),
                    destination: 'external',
                  );
                },
                icon: const Icon(Icons.ios_share_rounded, color: Colors.white),
              ),
          ],
        ),
        body: ResponsiveContent(
          maxWidth: 960,
          child: widget.event != null
              ? _buildContent([widget.event!], screenPadding)
              : StreamBuilder<List<EventModel>>(
                  stream: _service.getEventsByCity(widget.city),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(
                        child: CircularProgressIndicator(
                          color: AppTheme.primaryColor,
                        ),
                      );
                    }
                    if (snapshot.hasError) {
                      return _buildLoadErrorState(snapshot.error.toString());
                    }
                    if ((snapshot.data?.isNotEmpty ?? false) &&
                        _shareableEvent == null) {
                      _shareableEvent = snapshot.data!.first;
                    }
                    return _buildContent(snapshot.data ?? [], screenPadding);
                  },
                ),
        ),
      ),
    );
  }

  Widget _buildContent(List<EventModel> events, EdgeInsets screenPadding) {
    final hasEvent = events.isNotEmpty;
    final registrationOpen = hasEvent && events.first.registrationOpen;
    final headingSize = ResponsiveLayout.scaledFontSize(
      context,
      base: 36,
      minScale: 0.8,
      maxScale: 1.06,
    );

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        screenPadding.left,
        20,
        screenPadding.right,
        40,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Big title ──────────────────────────────────────────────
          RichText(
            text: TextSpan(
              style: TextStyle(
                  fontSize: headingSize,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  height: 1.15),
              children: [
                const TextSpan(text: 'Upcoming\nTana Maaro Event in '),
                TextSpan(
                  text: widget.city,
                  style: const TextStyle(color: AppTheme.primaryColor),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          if (!hasEvent) ...[
            _buildNoEventState(),
            const SizedBox(height: 24),
          ] else ...[
            _EventDetailsCard(event: events.first),
            if (events.length > 1) ...[
              const SizedBox(height: 14),
              ...events.skip(1).map((e) => _SmallEventTile(event: e)),
            ],
            const SizedBox(height: 24),
          ],

          // ── Registration section ─────────────────────────────────
          _RegistrationSection(
            city: widget.city,
            event: hasEvent ? events.first : null,
            registrationOpen: registrationOpen,
          ),
        ],
      ),
    );
  }

  Widget _buildNoEventState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 24),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          const Text('🏜️', style: TextStyle(fontSize: 52)),
          const SizedBox(height: 16),
          Text(
            'No upcoming events in ${widget.city} right now.',
            style: const TextStyle(
                color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'Stay tuned. We\'re roasting the whole country soon.',
            style: TextStyle(color: Colors.white38, fontSize: 13, height: 1.4),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLoadErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, color: Colors.white24, size: 46),
            const SizedBox(height: 14),
            const Text(
              'Could not load city events.',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: const TextStyle(
                color: Colors.white38,
                fontSize: 12,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Event Details Card ────────────────────────────────────────────────────────

class _EventDetailsCard extends StatelessWidget {
  final EventModel event;
  const _EventDetailsCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero banner
          Container(
            height: 130,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppTheme.primaryColor.withValues(alpha: 0.3),
                  Colors.black,
                ],
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text(
                  'TANA MAARO LIVE',
                  style: TextStyle(
                      color: AppTheme.primaryColor.withValues(alpha: 0.07),
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('OFFICIAL EVENT',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          letterSpacing: 1.5)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${event.city.toUpperCase()} ROAST SHOWDOWN',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                Text(
                  'The Tana Maaro crew is dropping in ${event.city} for our most ruthless live show yet. We\'ve got the mics, the cameras. Bring your thickest skin.',
                  style: const TextStyle(
                      color: Colors.white54, fontSize: 13, height: 1.5),
                ),
                const SizedBox(height: 16),
                _row('📅', 'Date',
                    DateFormat('MMMM dd, yyyy').format(event.date)),
                const SizedBox(height: 8),
                _row('📍', 'Venue', event.location),
                if (event.format != null) ...[
                  const SizedBox(height: 8),
                  _row('🎯', 'Format', event.format!),
                ],
                if (event.prizePool != null) ...[
                  const SizedBox(height: 8),
                  _row('🏆', 'Prize Pool', event.prizePool!),
                ],
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(12),
                    border:
                        Border.all(color: Colors.white.withValues(alpha: 0.06)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ENTRY REQUIREMENTS',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 11,
                              letterSpacing: 1.2)),
                      const Divider(color: Colors.white10, height: 12),
                      _req('Strictly 18+ only. ID verification at gates.'),
                      _req('Zero tolerance for physical altercations.'),
                      _req(
                          'By entering, you consent to being recorded and roasted.'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(String icon, String label, String value) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon),
          const SizedBox(width: 8),
          Text('$label: ',
              style: const TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.bold,
                  fontSize: 13)),
          Expanded(
              child: Text(value,
                  style: const TextStyle(color: Colors.white60, fontSize: 13))),
        ],
      );

  Widget _req(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• ',
                style: TextStyle(color: AppTheme.primaryColor, fontSize: 13)),
            Expanded(
              child: Text(text,
                  style: const TextStyle(
                      color: Colors.white54, fontSize: 12, height: 1.4)),
            ),
          ],
        ),
      );
}

class _SmallEventTile extends StatelessWidget {
  final EventModel event;
  const _SmallEventTile({required this.event});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          const Icon(Icons.event_outlined,
              color: AppTheme.primaryColor, size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14)),
                Text(DateFormat('MMM dd, yyyy').format(event.date),
                    style:
                        const TextStyle(color: Colors.white38, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Registration Section ──────────────────────────────────────────────────────

class _RegistrationSection extends StatefulWidget {
  final String city;
  final EventModel? event;
  final bool registrationOpen;

  const _RegistrationSection({
    required this.city,
    required this.event,
    required this.registrationOpen,
  });

  @override
  State<_RegistrationSection> createState() => _RegistrationSectionState();
}

class _RegistrationSectionState extends State<_RegistrationSection> {
  String? _selectedRole;

  String get _eventId =>
      widget.event?.id ?? 'EVENT_${widget.city.toUpperCase()}_LIVE';
  String get _eventName =>
      widget.event?.title ?? '${widget.city} Tana Maaro Live';

  void _proceed() {
    if (_selectedRole == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _selectedRole == 'attendee'
          ? _AttendeeSheet(
              city: widget.city,
              eventId: _eventId,
              eventName: _eventName,
            )
          : _PerformerSheet(
              city: widget.city,
              eventId: _eventId,
              eventName: _eventName,
            ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('SECURE YOUR SPOT',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5)),
          const SizedBox(height: 6),
          if (!widget.registrationOpen) ...[
            // Registration not yet open
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lock_clock_outlined,
                      color: Colors.white38, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('REGISTRATION OPENING SOON',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                letterSpacing: 0.8)),
                        const SizedBox(height: 4),
                        Text(
                          widget.event != null
                              ? 'Opens closer to ${DateFormat('MMMM dd').format(widget.event!.date)}'
                              : 'Official announcement coming soon.',
                          style: const TextStyle(
                              color: Colors.white38, fontSize: 12, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            // Registration open — show role selector
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _RoleCard(
                    icon: Icons.confirmation_number_outlined,
                    title: 'ATTENDEE',
                    subtitle: 'Watch the roasters\ndestroy each other live.',
                    selected: _selectedRole == 'attendee',
                    onTap: () => setState(() => _selectedRole = 'attendee'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _RoleCard(
                    icon: Icons.mic_outlined,
                    title: 'PERFORMER',
                    subtitle: 'Step into the ring.\n3 minutes to roast.',
                    selected: _selectedRole == 'performer',
                    onTap: () => setState(() => _selectedRole = 'performer'),
                  ),
                ),
              ],
            ),
            if (_selectedRole != null) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _proceed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    'PROCEED AS ${_selectedRole!.toUpperCase()}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        letterSpacing: 1),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primaryColor.withValues(alpha: 0.1)
              : Colors.black.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? AppTheme.primaryColor
                : Colors.white.withValues(alpha: 0.08),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: selected
                    ? AppTheme.primaryColor.withValues(alpha: 0.15)
                    : Colors.black,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Icon(icon,
                  size: 22,
                  color: selected ? AppTheme.primaryColor : Colors.white54),
            ),
            const SizedBox(height: 10),
            Text(title,
                style: TextStyle(
                    color: selected ? Colors.white : Colors.white60,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 0.8)),
            const SizedBox(height: 4),
            Text(subtitle,
                style: const TextStyle(
                    color: Colors.white38, fontSize: 10, height: 1.3),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

// ── Attendee Registration Sheet ───────────────────────────────────────────────

class _AttendeeSheet extends StatefulWidget {
  final String city;
  final String eventId;
  final String eventName;

  const _AttendeeSheet({
    required this.city,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<_AttendeeSheet> createState() => _AttendeeSheetState();
}

class _AttendeeSheetState extends State<_AttendeeSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final EventService _service = EventService();

  bool _loading = false;
  bool _submitted = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = FirebaseAuth.instance.currentUser;
    if (user?.email != null) _emailCtrl.text = user!.email!;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _service.registerAttendee(
        eventId: widget.eventId,
        eventName: widget.eventName,
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        city: widget.city,
      );
      if (mounted) setState(() => _submitted = true);
      Future.delayed(const Duration(seconds: 4), () {
        if (mounted) Navigator.pop(context);
      });
    } on Exception catch (e) {
      setState(() {
        _error = e.toString().contains('already_registered')
            ? 'You are already registered for this event.'
            : 'Registration failed. Please try again.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetWrapper(
      child: _submitted
          ? _SuccessState(
              emoji: '🎟️',
              title: 'YOU\'RE IN!',
              message:
                  'We will call you back regarding\npayment and confirmation.',
            )
          : Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _sheetHeader(
                      'REGISTER AS ATTENDEE', '${widget.city} Tana Maaro Live'),
                  const SizedBox(height: 20),
                  _field(_nameCtrl, 'Full Name', 'Enter your name',
                      required: true),
                  const SizedBox(height: 14),
                  Row(children: [
                    Expanded(
                      child: _field(_emailCtrl, 'Email', 'name@college.edu',
                          keyboard: TextInputType.emailAddress,
                          required: true,
                          emailValidate: true),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(_phoneCtrl, 'Phone', '+91...',
                          keyboard: TextInputType.phone, required: true),
                    ),
                  ]),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    _errorBox(_error!),
                  ],
                  const SizedBox(height: 20),
                  _submitButton(_loading, _submit, 'CONFIRM REGISTRATION'),
                ],
              ),
            ),
    );
  }
}

// ── Performer Registration Sheet ──────────────────────────────────────────────

class _PerformerSheet extends StatefulWidget {
  final String city;
  final String eventId;
  final String eventName;

  const _PerformerSheet({
    required this.city,
    required this.eventId,
    required this.eventName,
  });

  @override
  State<_PerformerSheet> createState() => _PerformerSheetState();
}

class _PerformerSheetState extends State<_PerformerSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _youtubeCtrl = TextEditingController();
  final _handleCtrl = TextEditingController();
  final _textCtrl = TextEditingController();
  final _audioLinkCtrl = TextEditingController();
  final EventService _service = EventService();
  final ImagePicker _picker = ImagePicker();

  String _contentType = 'text'; // 'video' | 'image' | 'audio_link' | 'text'
  File? _pickedFile;
  String? _pickedFileName;
  bool _loading = false;
  bool _submitted = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = FirebaseAuth.instance.currentUser;
    if (user?.email != null) _emailCtrl.text = user!.email!;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _youtubeCtrl.dispose();
    _handleCtrl.dispose();
    _textCtrl.dispose();
    _audioLinkCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(ImageSource source, bool isVideo) async {
    final XFile? picked = isVideo
        ? await _picker.pickVideo(source: source)
        : await _picker.pickImage(source: source, imageQuality: 80);
    if (picked == null) return;
    final file = File(picked.path);
    final validationError = await MediaUploadPolicy.validateFile(
      file,
      mediaType: isVideo ? 'video' : 'image',
    );
    if (validationError != null) {
      setState(() {
        _error = validationError;
      });
      return;
    }

    setState(() {
      _pickedFile = file;
      _pickedFileName = picked.name;
      _contentType = isVideo ? 'video' : 'image';
      _error = null;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _service.registerPerformer(
        eventId: widget.eventId,
        eventName: widget.eventName,
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        city: widget.city,
        youtubeChannel: _youtubeCtrl.text.trim(),
        tanamaroHandle: _handleCtrl.text.trim(),
        contentType: _contentType,
        contentText: _contentType == 'text' ? _textCtrl.text.trim() : null,
        contentLink:
            _contentType == 'audio_link' ? _audioLinkCtrl.text.trim() : null,
        contentFile: (_contentType == 'video' || _contentType == 'image')
            ? _pickedFile
            : null,
      );
      if (mounted) setState(() => _submitted = true);
      Future.delayed(const Duration(seconds: 4), () {
        if (mounted) Navigator.pop(context);
      });
    } on Exception catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      setState(() {
        _error = message.contains('already_registered')
            ? 'You are already registered as a performer.'
            : message == MediaUploadPolicy.videoUploadLimitMessage
                ? MediaUploadPolicy.videoUploadLimitMessage
                : 'Registration failed. Please try again.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetWrapper(
      child: _submitted
          ? _SuccessState(
              emoji: '🎤',
              title: 'SUBMISSION RECEIVED!',
              message: 'We will review your submission\nand get back to you.',
            )
          : Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _sheetHeader('REGISTER AS PERFORMER',
                      '${widget.city} Tana Maaro Live'),
                  const SizedBox(height: 20),

                  // Basic info
                  _field(_nameCtrl, 'Full Name', 'Enter your name',
                      required: true),
                  const SizedBox(height: 14),
                  Row(children: [
                    Expanded(
                      child: _field(_emailCtrl, 'Email', 'name@college.edu',
                          keyboard: TextInputType.emailAddress,
                          required: true,
                          emailValidate: true),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(_phoneCtrl, 'Phone', '+91...',
                          keyboard: TextInputType.phone, required: true),
                    ),
                  ]),
                  const SizedBox(height: 14),
                  _field(_youtubeCtrl, 'YouTube Channel',
                      'youtube.com/c/yourchannel',
                      keyboard: TextInputType.url),
                  const SizedBox(height: 14),
                  _field(_handleCtrl, 'Tana Maaro Handle / User ID',
                      '@your_handle'),

                  const SizedBox(height: 20),
                  const Text('CONTENT SUBMISSION',
                      style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5)),
                  const SizedBox(height: 10),

                  // Content type selector
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _typeChip(
                            'text', 'Text Post', Icons.text_fields_rounded),
                        const SizedBox(width: 8),
                        _typeChip('video', 'Video', Icons.videocam_outlined),
                        const SizedBox(width: 8),
                        _typeChip('image', 'Image', Icons.image_outlined),
                        const SizedBox(width: 8),
                        _typeChip('audio_link', 'Audio Link',
                            Icons.audiotrack_outlined),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Content input based on type
                  if (_contentType == 'text')
                    _buildTextInput()
                  else if (_contentType == 'video' || _contentType == 'image')
                    _buildFilePickerUI()
                  else if (_contentType == 'audio_link')
                    _field(_audioLinkCtrl, 'Audio Link',
                        'drive.google.com/... or soundcloud.com/...',
                        keyboard: TextInputType.url),

                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    _errorBox(_error!),
                  ],
                  const SizedBox(height: 20),
                  _submitButton(_loading, _submit, 'SUBMIT APPLICATION'),
                ],
              ),
            ),
    );
  }

  Widget _typeChip(String type, String label, IconData icon) {
    final selected = _contentType == type;
    return GestureDetector(
      onTap: () => setState(() {
        _contentType = type;
        _pickedFile = null;
        _pickedFileName = null;
      }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primaryColor.withValues(alpha: 0.15)
              : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected
                ? AppTheme.primaryColor
                : Colors.white.withValues(alpha: 0.1),
          ),
        ),
        child: Row(
          children: [
            Icon(icon,
                size: 14,
                color: selected ? AppTheme.primaryColor : Colors.white38),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    color: selected ? AppTheme.primaryColor : Colors.white38,
                    fontSize: 11,
                    fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _buildTextInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('TEXT CONTENT',
            style: TextStyle(
                color: AppTheme.primaryColor,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2)),
        const SizedBox(height: 6),
        TextFormField(
          controller: _textCtrl,
          maxLines: 4,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Write your roast or describe your content...',
            hintStyle: const TextStyle(color: Colors.white12, fontSize: 13),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.05),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: AppTheme.primaryColor, width: 1)),
            contentPadding: const EdgeInsets.all(12),
          ),
        ),
      ],
    );
  }

  Widget _buildFilePickerUI() {
    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: const Color(0xFF111111),
          shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
          builder: (_) => SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 12),
                ListTile(
                  leading: const Icon(Icons.photo_library_outlined,
                      color: AppTheme.primaryColor),
                  title: const Text('Choose from Gallery',
                      style: TextStyle(color: Colors.white)),
                  onTap: () {
                    Navigator.pop(context);
                    _pickMedia(ImageSource.gallery, _contentType == 'video');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.camera_alt_outlined,
                      color: AppTheme.primaryColor),
                  title: const Text('Use Camera',
                      style: TextStyle(color: Colors.white)),
                  onTap: () {
                    Navigator.pop(context);
                    _pickMedia(ImageSource.camera, _contentType == 'video');
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _pickedFile != null
              ? AppTheme.primaryColor.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _pickedFile != null
                ? AppTheme.primaryColor.withValues(alpha: 0.4)
                : Colors.white.withValues(alpha: 0.1),
            style: _pickedFile != null ? BorderStyle.solid : BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            FaIcon(
              _contentType == 'video'
                  ? FontAwesomeIcons.video
                  : FontAwesomeIcons.image,
              color:
                  _pickedFile != null ? AppTheme.primaryColor : Colors.white24,
              size: 28,
            ),
            const SizedBox(height: 10),
            Text(
              _pickedFile != null
                  ? _pickedFileName ?? 'File selected'
                  : 'Tap to select ${_contentType == 'video' ? 'video' : 'image'}',
              style: TextStyle(
                  color: _pickedFile != null
                      ? AppTheme.primaryColor
                      : Colors.white38,
                  fontSize: 13,
                  fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            if (_pickedFile != null) ...[
              const SizedBox(height: 6),
              const Text('Tap to change',
                  style: TextStyle(color: Colors.white24, fontSize: 11)),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Shared Sheet Widgets ──────────────────────────────────────────────────────

class _SheetWrapper extends StatelessWidget {
  final Widget child;
  const _SheetWrapper({required this.child});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0D0D0D),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(4)),
                ),
              ),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _SuccessState extends StatelessWidget {
  final String emoji;
  final String title;
  final String message;

  const _SuccessState({
    required this.emoji,
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
                child: Text(emoji, style: const TextStyle(fontSize: 36))),
          ),
          const SizedBox(height: 18),
          Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1)),
          const SizedBox(height: 10),
          Text(message,
              style: const TextStyle(
                  color: Colors.white54, fontSize: 14, height: 1.5),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

// ── Shared form helpers ───────────────────────────────────────────────────────

Widget _sheetHeader(String title, String subtitle) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(
                color: AppTheme.primaryColor,
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5)),
        const SizedBox(height: 4),
        Text(subtitle,
            style: const TextStyle(color: Colors.white38, fontSize: 12)),
      ],
    );

Widget _field(
  TextEditingController ctrl,
  String label,
  String hint, {
  TextInputType? keyboard,
  bool required = false,
  bool emailValidate = false,
}) =>
    Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: const TextStyle(
                color: AppTheme.primaryColor,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2)),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          keyboardType: keyboard,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          validator: (v) {
            if (required && (v == null || v.trim().isEmpty)) {
              return 'Required';
            }
            if (emailValidate && v != null && !v.contains('@')) {
              return 'Invalid email';
            }
            return null;
          },
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white12),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.05),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: AppTheme.primaryColor, width: 1)),
            errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: Colors.redAccent, width: 1)),
            focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: Colors.redAccent, width: 1)),
            errorStyle: const TextStyle(color: Colors.redAccent),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );

Widget _errorBox(String message) => Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
      ),
      child: Text(message,
          style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
    );

Widget _submitButton(bool loading, VoidCallback onTap, String label) =>
    SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: loading ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2))
            : Text(label,
                style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 0.8)),
      ),
    );
