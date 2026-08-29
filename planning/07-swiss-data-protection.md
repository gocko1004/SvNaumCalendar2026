# 07 — Swiss data protection compliance (nFADP)

Researched and web-verified 27 Aug 2026 (three parallel investigations: the Swiss
FADP itself, Firebase/US transfers, and app-store requirements). Applies because
the Општина tab collects personal data — and a church membership application is
**sensitive personal data** under Art. 5 lit. c FADP (it reveals religious
affiliation; that sensitivity covers every submitted field AND the listed family
members).

## Verdict

Nothing done so far creates legal exposure (nothing is released; no real user
data exists). The technical security the app already has satisfies Art. 8. What
remains is the information layer — one mandatory document and a handful of
cheap practices. Realistic enforcement risk for a small Verein is low and the
criminal fines (up to CHF 250,000, personal, intent-only) attach to a narrow
list: no privacy notice after being made aware, knowingly false answers to
access requests, knowingly unsecured sensitive data.

## MANDATORY before release

1. **Privacy notice (Art. 19)** — THE one hard duty. Must state: controller
   (the Verein) + contact email of the responsible board member; purposes
   (answering enquiries; administering membership); recipients (designated
   board members; Google as hosting processor); storage location and the USA
   transfer — Firebase Authentication always processes data in US data centers,
   so a US-transfer disclosure is unavoidable, covered by the **Swiss-U.S.
   Data Privacy Framework** (Google LLC certified, verified active Aug 2026;
   Google's SCCs as fallback). Macedonian + German versions recommended.
   → `PRIVACY_POLICY.md` rewritten accordingly; host at a public URL at release.
2. **Keep the security posture** (already built): admin-only reads, create-only
   public writes, schema validation, no PII in logs. Add: 2FA on the Google
   account; per-admin credentials when more admins arrive; no unencrypted
   exports on laptops.
3. **Google Play Data safety form** (+ Apple privacy label for iOS): declare
   Personal info (name, email, address, phone) + Messages, collected not
   shared, encrypted in transit, deletion on request. Public privacy-policy
   URL is mandatory in both stores. Under-declaring gets apps removed.

## NOT required (verified — common misconceptions)

- **No consent checkbox is legally required** for a self-submitted membership
  application: the FADP (unlike GDPR) has no legal-basis requirement for
  private controllers and no prohibition on processing sensitive data. A
  lightweight „Ја прочитав политиката на приватност" acknowledgement is good
  evidence practice, not an obligation.
- **No DPO**, no FDPIC registration, no DPIA at this scale.
- **No formal records register** (<250 employees, not large-scale) — but keep
  the one-page table below.

## Where express consent DOES matter: DISCLOSURE

Never pass member data outside the association — other parishes, the diocese
as a separate entity, printed directories, social media, publishing names in
the app — without an **active, specific opt-in** (never pre-ticked, never
bundled). Internal board use needs no consent. This is the rule that actually
bites for a parish (Art. 30(2)(c), Art. 6(7)).

## Cheap practices to adopt (do once)

- **Retention scheme:** contact messages deleted once handled (max 6-12
  months); accepted applications move to the member register and are deleted
  from the app DB; rejected/withdrawn applications deleted within ~3 months.
- **Access requests:** anyone can ask what we store about them → answer
  honestly and completely within 30 days (lookup in admin panel/console).
  Never stonewall — a false answer is the fined offence; an honest one is safe.
- **Breach process (one paragraph):** if unauthorized access is suspected —
  write down what happened, assess member exposure; if high risk (member list
  = religious affiliation + addresses of an ethnic-religious community →
  plausibly high risk), report via the FDPIC portal and inform affected
  members.
- **Annual check:** Google LLC's Swiss-U.S. DPF certification status
  (dataprivacyframework.gov) and this notice's transfer paragraph.
- **Firestore region:** check in Firebase console (Project settings →
  resource location). If nam5/us-central, consider export→import migration to
  europe-west6 (Zurich) at a convenient moment — simplifies the notice; not
  urgent since DPF covers the transfer either way.

## One-page processing record (Art. 12 hedge)

| Data | Purpose | Who sees it | Where | Retention |
|---|---|---|---|---|
| Contact messages (type, text, optional name/contact) | Answering enquiries | Admin board members | Firestore (Google) | Until handled, ≤12 months |
| Membership applications (name, address, phone, email, family) | Membership administration | Admin board members | Firestore (Google) | Accepted → member register; rejected → ≤3 months |
| Push tokens | Sending service reminders | System only | Firestore (Google) | While app installed |
| Admin accounts | App administration | The admins | Firebase Auth (USA) | While admin |
