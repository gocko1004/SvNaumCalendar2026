# Complete App Store Preparation Guide
## Св. Наум Охридски, Триенген

This guide will walk you through preparing your app for both **Apple App Store** and **Google Play Store**.

---

## 📋 PREPARATION CHECKLIST

### Before You Start:
- [ ] App is fully tested and working
- [ ] All features are implemented
- [ ] Privacy Policy is ready (you have PRIVACY_POLICY.md)
- [ ] App icons and splash screens are ready
- [ ] Screenshots of the app are prepared
- [ ] You have developer accounts:
  - [ ] Apple Developer Account ($99/year)
  - [ ] Google Play Developer Account ($25 one-time)

---

## PART 1: PREPARE APP CONFIGURATION

### Step 1: Update app.json

Make sure your `app.json` has all required fields:

```json
{
  "expo": {
    "name": "Св. Наум Охридски, Триенген",
    "slug": "sv-naum-calendar",
    "version": "1.0.0",  // Update for each release
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#831B26"
    },
    "ios": {
      "bundleIdentifier": "com.svnaum.calendar",
      "buildNumber": "1",  // Increment for each build
      "supportsTablet": true,
      "infoPlist": {
        "NSUserNotificationsUsageDescription": "We send notifications about church services and important events.",
        "NSCameraUsageDescription": "Not used in this app."
      }
    },
    "android": {
      "package": "com.svnaum.calendar",
      "versionCode": 1,  // Increment for each release
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#831B26"
      }
    }
  }
}
```

### Step 2: Verify Assets

Check that you have:
- ✅ `assets/icon.png` - 1024×1024 px (iOS & Android)
- ✅ `assets/adaptive-icon.png` - 1024×1024 px (Android)
- ✅ `assets/splash.png` - 1242×2436 px (or similar)

### Step 3: Update EAS Configuration

Update `eas.json` for production builds:

```json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "distribution": "internal"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "aab"  // AAB for Play Store (required)
      },
      "ios": {
        "bundleIdentifier": "com.svnaum.calendar"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"  // or "alpha", "beta", "production"
      },
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

---

## PART 2: ANDROID - GOOGLE PLAY STORE

### Step 1: Install EAS CLI

```powershell
npm install -g @expo/eas-cli
```

### Step 2: Login to Expo

```powershell
eas login
```

### Step 3: Configure EAS Build

```powershell
cd "C:\Users\Admin\Documents\Sv Naum Kalendar\SvNaumCalendar"
eas build:configure
```

### Step 4: Set Up Android Credentials

```powershell
eas credentials
```

**Select:**
- Platform: **Android**
- Action: **Set up new keystore**
- Option: **Generate new keystore**

**⚠️ IMPORTANT:** Save the keystore information securely! You'll need it for future updates.

### Step 5: Build Production AAB

```powershell
eas build --platform android --profile production
```

This will:
- Create an Android App Bundle (AAB) file
- Upload it to EAS servers
- Take 15-30 minutes

**Note:** AAB is required for Play Store (not APK)

### Step 6: Download the Build

After build completes:
```powershell
eas build:list
eas build:download [BUILD_ID]
```

Or download from: https://expo.dev/accounts/[your-account]/builds

### Step 7: Google Play Console Setup

#### 7.1 Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** Св. Наум Охридски, Триенген
   - **Default language:** Macedonian (mk)
   - **App or game:** App
   - **Free or paid:** Free
   - **Declarations:** Check all required boxes

#### 7.2 Store Listing

**Short description (80 characters max):**
```
Календар на богослужби и известувања за црковната општина Св. Наум Охридски.
```

**Full description:**
```
Оваа апликација служи како календар на богослужбите во црквата, како и за потребите и новостите во црковната општина Св. Наум Охридски, Триенген. 

Корисниците можат да ги следат датумите на службите, да примаат известувања и да останат информирани за важни активности и информации од општината. 

Апликацијата е едноставна за користење и достапна и офлајн за последно преземените податоци.

Features:
• Годишен календар на богослужби
• Push известувања за важни настани
• Информации за контакт
• Лесен пристап до социјален мрежи
• Офлајн пристап до календарот
```

**Graphics needed:**
- **App icon:** 512×512 px (you have this)
- **Feature graphic:** 1024×500 px (create this)
- **Phone screenshots:** At least 2, max 8
  - Minimum: 320×320 px
  - Recommended: 1080×1920 px or higher
- **Tablet screenshots (optional):** 7-inch and 10-inch

#### 7.3 Privacy Policy

1. Publish your privacy policy online:
   - Option 1: GitHub Pages (free)
   - Option 2: Google Sites (free)
   - Option 3: Your own website

2. Add the URL in Play Console → Store listing → Privacy policy

#### 7.4 Data Safety

In Play Console → Data safety:

**Data collection:**
- Personal info: **No**
- Device IDs: **No** (unless you use push notifications - then **Yes, for app functionality**)
- App activity: **No**
- App info: **No**

**Data usage:**
- App functionality: **Yes** (for notifications)
- Analytics: **No**
- Advertising: **No**

**Data sharing:**
- With third parties: **No**

#### 7.5 Content Rating

1. Complete the content rating questionnaire
2. For religious app: Select **"Everyone"** or **"Parental guidance"**

#### 7.6 Target Audience

- **Age range:** 18+ (or as you decide)
- **Primary audience:** Adults
- **Content guidelines:** Follow religious content guidelines

#### 7.7 Upload App Bundle

1. Go to **Release** → **Production**
2. Click **"Create new release"**
3. Upload the **AAB file** from EAS build
4. Add **Release notes** (in Macedonian):
   ```
   Прва верзија на апликацијата со:
   • Годишен календар на богослужби за 2025
   • Push известувања
   • Информации за контакт
   • Пристап до социјален мрежи
   ```

#### 7.8 Review and Submit

1. Review all sections (they should show green checkmarks)
2. Click **"Send for review"**
3. Wait for approval (usually 1-3 days)

---

## PART 3: iOS - APPLE APP STORE

### Step 1: Apple Developer Account

1. Sign up at [developer.apple.com](https://developer.apple.com)
2. Pay $99/year fee
3. Wait for approval (usually instant, but can take 24-48 hours)

### Step 2: Configure iOS in EAS

```powershell
eas credentials
```

**Select:**
- Platform: **iOS**
- Action: **Set up new credentials**
- Follow the prompts to set up:
  - Distribution certificate
  - Provisioning profile
  - App Store Connect API key (optional but recommended)

### Step 3: Build for iOS

```powershell
eas build --platform ios --profile production
```

This will:
- Create an iOS app archive
- Take 20-40 minutes
- Require you to be logged into Apple Developer account

### Step 4: App Store Connect Setup

#### 4.1 Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Св. Наум Охридски, Триенген
   - **Primary language:** Macedonian
   - **Bundle ID:** com.svnaum.calendar
   - **SKU:** sv-naum-calendar-001 (unique identifier)
   - **User access:** Full Access

#### 4.2 App Information

**Category:**
- Primary: **Lifestyle**
- Secondary: **Education** (optional)

**Privacy Policy URL:**
- Add your published privacy policy URL

**Support URL:**
- Your website or contact page

#### 4.3 Pricing and Availability

- **Price:** Free
- **Availability:** All countries (or select specific)

#### 4.4 App Store Listing

**Name (30 characters max):**
```
Св. Наум Охридски
```

**Subtitle (30 characters max):**
```
Црковен календар
```

**Description:**
```
Оваа апликација служи како календар на богослужбите во црквата, како и за потребите и новостите во црковната општина Св. Наум Охридски, Триенген.

Корисниците можат да ги следат датумите на службите, да примаат известувања и да останат информирани за важни активности и информации од општината.

Апликацијата е едноставна за користење и достапна и офлајн за последно преземените податоци.

Клучни функции:
• Годишен календар на богослужби
• Push известувања за важни настани
• Информации за контакт
• Лесен пристап до социјален мрежи
• Офлајн пристап до календарот
```

**Keywords (100 characters max):**
```
православие,црква,календар,литургија,Триенген,Св.Наум,Охридски,црковна општина,служби,известувања
```

**Promotional text (170 characters):**
```
Календар на богослужби и известувања за црковната општина Св. Наум Охридски, Триенген. Останете информирани за важни настани.
```

**Graphics needed:**
- **App icon:** 1024×1024 px (you have this)
- **Screenshots:**
  - iPhone 6.7" (1290×2796 px): At least 1, max 10
  - iPhone 6.5" (1242×2688 px): At least 1, max 10
  - iPhone 5.5" (1242×2208 px): Optional
  - iPad Pro 12.9" (2048×2732 px): Optional
- **App preview video:** Optional

#### 4.5 Version Information

**What's New in This Version:**
```
Прва верзија на апликацијата со:
• Годишен календар на богослужби за 2025
• Push известувања
• Информации за контакт
• Пристап до социјален мрежи
```

#### 4.6 App Privacy

**Data Collection:**
- Do you collect data? **No** (or **Yes** if you use push notifications)
- If Yes, specify:
  - Device ID: **Yes** (for push notifications)
  - Purpose: **App Functionality**
  - Linked to user: **No**
  - Used for tracking: **No**

#### 4.7 Submit for Review

1. Go to **App Store** tab
2. Click **"+"** next to **iOS App**
3. Select your build from EAS
4. Fill in **Export Compliance** (usually "No" for this app)
5. Fill in **Advertising Identifier** (usually "No")
6. Add **Review Notes** if needed
7. Click **"Submit for Review"**

**Review time:** Usually 24-48 hours, can take up to 7 days

---

## PART 4: POST-SUBMISSION

### Monitor Status

**Google Play:**
- Check Play Console → Dashboard
- Respond to any review feedback

**App Store:**
- Check App Store Connect → App Store → App Review
- Respond to any review feedback

### After Approval

1. **Monitor reviews and ratings**
2. **Respond to user questions**
3. **Plan updates:**
   - Update version in `app.json`
   - Increment `versionCode` (Android) and `buildNumber` (iOS)
   - Build new version
   - Submit update

---

## 📸 SCREENSHOT REQUIREMENTS

### Android (Google Play)

**Phone screenshots:**
- Minimum: 320×320 px
- Recommended: 1080×1920 px
- Format: PNG or JPEG
- Count: 2-8 images

**Feature graphic:**
- Size: 1024×500 px
- Format: PNG or JPEG (no transparency)

### iOS (App Store)

**iPhone screenshots:**
- 6.7" display: 1290×2796 px
- 6.5" display: 1242×2688 px
- 5.5" display: 1242×2208 px
- Format: PNG or JPEG
- Count: 1-10 images per size

**iPad screenshots (optional):**
- 12.9" Pro: 2048×2732 px

---

## 🔧 USEFUL COMMANDS

```powershell
# Check build status
eas build:list

# Download build
eas build:download [BUILD_ID]

# Submit to stores (if configured)
eas submit --platform android
eas submit --platform ios

# Check credentials
eas credentials

# View build logs
eas build:view [BUILD_ID]
```

---

## ⚠️ COMMON ISSUES

### Android

**Issue:** "AAB file too large"
- **Solution:** Optimize images, remove unused assets

**Issue:** "Privacy policy URL invalid"
- **Solution:** Make sure URL is publicly accessible, not behind login

**Issue:** "Missing feature graphic"
- **Solution:** Create 1024×500 px image

### iOS

**Issue:** "Missing app icon"
- **Solution:** Ensure icon.png is 1024×1024 px

**Issue:** "Bundle identifier already exists"
- **Solution:** Use unique bundle ID or claim existing app

**Issue:** "Missing screenshots"
- **Solution:** Take screenshots on actual device or simulator

---

## 📞 SUPPORT

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **Google Play Help:** https://support.google.com/googleplay/android-developer
- **App Store Connect Help:** https://help.apple.com/app-store-connect/
- **Your Email:** svnaum.triengen@gmail.com

---

## ✅ FINAL CHECKLIST

Before submitting:

- [ ] App is fully tested
- [ ] Version numbers are correct
- [ ] All assets are prepared (icons, screenshots)
- [ ] Privacy policy is published online
- [ ] Store listings are complete
- [ ] Data safety/privacy sections are filled
- [ ] Content rating is complete
- [ ] Build is successful and downloaded
- [ ] Release notes are written
- [ ] Contact information is correct

---

**Good luck with your app submission! 🚀**

