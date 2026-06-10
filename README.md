# Activity Tracker

A self-hosted MERN activity / habit tracker. Users sign up, define recurring **goals** (daily / weekly / monthly / yearly / unscheduled) grouped under custom **categories**, log progress, and view bar-chart history. The app is a Progressive Web App and ships with a dark/light theme, scheduled local notifications, and a guest demo account.

> **Status (June 2026):** working first version. The codebase is currently being refactored and re-instrumented under a harness-engineering workflow (see `AGENTS.md`, `ARCHITECTURE.md`, and `docs/`). Several known issues are tracked in `docs/feature_list.json`.

## Repository layout

```
activity-tracker/
├── AGENTS.md                 # Entry file for any AI agent working in this repo
├── ARCHITECTURE.md           # System design, layers, data model, request flows
├── README.md                 # You are here
├── SECURITY.md               # Required credential rotation + reporting policy
├── activity-server/          # Node + Express + Mongoose API (port 8000)
│   ├── app.js
│   ├── routes/  controllers/  models/  middleware/  scripts/
│   └── .env                   # ⚠ real-looking credentials — see SECURITY.md
└── activity-tracker-app/     # Vite + React 19 + Redux + MUI PWA
    ├── index.html
    └── src/
        ├── Components/       # Log / Settings / Auth / Navbar
        ├── Redux/            # store, reducer, actions, initial state
        ├── Hooks/            # useLongPress, useWindowSize
        └── utils/            # intervals, notifications
```

## Stack at a glance

| Layer       | Technology                                                 |
|-------------|------------------------------------------------------------|
| Frontend    | React 19, Vite 7, MUI 7, Redux 5 + Thunk, Recharts 3, PWA  |
| Routing     | react-router 7                                             |
| Backend     | Node 16, Express 5, Mongoose 9, Socket.IO 4                |
| Database    | MongoDB (Atlas in `.env`, local string commented out)      |
| Auth        | JWT (access 180m / refresh 90d) + bcrypt (SALT_WORK_FACTOR)|
| Tooling     | yarn (server), npm/yarn (client), ESLint 9, Docker (server)|

## Quick start

### 1. Backend (`activity-server`)

```bash
cd activity-server
yarn install            # or `npm install`
cp .env .env.example    # then edit values; do NOT commit real secrets
yarn dev                # nodemon on :8000
```

The server reads `DBURL`, `PORT`, `SALT_WORK_FACTOR`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` from `.env`. Without a valid `DBURL` the server logs `MongoDB connection error` and continues (no crash), but every DB-touching request will fail.

### 2. Frontend (`activity-tracker-app`)

```bash
cd activity-tracker-app
yarn install
yarn dev                # vite dev server
```

The client hard-codes the production API URL in `src/Redux/actions.jsx`:

```js
const serverURL = "https://myactivitytracker.herokuapp.com";
```

For local dev, swap that to `http://localhost:8000` (a commented hint lives just above it).

### 3. Demo account

A read-only guest account is hard-coded server-side: `DEMO@FAKEACCOUNT.COM` / `GUEST`. Password change is rejected for that account.

## Available scripts

**`activity-server`**
- `yarn start` — production
- `yarn dev`   — nodemon

**`activity-tracker-app`**
- `yarn dev`     — Vite dev server
- `yarn build`   — production bundle
- `yarn preview` — serve built bundle
- `yarn lint`    — ESLint

**Other**
- `node activity-server/scripts/migrate-goal-history.js` — one-shot migration that moved per-goal `history` arrays out of the `Goal` document and into a separate `GoalHistory` collection. Run only when upgrading from a pre-`GoalHistory` database.

## Project conventions (short version — full list in `AGENTS.md`)

- **WIP=1.** Work on one feature at a time. Don't bundle unrelated changes into a single commit.
- **Repo is the system of record.** Anything the agent needs to know (constraints, progress, current blockers) must be checked in, not held in chat.
- **Definition of done = verifiable evidence**, not "code looks right." For each feature in `docs/feature_list.json`, the `verification` block must actually pass.
- **UTC everywhere.** `dayjs.utc()` is used on both server and client for `periodStart`. Never mix local-time Date math with period keys.
- **No silent `console.log`** in commits. Use the structured logger planned for the server (see `docs/feature_list.json`).

## Documentation map

| File                          | Purpose                                                                  |
|-------------------------------|--------------------------------------------------------------------------|
| `README.md`                   | This file — what the project is and how to run it.                       |
| `AGENTS.md`                   | Entry file read by any AI coding agent. Working rules, DoD, topic links. |
| `ARCHITECTURE.md`             | Module map, request flows, data model, security model.                   |
| `SECURITY.md`                 | Required credential rotation + vulnerability reporting.                  |
| `docs/feature_list.json`      | The single source of truth for what to build next.                       |
| `docs/PROGRESS.md`            | Session log: what changed, what's next, what's blocked.                  |
| `docs/clean-state-checklist.md` | Five-condition exit checklist used at the end of every session.       |
| `docs/evaluator-rubric.md`    | Scorecard for reviewing agent output.                                    |
| `docs/quality-document.md`    | Per-module health snapshot.                                               |
| `docs/init.sh`                | One-shot startup: install, verify, print the start command.              |

## License

MIT (per `activity-server/package.json`). No license file is committed for the client; add one before publishing.

## Acknowledgements

Documentation scaffolding and workflow are adapted from the [Learn Harness Engineering](https://walkinglabs.github.io/learn-harness-engineering/en/) curriculum.
