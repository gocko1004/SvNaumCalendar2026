# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SV Naum Calendar is a React Native mobile application built with Expo SDK 51 for St. Naum Ohridski Church in Triengen, Switzerland. The app provides a 2026 church calendar with push notifications.

**Package**: `com.svnaum.calendar`
**EAS Project ID**: `ca6379d4-2b7a-4ea3-8aba-3a23414ae7cb`

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on platforms
npm run android
npm run ios
npm run web

# Build for web (Vercel deployment)
npm run vercel-build
```

### EAS Cloud Builds

```bash
# Preview build (APK/internal iOS)
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview

# Production build (AAB for Play Store)
npx eas-cli build --platform android --profile production

# TypeScript check
npx tsc --noEmit
```

### Local Native Builds

```bash
# Generate native projects
npx expo prebuild

# Run locally
npx expo run:ios
npx expo run:android
```

## Architecture

### Entry Points
- `App.tsx` - React Native entry point (uses `react-native-paper`, `LanguageProvider`, `AppNavigator`)
- `src/App.js` - Web version entry point (uses `react-router-dom`, Material UI)

### Navigation (React Navigation)
The app uses bottom tab navigation with three main sections:
- **Calendar Tab** - Main church calendar with events
- **Settings Tab** - Notification preferences
- **Admin Tab** - Protected admin features (nested stack navigator)

### Core Services

**NotificationService** (`src/services/NotificationService.ts`)
- Singleton managing Expo push notifications
- Yearly scheduling: schedules current year + next year (when in December)
- Reminder types: 1 week, 1 day, 1 hour before events
- Android channels: `church-events`, `urgent-updates`
- Stores push tokens in Firebase Firestore (`pushTokens` collection)

**ChurchCalendarService** (`src/services/ChurchCalendarService.ts`)
- Contains `CHURCH_EVENTS_2026` array (87 events)
- Service types: `LITURGY`, `EVENING_SERVICE`, `CHURCH_OPEN`, `PICNIC`

**DenoviImageService** (`src/services/DenoviImageService.ts`)
- Fetches saint images from `https://denovi.mk/synaxarion/[month]/[day]-020.jpg`
- Falls back to service-type icons on failure

**Firebase** (`src/firebase.js`)
- Firestore collections: `pushTokens`, `customEvents`
- Email/password authentication for admin access

### Key Directories
- `src/screens/` - Main app screens (CalendarScreen, NotificationSettingsScreen)
- `src/admin/screens/` - Admin dashboard and management screens
- `src/services/` - Business logic services
- `src/navigation/` - React Navigation configuration
- `src/constants/` - Theme (`#831B26` primary), config, languages

## Configuration Files

- `app.json` - Expo configuration, iOS encryption exemption (`ITSAppUsesNonExemptEncryption: false`)
- `eas.json` - Build profiles (preview: APK/internal, production: AAB)
- `metro.config.js` - Simplified default Expo config (5 lines)

## Build Profiles

| Profile | Android | iOS | Use Case |
|---------|---------|-----|----------|
| preview | APK | Internal distribution | Testing |
| production | AAB | App Store | Store release |

## Known Issues

### EAS Build Metro Errors
If builds fail with Metro bundler errors, building locally on Mac with Xcode is more reliable than EAS cloud builds.

### Android SDK Setup
Create `android/local.properties` with SDK path:
```
sdk.dir=/path/to/Android/Sdk
```

### Image Assets
All image files (icon.png, splash.png, adaptive-icon.png) must be valid before running `expo prebuild`.

## Language

The app uses Macedonian/Cyrillic text. UI labels are hardcoded in Macedonian (e.g., "Годишен План 2026 година"). The `LanguageContext` provides internationalization infrastructure.
