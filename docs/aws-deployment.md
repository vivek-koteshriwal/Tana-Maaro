# AWS Deployment Plan

## Recommended Deployment Targets

- Website + web app: deploy the repository root as one Next.js service
- Mobile app: build from `mobile/` for App Store / Play Store distribution

## Recommended AWS Services

### Web App Hosting

Recommended now:

- AWS Amplify Hosting for the root Next.js app

Why:

- easiest path for App Router SSR hosting
- built-in previews and branch deployments
- managed CDN and build pipeline

Alternative when you need more control:

- ECS Fargate running a containerized Next.js app behind an Application Load Balancer

### Website Hosting

Recommended now:

- host the public website inside the same root Next.js deployment as the web app

Later, if marketing content becomes fully static and independently managed:

- S3 + CloudFront for the website
- keep the authenticated app on Amplify or ECS

### Mobile Backend APIs

Recommended now:

- keep the current Next.js API handlers in `app/api/*`
- expose them through the same web deployment

Later, if API traffic grows independently:

- split heavy API workloads into a dedicated ECS service or Lambda-backed API Gateway

### Database

Recommended now:

- keep Firestore as the source of truth for launch

Reason:

- the current application logic is already built around Firebase Auth + Firestore
- moving to an AWS-native database now would be a full backend migration, not a cleanup task

Future AWS-native options:

- DynamoDB for document-style scale
- Aurora PostgreSQL if relational analytics and complex querying become important

### File Storage

Recommended:

- Amazon S3 for user-uploaded media
- CloudFront in front of S3 for caching and faster delivery

The web codebase already contains signed-upload S3 support in `lib/s3.ts`.

### Authentication

Recommended now:

- keep Firebase Auth for launch

Future AWS-native option:

- Amazon Cognito

Do not migrate auth providers during launch prep unless the team is ready for a coordinated web + mobile + backend migration.

### Cache / Rate Limiting

Recommended:

- Redis-compatible cache

AWS-native option:

- ElastiCache for Redis

### CI/CD Pipeline

Recommended:

- GitHub Actions for lint/build/analyze checks
- Amplify branch deployments for the web app
- optional GitHub Actions workflow for Flutter analyze/build

If using ECS instead of Amplify:

- GitHub Actions -> ECR -> ECS deploy

## Scalable Architecture

### Launch Architecture

```text
Users
  -> CloudFront / Amplify
  -> Next.js app (website + web app + API routes)
  -> Firestore / Firebase Auth
  -> Redis
  -> S3
```

### Growth Architecture

```text
Users
  -> CloudFront
  -> Web frontend
  -> API service layer
  -> Firestore or migrated AWS-native database
  -> ElastiCache
  -> S3
  -> Background jobs / queues
```

## Production Folder Choice

Use these exact folders:

- Web production deploy: repository root
- Mobile production build: `mobile/`

Do not deploy test scripts, local build caches, or editor folders.

## Secrets and Configuration

Store these in AWS secret/config services instead of committing them:

- Firebase admin credentials
- JWT secret
- S3 credentials or IAM role configuration
- Redis URL/token
- mail server credentials

Recommended services:

- AWS Secrets Manager
- AWS Systems Manager Parameter Store

## Launch Checklist

- confirm `JWT_SECRET` is set in production
- confirm Firebase authorized domains include the production hostname
- confirm S3 bucket, CORS, and signed upload permissions
- confirm Redis connectivity for rate limiting and caching
- confirm mail credentials for password reset / alerts
- confirm admin-only routes use admin auth checks
- run `npm run lint`
- run `npm run build`
- run `flutter analyze` inside `mobile/`

## Important Constraint

This repository is AWS-hostable today, but it is not fully AWS-native yet because core auth and database flows still rely on Firebase. That is acceptable for launch. Treat a Firebase-to-AWS data/auth migration as a separate project.
