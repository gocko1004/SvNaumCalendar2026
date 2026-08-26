# 04 — Communications hub (future)

Vision: the app is the single place church communication goes out from. One message,
written once, reaches app users (push), the Facebook business page, and later other
channels.

## Facebook business page

- Post from app → page: Meta Graph API (`/{page-id}/feed`, `/photos`) with a Page
  Access Token. Requires a Meta developer app + `pages_manage_posts` permission and
  a token stored **server-side** — never in the mobile app bundle.
- This forces the first piece of backend: a small Cloud Function (Firebase) that
  holds the page token and exposes one endpoint the admin app calls. The token
  never ships in the APK.
- Inbound (page → app): Graph API webhooks to the same function; new page posts can
  be mirrored into `news`.
- Note: `SocialMediaService.postToFacebookGroup` already exists as a stub concept —
  the hub replaces it with a real, server-side integration.

## Design consequences to respect NOW (cheap today, expensive later)

1. Every outgoing message becomes a `communications` document first (content,
   channels, status per channel), then fan-out. The Phase 3 notification composer
   should write this shape even while push is the only channel.
2. Channel connectors are per-department permissions (`comms.facebook` etc.) in the
   [access-control model](02-admin-access-control.md).
3. Nothing else needs building yet. This file exists so Phase 2/3 data shapes don't
   paint us into a corner.
