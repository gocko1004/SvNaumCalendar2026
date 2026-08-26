# 02 — Admin access control (least privilege)

Not built yet — but every new collection and screen is designed against this model so
adding roles later is configuration, not migration.

## Model

Roles live in Firestore `adminUsers/{uid}`:

```
{
  email: string,
  displayName: string,
  role: 'SUPER_ADMIN' | 'EDITOR',
  permissions: string[],     // fine-grained, see catalog
  isActive: boolean,
  createdBy: string, createdAt, updatedAt
}
```

Permission catalog (departments map to permission bundles):

| Permission | Covers |
|---|---|
| `calendar.manage` | Events incl. overriding hardcoded schedule |
| `fasting.manage` | Fasting periods and rules |
| `news.manage` | News + media upload |
| `announcements.manage` | Announcements |
| `notifications.send` | Push to all users; edit templates |
| `parking.manage` | Parking module |
| `admins.manage` | SUPER_ADMIN only: invite/disable admins, assign permissions |

`SUPER_ADMIN` (Goce) implicitly has everything. `EDITOR` has exactly its
`permissions` array.

## Enforcement — two layers, always both

1. **UI**: admin dashboard renders only the cards the signed-in admin's permissions
   allow; screens guard on mount. (Convenience, not security.)
2. **Firestore/Storage security rules**: the real enforcement.
   `request.auth.uid` must exist in `adminUsers`, be `isActive`, and hold the
   permission for that collection. Example:

```
function hasPerm(p) {
  let u = get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data;
  return u.isActive && (u.role == 'SUPER_ADMIN' || p in u.permissions);
}
match /fastingPeriods/{id} {
  allow read: if true;
  allow write: if request.auth != null && hasPerm('fasting.manage');
}
```

## Migration path

- Today: single Firebase Auth admin user. Step 1 creates `adminUsers` with Goce as
  SUPER_ADMIN — everything keeps working.
- Every feature from Phase 2 on writes `createdBy: uid` into its documents (fasting
  already specs this), so auditability exists from day one.
- New admins: created in Firebase Console Authentication (passwords never handled by
  the app code or by Claude), then granted a role in the in-app „Администратори"
  screen (SUPER_ADMIN only).
