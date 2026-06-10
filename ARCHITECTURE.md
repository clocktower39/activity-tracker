# ARCHITECTURE.md

> Single source of truth for the system's shape. If the code disagrees with this file, the code is wrong. Update the file in the same commit that fixes the code.

## 1. System overview

```
┌────────────────────────────────┐    HTTPS / JSON     ┌────────────────────────────┐
│  Browser (PWA)                 │ ──────────────────► │  Express + Mongoose API    │
│  React 19 + Redux + MUI        │ ◄────────────────── │  Node 16                   │
│  • Bearer JWT in localStorage  │                     │  • verifyAccessToken mw    │
│  • Optimistic UI on log tick   │                     │  • Mongoose 9 models       │
└────────────────────────────────┘                     └──────────────┬─────────────┘
        ▲                                                            │
        │  Service Worker / Web Push                                ▼
        │                                                  ┌──────────────────┐
        │                                                  │  MongoDB         │
        │                                                  │  (Atlas)         │
        ▼                                                  └──────────────────┘
  Notifications API
```

- **One round-trip model.** The browser talks to the API directly. There is no BFF / proxy layer.
- **Auth is JWT-based.** Access token (15–180 m, see §5) lives in `localStorage.JWT_AUTH_TOKEN`; refresh token in `JWT_REFRESH_TOKEN`. There is no cookie / CSRF surface because the API does not rely on session cookies.
- **Realtime is a future direction.** `socket.io` is installed on the server but not yet wired to a route. Treat any `socket` reference in the client as dead code.

## 2. Module map

### 2.1 Server (`activity-server/`)

| Path                                                | Responsibility                                        |
|-----------------------------------------------------|-------------------------------------------------------|
| `app.js`                                            | Express bootstrap, CORS, JSON, error handler          |
| `routes/goalRoutes.js`                              | All `/` and `/goal*` POST routes, gated by JWT        |
| `routes/userRoutes.js`                              | `/login`, `/signup`, `/refresh-tokens`, user mutators |
| `controllers/goalController.js`                     | Business logic for goals + history                    |
| `controllers/userController.js`                     | Signup, login, token issuance, password change        |
| `models/goal.js`                                    | `Goal` Mongoose schema                                |
| `models/goalHistory.js`                             | `GoalHistory` Mongoose schema (idempotent writes)     |
| `models/category.js`                                | `Category` Mongoose schema (one doc per user)         |
| `models/user.js`                                    | `User` schema + bcrypt pre-save hook                  |
| `middleware/auth.js`                                | `verifyAccessToken`, `verifyRefreshToken`             |
| `scripts/migrate-goal-history.js`                   | One-shot migration, run once when upgrading           |

### 2.2 Client (`activity-tracker-app/`)

| Path                                          | Responsibility                                            |
|-----------------------------------------------|-----------------------------------------------------------|
| `src/main.jsx`                                | Redux Provider + StrictMode root                          |
| `src/App.jsx`                                 | Theme + Router, picks dark/light from `state.user.themeMode` |
| `src/Redux/store.jsx`                         | Single store, thunk middleware, devtools                  |
| `src/Redux/reducer.jsx`                       | Activity-by-date cache + auth state                       |
| `src/Redux/actions.jsx`                       | Thunks: `loginUser`, `getActivities`, `updateActivityProgress`, … |
| `src/Redux/states.jsx`                        | Initial state slices                                      |
| `src/Components/AuthRoute.jsx`                | `<Outlet>` guard; runs `loginJWT` on mount if a refresh token is present |
| `src/Components/Log/LogContainer.jsx`         | Main log view; grouped-by-category or flat                |
| `src/Components/Log/GoalCircularProgress.jsx` | Tap = +1 progress, long-press = open details              |
| `src/Components/Log/GoalDetails.jsx`          | Detail dialog: ± progress, chart, edit                    |
| `src/Components/Log/EditGoal.jsx`             | Edit / hide / delete goal                                 |
| `src/Components/Log/NewGoal.jsx`              | Add new goal                                              |
| `src/Components/Log/EditCategories.jsx`       | Manage category list                                      |
| `src/Components/Log/Metrics.jsx`              | Recharts bar chart + date range picker                    |
| `src/Components/Settings/*`                   | Account, theme, notifications, hidden, change password    |
| `src/Hooks/useLongPress.jsx`                  | Touch / mouse long-press helper                           |
| `src/Hooks/useWindowSize.jsx`                 | Responsive breakpoint hook                                |
| `src/utils/intervals.js`                      | `INTERVAL_OPTIONS`, `normalizeInterval`, period math      |
| `src/utils/notifications.js`                  | Permission flow + daily check-in scheduler                |

## 3. Request flow

A logged-in user opens the app:

1. `AuthRoute` mounts. If a refresh token is in `localStorage`, it dispatches `loginJWT` to get a fresh access token.
2. Once `state.user.email` is set, `AuthRoute` dispatches `getActivities(today)`.
3. `getActivities` POSTs `{ selectedDate: "YYYY-MM-DD" }` to `/`. The server returns the user's goals + categories + the relevant `GoalHistory` slice.
4. The result is cached in `state.activityByDate[YYYY-MM-DD]`. Subsequent visits to the same date apply the cache; visits to other dates trigger a new fetch.
5. When the user taps a goal circle, `updateActivityProgress` runs: optimistic local update first, then `POST /newHistoryItem` or `POST /updateHistoryItem`.

### 3.1 Write paths (must be idempotent)

```
tap on goal  ──► updateActivityProgress(goalId, +1, selectedDate)
                  │
                  ├─ exists in goal.history? ──► POST /updateHistoryItem  (findOneAndUpdate by _id)
                  └─ does not exist?           ──► POST /newHistoryItem    (findOneAndUpdate by
                                                                          (goalId, interval,
                                                                           periodStart),
                                                                          upsert:true)
```

The `newHistoryItem` endpoint is the only correct way to add a new period entry; it enforces the `(goalId, interval, periodStart)` unique key and refuses to clobber an existing row.

## 4. Data model

### 4.1 `User` (`models/user.js`)

| Field        | Type    | Notes                                          |
|--------------|---------|------------------------------------------------|
| `email`      | String  | unique index                                   |
| `firstName`  | String  | required                                       |
| `lastName`   | String  | required                                       |
| `password`   | String  | bcrypt-hashed; `SALT_WORK_FACTOR` from `.env`  |
| `themeMode`  | String  | `"light" \| "dark" \| "custom"`                |

### 4.2 `Goal` (`models/goal.js`)

| Field           | Type     | Notes                                                        |
|-----------------|----------|--------------------------------------------------------------|
| `task`          | String   | required                                                     |
| `interval`      | String   | enum: `daily / weekly / monthly / yearly / none` (lowercased on set) |
| `defaultTarget` | Number   | required                                                     |
| `category`      | String   | required, free-text; matches `Category.categories[].category` |
| `order`         | Number   | required; user-defined sort key                              |
| `history`       | Array    | **Deprecated.** Kept in the schema for backward compatibility but no new code should write to it. Use `GoalHistory`. |
| `accountId`     | ObjectId | required, ref `User`                                         |
| `hidden`        | Boolean  | default `false`                                              |

### 4.3 `GoalHistory` (`models/goalHistory.js`)

| Field              | Type     | Notes                                                |
|--------------------|----------|------------------------------------------------------|
| `goalId`           | ObjectId | ref `Goal`, indexed                                 |
| `accountId`        | ObjectId | ref `User`, indexed                                 |
| `interval`         | String   | enum as above                                        |
| `periodStart`      | Date     | **UTC** start of the period (day/week/month/year)   |
| `targetPerDuration`| Number   | copied from `Goal.defaultTarget` at upsert time     |
| `achieved`         | Number   | sum of ticks for this period                         |
| `note`             | String   | optional                                             |

Indexes:
- `unique (goalId, interval, periodStart)` — the idempotency key.
- `(accountId, periodStart)` — query acceleration for the log view.

### 4.4 `Category` (`models/category.js`)

One document per user. The schema is `{ account: ObjectId, categories: [{ category: String, order: Number }] }`. (Note: the `account` field name does not match the `accountId` convention used elsewhere. Tracked as a low-priority cleanup in `docs/feature_list.json`.)

## 5. Security model

- **Auth.** Bcrypt password hashing with `SALT_WORK_FACTOR` from `.env` (currently 13). JWTs signed with `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`.
- **Token lifetimes.** Access 180 m, refresh 90 d. Note: `userController.update_user` issues an access token with a *30-day* lifetime (line 29) — almost certainly a copy-paste leftover. Tracked in `docs/feature_list.json` as `bug/access-token-lifetime`.
- **Account id source of truth.** Always `res.locals.user._id` after `verifyAccessToken`. Controllers must never read `req.body.accountId`.
- **Public endpoints.** Only `POST /login`, `POST /signup`, `POST /refresh-tokens`. `POST /signup` is currently *unprotected* but not authenticated; it is the only route that creates a user.
- **Demo guard.** The hard-coded email `DEMO@FAKEACCOUNT.COM` blocks password changes inside `change_password`. (It does **not** block edits to other fields, and it does **not** block read or write of goals. Tracked as a refactor.)
- **CORS.** `app.use(cors())` with the default `Access-Control-Allow-Origin: *`. Acceptable for a public read-write API paired with a JWT, but should be tightened when the production origin set is known.

For credential handling, rotation, and incident reporting, see `SECURITY.md`.

## 6. Client architecture

### 6.1 Redux store

State shape (initial):
```js
{
  goals: [],
  categories: [],
  user: { themeMode: 'dark' },
  activityLoaded: false,
  activityByDate: {},          // { 'YYYY-MM-DD': { goals, categories } }
  activityLoadingByDate: {},   // { 'YYYY-MM-DD': boolean }
  selectedDate: null,
  activeDate: null,
}
```

`activityByDate` is a date-keyed cache so re-opening the same day is instant. `activeDate` mirrors the currently displayed date so components can know when the cache they hold is still relevant.

### 6.2 Theme

`src/theme.jsx` exports `theme()` — a *function*, not an object — that reads the current Redux state to decide light vs. dark. The store is imported at module load, so a Redux update triggers a re-read on the next `useEffect` in `App.jsx`. Don't cache the result.

### 6.3 PWA

`vite-plugin-pwa` is configured with a manifest, two icons, and a base path of `/activity-tracker/`. The service worker is auto-registered. The notification flow lives in `src/utils/notifications.js`:

1. `requestNotificationPermission()` → standard Web Notifications prompt.
2. `scheduleDailyCheckin(time, onNotify)` returns a cleanup function; it sets a `setTimeout` to the next occurrence, then a 24 h `setInterval`.
3. `showCheckinNotification()` prefers `registration.showNotification` (Service Worker path) and falls back to the `Notification` constructor.

### 6.4 Routing

`react-router` v7 with `BrowserRouter basename="/activity-tracker/"`. Public: `/login`, `/signup`, any unmatched path (`NotFoundPage`). All other routes are wrapped in `AuthRoute` which either renders `<Outlet />` (when authenticated) or `<Navigate to="/login" />`. `AuthRoute` also kicks off the first `getActivities` fetch.

### 6.5 Server URL

`src/Redux/actions.jsx` line 26 hard-codes the production API URL. For local development, swap the constant. There is no environment switch today; the recommended refactor is a `VITE_API_URL` env variable read by Vite at build time (tracked in `docs/feature_list.json`).

## 7. Data flow invariants (must hold)

1. **Period keys are computed with `dayjs.utc()` on both sides.** Client and server must agree, or progress ticks land in the wrong bucket.
2. **`periodStart` is the start of the UTC period, not a timestamp from a tick.** A tick at 23:59 local on 2026-01-15 in `America/Los_Angeles` is still UTC `2026-01-16` — same period bucket as a tick at 00:01 UTC.
3. **`Goal.history` is read-only.** Any new write goes through `GoalHistory`. The legacy field is preserved on disk for old data and removed by the migration script.
4. **`accountId` is server-derived.** Client code never sends it; controllers never accept it from the body.

## 8. Where things are likely to break next

These are the spots where the next refactor should focus:

- The `serverURL` constant — bake it from `import.meta.env.VITE_API_URL` instead of hard-coding.
- The token-lifetime typo in `userController.update_user` (30 d instead of 180 m).
- `Category.account` vs. `accountId` naming.
- `socket.io` is installed and required by `app.js` (line 4) but no route mounts it. Either wire it or remove the import.
- The local MongoDB connection string in `.env` is commented out (line 3). It is referenced as the dev path; either enable it or document why Atlas-only.
- `Login.jsx` swallows the response promise (`.then(setDisableButtonDuringLogin(false))` after a `setState` already set it to `false`) — works today, fragile tomorrow.
- `AccountSettings.jsx` has no wired Save / Cancel handlers (`onClick={() => null}`).

These are tracked in `docs/feature_list.json`.
