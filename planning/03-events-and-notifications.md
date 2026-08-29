# 03 — Editable hardcoded events & event-referenced notifications

## A. Admin can edit/delete ANY event, including the hardcoded year

Problem: `CHURCH_EVENTS_2026` is compiled into the app. Schedules change (priest
unavailable, weather, unplanned services) and today only a release can change them.

Design: **Firestore override layer** on top of the hardcoded list.

Collection `eventOverrides/{eventKey}` where `eventKey = date_serviceType_time` of the
hardcoded event (custom Firestore events are already editable directly):

```
{
  action: 'CANCEL' | 'MODIFY',
  // for MODIFY, any of:
  name?, time?, serviceType?, description?, note?,
  reason?: string,             // shown to users: „Откажано поради ..."
  createdBy: string, updatedAt
}
```

Merge order in `ChurchCalendarService.getAllEvents()`:
hardcoded events → apply overrides (drop CANCELed, patch MODIFYd) → add Firestore
custom events. A CANCELed event also cancels its scheduled local notifications on
each device at next sync.

Admin UX: in „Годишен Календар", every event (hardcoded or not) gets Edit / Cancel
actions. Canceling asks for the reason. Overridden events show a small „изменето"
marker so the admin can see and undo overrides (undo = delete the override doc).

This also becomes the path to killing the yearly hardcode: year N+1 can be imported
into Firestore instead of into code.

## B. Notifications that reference the event card

Two directions, both wanted:

1. **Compose from the card (admin).** On an event card in the admin calendar:
   „Испрати известување" → opens the notification composer **pre-filled** from
   `NotificationTextService.getReminderText(event, timing)` with a timing picker
   (3 дена / утре / 1 час / сега). Admin edits the text freely, sends. The
   notification document stores `eventKey` so it stays linked to the event.
   No more retyping what the card already knows — „во 3 дена - Пикник во 12:00
   часот" comes out ready to send.

2. **Deep link from the notification (users).** Notification payload carries
   `{ eventKey }`; tapping opens the app directly on that event's detail sheet
   (expo-notifications response listener → navigate). Applies to automatic
   reminders and admin-sent ones alike.

Storage: sent notifications already log to `notificationHistory`; add `eventKey`
there so history can show which card each notification belonged to.

## Order of work

Part B1 (compose pre-filled from card) is small and rides on Phase 1's
NotificationTextService — good early win. Part A and B2 belong together with the
calendar-override work in Phase 3.
