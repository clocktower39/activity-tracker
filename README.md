# Activity Tracker

A self-hosted MERN habit tracker. Define recurring **goals** (daily / weekly /
monthly / yearly / unscheduled) grouped under **categories**, record progress with
one tap, and follow the pattern out to the week, month and year.

Progress is a *count against a target for the period*, not a checkbox — so
"run 3 times this week", "8 glasses today" and "12 books this year" are the same
primitive at four cadences.

> **Status (July 2026):** v2. The server and client were rebuilt; the MongoDB
> data is the original data. See `ARCHITECTURE.md` for the shape of the system
> and `DESIGN.md` for the visual direction.

## Repository layout

```
activity-tracker/
├── AGENTS.md              # Entry file for any AI agent working in this repo
├── ARCHITECTURE.md        # System design, API, data model, invariants
├── PRODUCT.md             # Durable product truth: users, purpose, constraints
├── DESIGN.md              # The visual world and its rules
├── SECURITY.md            # Credential rotation + reporting policy
├── activity-server/       # Express 5 + Mongoose 9 API (port 8000)
│   ├── server.js
│   ├── src/               # config, db, lib, middleware, controllers, routes, models
│   └── scripts/           # maintenance.js, verify-api.js
└── activity-client/       # Vite + React 19 + MUI 7 + Redux Toolkit PWA
    └── src/
        ├── app/           # api client, store
        ├── features/      # auth, goals, history, ui slices
        ├── components/    # Ring, Stave, PeriodBars, GoalSheet, …
        ├── views/         # Today, Period, Review, Settings, auth screens
        ├── design/        # theme
        └── lib/           # periods (mirrors the server)
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, MUI 7, Redux Toolkit 2, PWA |
| Routing | react-router 7 |
| Backend | Node 20+, Express 5, Mongoose 9 |
| Database | MongoDB |
| Auth | JWT (access 180m / refresh 90d, rotating) + bcrypt |
| Serving | nginx serves the built client and proxies `/api` on the same origin |
| Tooling | yarn, ESLint 9 |

## Quick start

### 1. API

```bash
cd activity-server
yarn install
cp .env.example .env      # then fill in DBURL and both secrets
yarn dev                  # nodemon on :8000
```

Secrets must be at least 32 characters and different from each other — generate
them with `openssl rand -base64 48`. The server refuses to start in production
with weak secrets and warns in development. It also connects to MongoDB *before*
listening, so a bad `DBURL` fails immediately rather than producing a server
that 500s on every request.

### 2. Client

```bash
cd activity-client
yarn install
yarn dev                     # vite on :5173
```

Then open <http://localhost:5173>.

No configuration is needed: `yarn dev` proxies `/api` to `localhost:8000`, so
development is same-origin exactly like production and CORS is not involved at
either end. `.env.example` documents the overrides if you need them.

### 3. Demo account

`demo@fakeaccount.com` / `GUEST`. It can record progress and edit goals so the
app is actually demonstrable; only credential changes are blocked, via the
`isDemo` flag rather than a hard-coded email comparison.

## Scripts

**`activity-server`**
- `yarn start` / `yarn dev`
- `yarn verify` — end-to-end API check against a running server (34 assertions
  covering auth, payload shape, concurrent writes, account isolation and the
  week-start re-bucketing)
- `yarn maintenance` — data maintenance; **dry-run by default**

**`activity-client`**
- `yarn dev` / `yarn build` / `yarn preview` / `yarn lint`

### Data maintenance

```bash
node scripts/maintenance.js                        # report only, changes nothing
node scripts/maintenance.js --apply                # normalise and migrate
node scripts/maintenance.js --apply --purge-empty  # also delete placeholder rows
```

Idempotent and safe to re-run. It lowercases emails, flags the demo account,
folds any legacy embedded `Goal.history` into `GoalHistory` (summing collisions
instead of dropping them), fixes `Category.accountId` from String to ObjectId,
gives accounts the default week start and moves their weekly rows to match, and
syncs indexes.

`--purge-empty` is the only destructive option and is never implied. It deletes
`GoalHistory` rows with `achieved <= 0` and no note: the placeholders the old
read path created on every page view, plus a few rows the old client's unclamped
decrement drove negative. Neither carries information.

## Conventions

- **Periods are UTC-anchored date labels**, not instants. `src/lib/periods.js`
  exists on both sides and the two must stay identical.
- **"Today" is the user's local calendar date**, never derived from UTC.
- **The week boundary is per account** (`User.weekStart`, default Sunday), so
  nothing may hard-code Monday or reach for `startOf("week")`.
- **No writes on read paths.** A history row exists only because a user recorded
  something; a missing row means zero.
- **Every history query is bounded** by an indexed period range. Rollups are
  aggregated in MongoDB, not shipped to the browser.
- **`accountId` is always server-derived** from the verified token.
- **Progress uses `$inc`**, never read-modify-write.

## Documentation map

| File | Purpose |
|---|---|
| `README.md` | What this is and how to run it |
| `PRODUCT.md` | Users, purpose, constraints, product principles |
| `DESIGN.md` | The visual world, tokens, and the ring's rules |
| `ARCHITECTURE.md` | Module map, API, data model, invariants |
| `AGENTS.md` | Working rules for an AI agent in this repo |
| `SECURITY.md` | Credential rotation + vulnerability reporting |
| `docs/deployment.md` | Subdomain deployment: nginx, Cloudflare, systemd, firewall |

## License

MIT.
