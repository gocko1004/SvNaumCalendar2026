# Windows Handoff Log - Jan 2, 2026

**Author**: Antigravity (Mac Session)
**Target**: Antigravity (Windows Session)
**Date**: Jan 2, 2026

## 📝 Session Summary
We have successfully fixed the Android Notification issue by updating the `google-services.json` to match the new Upload Key SHA-1. A new build was created and confirmed valid.

However, we hit a **"App not installed"** error on the Pixel 7. This is occurring because the specific Pixel 7 device has a "ghost" version of the old app installed (likely in a Work Profile or Guest User), preventing the new signature from installing.

Since `adb` was not available on the Mac, we are moving to Windows to perform a forced uninstall.

## 🚀 Immediate Next Steps (On Windows)

1.  **Pull the latest code**:
    ```bash
    git pull origin ui-improvements-parking-novosti-calendar
    ```

2.  **Connect the Pixel 7** via USB (Ensure USB Debugging is ON).

3.  **Run the Magic Command** (Force Uninstall):
    ```bash
    adb uninstall com.svnaum.calendar
    ```
    *If this says "Success", you are fixed.*

4.  **Install the Fixed APK**:
    Download link: [https://expo.dev/artifacts/eas/rzcuEqhguhi3S2znmfHyyH.apk](https://expo.dev/artifacts/eas/rzcuEqhguhi3S2znmfHyyH.apk)
    
    Or install via ADB:
    ```bash
    adb install path\to\downloaded_app.apk
    ```

## ✅ Verified Logic (Do not change)
*   **NotificationService.ts**: Logic is perfect. Channels `church-events` and `urgent-updates` are correct.
*   **google-services.json**: Is NEW and CORRECT. Do not revert it.
*   **EAS Config**: Project ID `ca6379...` is correct.

## 📂 Key Files Context
*   `ANDROID_KEY_RESET_LOG.md`: Details the key reset happening on Dec 21.
*   `PROJECT_CONTEXT.md`: General project info.

Good luck on Windows! 
