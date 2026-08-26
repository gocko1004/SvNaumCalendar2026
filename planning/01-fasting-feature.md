# 01 — Fasting periods (Пости)

Top priority. Admin-managed, zero hardcoding, visible on the calendar cards.

## Why nothing is hardcoded

Three of the four yearly fasts move with Easter, and the per-day rules (масло, вино,
риба) follow the eparchy's guidance which Goce receives each year. The admin sets the
dates and rules in the app; users see them immediately. No app release, ever.

The four periods (presets in the admin UI, dates always editable):

| Preset | Typical span |
|---|---|
| Велигденски пост (Великиот пост) | 7 недели пред Велигден |
| Петровски пост | по Сите Светии до Петровден (29 јуни / 12 јули) |
| Богородичен пост | 1–14 август (стар стил: 14–27 август) |
| Божиќен пост | 28 ноември – 6 јануари |

Plus one-day fasts and exceptions the admin can add freely (Крстовден, Усекование…).

## Data model (Firestore)

Collection `fastingPeriods`:

```
{
  name: string,            // „Велигденски пост"
  startDate: Timestamp,    // inclusive
  endDate: Timestamp,      // inclusive
  defaultRule: 'STRICT' | 'WITH_OIL' | 'WINE_OIL' | 'FISH',
  note?: string,           // free text from the eparchy guidance
  exceptions: [            // days inside the period with a different rule
    { date: Timestamp, rule: FastingRule, note?: string }   // нпр. Благовештение → FISH
  ],
  isActive: boolean,
  createdBy: string,       // uid — access-control ready (see 02)
  updatedAt: Timestamp
}
```

Rule labels (single source, `FastingService.ts`):

| Key | Label | Icon | Color |
|---|---|---|---|
| STRICT | Строг пост (без масло) | `sprout` | `#6B4E9B` (постен виолет) |
| WITH_OIL | Пост со масло | `water` (капка) | `#7B8A3E` (маслиново) |
| WINE_OIL | Вино и масло | `glass-wine` | `#A3622E` (килибар) |
| FISH | Дозволена риба | `fish` | `#1B3661` (Orthodox blue) |

Violet is the traditional lenten liturgical color — used for the badge accent so the
calendar reads "fast" at a glance without clashing with the red/gold theme.

## User-facing UX (calendar)

1. **Badge on the day card.** Small chip in the card's top-right: rule icon + short
   label („Со масло"). Gold border like everything else; rule color as accent.
2. **Period banner.** While a fast is running, a slim banner above the day list:
   „Велигденски пост · ден 12 од 48 · Строг пост". Tap → detail sheet.
3. **Detail sheet** (same bottom-sheet pattern as EventDetailSheet): period name,
   date range, today's rule with icon, eparchy note, and the list of exception days.
4. Filter chip row gets a „Пост" toggle so users can see fasting days highlighted.

## Admin UX (Управувај со пости)

New card „Пости" on the admin dashboard → `ManageFastingScreen`:

- List of periods as cards: name, range, rule chip, active toggle, edit/delete.
- „+ Нов пост" → form: preset picker (4 fasts, pre-fills name), date range pickers,
  rule selector as 4 large tappable chips (icon + label), note field, exceptions
  editor (date + rule + note rows, „+ Додади исклучок").
- Preview strip at the bottom of the form: shows exactly how the badge will look on
  a calendar card before saving.

Mockup: published as design artifact — „SvNaum Fasting UI" (link kept in chat; ask
Claude to re-publish/update it during iteration).

## Implementation slices

1. `FastingService.ts` — model, CRUD, `getFastingInfoForDate(date)` (resolves
   period + exception → effective rule), local cache.
2. Calendar integration — badge on day cards + banner + detail sheet.
3. `ManageFastingScreen` + dashboard card + navigation + preset data.
4. Firestore security rules: reads public; writes require auth (role-gated later
   per [02-admin-access-control.md](02-admin-access-control.md)).
