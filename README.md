# Tana Maaro

Tana Maaro is a combined product repository containing:

- the public website and web application in the repository root
- the mobile application in [`mobile/`](/Users/vivekkoteshriwal/Documents/Tana Maaro Web V1 copy 2/mobile)

The root app is a Next.js application that serves both the marketing site and the authenticated web experience. The mobile client is a Flutter application that shares the same Firebase/Firestore data model.

## Deployable Folders

- Web app + website: repository root
- Mobile app: [`mobile/`](/Users/vivekkoteshriwal/Documents/Tana Maaro Web V1 copy 2/mobile)

## Project Structure

```text
.
├── app/                 # Next.js routes, pages, and API handlers
├── components/          # Shared React UI by domain
├── lib/                 # Auth, DB, Firebase, Redis, S3, utilities
├── public/              # Static web assets
├── scripts/             # Operational scripts
├── mobile/              # Flutter mobile app
│   ├── lib/
│   ├── assets/
│   ├── android/
│   └── ios/
├── firebase.json
├── firestore.rules
├── storage.rules
└── next.config.ts
```

## Local Development

### Web

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Note: the `dev` script uses Webpack intentionally. Turbopack currently mis-resolves CSS imports from this repo path and is kept only as an opt-in fallback via `npm run dev:turbo`.

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Environment

The web application expects Firebase, Redis, JWT, mail, and S3 configuration in `.env.local`.

Core integrations currently in use:

- Firebase Auth
- Firestore
- Firebase Storage rules files
- Redis cache / rate limiting
- AWS S3 signed uploads

## Current Architecture Notes

- Website and web app are intentionally combined in one Next.js deployment.
- API routes live under `app/api/*`.
- The source of truth for user, post, event, and battle data is Firestore.
- Mobile and web should stay schema-compatible because they operate on the same Firebase data.

## Cleanup Notes

Recent cleanup removed:

- obsolete JSON file database fallback
- unused phone-auth web flow
- legacy Mongoose-only model files
- test scripts and log artifacts
- local editor/build/cache directories

## Deployment

Use the repository root for web deployment. Use [`docs/aws-deployment.md`](/Users/vivekkoteshriwal/Documents/Tana Maaro Web V1 copy 2/docs/aws-deployment.md) for the recommended AWS launch plan and service mapping.
