# 08 — Release guide v2.1.0 (build 11)

Prepared 29 Aug 2026. Code state: everything merged to `master`, typechecked,
bundle-verified, audited (13-agent review 27 Aug + release audit 29 Aug, all
confirmed findings fixed).

## Privacy policy URL (needed by both stores)

https://github.com/gocko1004/SvNaumCalendar2026/blob/master/PRIVACY_POLICY.md

Public, on master, MK + EN. Paste into Play Console (App content → Privacy
policy) and App Store Connect (App Privacy → Privacy Policy URL).

## ANDROID (Google Play) - the near-term release

### Step 0 - google-services.json (REQUIRED, Goce only)
The repo has NO google-services.json, but the app registers push tokens via
FCM. Without it, push notifications will not work in the store build.
1. Firebase Console → Project settings (gear) → Your apps → Android app
   `com.svnaum.calendar` (add it there if missing).
2. Download `google-services.json` → put it in the repo ROOT.
3. Tell Claude — app.json gets `"googleServicesFile": "./google-services.json"`
   wired and it's committed (the file is not secret; it can live in the repo).
4. Also check Firebase Console → Project settings → Cloud Messaging that
   FCM API (V1) is enabled, and in https://expo.dev → project → Credentials
   that an FCM V1 service account key is uploaded (needed for Expo push).

### Step 1 - build
```bash
cd ~/Documents/SvNaumCalendar2026 && npx eas-cli build --platform android --profile production
```
- EAS CLI uses the already-logged-in Expo account (mpc_triengen_Sv_Naum).
- If it asks about the Android keystore: choose the EXISTING one from EAS
  (used for build 10). NEVER generate a new keystore for an app already on
  Play - Play would reject the signature.
- Build runs in Expo's cloud (~15-25 min), produces an .aab download link.

### Step 2 - Play Console (https://play.google.com/console)
1. Production → Create new release → upload the .aab.
2. Release notes (MK), suggestion:
   „Нови можности: пости на календарот, Црковна Општина (пораки и
   зачленување), подобрени известувања и поправки."
3. App content → Data safety - declare:
   - Personal info: Name, Email address, User address, Phone number -
     collected, NOT shared, optional (user-initiated forms), encrypted in
     transit, deletion on request (via email)
   - Messages: Other in-app messages - collected, not shared
   - Device or other IDs: NO (no analytics SDK)
   - Purpose everywhere: App functionality
4. App content → Photo and video permissions: declare NOT used (we removed
   READ_MEDIA_*; the system photo picker needs none).
5. Review → roll out to Production (or Internal testing first for a
   dry run - recommended: Internal testing → the council installs the real
   build → then promote the same build to Production).

## iOS (App Store) - needs Goce's Apple context

- REQUIRED: an active Apple Developer Program membership ($99/yr) on an
  Apple ID Goce controls. Status unknown - Goce to confirm.
- Then: `npx eas-cli build --platform ios --profile production` (EAS asks to
  log in to the Apple account interactively - Goce runs this one in Terminal),
  followed by `npx eas-cli submit -p ios`.
- App Store Connect: create the app record for com.svnaum.calendar,
  privacy labels: Contact Info (name, email, phone, address) + User Content
  (messages), all "Linked to You", no Tracking; privacy policy URL above.
- The eas.json Xcode image pins were removed - EAS default (current SDK) is
  required by Apple.

## Post-release

- Verify push end to end on the store build (Preview screen + a real news
  post to yourself before announcing).
- Tag the release: `git tag v2.1.0 && git push --tags` (after the store
  build is accepted).
- The Auto известувања admin screen stays dormant (documented in ROADMAP) -
  decide wire-or-hide before the NEXT release.
