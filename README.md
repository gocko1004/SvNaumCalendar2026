# Св. Наум Календар

Mobile application for St. Naum Church calendar events and notifications.

## Features

- Complete church calendar for 2025
- Push notifications for all services
- Notifications 24 hours and 1 hour before events
- Support for different types of services:
  - Liturgies
  - Evening Services
  - Church Open Hours
  - Picnics and Special Events

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

## Deployment Instructions

### iOS Deployment

1. Install Xcode from the Mac App Store
2. Open an Apple Developer Account
3. In Xcode:
   - Open `ios/SvNaumCalendar.xcworkspace`
   - Select your team in signing & capabilities
   - Set up your provisioning profile
4. Build the app:
```bash
cd ios
pod install
cd ..
npm run ios
```

### Android Deployment

1. Install Android Studio
2. Generate a keystore:
```bash
keytool -genkey -v -keystore sv-naum-calendar.keystore -alias sv-naum-calendar -keyalg RSA -keysize 2048 -validity 10000
```
3. Place the keystore in `android/app`
4. Build the app:
```bash
cd android
./gradlew assembleRelease
```

The release APK will be in `android/app/build/outputs/apk/release/`

## Publishing

### App Store (iOS)

1. Create an app in App Store Connect
2. Fill in all required information:
   - App description
   - Screenshots
   - Privacy policy
3. Upload build through Xcode
4. Submit for review

### Google Play Store

1. Create a developer account
2. Create a new application
3. Fill in the store listing:
   - App description
   - Screenshots
   - Privacy policy
4. Upload the signed APK/Bundle
5. Submit for review

## Support

For support, please contact [your-email@example.com]
