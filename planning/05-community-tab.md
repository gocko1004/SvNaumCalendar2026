# 05 — Community tab (Верници / Заедница)

Requested 27 Aug 2026. A dedicated button in the bottom tab bar where the faithful
can reach the church — and the church receives everything in the admin panel.

## What users can do there

1. **Пишете ни** — a message form: type (Прашање / Забелешка / Поплака), message
   text, optional name and phone/email. Complaints may be sent anonymously.
2. **Зачленување** — apply for membership in the church community: full name,
   address, phone, email, optional family members and note.
3. Room to grow: candle/prayer requests, volunteering, donations info.

## Where it lands (admin)

New „📨 Пораки" section in the admin panel: newest first, unread counter on the
dashboard card, mark-as-processed, filter by type. Membership applications appear
in their own list with the applicant's contact details.

## Data model (Firestore)

```
contactMessages/{id}:
  type: 'QUESTION' | 'REMARK' | 'COMPLAINT'
  message: string
  name?: string
  contact?: string          // phone or email, optional
  createdAt: Timestamp
  status: 'NEW' | 'PROCESSED'

membershipApplications/{id}:
  fullName, address, phone, email
  familyMembers?: string
  note?: string
  createdAt: Timestamp
  status: 'NEW' | 'APPROVED' | 'CONTACTED'
```

## Security rules — CRITICAL

These collections contain personal data. The public may only CREATE; nobody
except a signed-in admin may ever read:

```
match /contactMessages/{id} {
  allow create: if true;
  allow read, update, delete: if request.auth != null;
}
match /membershipApplications/{id} {
  allow create: if true;
  allow read, update, delete: if request.auth != null;
}
```

Spam control: client-side rate limit (the app already has `rateLimiter` in
ValidationService), max lengths, and no links rendered from message text.
If spam becomes real, add Firebase App Check.

## Fit with the roadmap

This is the first INBOUND channel of the communications hub
([04-communications-hub.md](04-communications-hub.md)) and slots into the
access-control plan as a `messages.manage` permission
([02-admin-access-control.md](02-admin-access-control.md)).

Tab name candidates: „Заедница" (recommended — covers membership + contact),
„Контакт" (safest, everyone understands), „Верници". Goce decides.

Status: SPEC ONLY — not yet approved for build.
