# 🔧 Android Build Fix Guide

## Current Issue
Gradle build failed with unknown error during EAS build.

## Common Causes & Fixes

### 1. Check Build Logs
The detailed error is in the build logs:
https://expo.dev/accounts/mpc_triengen_sv_naum/projects/sv-naum-calendar/builds/f6e58a13-9f8b-49f3-9230-ed9948b89e14#run-gradlew

**Action**: Open the link above and check the "Run gradlew" phase for specific error messages.

### 2. Common Fixes Applied

I've updated `eas.json` to include:
- `EXPO_UNSTABLE_CORE_AUTOLINKING: "1"` - Helps with module autolinking issues

### 3. Additional Fixes to Try

#### Option A: Clear Cache and Rebuild
```bash
eas build --platform android --profile production --clear-cache
```

#### Option B: Check for Missing Dependencies
```bash
cd SvNaumCalendar
npm install
```

#### Option C: Verify Android Configuration
- Check that `android/app/build.gradle` is correct
- Verify `android/gradle.properties` settings
- Ensure all required files exist

### 4. Common Gradle Errors

#### Error: "Could not resolve all dependencies"
**Fix**: Dependencies might be missing. Try:
```bash
cd android
./gradlew clean
cd ..
```

#### Error: "Out of memory"
**Fix**: Already configured in `gradle.properties`:
```
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

#### Error: "Signing configuration"
**Fix**: EAS handles signing automatically. The debug signing in `build.gradle` is fine for EAS builds.

#### Error: "Module not found"
**Fix**: Check that all dependencies in `package.json` are installed.

### 5. Next Steps

1. **Check the build logs** at the URL above to see the specific error
2. **Try rebuilding with cache cleared**:
   ```bash
   eas build --platform android --profile production --clear-cache
   ```
3. **If still failing**, share the specific error message from the logs

### 6. Alternative: Build Locally First

To debug locally:
```bash
cd SvNaumCalendar
cd android
./gradlew bundleRelease
```

This will show the exact error on your machine.

---

**Please check the build logs URL and share the specific error message so I can provide a targeted fix.**

