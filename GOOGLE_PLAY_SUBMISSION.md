# 📱 Google Play Store Submission Guide
## Св. Наум Охридски, Триенген

Complete step-by-step guide to upload your Android app to Google Play Store.

---

## ✅ PRE-REQUIREMENTS

### 1. Google Play Developer Account
- **Cost**: $25 one-time fee (lifetime)
- **Sign up**: https://play.google.com/console/signup
- **Required**: Google account, payment method

### 2. App Information Ready
- App name: "Св. Наум Охридски, Триенген"
- Short description (80 characters max)
- Full description (4000 characters max)
- App icon (512×512 px)
- Screenshots (at least 2, up to 8)
- Feature graphic (1024×500 px) - optional but recommended

---

## 📋 STEP 1: VERIFY APP CONFIGURATION

Your `app.json` is already configured correctly:
- ✅ Package name: `com.svnaum.calendar`
- ✅ Version: `1.0.0`
- ✅ Version code: `1`
- ✅ Permissions configured

**Optional**: Add adaptive icon for better Android appearance:
```json
"android": {
  "package": "com.svnaum.calendar",
  "versionCode": 1,
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#831B26"
  },
  "permissions": [
    "android.permission.INTERNET",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.RECEIVE_BOOT_COMPLETED"
  ]
}
```

---

## 🔐 STEP 2: SET UP ANDROID CREDENTIALS (KEYSTORE)

EAS will handle this automatically, but you can set it up manually:

```bash
cd SvNaumCalendar
eas credentials
```

**Select:**
- Platform: **Android**
- Action: **Set up new keystore**
- Option: **Generate new keystore** (or use existing if you have one)

**⚠️ CRITICAL**: Save the keystore information! You'll need it for all future updates.

---

## 🏗️ STEP 3: BUILD PRODUCTION AAB

Google Play Store requires **AAB (Android App Bundle)**, not APK.

```bash
cd SvNaumCalendar
eas build --platform android --profile production
```

**This will:**
- Build Android App Bundle (AAB)
- Sign it with your keystore
- Upload to EAS servers
- Take 15-30 minutes

**After build completes:**
- Download the AAB file from EAS dashboard
- Save it securely (you'll need it for Step 5)

---

## 📝 STEP 4: PREPARE STORE LISTING

### Required Information:

1. **App Name** (50 characters max)
   ```
   Св. Наум Охридски, Триенген
   ```

2. **Short Description** (80 characters max)
   ```
   Календар на црковни празници и настани за црквата Св. Наум Охридски
   ```

3. **Full Description** (4000 characters max)
   ```
   Апликација за календар на црковни празници и настани за црквата Св. Наум Охридски во Триенген.
   
   Функции:
   • Преглед на црковни празници
   • Календар на настани
   • Известувања за важни настани
   • Информации за светците
   
   Оваа апликација ви помага да останете во тек со црковниот календар и важните настани.
   ```

4. **App Icon** (512×512 px)
   - Use: `assets/icon.png`
   - Must be square, PNG format

5. **Screenshots** (Required: at least 2)
   - Phone screenshots: 16:9 or 9:16 aspect ratio
   - Minimum: 320px height
   - Recommended: 1080×1920 px or higher
   - Take screenshots of:
     - Home screen
     - Calendar view
     - Event details
     - Admin panel (if showing)

6. **Feature Graphic** (Optional but recommended)
   - Size: 1024×500 px
   - Used for Play Store banner

7. **Privacy Policy** (Required)
   - You need a publicly accessible URL
   - Can host on your website or use a free service
   - Example: `https://yourwebsite.com/privacy-policy`

---

## 🚀 STEP 5: CREATE APP IN GOOGLE PLAY CONSOLE

### 5.1 Access Play Console
1. Go to: https://play.google.com/console
2. Sign in with your Google account
3. Accept Developer Agreement (if first time)

### 5.2 Create New App
1. Click **"Create app"**
2. Fill in:
   - **App name**: Св. Наум Охридски, Триенген
   - **Default language**: Macedonian (or your preferred language)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Check all that apply
3. Click **"Create app"**

### 5.3 Complete Store Listing
1. Go to **"Store presence" → "Main store listing"**
2. Fill in all required fields:
   - App name
   - Short description
   - Full description
   - App icon (upload 512×512 icon)
   - Screenshots (upload at least 2)
   - Feature graphic (optional)
   - Privacy Policy URL (required)

### 5.4 Set Up Content Rating
1. Go to **"Content rating"**
2. Complete the questionnaire
3. Submit for rating (usually instant)

### 5.5 Set Up Privacy Policy
1. Go to **"App content" → "Privacy Policy"**
2. Enter your Privacy Policy URL
3. If you don't have one, create a simple page with:
   - What data you collect (if any)
   - How you use it
   - Contact information

---

## 📤 STEP 6: UPLOAD AAB TO PLAY CONSOLE

### 6.1 Create Production Release
1. Go to **"Production"** (left sidebar)
2. Click **"Create new release"**

### 6.2 Upload AAB
1. Click **"Upload"** under "App bundles and APKs"
2. Select your AAB file (downloaded from EAS)
3. Wait for upload to complete
4. Google will process the bundle (may take a few minutes)

### 6.3 Add Release Notes
1. Scroll down to **"Release notes"**
2. Add notes in your app's language:
   ```
   Прва верзија на апликацијата.
   Вклучува календар на црковни празници и настани.
   ```
3. Click **"Save"**

### 6.4 Review and Roll Out
1. Review all information
2. Click **"Review release"**
3. If everything looks good, click **"Start rollout to Production"**
4. Confirm the release

---

## ✅ STEP 7: COMPLETE REQUIRED DECLARATIONS

Before your app can be published, complete:

1. **App access** - Declare if app is restricted
2. **Ads** - Declare if you show ads (probably "No")
3. **Content rating** - Already done in Step 5.4
4. **Target audience** - Age group
5. **Data safety** - What data you collect (if any)
6. **Export compliance** - Usually not needed for simple apps

---

## 🎯 STEP 8: SUBMIT FOR REVIEW

1. Go to **"Production"** tab
2. Check that all sections show ✅ (green checkmarks)
3. Click **"Submit for review"**
4. Confirm submission

**Review Time:**
- Usually 1-3 days
- Can be up to 7 days for first submission
- You'll receive email when approved or if changes needed

---

## 📊 STEP 9: MONITOR SUBMISSION

1. Check **"Production"** tab for status
2. Check email for updates
3. If rejected, read feedback and fix issues
4. Resubmit after fixes

---

## 🔄 FUTURE UPDATES

When you want to update the app:

1. **Update version in `app.json`:**
   ```json
   "version": "1.0.1",  // Increment version
   "versionCode": 2     // Increment version code
   ```

2. **Build new AAB:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Upload to Play Console:**
   - Go to Production → Create new release
   - Upload new AAB
   - Add release notes
   - Submit for review

---

## ⚠️ IMPORTANT NOTES

### Keystore Security
- **NEVER lose your keystore!**
- If lost, you cannot update your app
- Store backup securely (encrypted, multiple locations)

### Version Codes
- Must always increase
- Cannot decrease
- Each release needs new version code

### Testing
- Consider using **Internal testing** track first
- Test with a few users before production
- Fix issues before public release

### Privacy Policy
- Required by Google
- Must be publicly accessible
- Must be in a language your users understand

---

## 🆘 TROUBLESHOOTING

### Build Fails
- Check EAS build logs
- Verify `eas.json` configuration
- Ensure all dependencies are compatible

### Upload Fails
- Check AAB file size (max 150MB)
- Verify signing
- Check Play Console for error messages

### Review Rejected
- Read rejection reason carefully
- Fix issues mentioned
- Resubmit with explanation

---

## 📞 QUICK REFERENCE

**EAS Build:**
```bash
eas build --platform android --profile production
```

**Play Console:**
https://play.google.com/console

**EAS Dashboard:**
https://expo.dev/accounts/mpc_triengen_sv_naum/projects/sv-naum-calendar/builds

---

## ✅ CHECKLIST

Before submitting, ensure:
- [ ] Google Play Developer account created ($25 paid)
- [ ] AAB file built and downloaded
- [ ] App icon ready (512×512)
- [ ] Screenshots ready (at least 2)
- [ ] Privacy Policy URL ready
- [ ] Store listing completed
- [ ] Content rating completed
- [ ] All declarations completed
- [ ] AAB uploaded to Production
- [ ] Release notes added
- [ ] Ready to submit for review

---

**Good luck with your submission! 🚀**

