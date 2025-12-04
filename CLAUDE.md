# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SV Naum Calendar is a React Native mobile application built with Expo SDK 51 for St. Naum Church in Triengen. The app provides a church calendar with push notifications for services and events, targeting both iOS and Android platforms.

**Package**: `com.svnaum.calendar`
**Expo Owner**: `mpc_triengen_sv_naum`
**EAS Project ID**: `ca6379d4-2b7a-4ea3-8aba-3a23414ae7cb`

## Development Commands

### Basic Development
```bash
# Install dependencies
npm install

# Start development server (Metro bundler)
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator/device
npm run ios

# Run web version
npm run web
```

### Building

#### Local Android Debug Build
```bash
# Generate native Android code
npx expo prebuild --platform android

# Build debug APK (Windows batch script)
cd android
call build-android.bat
```

The debug APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### EAS Cloud Builds
```bash
# Preview build (APK for internal testing)
npx eas-cli build --platform android --profile preview

# Production build (AAB for Play Store)
npx eas-cli build --platform android --profile production

# iOS production build (requires Apple Developer account)
npx eas-cli build --platform ios --profile production

# Check build status
npx eas-cli build:view <build-id>

# List all builds
npx eas-cli build:list
```

### Testing & Web Deployment
```bash
# Build for web deployment (Vercel)
npm run vercel-build
# Output: web-build/

# Standard web export
npm run build
```

## Architecture

### Navigation Structure
The app uses React Navigation with a bottom tab navigator as the main interface:
- **Calendar Tab** (`CalendarScreen`): Main church calendar view showing events
- **Settings Tab** (`NotificationSettingsScreen`): User notification preferences
- **Admin Tab** (`AdminNavigator`): Nested stack navigator for admin functions (requires authentication)

### Core Services

#### NotificationService (Singleton)
Handles all push notification logic with yearly event scheduling:
- Configures Android notification channels (`church-events`, `urgent-updates`)
- Registers devices with Expo Push Notification service
- Stores push tokens in Firebase Firestore (`pushTokens` collection)
- **Yearly scheduling system**: Automatically schedules notifications for current year's remaining events and next year's events when in December
- Schedules three types of reminders: 1 week before, 1 day before, 1 hour before (configurable)
- Manages notification settings in AsyncStorage
- Can send custom push notifications to all registered devices via admin interface

#### ChurchCalendarService
Contains hardcoded calendar data (`CHURCH_EVENTS_2026` - 87 events) with service types:
- `LITURGY`: Regular church services
- `EVENING_SERVICE`: Evening prayers/services
- `CHURCH_OPEN`: Church open hours
- `PICNIC`: Special community events

**Latest Update (Dec 2, 2025)**: Calendar updated to 2026 data from PDF "Годишен план на Богослужби за 2026 Година.pdf"

#### DenoviImageService (NEW)
Fetches saint images dynamically from denovi.mk:
- URL pattern: `https://denovi.mk/synaxarion/[month]/[day]-020.jpg`
- Automatic image URL generation for each event date
- Fallback to service-type icons if images fail to load
- Images display in CalendarScreen for each church event

#### Firebase Integration
Uses Firebase Firestore for:
- Push token storage (`pushTokens` collection)
- Admin authentication
- Event management (admin features)

Configuration is in `src/firebase.js` (not TypeScript).

### Language Support
The app has a `LanguageContext` for internationalization, primarily supporting Macedonian/Cyrillic text. UI labels are hardcoded in Macedonian (e.g., "Годишен План 2026 година").

### Theme & Styling
- Primary color: `#831B26` (dark red - church branding)
- Uses `react-native-paper` for Material Design components
- Theme defined in `src/constants/theme.ts`
- Brand colors also in `src/constants/config.ts`

## Android Build Configuration

### Critical Files for Android
1. **`android/local.properties`** - SDK location (REQUIRED, not in git)
   ```
   sdk.dir=C\\:\\\\Users\\\\Admin\\\\AppData\\\\Local\\\\Android\\\\Sdk
   ```

2. **`android/build-android.bat`** - Custom build script for Windows/WSL
   ```batch
   set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
   cd C:\dev\SvNaumKalendarClaude\SVNaumCalendarUpdate\android
   call gradlew.bat assembleDebug
   ```

3. **`android/app/build.gradle`**
   - Package: `com.svnaum.calendar`
   - Uses debug keystore for both debug and release builds (production uses EAS credentials)
   - Expo SDK 51 compatible configuration with React Native 0.74.5

### Build Profile Differences (eas.json)
- **preview**: Builds APK for internal distribution/testing
- **production**: Builds AAB (Android App Bundle) for Play Store, sets `NODE_ENV=production`

## Common Issues & Solutions

### Metro Bundler Patches
**CRITICAL**: Metro bundler requires patching to fix `_logLines` undefined errors.

**Before running the app for the first time:**
```bash
node scripts/fix-build-all.js
```

This script patches `@expo/cli` to fix logging issues in Metro. The fix scripts are located in `scripts/` directory:
- `fix-build-all.js` - Main fix script (run this first)
- `fix-expo-cli-logging.js` - Fixes Metro logging errors
- `fix-metro-terminal-reporter.js` - Additional Metro fixes

If you encounter "Cannot read properties of undefined (reading 'push')" errors when starting Metro, run the fix script again.

### Android SDK Not Found
Create `android/local.properties` with the correct SDK path for your system. Common locations:
- Windows: `C:\Users\<username>\AppData\Local\Android\Sdk`
- macOS: `~/Library/Android/sdk`
- Linux: `~/Android/Sdk`

### Java Not Found
The `build-android.bat` script sets JAVA_HOME to Android Studio's bundled JBR. For other environments:
- Ensure Java 17+ is installed
- Set JAVA_HOME environment variable
- Or modify build scripts to use Android Studio's JBR path

### Image Assets
All image assets (icon.png, splash.png, adaptive-icon.png) must exist and be valid image files before running `expo prebuild`. Empty or corrupted image files will cause prebuild to fail.

## Admin Features

The admin section requires authentication and provides:
- Custom notification sending to all users
- Calendar event management
- Location management
- Special events management

Admin screens are in `src/admin/screens/`.

## Firebase Configuration

The app uses Firebase for backend services. The Firebase config is in `src/firebase.js`. Ensure this file has valid credentials before running the app, or comment out Firebase imports if not using backend features during development.

## Social Media Integration

The app has a `SocialMediaService` that can post events to social media (currently disabled via feature flags in `src/constants/config.ts`). Facebook integration requires:
- Facebook App ID and Secret in `.env`
- Facebook Access Token
- Feature flag `ENABLE_SOCIAL_SHARING` set to true

---

## Recent Updates (December 2, 2025)

### 2026 Calendar Integration
- ✅ Updated calendar from 2025 to 2026 (87 events total)
- ✅ Data extracted from PDF: "Годишен план на Богослужби за 2026 Година.pdf"
- ✅ All events verified and mapped to correct service types

### Image Integration (denovi.mk)
- ✅ Created `DenoviImageService.ts` for dynamic image fetching
- ✅ Images load from: `https://denovi.mk/synaxarion/[month]/[day]-020.jpg`
- ✅ Added `imageUrl` field to `ChurchEvent` interface
- ✅ Updated `CalendarScreen.tsx` to display saint images
- ✅ Fallback to service-type icons if images fail to load

### Files Modified
1. `src/services/ChurchCalendarService.ts` - Updated to 2026 events
2. `src/services/DenoviImageService.ts` - NEW: Image fetching service
3. `src/screens/CalendarScreen.tsx` - Updated image display logic
4. `src/admin/screens/AdminDashboardScreen.tsx` - Updated to use 2026 data
5. `src/admin/screens/ManageCalendarScreen.tsx` - Updated to use 2026 data
6. `src/services/NotificationService.ts` - Updated to use 2026 data
7. `scripts/fix-build-all.js` - Added Metro bundler fix script

### TypeScript Compilation
✅ All files pass TypeScript compilation (`npx tsc --noEmit`)

### Known Issues
- **Metro Bundler**: Requires running `node scripts/fix-build-all.js` before first start
- **Web Version**: May show blank screen on first load - investigating (possibly loading screen timeout or rendering issue)
- **QR Code Connection**: Tunnel mode (`npx expo start --tunnel`) may be required for cross-network connections

### Testing Status
- ✅ TypeScript compilation: PASSED
- ⏳ Mobile app testing: PENDING (QR code connection issues)
- ⏳ Web version: PENDING (blank screen investigation needed)
