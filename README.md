# Odyssey

**Every journey matters.** A premium personal travel companion — your permanent archive of every place you've ever visited.

Phase 1 + 2: foundation, design system, Supabase authentication, and an interactive world map with country statuses (visited / lived / wishlist / transit / favorite).

## Tech stack

- **Expo SDK 56** + TypeScript + Expo Router (file-based routing, `src/app/`)
- **NativeWind v4** (Tailwind) with a custom "Sunfaded Atlas" design system — light-first, warm cream + deep teal + terracotta, full dark mode
- **MapLibre React Native** — fully offline, self-contained world map rendered from bundled Natural Earth polygons (no tile servers, no API keys)
- **Supabase** — auth (email + Google) and Postgres with row-level security
- **TanStack Query** (server state, optimistic updates), **Zustand** (client state), **React Hook Form + Zod** (forms)

## Project structure

```
src/app/           Expo Router routes: (auth), (tabs), country/[iso]
src/components/ui  Design-system components (Button, Input, Card, Chip, ...)
src/features/      auth/, countries/, map/
src/lib/           supabase client, theme tokens, query client
src/stores/        Zustand stores
src/data/          Generated country dataset
assets/geo/        Generated world GeoJSON (Natural Earth 1:50m)
supabase/          SQL migrations
scripts/           generate-geo.js (regenerates geo assets)
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In the dashboard, open **SQL Editor** and run the contents of `supabase/migrations/0001_init.sql`.
3. Copy **Project Settings → API → Project URL** and **anon public key** into a `.env` file:

```bash
cp .env.example .env
# then fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

4. In **Authentication → URL Configuration**, add `odyssey://` to the Redirect URLs.

### 3. Google Sign-In (optional, can be done later)

1. In Google Cloud Console, create OAuth credentials (Web application type) and copy the client ID + secret.
2. In Supabase **Authentication → Sign In / Providers → Google**, enable it and paste the credentials.
3. Add the Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) to the Google OAuth client's authorized redirect URIs.

Email/password auth works without this step.

### 4. Development build (required — MapLibre is a native module, Expo Go won't work)

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Install the APK from the build link on your Android device, then:

```bash
npx expo start
```

Scan the QR code with the dev build. Day-to-day JS/UI changes never need a rebuild — only adding new native modules does.

## Regenerating geo data

```bash
node scripts/generate-geo.js
```

Rebuilds `assets/geo/countries.geo.json` and `src/data/countries.json` from `world-atlas` + `world-countries`.

## Roadmap

- **Phase 3** — Cities & trips (multi-stop itineraries, transport modes)
- **Phase 4** — Passport statistics dashboard and charts
- **Phase 5** — Passport stamps, offline sync, Play Store release
