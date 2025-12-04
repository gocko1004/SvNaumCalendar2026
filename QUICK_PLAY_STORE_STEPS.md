# 🚀 Quick Steps to Upload Android App to Google Play Store

## Step 1: Build the AAB File

```bash
cd SvNaumCalendar
eas build --platform android --profile production
```

⏱️ **Takes:** 15-30 minutes  
📦 **Output:** Android App Bundle (AAB) file

---

## Step 2: Set Up Google Play Developer Account

1. Go to: https://play.google.com/console/signup
2. Pay $25 one-time fee
3. Complete account setup

---

## Step 3: Create App in Play Console

1. Go to: https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - App name: **Св. Наум Охридски, Триенген**
   - Default language: **Macedonian**
   - App or game: **App**
   - Free or paid: **Free**

---

## Step 4: Complete Store Listing

**Required:**
- ✅ App icon (512×512) - You have: `assets/icon.png`
- ✅ Short description (80 chars max)
- ✅ Full description (4000 chars max)
- ✅ Screenshots (at least 2) - Take from your app
- ✅ Privacy Policy URL - Need to create/host this

**Optional:**
- Feature graphic (1024×500)

---

## Step 5: Upload AAB File

1. In Play Console, go to **"Production"**
2. Click **"Create new release"**
3. Click **"Upload"** and select your AAB file
4. Add release notes
5. Click **"Save"**

---

## Step 6: Complete Required Sections

Before submitting, complete:
- ✅ Content rating
- ✅ Data safety
- ✅ Target audience
- ✅ Privacy Policy

---

## Step 7: Submit for Review

1. Check all sections show ✅
2. Click **"Submit for review"**
3. Wait 1-3 days for approval

---

## 📝 What You Need to Prepare

1. **Screenshots** (take from your app):
   - At least 2 screenshots
   - Recommended: 1080×1920 px
   - Show: Home screen, Calendar, Events

2. **Privacy Policy** (create a simple page):
   - What data you collect (if any)
   - How you use it
   - Contact info
   - Host it somewhere (GitHub Pages, your website, etc.)

3. **App Descriptions** (in Macedonian):
   - Short: 80 characters max
   - Full: Up to 4000 characters

---

## ⚠️ Important Notes

- **AAB is required** (not APK) for Play Store
- **Version code must increase** with each update
- **Save your keystore** - you'll need it for updates
- **Privacy Policy is mandatory** - Google requires it

---

## 🆘 Need Help?

See full guide: `GOOGLE_PLAY_SUBMISSION.md`

