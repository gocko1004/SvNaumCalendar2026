# Roadmap

Updated 26 August 2026.

## Phase 1 — shipped to branch, awaiting release ✅ (code complete)

Branch: `feature/phase1-notifications-zoom-authfix`

1. Natural Macedonian notification wording, one shared source
   (`src/services/NotificationTextService.ts`). Essentials only, no „Ве очекуваме",
   normal dash `-` (never the long `—`). CHURCH_OPEN says the church is open and the
   priest is not present — never that something "starts".
2. Pinch-zoom news photo gallery (`react-native-image-viewing`).
3. Upload session guard: token refresh before upload, clear Macedonian error when the
   login session is dead (root cause of the 26 Aug `storage/unauthorized` incident).

## Phase 2 — fasting periods (NEXT, top priority)

Admin-managed fasting periods shown on the calendar. Nothing hardcoded — the four
yearly fasts change dates every year and the rules come from the eparchy. Spec:
[01-fasting-feature.md](01-fasting-feature.md). UI/UX mockup: see the published design
mockup (link in the spec).

## Phase 3 — admin platform

- **Editable/deletable hardcoded events** (override layer in Firestore, spec in
  [03-events-and-notifications.md](03-events-and-notifications.md)). Main admin can
  cancel, edit, or add any event, including the yearly hardcoded schedule.
- **Event-referenced notifications**: compose a notification FROM an event card —
  pre-filled text from NotificationTextService, editable before sending; notification
  tap deep-links back to the event card.
- **Access control foundation**: roles/departments, least privilege. Spec in
  [02-admin-access-control.md](02-admin-access-control.md). Built into Phase 2 data
  model from day one so it never needs a migration.
- Notification templates editable in admin (Firestore), replacing the AsyncStorage
  custom messages that today never leave the admin's own phone.

## Phase 4 — communications hub (later)

The app becomes the single place communication goes out from: Facebook business page
connection (post from app → page), and inbound sync. Spec sketch in
[04-communications-hub.md](04-communications-hub.md).

## Release checklist additions (Google Play quality requirements, announced Aug 2026)

- Compress/resize images on upload in MediaUploadService (memory + bitmap
  thresholds; also cuts Firebase bandwidth).
- Confirm R8/code shrinking is active in the production EAS build.
- Check Play Console → Android vitals for memory flags before submitting.
- Verify backup/device-migration behavior (data is in Firebase; low risk).

## Known issues (final review, 27 Aug 2026 - documented, deliberately not fixed yet)

- **Auto-notification configs are dormant**: the „Авто известувања" admin screen
  saves configs to Firestore, but nothing ever schedules from them
  (checkAndScheduleNotifications has no caller). The standard reminders cover
  the need. DECIDE BEFORE RELEASE: wire it properly (needs dedup against the
  standard reminders) or hide the screen.
- Minor: news send-failure is logged as SENT in notification history.
- Minor: cold-start notification tap waits a fixed 500ms for navigation and
  gives up silently if not ready.
- Minor: sanitizeString strips <angle-bracketed> text from community messages.
- Minor: clearing description/saintName of an overridden hardcoded event
  reverts to the original instead of clearing (empty string dropped).

## Standing issues / debt

- 2026 calendar is hardcoded (`ChurchCalendarService.ts`) → 2027 requires a release.
  Fixing properly is part of Phase 3 (calendar into Firestore with override layer).
- Duplicate `src/firebase.js` / `src/firebase.ts` (Metro resolves `.js`, tsc sees
  `.ts`). Remove the compat `.ts` copy when convenient.
- Admin password was exposed in a chat session on 26 Aug 2026 → must be rotated in
  Firebase Console → Authentication.
