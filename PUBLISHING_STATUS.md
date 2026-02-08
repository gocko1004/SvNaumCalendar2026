# Publishing Context (Saved: 2026-02-08)

This document preserves the current state of the app release to ensure continuity.

## 🟢 Current Release (In Review)
- **Version**: `2.0.2`
- **Build Number**: `21`
- **Status**: **In Review** (Google Play Console)
- **Managed Publishing**: **ON** (Requires manual release after approval).
- **Contents**: Does NOT include the notification fixes (Admin panel upsert/merging).
- **Action Required**: Wait for Google approval email -> Click "Review and publish" in Play Console.

## 🟡 Pending Release (Next)
- **Version**: `2.0.3` (Planned)
- **Branch**: `ui-improvements-parking-novosti-calendar`
- **Contents**: Includes fixes for:
  1.  Hardcoded event notifications (Deterministic IDs).
  2.  Admin Panel editing (Shadowing/Upsert logic).
  3.  Auto Notification settings.
- **Plan**: Build and release this version immediately AFTER 2.0.2 is live.

## 📝 Important Notes
- Do NOT build `2.0.3` until `2.0.2` is live, unless you decide to cancel the current review and replace it.
- The `google-services.json` and signing keys are correctly configured for production.

## 🍎 iOS Release (Pending)
- **Version**: `2.0.3`
- **Build**: `22`
- **Status**: Ready to Build.
- **Contents**: Includes Notification Fixes.
- **Action**: Run `eas build -p ios` and submit to App Store.
