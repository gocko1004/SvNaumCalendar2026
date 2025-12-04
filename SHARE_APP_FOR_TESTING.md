# How to Share App for Testing

## Option 1: EAS Build (Recommended for Testing)

This creates a shareable APK that can be installed on any Android device.

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
Use your Expo account: `mpc_triengen_sv_naum`

### Step 3: Build APK for Testing
```bash
cd "Sv Naum Kalendar\SvNaumCalendar"
eas build --platform android --profile preview
```

This will:
- Build the app in the cloud
- Generate an APK file
- Give you a download link

### Step 4: Share the APK
1. After the build completes, you'll get a download link
2. Download the APK file
3. Share it with testers via:
   - Email
   - Google Drive
   - Dropbox
   - Any file sharing service

### Step 5: Testers Install the App
Testers need to:
1. Enable "Install from Unknown Sources" on their Android device:
   - Settings → Security → Unknown Sources (enable)
   - Or Settings → Apps → Special Access → Install Unknown Apps
2. Download the APK file
3. Open the APK file and tap "Install"

---

## Option 2: Local Build (Faster, but requires Android Studio)

If you want to build locally without EAS:

### Step 1: Build APK Locally
```bash
cd "Sv Naum Kalendar\SvNaumCalendar"
npx expo run:android --variant release
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 2: Share the APK
Share the APK file from the location above.

---

## Option 3: Google Play Internal Testing (Best for Many Testers)

If you have a Google Play Developer account ($25 one-time fee):

### Step 1: Build AAB for Play Store
```bash
eas build --platform android --profile production
```
Select "app-bundle" when prompted (not APK)

### Step 2: Upload to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create app (if not already created)
3. Go to Testing → Internal testing
4. Upload the AAB file
5. Add testers' email addresses
6. Testers will get an email with a link to install

---

## Quick Testing Checklist

Before sharing, make sure:
- [ ] App builds successfully
- [ ] Push notifications work (testers need to grant permissions)
- [ ] Admin login works
- [ ] Calendar displays correctly
- [ ] All features work as expected

---

## Troubleshooting

**Build fails?**
- Check you're logged in: `eas whoami`
- Check project ID matches in `app.json` and `eas.json`
- Make sure you're in the correct directory

**Testers can't install APK?**
- They need to enable "Unknown Sources" in Android settings
- Make sure they download the complete APK file

**Push notifications not working?**
- Testers need to grant notification permissions when prompted
- Check Firebase Console → Firestore → `pushTokens` collection to see registered devices

---

## Next Steps After Testing

Once testing is complete:
1. Fix any bugs found
2. Update version number in `app.json` (e.g., `1.0.1`)
3. Build production version: `eas build --platform android --profile production`
4. Submit to Google Play Store

