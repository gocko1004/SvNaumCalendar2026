# 🔧 Building Android AAB Locally with Android Studio

## Step-by-Step Guide

### Step 1: Open Project in Android Studio

1. **Open Android Studio**
2. **File → Open**
3. Navigate to: `C:\Users\Admin\Documents\Sv Naum Kalendar\SvNaumCalendar\android`
4. Click **OK**
5. Wait for Gradle sync to complete (5-10 minutes first time)

### Step 2: Wait for Gradle Sync

- Android Studio will automatically sync Gradle
- Watch the bottom status bar for progress
- Fix any errors that appear in the "Build" tab

### Step 3: Create Release Keystore (One-Time Setup)

Open terminal in Android Studio (View → Tool Windows → Terminal) or use PowerShell:

```powershell
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

**When prompted, enter:**
- Password: (choose a strong password - **SAVE THIS!**)
- Name: Your name
- Organizational Unit: (optional)
- Organization: (optional)
- City: (optional)
- State: (optional)
- Country: MK (or your country code)

**⚠️ IMPORTANT:** Save the keystore file and password securely! You'll need it for all future updates.

### Step 4: Configure Signing in build.gradle

Edit `android/app/build.gradle`:

Find the `signingConfigs` section (around line 120) and update it:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

Then update `buildTypes`:

```gradle
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release
        shrinkResources false
        minifyEnabled false
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

### Step 5: Create gradle.properties for Signing

Create or edit `android/gradle.properties` and add:

```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=release
MYAPP_RELEASE_STORE_PASSWORD=your-keystore-password
MYAPP_RELEASE_KEY_PASSWORD=your-keystore-password
```

**⚠️ SECURITY:** Add `gradle.properties` to `.gitignore` to avoid committing passwords!

### Step 6: Build AAB

**Option A: Using Android Studio GUI**
1. **Build → Generate Signed Bundle / APK**
2. Select **"Android App Bundle"**
3. Click **Next**
4. Select **release** keystore
5. Enter password and key alias
6. Click **Next**
7. Select **release** build variant
8. Click **Finish**

**Option B: Using Command Line**
```powershell
cd android
.\gradlew bundleRelease
```

### Step 7: Find Your AAB File

The AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Step 8: Upload to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Production** → **Create new release**
4. Upload the AAB file
5. Add release notes
6. Submit for review

---

## Troubleshooting

### Error: "Gradle sync failed"
- Check internet connection
- Try: **File → Invalidate Caches → Invalidate and Restart**

### Error: "Keystore not found"
- Make sure `release.keystore` is in `android/app/` folder
- Check the path in `gradle.properties`

### Error: "Metro bundler error"
- This is the same error we're seeing in EAS
- Building locally might show more details
- Try: **Build → Clean Project** then rebuild

### Error: "Out of memory"
- Increase memory in `android/gradle.properties`:
  ```
  org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
  ```

---

## Quick Command Summary

```powershell
# Navigate to project
cd "C:\Users\Admin\Documents\Sv Naum Kalendar\SvNaumCalendar"

# Create keystore (one time)
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000

# Build AAB
cd ..\..
cd android
.\gradlew bundleRelease

# Find AAB
# Location: android/app/build/outputs/bundle/release/app-release.aab
```

---

**Ready to start?** Open Android Studio and follow Step 1!

