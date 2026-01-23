# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SV Naum Calendar is a React Native mobile application built with Expo SDK 54 for St. Naum Ohridski Church in Triengen, Switzerland. The app provides a 2026 church calendar with push notifications.

**App Name**: `Св. Наум Охридски • Триенген`
**Package**: `com.svnaum.calendar`
**Version**: 2.0.1 (build 19)
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

# Force fresh build (if caching issues)
npx eas-cli build --platform ios --profile production --clear-cache
```

### App Store Submission

```bash
# Submit latest iOS build to App Store Connect/TestFlight
npx eas-cli submit --platform ios --latest

# Submit latest Android build to Play Store
npx eas-cli submit --platform android --latest
```

**Important**: Before each submission, increment build numbers in **BOTH** locations:
1. `app.json` - `ios.buildNumber` and `android.versionCode`
2. **Native iOS files** (since `ios/` directory exists):
   - `ios/SvNaumOhridskiTriengen/Info.plist` - `CFBundleVersion` and `CFBundleShortVersionString`
   - `ios/SvNaumOhridskiTriengen.xcodeproj/project.pbxproj` - `CURRENT_PROJECT_VERSION`

**CRITICAL**: When `ios/` directory exists, EAS ignores `app.json` build numbers and uses native values!

## Architecture

### Entry Points
- `App.tsx` - React Native entry point (uses `react-native-paper`, `LanguageProvider`, `AppNavigator`)
- `src/App.js` - Web version entry point (uses `react-router-dom`, Material UI)

### Navigation (React Navigation)
The app uses a root stack navigator with bottom tabs:

**Visible Bottom Tabs:**
- **Календар** - Main church calendar with events (`CalendarScreen`)
- **Новости** - News and announcements (`NewsScreen`)
- **Известувања** - Notification history with badge count (`UserNotificationHistoryScreen`)
- **Поставки** - Notification preferences (`NotificationSettingsScreen`)

**Hidden Admin Access:**
- Admin panel is NOT visible in tabs (security measure)
- Access: Tap the church header ("Св. Наум Охридски • Триенген, CH") **5 times within 3 seconds**
- Opens as modal overlay with Firebase authentication
- Session options: 10 minutes default, 7 days with "keep logged in"

### Core Services

**NotificationService** (`src/services/NotificationService.ts`)
- Singleton managing Expo push notifications
- Yearly scheduling: schedules current year + next year (when in December)
- Reminder types: 1 week, 1 day, 1 hour before events
- Android channels: `church-events`, `urgent-updates`
- Stores push tokens in Firebase Firestore (`pushTokens` collection)
- Admin push notifications go to ALL users regardless of reminder settings
- **Expo has 100 message batch limit** - notifications are chunked into batches of 50

**NotificationHistoryService** (`src/services/NotificationHistoryService.ts`)
- Stores sent notifications in Firestore (`notificationHistory` collection)
- 30-day retention with auto-cleanup
- Badge count system using AsyncStorage for "last seen" timestamp
- Users can delete individual notifications
- Stores `fullBody` for complete notification text in detail view
- Stores `data` for navigation (e.g., news object for direct NewsDetail navigation)

**ParkingService** (`src/services/ParkingService.ts`)
- Manages parking locations and rules
- Sends parking notifications with Google Maps links
- Stores data in Firestore: `parkingLocations`, `parkingRules`, `parkingSettings`

**ChurchCalendarService** (`src/services/ChurchCalendarService.ts`)
- Contains `CHURCH_EVENTS` array (87 events for 2026)
- Service types: `LITURGY`, `EVENING_SERVICE`, `CHURCH_OPEN`, `PICNIC`

**ValidationService** (`src/services/ValidationService.ts`)
- Input sanitization (XSS prevention, HTML stripping)
- URL validation for external links
- Document ID validation to prevent path traversal

**Firebase** (`src/firebase.js`)
- Firestore collections: `pushTokens`, `customEvents`, `announcements`, `news`, `notificationHistory`, `parkingLocations`, `parkingRules`
- Email/password authentication for admin access
- Auth persistence via AsyncStorage

### Authentication

**useAuth Hook** (`src/hooks/useAuth.ts`)
- Firebase email/password authentication
- Session timeout: 10 minutes default, 7 days with "keep logged in"
- Username without @ gets `@svnaumcalendar.firebaseapp.com` suffix

### Key Directories
- `src/screens/` - Main app screens
- `src/admin/screens/` - Admin dashboard and management screens
- `src/services/` - Business logic services
- `src/navigation/` - React Navigation configuration
- `src/hooks/` - Custom React hooks
- `src/constants/` - Theme, config, languages

### Theme Colors
- Primary: `#831B26` (burgundy)
- Service types: `LITURGY` (#8B1A1A), `EVENING_SERVICE` (#2C4A6E), `CHURCH_OPEN` (#8B5A2B), `PICNIC` (#CD853F)
- Card backgrounds: `#FFFDF8` (cream)

## Configuration Files

- `app.json` - Expo configuration, build numbers, iOS encryption exemption
- `eas.json` - Build profiles, `appVersionSource: local` means build numbers from app.json
- `metro.config.js` - Default Expo metro config

## Build Profiles

| Profile | Android | iOS | Use Case |
|---------|---------|-----|----------|
| preview | APK | Internal distribution | Testing |
| production | AAB | App Store | Store release |

## Firebase Notes

- Firebase API key is in `src/firebase.js` - this is public by design for client apps
- Security comes from Firebase Security Rules, not the API key
- Admin users are managed in Firebase Console → Authentication → Users
- API key restrictions in Google Cloud Console may break Firebase Auth - use with caution

### Firebase Security Rules
The `notificationHistory` collection requires **public read** access for users to see their notification history:
```javascript
match /notificationHistory/{document=**} {
  allow read: if true;  // Users can read
  allow write: if request.auth != null;  // Only admins can write
}
```

## Known Issues

### Simulator Limitations
- Push notifications don't work in iOS Simulator
- Test on physical device via TestFlight for notification testing

### Android Status Bar
- App uses `SafeAreaProvider` from `react-native-safe-area-context` at root level
- Screens use `useSafeAreaInsets()` hook for proper status bar handling
- `app.json` has `android.statusBar.translucent: true` for edge-to-edge design

### Android Emulator on Mac
- Use correct Android Studio version: **Intel Macs need "Mac (Intel)"**, Apple Silicon needs ARM version
- API 36 emulators can be slow on Intel Macs - consider using API 33-34 or real device
- Android SDK location: `~/Library/Android/sdk/`

### EAS Build Caching
If build numbers don't update, use `--clear-cache` flag.

### Play Store Signing Key
- EAS uses a different keystore than the original Play Store upload
- Automatic `eas submit --platform android` fails due to signing key mismatch
- **Manual upload required**: Download AAB from EAS build artifacts and upload via Play Console
- Play Console path: Release → Production → Create new release → Upload AAB
- To fix: Either upload original keystore to EAS (`eas credentials`) or request upload key reset in Play Console

### iOS App Store Submission
- `eas submit --platform ios --latest` works with Apple credentials
- Build appears in App Store Connect with "Processing" status (5-30 min)
- After processing: available for TestFlight or App Store Review

## Language

The app uses Macedonian/Cyrillic text. UI labels are hardcoded in Macedonian.

## Claude Code Guidelines

- **ALWAYS ask before running EAS builds** - builds cost money and use limited credits
- Run `npx tsc --noEmit` before builds to check for TypeScript errors
- Test on simulator before building for production

## Website Project (mpc-triengen.ch)

Embeddable widgets for the church WordPress website are in:
`/Users/gocepetrov/Documents/SvNaumCalendar2026/mpctriengen-website/`

### Hero Slider Widget (IN PROGRESS)

**File:** `hero-slider-embed.html`

**Purpose:** Hero slider showing upcoming events from WordPress + calendar events

**Current Status:**
- Fetches from WordPress REST API `/wp/v2/posts`
- WordPress has **media REST API blocked** - slider fetches post page HTML to extract image
- Calendar events show as text-only (centered)
- WordPress posts with Featured Image show with image on left, text on right
- 12 second slide duration, smooth horizontal transitions

**WordPress Limitations:**
- `nastani` custom post type does NOT have REST API enabled (returns 404)
- Media REST API returns 401 "rest_forbidden"
- Must use regular Posts and scrape og:image from post page

**To add event to slider:**
1. WordPress → Објави (Posts) → New/Edit post
2. Title format: `DD.MM.YYYY - Event Name` (e.g., `19.01.2026 - Богојавление`)
3. Add Featured Image (right sidebar)
4. Publish

**TODO:**
- User needs to upload correct featured image in WordPress
- Current featured image on test post is `19-010.jpg` (old image from 2024)

### Calendar Embed Widget

**File:** `calendar-embed.html` - Working, embeds the church calendar
