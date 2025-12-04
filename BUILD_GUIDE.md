# 🚀 Step-by-Step Android Build Guide

## ✅ Step 1: Open Android Studio

1. **Open Android Studio** (if not installed, download from https://developer.android.com/studio)
2. If this is your first time:
   - Click "More Actions" → "Open"
   - Or click "Open" if you see it
3. Navigate to: `C:\Users\Admin\Documents\Sv Naum Kalendar\SvNaumCalendar\android`
4. Click **OK**

**Wait for Gradle sync** (this takes 5-10 minutes the first time)
- Watch the bottom status bar
- You'll see "Gradle sync in progress..."
- Don't close Android Studio during this!

---

## ✅ Step 2: Check for Errors

After Gradle sync completes:
1. Look at the bottom "Build" tab
2. If you see errors, let me know what they say
3. If it says "BUILD SUCCESSFUL" or no errors, continue to Step 3

---

## ✅ Step 3: Create Release Keystore

We need to create a keystore file for signing the app.

**Option A: Using Android Studio Terminal**
1. In Android Studio, click **View → Tool Windows → Terminal** (or press Alt+F12)
2. Run this command:

```powershell
cd app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

**Option B: Using PowerShell (outside Android Studio)**
Open PowerShell and run:
```powershell
cd "C:\Users\Admin\Documents\Sv Naum Kalendar\SvNaumCalendar\android\app"
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

**When prompted, enter:**
- **Keystore password**: (choose a strong password - **SAVE THIS!**)
- **Re-enter password**: (same password)
- **Your name**: (your name or organization)
- **Organizational Unit**: (optional, press Enter)
- **Organization**: (optional, press Enter)
- **City**: (optional, press Enter)
- **State**: (optional, press Enter)
- **Country code**: MK (or your 2-letter country code)
- **Confirm**: Type `yes`

**⚠️ CRITICAL:** Save the password somewhere safe! You'll need it for all future app updates.

---

## ✅ Step 4: Configure Signing

I'll help you update the build.gradle file to use the keystore.

---

## ✅ Step 5: Build the AAB

Once signing is configured, we'll build the AAB file.

---

**Let's start with Step 1! Open Android Studio and tell me when you've opened the project.**

