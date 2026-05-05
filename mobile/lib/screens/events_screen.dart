import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:tanamaaro_mobile/core/app_theme.dart';
import 'package:tanamaaro_mobile/core/responsive_layout.dart';
import 'package:tanamaaro_mobile/screens/city_event_screen.dart';
import 'package:tanamaaro_mobile/services/event_service.dart';

const Color _eventBackground = Color(0xFF0E0E0E);
const Color _eventSurface = Color(0xFF191919);
const Color _eventSurfaceHigh = Color(0xFF1F1F1F);
const Color _eventPrimary = Color(0xFFFF3B3B);
const Color _eventPrimarySoft = Color(0xFFFF8E84);
const Color _eventMuted = Color(0xFFABABAB);

const String _heroImageUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBcx9NdtzZjw2Wi2zkwJ0nU6cWJbLeo-y_IzGHacV020ysyFBpnAR-uJypVKWVQUm6m7LRUq_RsQdoVVyQdonyVKn8vIXhC39PJZgixoFiMgmZszIdQWVn-U-pjsonuG-GEt3aED9Aq6UahLvKUaS_SQloqK94SxVTyIPDSkyRiDVlR70NJPb1pv8UsE5fyoBKKoIw9eLNwPY0QLMZP33I3_3eB6kJCRSIfvTo7NXudFEcsdqWfeQhsFbgiVkXOCtSyszSgj2kehVk';

const _eventCitySpecs = <_EventCitySpec>[
  _EventCitySpec(
    city: 'Delhi',
    venue: 'National Arena 01',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCOqW8D2dydegFsd9sVjXHFN9p_VBVHsZJzpxzkwbbWl5jhY8A8HoGUxI-WcuLM-sqEMzrVe7duHTNLiW9_SIlGLRDjSqEhFYlK9xXxJXivZa38mcglRbjdbg8q56ZRLd7T8beeyQUjjaRrMMxuguE0zy2bs0mvrf16k6Egjy23eNkAX_k7iGEbF2YAHdKJvIVl_we1OrhvTShyE58xKuIlutaRapsoBg8WoTjJxYwworX_mF-o3NdpbXfMcmYAdK4YVvRsf-b68P4',
    fallbackDate: 'NOV 24',
    fallbackNote: 'STARTS 20:00',
    liveByDefault: true,
    codeA: 'JC',
    codeB: 'MK',
    fallbackCrowd: '12K+',
    fallbackActivity: 'Already registered for battle',
  ),
  _EventCitySpec(
    city: 'Mumbai',
    venue: 'Coastal Hub Alpha',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCEOHvVUTR-d4OPWuu5GphKDxC6Er-oXWkzpc9px-RWRqBxG0K11uyBRfiT1Vrm0_AqnRPNkgH-Iy7j0i89yok7FEQFxIMpQ94JqnTFKRvw0DrgrtjnXMP9oJWZky8hSQ-v8vrf3yjDJDu2IYTDak7AnfOC-Yv2JXQqiUeRYGwVUQWmFA72dQJgcUZPrbX5gFtYjWHXrE8t5hUvHcroUIVN_JfnTLI8G-fgQcadFUBDQZFGo7o7eueAOIcbElICOPsg7JIBiQTy0bc',
    fallbackDate: 'DEC 02',
    fallbackNote: 'TICKET DROP SOON',
    liveByDefault: false,
    codeA: 'AS',
    codeB: 'RT',
    fallbackCrowd: '45K+',
    fallbackActivity: 'Watching for deployment',
  ),
  _EventCitySpec(
    city: 'Bangalore',
    venue: 'Tech Colosseum',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDgWrqevp1FEL5tqIkgJF2grUdokUOeS7kgtO533z9MKTyFKCz3wwp_VbLotXtmGAj1Ex6LvZIhykImKNJWzGduLzK4Ae4jKZMfFM0NCKyocVIpUZOMV0MhRLfy5Wyf6FTPZz1u9J7lGqcW4jRKr0ux2ZUma3Z0lPl5qP1GIp2To76hnq-NyDz2WIGeGbSZMErSh8-cZDD4L1BIU89zvIu4khzoKTKN4KCiuwlFhPWX8ERmdY4uMmsQMAbEhK2HC9oQUGA1OO2dxPk',
    fallbackDate: 'NOV 25',
    fallbackNote: 'FINAL SLOTS OPEN',
    liveByDefault: true,
    codeA: 'BK',
    codeB: 'ML',
    fallbackCrowd: '8K+',
    fallbackActivity: 'Engineers of destruction ready',
  ),
  _EventCitySpec(
    city: 'Hyderabad',
    venue: 'Nizam Citadel',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBKfBKH7vldg2mp7rQDEahw5SY0C3qV4BkMLDe6qS6uXOWii7oRrL2TrhLFg0_FwTXwrwRdwvR_UgdAIneo_QLIQZGtKZTrOhpCaqMsgPI-N4qQA2hnin2NxkssOt0iRa76iMn257EeKSHiX42omCddAlqUI5M3Ym9kHPSfe5cPd_p9iK7kZsPwkFyE0BjYZkjiZ37XojUqsVV5O2Gk9mSkB-GIyHFea3MQ3H9MtxmseOx058X5X8Ll0wVV9l66zANDbvqL6bp7GIs',
    fallbackDate: 'DEC 10',
    fallbackNote: 'PRE-REGISTRATION',
    liveByDefault: false,
    codeA: 'VF',
    codeB: 'LQ',
    fallbackCrowd: '22K+',
    fallbackActivity: 'Tacticians gathering forces',
  ),
];

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final EventService _eventService = EventService();
  late final Map<String, Future<CityStats>> _cityStatsFutures;

  @override
  void initState() {
    super.initState();
    _cityStatsFutures = {
      for (final city in _eventCitySpecs)
        city.city: _eventService.getCityStats(city.city),
    };
  }

  EventModel? _findEventForCity(List<EventModel> events, String city) {
    final normalizedCity = city.toLowerCase().trim();
    final matches = events.where((event) {
      final eventCity = event.city.toLowerCase().trim();
      return eventCity == normalizedCity || eventCity.contains(normalizedCity);
    }).toList(growable: false);

    if (matches.isEmpty) {
      return null;
    }

    matches.sort((a, b) => a.date.compareTo(b.date));
    final live = matches.where((event) => event.registrationOpen);
    if (live.isNotEmpty) {
      return live.first;
    }
    return matches.first;
  }

  void _openCity(_EventCitySpec spec, EventModel? event) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CityEventScreen(city: spec.city, event: event),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenPadding = ResponsiveLayout.screenPadding(context);

    return Scaffold(
      backgroundColor: _eventBackground,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: _eventBackground.withValues(alpha: 0.94),
        surfaceTintColor: Colors.transparent,
        titleSpacing: 16,
        title: const _EventAppBarTitle(),
      ),
      body: ResponsiveContent(
        maxWidth: 1040,
        child: StreamBuilder<List<EventModel>>(
          stream: _eventService.getUpcomingEvents(),
          builder: (context, snapshot) {
            final events = snapshot.data ?? const <EventModel>[];

            return CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: ClampingScrollPhysics(),
              ),
              slivers: [
                SliverToBoxAdapter(
                  child: _EventHeroSection(
                    errorMessage:
                        snapshot.hasError ? snapshot.error.toString() : null,
                  ),
                ),
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(
                    screenPadding.left,
                    22,
                    screenPadding.right,
                    128,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: _ActiveArenaSection(
                      cards: _eventCitySpecs
                          .map(
                            (spec) => _EventCardData(
                              spec: spec,
                              event: _findEventForCity(events, spec.city),
                              statsFuture: _cityStatsFutures[spec.city]!,
                            ),
                          )
                          .toList(growable: false),
                      onOpenCity: _openCity,
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _EventAppBarTitle extends StatelessWidget {
  const _EventAppBarTitle();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(
          Icons.event_outlined,
          color: _eventPrimary,
          size: 16,
        ),
        const SizedBox(width: 10),
        Text(
          'EVENT',
          style: AppTheme.headline(
            size: 15,
            weight: FontWeight.w900,
            letterSpacing: -0.25,
          ),
        ),
      ],
    );
  }
}

class _EventHeroSection extends StatelessWidget {
  const _EventHeroSection({
    required this.errorMessage,
  });

  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final heroSize = ResponsiveLayout.scaledFontSize(
      context,
      base: 31,
      minScale: 0.94,
      maxScale: 1.12,
    );

    return SizedBox(
      height: 340,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _GrayscaleNetworkImage(
            imageUrl: _heroImageUrl,
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  _eventBackground.withValues(alpha: 0.10),
                  _eventBackground.withValues(alpha: 0.35),
                  _eventBackground,
                ],
              ),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  _eventBackground,
                  _eventBackground.withValues(alpha: 0.85),
                  _eventBackground.withValues(alpha: 0.18),
                ],
              ),
            ),
          ),
          Positioned(
            top: 12,
            right: -34,
            child: Container(
              width: 168,
              height: 168,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _eventPrimary.withValues(alpha: 0.08),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 26),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: _eventPrimary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'OFFLINE CITY MEETUPS',
                      style: AppTheme.label(
                        size: 10,
                        color: _eventPrimarySoft,
                        weight: FontWeight.w900,
                        letterSpacing: 1.45,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: 'IN-PERSON\n',
                        style: AppTheme.headline(
                          size: heroSize,
                          weight: FontWeight.w900,
                          letterSpacing: -1.15,
                          height: 0.88,
                        ),
                      ),
                      TextSpan(
                        text: 'ARENA EVENTS',
                        style: AppTheme.headline(
                          size: heroSize,
                          color: _eventPrimary,
                          weight: FontWeight.w900,
                          letterSpacing: -1.15,
                          height: 0.88,
                        ).copyWith(fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 320),
                  child: Text(
                    'Witness the clash of legends in your territory. High-performance arenas, tactical gatherings, and global showdowns.',
                    style: AppTheme.body(
                      size: 13.5,
                      color: _eventMuted,
                      weight: FontWeight.w600,
                      height: 1.55,
                    ),
                  ),
                ),
                if (errorMessage != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'EVENT SYNC FAILED. SHOWING FALLBACK CITIES.',
                      style: AppTheme.label(
                        size: 9.4,
                        color: Colors.white70,
                        weight: FontWeight.w800,
                        letterSpacing: 0.95,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveArenaSection extends StatelessWidget {
  const _ActiveArenaSection({
    required this.cards,
    required this.onOpenCity,
  });

  final List<_EventCardData> cards;
  final void Function(_EventCitySpec spec, EventModel? event) onOpenCity;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ACTIVE ARENAS',
          style: AppTheme.headline(
            size: 18,
            weight: FontWeight.w900,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Select your battleground for local meetup details',
          style: AppTheme.body(
            size: 12.4,
            color: _eventMuted,
            weight: FontWeight.w600,
            height: 1.45,
          ),
        ),
        const SizedBox(height: 18),
        LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 760 ? 2 : 1;
            const spacing = 18.0;
            final cardWidth = columns == 1
                ? constraints.maxWidth
                : (constraints.maxWidth - spacing) / 2;

            return Wrap(
              spacing: spacing,
              runSpacing: spacing,
              children: cards
                  .map(
                    (card) => SizedBox(
                      width: cardWidth,
                      child: _EventArenaCard(
                        card: card,
                        onTap: () => onOpenCity(card.spec, card.event),
                      ),
                    ),
                  )
                  .toList(growable: false),
            );
          },
        ),
      ],
    );
  }
}

class _EventArenaCard extends StatelessWidget {
  const _EventArenaCard({
    required this.card,
    required this.onTap,
  });

  final _EventCardData card;
  final VoidCallback onTap;

  bool get _isLive {
    if (card.event != null) {
      return card.event!.registrationOpen;
    }
    return card.spec.liveByDefault;
  }

  String get _dateLabel {
    final event = card.event;
    if (event == null) {
      return card.spec.fallbackDate;
    }
    return DateFormat('MMM dd').format(event.date).toUpperCase();
  }

  String get _noteLabel {
    final event = card.event;
    if (event == null) {
      return card.spec.fallbackNote;
    }
    if (event.registrationOpen) {
      return 'REG OPEN';
    }
    if (event.status == 'upcoming') {
      return 'PRE-REGISTRATION';
    }
    if (event.status == 'ended') {
      return 'ARENA CLOSED';
    }
    return event.status.toUpperCase();
  }

  String get _venueLabel {
    final event = card.event;
    if (event == null || event.location.trim().isEmpty) {
      return card.spec.venue.toUpperCase();
    }
    return event.location.toUpperCase();
  }

  String get _ctaLabel => _isLive ? 'ENTER ARENA' : 'REMIND ME';

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            color: _eventSurface,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: _eventPrimary.withValues(alpha: 0.05),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  children: [
                    SizedBox(
                      height: 164,
                      width: double.infinity,
                      child:
                          _GrayscaleNetworkImage(imageUrl: card.spec.imageUrl),
                    ),
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              _eventSurface.withValues(alpha: 0.16),
                              _eventSurface,
                            ],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _isLive ? _eventPrimary : _eventSurfaceHigh,
                          borderRadius: BorderRadius.circular(4),
                          border: _isLive
                              ? null
                              : Border.all(
                                  color: _eventPrimary.withValues(alpha: 0.28),
                                ),
                        ),
                        child: Text(
                          _isLive ? 'LIVE' : 'SOON',
                          style: AppTheme.label(
                            size: 8.6,
                            color: Colors.white,
                            weight: FontWeight.w900,
                            letterSpacing: 0.95,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  card.spec.city.toUpperCase(),
                                  style: AppTheme.headline(
                                    size: 17,
                                    weight: FontWeight.w900,
                                    letterSpacing: -0.55,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  _venueLabel,
                                  style: AppTheme.label(
                                    size: 9,
                                    color: _eventMuted,
                                    weight: FontWeight.w700,
                                    letterSpacing: 0.95,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                _dateLabel,
                                style: AppTheme.headline(
                                  size: 15,
                                  color: _isLive ? _eventPrimary : Colors.white,
                                  weight: FontWeight.w900,
                                  letterSpacing: -0.35,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                _noteLabel,
                                style: AppTheme.label(
                                  size: 8.4,
                                  color: _eventMuted,
                                  weight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      FutureBuilder<CityStats>(
                        future: card.statsFuture,
                        builder: (context, snapshot) {
                          final statCount =
                              snapshot.data?.registrationCount ?? 0;
                          final crowdLabel = statCount > 0
                              ? _formatInterestCount(statCount)
                              : card.spec.fallbackCrowd;

                          return Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _CodePill(code: card.spec.codeA),
                              _CodePill(code: card.spec.codeB),
                              Text(
                                crowdLabel,
                                style: AppTheme.headline(
                                  size: 13,
                                  color: _eventPrimary,
                                  weight: FontWeight.w900,
                                  letterSpacing: -0.25,
                                ),
                              ),
                              Text(
                                card.spec.fallbackActivity,
                                style: AppTheme.body(
                                  size: 10.4,
                                  color: _eventMuted,
                                  weight: FontWeight.w600,
                                  height: 1.3,
                                ).copyWith(fontStyle: FontStyle.italic),
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 14),
                      _EventCardButton(
                        label: _ctaLabel,
                        live: _isLive,
                        onTap: onTap,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EventCardButton extends StatelessWidget {
  const _EventCardButton({
    required this.label,
    required this.live,
    required this.onTap,
  });

  final String label;
  final bool live;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Ink(
          height: 34,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(6),
            gradient: live
                ? const LinearGradient(
                    colors: [_eventPrimarySoft, _eventPrimary],
                  )
                : null,
            color: live ? null : Colors.transparent,
            border: Border.all(
              color: live
                  ? Colors.transparent
                  : _eventPrimary.withValues(alpha: 0.28),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: AppTheme.label(
                  size: 9.6,
                  color: Colors.white,
                  weight: FontWeight.w900,
                  letterSpacing: 0.95,
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                live
                    ? Icons.flash_on_rounded
                    : Icons.notifications_active_rounded,
                size: 13,
                color: Colors.white,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CodePill extends StatelessWidget {
  const _CodePill({
    required this.code,
  });

  final String code;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: _eventSurfaceHigh,
        borderRadius: BorderRadius.circular(9),
      ),
      alignment: Alignment.center,
      child: Text(
        code,
        style: AppTheme.label(
          size: 7.2,
          color: Colors.white,
          weight: FontWeight.w800,
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}

class _GrayscaleNetworkImage extends StatelessWidget {
  const _GrayscaleNetworkImage({
    required this.imageUrl,
  });

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return ColorFiltered(
      colorFilter: const ColorFilter.matrix(<double>[
        0.2126,
        0.7152,
        0.0722,
        0,
        0,
        0.2126,
        0.7152,
        0.0722,
        0,
        0,
        0.2126,
        0.7152,
        0.0722,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ]),
      child: Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  _eventSurfaceHigh,
                  _eventBackground,
                ],
              ),
            ),
          );
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) {
            return child;
          }
          return DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  _eventSurfaceHigh,
                  _eventBackground,
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

String _formatInterestCount(int count) {
  if (count >= 1000) {
    final thousands = count / 1000;
    final rounded = thousands >= 10
        ? thousands.round().toString()
        : thousands.toStringAsFixed(1).replaceAll('.0', '');
    return '${rounded}K+';
  }
  return '$count+';
}

class _EventCardData {
  const _EventCardData({
    required this.spec,
    required this.event,
    required this.statsFuture,
  });

  final _EventCitySpec spec;
  final EventModel? event;
  final Future<CityStats> statsFuture;
}

class _EventCitySpec {
  const _EventCitySpec({
    required this.city,
    required this.venue,
    required this.imageUrl,
    required this.fallbackDate,
    required this.fallbackNote,
    required this.liveByDefault,
    required this.codeA,
    required this.codeB,
    required this.fallbackCrowd,
    required this.fallbackActivity,
  });

  final String city;
  final String venue;
  final String imageUrl;
  final String fallbackDate;
  final String fallbackNote;
  final bool liveByDefault;
  final String codeA;
  final String codeB;
  final String fallbackCrowd;
  final String fallbackActivity;
}
