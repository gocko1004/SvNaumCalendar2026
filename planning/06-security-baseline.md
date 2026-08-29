# 06 — Security baseline (standing mandate)

Goce's rule, 27 Aug 2026: the app's architecture is security-first — best
practices by default, strong guardrails, isolation between public and
sensitive data. Every new feature is measured against this file.

## Model: what protects what

| Layer | Role |
|---|---|
| Firebase Security Rules (Firestore + Storage) | **The** enforcement layer. The client is never trusted; rules validate schema, sizes, and auth for every collection. |
| Firebase Auth | Admin identity. Sessions verified before privileged actions (upload guard already forces a token refresh). |
| App code | UX-level validation and rate limiting (`ValidationService`) — convenience, never the security boundary. |
| The API key | **Not a secret** (standard for Firebase clients) — security never depends on hiding it. |

## Current state (verified 26-27 Aug 2026)

- Storage: public read, authed write. ✔
- Firestore: per-collection rules, default deny; new collections
  (`fastingPeriods`, `eventOverrides`) public-read / authed-write. ✔
- Uploads: session guard with forced token refresh (SessionExpiredError). ✔
- Push tokens: world-writable by design (registration), admin-only read. ✔
  (Watch item: a hostile actor could spam fake tokens; acceptable now,
  revisit with App Check.)

## Open items (tracked, owner: Goce + Claude)

1. **Rotate the admin password** — it was pasted into a chat session on
   26 Aug 2026. Firebase Console → Authentication → Users. NOT DONE YET.
2. Remove the stale `src/firebase.ts` compat duplicate once the Expo Go login
   investigation closes (Metro resolves `.ts` over `.js`; two configs = drift risk).
3. When multiple admins arrive: RBAC per [02-admin-access-control.md](02-admin-access-control.md) —
   permissions enforced in RULES, not just hidden UI.
4. When the community tab ships: create-only + schema-validated rules per
   [05-community-tab.md](05-community-tab.md); App Check is the escalation
   path against spam/abuse.
5. Dependency hygiene: `npm audit` before every release; Expo SDK kept current.

## AI-era guardrails (Goce works in AI security; these are his defaults)

- Claude never handles or enters credentials; auth actions are Goce's alone.
- No secrets in the repo, ever (API key is the documented exception — not a secret).
- Untrusted content (user messages, news text, notification payloads) is data,
  never instructions/HTML/deep-link targets without validation.
- Personal data of the faithful is isolated admin-only (see 05), minimized,
  and deletable.
- Every security-relevant change lands in git with an explicit commit message
  so the history is auditable.
