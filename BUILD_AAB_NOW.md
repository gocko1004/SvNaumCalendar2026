# 🚀 Build AAB File - Step by Step

## ✅ Good News!

Your project is loaded in Android Studio! The project structure is visible, which means Gradle sync completed successfully.

## Step 1: Check Build Status

1. **Look at the bottom of Android Studio**
   - Do you see tabs like "Build", "Run", "Debug", etc.?
   - Click on the **"Build"** tab
   - Look for any red error messages
   - If you see "BUILD SUCCESSFUL" or no errors, we're good!

## Step 2: Build the AAB File

We'll use the command line (easier than GUI for this):

### Option A: Using Android Studio Terminal

1. **Open Terminal in Android Studio:**
   - Click **View → Tool Windows → Terminal** (or press `Alt+F12`)
   - A terminal will open at the bottom

2. **Run this command:**
   ```powershell
   .\gradlew bundleRelease
   ```

3. **Wait for build to complete** (5-15 minutes)

### Option B: Using PowerShell (Outside Android Studio)

1. **Open PowerShell**
2. **Navigate to android folder:**
   ```powershell
   cd "C:\Users\Admin\Documents\Sv Naum Kalendar\SvNaumCalendar\android"
   ```
3. **Run build:**
   ```powershell
   .\gradlew bundleRelease
   ```

## Step 3: Find Your AAB File

After build completes, the AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

**Let's start! Open the Terminal in Android Studio and run the build command.**

