# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SV Naum Calendar is a React Native mobile application built with Expo SDK 54 for St. Naum Ohridski Church in Triengen, Switzerland. The app provides a 2026 church calendar with push notifications.

**App Name**: `Св. Наум Охридски • Триенген`
**Package**: `com.svnaum.calendar`
**EAS Project ID**: `ca6379d4-2b7a-4ea3-8aba-3a23414ae7cb`
**Version**: 2.0.0

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

# TypeScript check (run before commits)
npx tsc --noEmit
```

### EAS Cloud Builds

```bash
# Preview build (APK/internal iOS)
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview

# Production build (App Store / Play Store)
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
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
The app uses a root stack navigator with bottom tabs:

**Visible Bottom Tabs:**
- **Календар** - Main church calendar with events (`CalendarScreen`)
- **Новости** - News and announcements (`NewsScreen`)
- **Поставки** - Notification preferences (`NotificationSettingsScreen`)

**Hidden Admin Access:**
- Admin panel is NOT visible in tabs (security measure)
- Access: Tap the church header ("Св. Наум Охридски • Триенген, CH") **5 times within 3 seconds**
- Opens as modal overlay with Firebase authentication
- Admin session persists for 10 minutes of inactivity

### Core Services

**NotificationService** (`src/services/NotificationService.ts`)
- Singleton managing Expo push notifications
- Yearly scheduling: schedules current year + next year (when in December)
- Reminder types: 1 week, 1 day, 1 hour before events
- Android channels: `church-events`, `urgent-updates`
- Stores push tokens in Firebase Firestore (`pushTokens` collection)
- Admin push notifications go to ALL users regardless of reminder settings

**ChurchCalendarService** (`src/services/ChurchCalendarService.ts`)
- Contains `CHURCH_EVENTS` array (87 events for 2026)
- Service types: `LITURGY`, `EVENING_SERVICE`, `CHURCH_OPEN`, `PICNIC`

**DenoviImageService** (`src/services/DenoviImageService.ts`)
- Fetches saint images from `https://denovi.mk/synaxarion/[month]/[day]-020.jpg`
- Falls back to service-type icons on failure

**ValidationService** (`src/services/ValidationService.ts`)
- Input sanitization (XSS prevention, HTML stripping)
- URL validation (whitelist: `denovi.mk` only)
- Rate limiting for abuse prevention

**NewsService** (`src/services/NewsService.ts`)
- Firestore CRUD for news items
- Supports image galleries and video attachments

**Firebase** (`src/firebase.js`)
- Firestore collections: `pushTokens`, `customEvents`, `announcements`, `news`, `notificationHistory`
- Email/password authentication for admin access

### Authentication

**useAuth Hook** (`src/hooks/useAuth.ts`)
- Firebase email/password authentication
- 10-minute session timeout for admin
- Stores last activity timestamp in AsyncStorage

### Key Directories
- `src/screens/` - Main app screens (CalendarScreen, NewsScreen, NotificationSettingsScreen)
- `src/admin/screens/` - Admin dashboard and management screens
- `src/services/` - Business logic services
- `src/navigation/` - React Navigation configuration
- `src/hooks/` - Custom React hooks (useAuth, useNotificationSettings)
- `src/constants/` - Theme (`#831B26` primary), config, languages

### Theme Colors
- Primary: `#831B26` (burgundy)
- Service types: `LITURGY` (#8B1A1A), `EVENING_SERVICE` (#2C4A6E), `CHURCH_OPEN` (#8B5A2B), `PICNIC` (#CD853F)
- Card backgrounds: `#FFFDF8` (cream)
- Gold accents: `#D4AF37`

## Configuration Files

- `app.json` - Expo configuration, iOS encryption exemption (`ITSAppUsesNonExemptEncryption: false`)
- `eas.json` - Build profiles (preview: APK/internal, production: AAB/App Store)
- `metro.config.js` - Simplified default Expo config

## Build Profiles

| Profile | Android | iOS | Use Case |
|---------|---------|-----|----------|
| preview | APK | Internal distribution | Testing |
| production | AAB | App Store | Store release |

## Known Issues

### EAS Build iOS Credentials
iOS builds require interactive mode for Apple credentials. Run in terminal:
```bash
npx eas-cli build --platform ios --profile production
```

### Android SDK Setup
Create `android/local.properties` with SDK path:
```
sdk.dir=/path/to/Android/Sdk
```

### Image Assets
All image files (icon.png, splash.png, adaptive-icon.png) must be valid before running `expo prebuild`.

### Simulator Limitations
- Push notifications don't work in iOS Simulator
- Use the test button in Поставки tab (dev mode only) to test notification detail screen

## Language

The app uses Macedonian/Cyrillic text. UI labels are hardcoded in Macedonian. The `LanguageContext` provides internationalization infrastructure.
