# Scalability, Performance, and Media Upload Audit

Date: 2026-04-23

## Executive Decision

The current Tana Maaro web and mobile stack is not ready for 1 million concurrent users. The app can be launched and scaled gradually, but the current Firestore data model, direct realtime listeners, reaction arrays, local upload route, and missing async media-processing pipeline would become bottlenecks well before that level.

Current production readiness score: 38 / 100

After the recommended infrastructure and data-model changes: 80+ / 100

## What Was Fixed Now

- Added shared web upload policy in `lib/media-policy.ts`.
- Enforced 100 MB maximum video upload validation in web upload APIs.
- Added web composer upload progress and clearer upload errors.
- Fixed web local upload response compatibility by returning both `fileUrl` and `url`.
- Fixed S3 signed upload key mismatch so the returned URL points to the uploaded object.
- Added mobile upload policy in `mobile/lib/core/media_upload_policy.dart`.
- Added mobile video size validation for post creation and event performer submissions.
- Added Firebase Storage metadata for mobile uploads so Storage rules can validate content type.
- Tightened Firebase Storage rules to reject unsupported media and videos larger than 100 MB.

## Critical Bottlenecks

1. Firestore feed pagination uses offsets in `lib/db.ts`. Offsets still scan skipped documents internally and become slower and more expensive as data grows.

2. Reactions are stored as `likedBy` and `dislikedBy` arrays on the post document. Viral posts can create large arrays, high index fanout, and hot documents.

3. Likes, comments, shares, saves, and views update the same post document. At high velocity, this becomes write contention.

4. Realtime feed listeners watch recent post ranges directly from clients. At 1 million active users, this creates very high read fanout and cost.

5. Trending is computed by fetching recent candidate posts and ranking them in the application process. This is acceptable for small feeds but not for large-scale ranking.

6. The local web upload route still buffers uploads in memory and writes to `public/uploads`. That is not safe for production or serverless/multi-instance deployments.

7. Video compression and adaptive streaming are not implemented yet. Current work validates upload size but does not transcode video.

8. Admin analytics and dashboard routes fetch large batches such as 1000 posts and aggregate in-process. These need precomputed metrics.

9. Firebase Storage rules were too permissive before this pass. They now enforce media type and the 100 MB video limit, but rules should still be reviewed before launch.

10. The app has no proven load test, autoscaling policy, or SLO monitoring setup yet.

## Required Architecture For 1M Concurrent Users

Use a staged architecture rather than trying to run all web, API, realtime, uploads, and ranking work in one Next.js deployment.

Recommended target:

```text
CloudFront + AWS WAF
  -> Next.js web frontend on ECS Fargate or Amplify Hosting
  -> Dedicated API service on ECS Fargate behind ALB
  -> Redis / ElastiCache for hot feed, sessions, rate limits
  -> Firestore for current source of truth, or DynamoDB if migrating later
  -> SQS / EventBridge for async jobs
  -> S3 private buckets for original media
  -> MediaConvert or ECS FFmpeg workers for video processing
  -> S3 processed-media bucket
  -> CloudFront media CDN
  -> CloudWatch, OpenTelemetry, alarms, dashboards
```

## Database Changes Needed

- Replace offset pagination with cursor pagination using `startAfter` / document cursors.
- Move user reactions into subcollections or deterministic documents like `postReactions/{postId_userId}`.
- Replace single-document counters with sharded/distributed counters for hot metrics.
- Precompute trending scores into a `trendingPosts` collection updated by workers.
- Add rolling 7-day engagement event storage, ideally partitioned by day.
- Create composite indexes for feed, battle feed, user posts, event lookups, and trending windows.
- Add denormalized feed documents for high-read surfaces.

## Trending System Needed

Do not calculate production trending by scanning and sorting posts during API requests.

Recommended scoring pipeline:

```text
reaction/comment/share/view events
  -> queue
  -> ranking worker
  -> rolling 7-day aggregates
  -> trending score documents
  -> cached API response
```

Suggested score:

```text
score =
  likes_7d * 3
  + comments_7d * 5
  + shares_7d * 8
  + saves_7d * 6
  + views_7d * 0.2
  + velocity_boost
  + freshness_boost
  - report_penalty
```

Refresh ranking every 1 to 5 minutes for launch, then move to event-driven updates as traffic grows.

## Media Upload Plan

Implemented now:

- Web and mobile reject videos over 100 MB with the required message.
- Web upload UI shows progress in the feed composer.
- Web image uploads are compressed to WebP before upload in the feed composer.
- Mobile image pickers use reduced image quality.
- Firebase Storage rules now enforce media type and max size.

Still required:

- Remove `/api/upload/local` from production usage.
- Use direct-to-S3 multipart uploads or presigned uploads for web and mobile.
- Put CloudFront in front of media instead of serving raw S3 URLs.
- Store originals in a private bucket.
- Trigger media processing after upload.
- Generate thumbnails, WebP/AVIF image variants, and HLS/DASH video outputs.
- Save processing status on the post so users see "processing" until playback assets are ready.
- Add retryable upload state and resumable upload support on mobile.

## AWS Services

- Web app hosting: AWS Amplify Hosting for managed Next.js launch, or ECS Fargate for more control.
- Website hosting: same Next.js deployment now; S3 + CloudFront later if fully static.
- APIs: dedicated ECS Fargate service behind ALB once API traffic grows.
- Database: Firestore for current launch, with redesign for counters/listeners; DynamoDB only as a separate migration.
- Cache: ElastiCache Redis or Upstash Redis with production limits sized for traffic.
- Media storage: S3 private buckets plus CloudFront.
- Video processing: AWS Elemental MediaConvert, or ECS/Fargate workers running FFmpeg for lower-level control.
- Queues/jobs: SQS and EventBridge.
- Security: AWS WAF rate-based rules, Shield through CloudFront, IAM roles instead of static AWS keys.
- Observability: CloudWatch metrics/logs, X-Ray or OpenTelemetry traces, uptime checks, error alerts.
- CI/CD: GitHub Actions running `npm run build`, `flutter analyze`, tests, then Amplify or ECS deployment.

## Launch Gates Before High Traffic

- Run load tests for feed read, post create, react, comment, login, and upload URL generation.
- Define SLOs for p95 API latency, feed load time, error rate, and upload success rate.
- Confirm autoscaling policies and database quotas before paid marketing.
- Add CloudFront caching rules for static and media assets.
- Add bot/rate protection before opening public traffic.
- Create rollback playbooks for web, API, Firebase rules, and storage rules.
- Move all secrets to AWS Secrets Manager or Parameter Store.

## Verification

- `npm run build` passes.
- `flutter analyze` passes.
- Firebase CLI is not installed in this environment, so Storage rule validation still needs to be run in the project team's normal Firebase deployment or emulator pipeline before production.
