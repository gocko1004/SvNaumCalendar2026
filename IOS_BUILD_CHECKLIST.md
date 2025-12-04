# iOS Build Checklist for Tomorrow

## ✅ What's Already Fixed

1. **Podfile Configuration** - All TARGET_OS_SIMULATOR errors fixed
2. **C++ Standard** - Set to C++20 for React Native 0.74.5 compatibility
3. **Deployment Target** - Set to iOS 14.0
4. **EAS Configuration** - Properly configured in `eas.json`
5. **Info.plist** - Updated to use arm64 architecture
6. **app.json** - iOS settings configured correctly

## 📋 Pre-Build Checklist

### Before Running the Build:

1. **Check EAS Build Credits**
   - Verify you have available iOS builds
   - If free tier limit reached, wait for reset or upgrade plan
   - Check: https://expo.dev/accounts/mpc_triengen_sv_naum/settings/billing

2. **Verify Configuration Files**
   ```bash
   # Run this to check for issues
   npx expo doctor
   ```

3. **Ensure All Dependencies Are Installed**
   ```bash
   npm install
   cd ios && pod install && cd ..
   ```

## 🚀 Build Command

When ready, run:
```bash
eas build --platform ios --profile production
```

## ⚠️ Known Issues & Solutions

### If Build Fails with TARGET_OS_SIMULATOR Error:
- ✅ Already fixed in Podfile (lines 54-151)
- The fix applies TARGET_OS_SIMULATOR to all targets

### If Build Fails with CocoaPods Issues:
- ✅ Cache disabled in eas.json
- ✅ Environment variables set for CocoaPods
- If still fails, try: `cd ios && pod deintegrate && pod install`

### If Build Fails with Xcode Version:
- Currently using `sdk-51` image in eas.json
- This should work with Expo SDK 51
- If issues persist, may need to specify Xcode version

## 📝 Current Configuration Summary

- **Expo SDK**: 51.0.0
- **React Native**: 0.74.5
- **iOS Deployment Target**: 14.0
- **Bundle ID**: com.svnaum.calendar
- **Build Number**: 1
- **EAS Image**: sdk-51

## 🔧 Quick Fixes Reference

### If Metro Issues (like Android):
Use: `npx react-native start --port 8081` instead of `expo start`

### If Podfile Issues:
The Podfile is already configured correctly. Don't modify unless absolutely necessary.

## ✅ Expected Build Time

- First build: ~15-20 minutes
- Subsequent builds: ~10-15 minutes (with cache)

## 📱 After Build Completes

1. Download the .ipa file from EAS
2. Install on device using TestFlight or direct install
3. Test all features before App Store submission

---

**Last Updated**: Based on fixes completed today
**Status**: Ready for build (pending EAS credits)


