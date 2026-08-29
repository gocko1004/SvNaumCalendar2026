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

## Security rules — CRITICAL (Goce mandate: super secure, super isolated)

These collections contain personal data. Principles: **create-only for the
public, admin-only reads, schema enforced at the rules level** — the server
rejects malformed or oversized submissions even if the app is bypassed
entirely and someone talks to Firestore directly.

```
function validContactMessage() {
  let d = request.resource.data;
  return d.keys().hasOnly(['type', 'message', 'name', 'contact', 'createdAt', 'status'])
    && d.type in ['QUESTION', 'REMARK', 'COMPLAINT']
    && d.message is string && d.message.size() > 0 && d.message.size() <= 3000
    && (!('name' in d) || (d.name is string && d.name.size() <= 120))
    && (!('contact' in d) || (d.contact is string && d.contact.size() <= 160))
    && d.status == 'NEW'
    && d.createdAt == request.time;
}
match /contactMessages/{id} {
  allow create: if validContactMessage();
  allow read, update, delete: if request.auth != null;
}

function validMembershipApplication() {
  let d = request.resource.data;
  return d.keys().hasOnly(['fullName', 'address', 'phone', 'email',
                           'familyMembers', 'note', 'createdAt', 'status'])
    && d.fullName is string && d.fullName.size() > 0 && d.fullName.size() <= 160
    && d.address is string && d.address.size() <= 300
    && d.phone is string && d.phone.size() <= 40
    && d.email is string && d.email.size() <= 160
    && (!('familyMembers' in d) || (d.familyMembers is string && d.familyMembers.size() <= 1000))
    && (!('note' in d) || (d.note is string && d.note.size() <= 2000))
    && d.status == 'NEW'
    && d.createdAt == request.time;
}
match /membershipApplications/{id} {
  allow create: if validMembershipApplication();
  allow read, update, delete: if request.auth != null;
}
```

Hardening checklist (build requirements, not suggestions):

- **Isolation**: these two collections share nothing with public data; no
  queries from public screens ever touch them (write-only from the form).
- **No public reads, ever** — not even "your own message": that requires auth
  and invites enumeration. The form confirms locally („Пораката е испратена").
- **Rules-level schema**: `hasOnly` + type + size checks above; server-side
  `createdAt == request.time` prevents timestamp forgery; forced `status: 'NEW'`
  prevents self-approval of membership applications.
- **Client sanitation**: trim, strip control chars, length counters in the UI
  (`ValidationService` already exists — extend it).
- **Display safety in admin**: message text rendered as plain text only; links
  not tappable by default (a complaint containing a link must not become a
  phishing vector aimed at the admin).
- **Spam posture** (Goce: pragmatic now, escalate if real): client rate limit
  (`rateLimiter`, e.g. 3 submissions / 10 min), honeypot field the UI never
  shows (bots fill it → rules reject via hasOnly), submission length floor.
  Escalation path when needed: Firebase App Check enforcement — the
  infrastructure step that cuts off non-app clients entirely.
- **Data minimization & retention**: only the fields above; admin panel gets a
  delete action; processed complaints can be purged after a period Goce picks.
- **No PII in logs**: console/log statements must never print message contents
  or applicant details.

## Fit with the roadmap

This is the first INBOUND channel of the communications hub
([04-communications-hub.md](04-communications-hub.md)) and slots into the
access-control plan as a `messages.manage` permission
([02-admin-access-control.md](02-admin-access-control.md)).

Tab name candidates: „Заедница" (recommended — covers membership + contact),
„Контакт" (safest, everyone understands), „Верници". Goce decides.

Status: SPEC ONLY — not yet approved for build.
