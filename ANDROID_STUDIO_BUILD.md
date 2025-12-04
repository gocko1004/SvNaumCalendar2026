# 📱 Building Android App with Android Studio

## Pros of Building Locally

✅ **Full Control** - See exact errors in real-time  
✅ **Faster Debugging** - Fix issues immediately  
✅ **No Build Credits** - Doesn't use EAS build quota  
✅ **Better Error Messages** - More detailed logs  
✅ **Test Before Upload** - Verify the AAB works locally  

## Cons of Building Locally

❌ **Requires Setup** - Need Android Studio installed  
❌ **Manual Signing** - Need to create/configure keystore  
❌ **Local Environment** - May have different issues than EAS  
❌ **More Steps** - More manual work  

---

## Option 1: Fix Metro Error & Use EAS (Recommended First)

The Metro error `context.fileSystemLookup is not a function` is likely fixable. Let's try one more fix:

### Quick Fix to Try:
The issue might be with how Metro is being called during the build. We can try updating the build configuration.

**Try building again with the updated metro.config.js:**
```bash
eas build --platform android --profile production --clear-cache
```

---

## Option 2: Build Locally with Android Studio

If you want to build locally, here's how:

### Step 1: Open Project in Android Studio
1. Open Android Studio
2. File → Open
3. Navigate to: `SvNaumCalendar/android`
4. Click OK

### Step 2: Wait for Gradle Sync
- Android Studio will sync Gradle
- This may take 5-10 minutes first time
- Fix any errors that appear

### Step 3: Create Signing Keystore (if needed)
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

### Step 4: Configure Signing in build.gradle
Update `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword 'your-password'
        keyAlias 'release'
        keyPassword 'your-password'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### Step 5: Build AAB
1. Build → Generate Signed Bundle / APK
2. Select "Android App Bundle"
3. Select release keystore
4. Click Next → Finish

### Step 6: Find the AAB
Location: `android/app/build/outputs/bundle/release/app-release.aab`

---

## My Recommendation

**Try EAS one more time** with the Metro config fix, because:
1. ✅ EAS handles signing automatically
2. ✅ Consistent build environment
3. ✅ Easier for future updates
4. ✅ The Metro error is likely fixable

**If EAS still fails**, then build locally to:
1. See the exact error
2. Generate AAB manually
3. Upload to Play Store

---

## Which Do You Prefer?

**A) Try EAS build again** (I'll fix the Metro issue)  
**B) Build locally with Android Studio** (I'll guide you step-by-step)

Let me know and I'll help accordingly!

