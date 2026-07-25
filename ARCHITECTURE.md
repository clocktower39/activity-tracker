# ARCHITECTURE.md

> Single source of truth for the system's shape. If the code disagrees with this file, the code is wrong. Update the file in the same commit that fixes the code.

## 1. System overview

```
┌──────────────────────────────┐   HTTPS / JSON    ┌────────────────────────────┐
│  Browser (PWA)               │ ────────────────► │  Express 5 + Mongoose 9    │
│  React 19 · MUI 7 · RTK      │ ◄──────────────── │  Node 20+                  │
│  • Bearer JWT in localStorage│                   │  • requireAuth middleware  │
│  • Optimistic ring updates   │                   │  • All routes under /api   │
└──────────────────────────────┘                   └─────────────┬──────────────┘
                                                                 ▼
                                                        ┌──────────────────┐
                                                        │  MongoDB (Atlas) │
                                                        └──────────────────┘
```

The browser talks to the API directly; there is no BFF. Auth is JWT-based, so
there is no cookie or CSRF surface.

## 2. Module map

### 2.1 Server (`activity-server/`)

| Path | Responsibility |
|---|---|
| `server.js` | Connects to Mongo, *then* listens. Graceful shutdown. |
| `src/app.js` | Express bootstrap: CORS allow-list, JSON, dev logger, error handler |
| `src/config/env.js` | Validated environment. Fails fast on missing/weak secrets. |
| `src/db/connect.js` | Mongoose connection |
| `src/lib/periods.js` | **Period math. Mirrored by the client.** |
| `src/lib/tokens.js` | JWT signing/verification. Payload is identifiers only. |
| `src/lib/rebucketWeeks.js` | Moves weekly rows when an account changes `weekStart` |
| `src/lib/apiError.js` | `ApiError` + `asyncHandler` |
| `src/middleware/auth.js` | `requireAuth`, `blockDemo` |
| `src/middleware/errorHandler.js` | The only place an error becomes a response |
| `src/middleware/rateLimit.js` | In-process fixed-window limiter for auth routes |
| `src/controllers/authController.js` | Signup, login, refresh, profile, password |
| `src/controllers/goalController.js` | Bootstrap, goal CRUD, categories |
| `src/controllers/historyController.js` | Period reads and progress writes |
| `src/controllers/statsController.js` | Server-side rollups and streaks |
| `src/routes/index.js` | Route table |
| `scripts/maintenance.js` | Idempotent data maintenance. Dry-run by default. |
| `scripts/verify-api.js` | End-to-end API check against a running server |

### 2.2 Client (`activity-client/`)

| Path | Responsibility |
|---|---|
| `src/app/api.js` | fetch wrapper: auth header, single-flight token refresh, `ApiError` |
| `src/app/store.js` | RTK store |
| `src/features/auth/authSlice.js` | Session and profile |
| `src/features/goals/goalsSlice.js` | Goals + categories, and the grouping selector |
| `src/features/history/historySlice.js` | **The period cache.** Optimistic writes. |
| `src/features/ui/uiSlice.js` | Theme mode, transient status messages |
| `src/design/theme.js` | The Practice Chart world as MUI tokens. See `DESIGN.md`. |
| `src/lib/periods.js` | **Mirror of the server's period math.** |
| `src/components/Ring.jsx` | The signature interaction |
| `src/components/Stave.jsx` | Goals × periods matrix (a reading surface) |
| `src/components/PeriodBars.jsx` | Bars against the target line |
| `src/components/GoalSheet.jsx` | Detail: adjust, note, recent run |
| `src/views/TodayView.jsx` | Rings for one day |
| `src/views/PeriodView.jsx` | Week / Month / Year, one component |
| `src/views/ReviewView.jsx` | Aggregates and streaks |

## 3. The data-loading contract

This is the part that was broken and is the reason for the rebuild. Read it
before touching any read path.

**The old behaviour.** `POST /` returned every goal *with its entire history*,
on every page load — 19,890 documents and 5.53 MB for the primary account. It
also ran a `bulkWrite` on that read path which upserted a placeholder row for
every goal at the selected period, so merely *looking* at a date wrote rows.
27,399 of 36,557 rows in the collection were empty placeholders created this way.

**The rules now:**

1. **No write on a read path.** Ever. A `GoalHistory` row exists only because a
   user recorded something.
2. **A missing row means zero**, not "not loaded".
3. **A row that reaches zero with no note is deleted**, not left behind.
4. **Every history query is bounded** by an indexed period range.
5. **Rollups are aggregated in Mongo**, not by shipping rows to the browser.

Resulting sizes for the primary account:

| | Old | New |
|---|---|---|
| First load | 5.53 MB | 3.6 KB bootstrap + ~5.6 KB for the day |
| Changing date | 5.53 MB | ~5.6 KB (once; then cached) |
| A year of totals | n/a | ~800 B |

## 4. API

All routes are under `/api`. Public: `POST /auth/signup`, `/auth/login`,
`/auth/refresh`. Everything else requires a valid access token.

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/auth/signup` \| `/auth/login` \| `/auth/refresh` | Rate-limited; refresh rotates both tokens |
| GET | `/auth/me` | |
| PATCH | `/auth/profile` | Allow-listed fields only |
| POST | `/auth/change-password` | Bumps `tokenVersion`, invalidating other sessions |
| GET | `/bootstrap` | Goals + categories + `recordRange` (first/last recorded period). **No history.** |
| POST/PATCH/DELETE | `/goals`, `/goals/:id` | `PATCH /goals/reorder` is declared before `/goals/:id` |
| PUT | `/categories` | Whole list |
| POST | `/categories/rename` | Renames the category on every goal too |
| GET | `/history?date=` | One row per goal for the period containing that date |
| GET | `/history/range?from=&to=[&interval=][&goalId=]` | Bounded window |
| POST | `/history/progress` | `delta` increments atomically; `achieved` sets absolutely |
| GET | `/stats/summary?from=&to=&bucket=` | `$dateTrunc` rollup, one row per bucket |
| GET | `/stats/matrix?from=&to=&bucket=` | Goal × bucket rollup, one row per goal per bucket |
| GET | `/stats/by-goal?from=&to=` | Per-goal totals |
| GET | `/stats/streaks?days=` | Current and longest. `days=all` walks the whole record. |

### 4.1 How ranges are bounded

Two different limits, because the two kinds of endpoint fail in different ways.

**`/history/range` returns raw documents**, so its cost scales with how much was
recorded. It is capped at 5 years, which is far beyond what any view asks for
(the goal sheet wants 14 periods; a period view wants one period).

**`/stats/*` aggregate in MongoDB**, so their cost scales with *bucket count*,
not with duration. They are therefore bounded by buckets (3,000) rather than by
years. A decade of monthly totals is 120 rows and perfectly reasonable; a decade
of daily totals is not, and is refused with a message naming a coarser bucket.

This is what makes "all time" viable: the Review view spans the account's entire
record — `recordRange.first` from `/bootstrap` to today — and picks its bucket
from the span (day ≤ 45 d, week ≤ 200 d, month ≤ 6 y, year beyond). Five years of
monthly totals is under 2 KB; the underlying rows would be tens of thousands.
A custom range picks its bucket the same way, so an arbitrary span is bounded by
the same rule rather than by a second set of limits.

Note that the row-matching window is deliberately widened to the start of the
`from` year so a yearly-interval row overlapping the range is still found. The
aggregation then clamps its output back to the caller's range — without that,
asking for 25 Jan onward returned a first bucket dated the preceding December.

## 5. Data model

Collection names are unchanged from v1, so the existing data is the same data.

### `User`
`email` (unique, lowercased), `firstName`, `lastName`, `password` (bcrypt,
`select: false`), `themeMode`, `isDemo`, `tokenVersion`.

`password` never leaves the server: it is excluded by default and
`toPublicJSON()` is the only shape sent to a client.

### `Goal`
`task`, `interval` (`daily|weekly|monthly|yearly|none`), `defaultTarget`,
`trackingMode` (`target` = done is done; `more` = overshoot counts and earns
laps), `category` (free text), `order`, `accountId`, `hidden`, `color`, `icon`,
`archivedAt`.

The legacy embedded `history` array is gone; `scripts/maintenance.js` folds any
survivors into `GoalHistory`, summing collisions rather than dropping them.

### `GoalHistory`
`goalId`, `accountId`, `interval`, `periodStart` (UTC), `targetPerDuration`,
`achieved`, `note`.

Indexes: unique `(goalId, interval, periodStart)` — the idempotency key;
`(accountId, periodStart)` for window queries; `(accountId, goalId, periodStart)`
for per-goal charts.

### 5.1 Changing the week boundary

`periodStart` for a weekly row is the first day of that week, so changing
`weekStart` changes where every existing weekly row belongs. `PATCH
/api/auth/profile` therefore runs `src/lib/rebucketWeeks.js` *before* saving the
new setting, so a failure leaves the account with a setting that still matches
its data.

A row is placed by its old week's **midpoint**, not its first day. Shifted
boundaries mean the old and new weeks overlap only partially, and the midpoint
picks the new week sharing the most days with the old one — at least four of
seven. Mapping from the first day instead drags every row into the preceding
new-week, outside the range the app then queries, which makes recorded progress
look lost. Two old weeks can still land in one new week, so collisions are summed
rather than resolved by picking a winner.

The endpoint reports `{ moved, merged, scanned }` and the client drops its cached
history, which is keyed to the old boundary.

### `Category`
One document per account: `{ accountId, categories: [{ category, order, color }] }`.

> The v1 schema declared this field as `account` while the data used `accountId`,
> so Mongoose never cast it and **every document stored the id as a String while
> `Goal.accountId` is an ObjectId**. The two never matched, so category lookups
> silently returned nothing for every account, for years. `maintenance.js`
> converts the type and folds in any category a goal names but the list lacks.

## 6. Invariants (must hold)

1. **A `periodStart` is a date *label*, not an instant.** It is stored at UTC
   midnight so a given calendar date is the same bucket for everyone, and
   `activity-server/src/lib/periods.js` and `activity-client/src/lib/periods.js`
   must agree exactly on how a date string becomes one. If they drift, a tap is
   written to one bucket and read from another.
2. **"Today" is the user's LOCAL calendar date**, never `dayjs.utc()`. The label
   has to come from the calendar the user is looking at; deriving it from UTC
   rolled the app over to tomorrow partway through the evening for anyone behind
   UTC (in UTC-7, at 17:00 local), showing an empty day and recording taps
   against the wrong date. `todayKey()` on the client is local; endpoints that
   need to know the current period take it as a parameter (`?today=`) rather
   than reading the server's clock. See §6.1.
3. **The week boundary is per account** (`User.weekStart`, 0 = Sunday … 6 =
   Saturday, default Sunday) and is computed arithmetically, never through a
   dayjs locale or the isoWeek plugin. The server passes it explicitly on every
   call because it serves many accounts; the client holds a configured default
   set from the signed-in user, which an explicit argument still overrides.
   Changing it re-buckets that account's weekly rows — see §5.1.
4. **`accountId` is server-derived**, always from `res.locals.user._id`.
   Controllers never read it from the body.
5. **`GoalHistory` writes are idempotent** on `(goalId, interval, periodStart)`.
6. **Progress increments use `$inc`**, never read-modify-write. Two quick taps
   must both land.
7. **JWT payloads carry identifiers only** — never a document.

### 6.1 Time zones

The server has no idea what day it is for a given user and must not guess. Two
rules follow:

- **The client sends the date.** `?date=` on history reads, `date` in the body of
  a progress write, and `?today=` on streaks are all the *client's local calendar
  date*. Each endpoint falls back to the server's UTC date, which is correct only
  for callers on UTC and exists for curl and health checks.
- **Nothing is stored per user.** No timezone field to keep in sync and nothing
  to update when someone travels — the device that is being looked at is by
  definition the authority on what day it is there.

The client's local date is live rather than read once at mount (`useTodayKey`).
This is an installed PWA people leave running, so a date captured at mount goes
stale at local midnight; it is re-checked on a timer and whenever the tab returns
to the foreground, and the Today view follows the rollover if the user is still
sitting on today.

## 7. Client state

```js
{
  auth:    { user, status, error },
  goals:   { goals, categories, status, error },
  history: { entries, dates, ranges, summaries, streaks, pending, errors },
  ui:      { themeMode, toast },
}
```

`history.entries` is flat, keyed `"<goalId>|<interval>|<periodKey>"` — the same
identity the server uses. Two views showing the same period read the same object.

`history.dates` and `history.ranges` record what has already been fetched; every
thunk's `condition` checks them and returns early rather than re-requesting.
`ranges` also does containment checks, so a week inside an already-loaded month
costs nothing.

Because the cache is keyed by *data identity* rather than by "what the view is
currently showing", a late response cannot corrupt a newer one — which is why
`useAutoFetch` deliberately does not abort in-flight requests. It used to, and
the abort's rejection resolved after the next dispatch had already been skipped
by the thunk's `condition`, clearing the cache key and leaving views permanently
empty.

Optimistic writes track a per-entry `pending` count and a `_rollback` value, so a
failure restores the exact pre-tap number even with several taps in flight.

## 8. Known gaps

- `activity-server/.env` is committed and its secrets are 19–20 characters
  (32+ required). Rotating them is tracked in `SECURITY.md`; the app warns in
  development and refuses to start in production.
- 27,399 empty placeholder rows from the old read path are still in
  `goalhistories`. They are inert. `node scripts/maintenance.js --apply
  --purge-empty` removes them.
- No automated test suite beyond `scripts/verify-api.js`. There is no client
  test harness.
- Notifications from v1 were removed rather than ported; they were a live-tab
  `setTimeout` with no push subscription, so they never fired with the app closed.
- No deployment target is configured.
