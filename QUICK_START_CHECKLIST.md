# Quick Start Checklist - App Store Submission

## 🚀 Quick Steps

### 1. PREPARE (5 minutes)
```powershell
# Install EAS CLI
npm install -g @expo/eas-cli

# Login
eas login

# Configure
cd "C:\Users\Admin\Documents\Sv Naum Kalendar\SvNaumCalendar"
eas build:configure
```

### 2. ANDROID - Set Up Credentials (10 minutes)
```powershell
eas credentials
# Select: Android → Set up new keystore → Generate new keystore
# ⚠️ SAVE THE KEYSTORE INFO SECURELY!
```

### 3. ANDROID - Build (15-30 minutes)
```powershell
eas build --platform android --profile production
# Wait for build to complete
eas build:list  # Check status
eas build:download [BUILD_ID]  # Download AAB file
```

### 4. ANDROID - Play Console (30-60 minutes)
1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app
3. Fill store listing
4. Upload AAB file
5. Complete Data Safety section
6. Submit for review

### 5. iOS - Set Up Credentials (10 minutes)
```powershell
eas credentials
# Select: iOS → Set up credentials
# Follow prompts (requires Apple Developer account)
```

### 6. iOS - Build (20-40 minutes)
```powershell
eas build --platform ios --profile production
# Wait for build
eas build:list  # Check status
```

### 7. iOS - App Store Connect (30-60 minutes)
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create app
3. Fill app information
4. Upload build
5. Complete App Privacy section
6. Submit for review

---

## 📋 What You Need

### Accounts
- [ ] Google Play Developer Account ($25 one-time)
- [ ] Apple Developer Account ($99/year)

### Assets
- [ ] App icon (1024×1024 px) ✅ You have this
- [ ] Screenshots (see APP_STORE_PREPARATION.md for sizes)
- [ ] Privacy Policy published online
- [ ] Feature graphic for Android (1024×500 px)

### Information
- [ ] App description (Macedonian)
- [ ] Keywords
- [ ] Contact email: svnaum.triengen@gmail.com
- [ ] Support URL (optional)

---

## ⚡ Fast Track (If You Have Everything Ready)

**Android:**
1. `eas credentials` → Set up Android keystore
2. `eas build --platform android --profile production`
3. Upload AAB to Play Console
4. Submit

**iOS:**
1. `eas credentials` → Set up iOS certificates
2. `eas build --platform ios --profile production`
3. Upload to App Store Connect
4. Submit

---

## 📖 Full Guide

See **APP_STORE_PREPARATION.md** for complete step-by-step instructions.

---

## ⚠️ Important Notes

1. **Android requires AAB** (not APK) for Play Store
2. **Save keystore credentials** - you'll need them for updates
3. **Review times:** Android (1-3 days), iOS (1-7 days)
4. **Version numbers:** Increment for each release
5. **Privacy Policy:** Must be publicly accessible URL

---

## 🆘 Need Help?

- Full guide: `APP_STORE_PREPARATION.md`
- EAS docs: https://docs.expo.dev/build/introduction/
- Email: svnaum.triengen@gmail.com

