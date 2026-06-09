# activity-server

Node 16 + Express 5 + Mongoose 9 API. See the [top-level README](../README.md) and [ARCHITECTURE.md](../ARCHITECTURE.md) for the full picture.

## Scripts

| Command       | Purpose                          |
|---------------|----------------------------------|
| `yarn start`  | Production (`node app.js`)       |
| `yarn dev`    | Nodemon reload on change         |

## Environment

`.env` must define:

| Key                    | Example                                                                                | Notes                                  |
|------------------------|----------------------------------------------------------------------------------------|----------------------------------------|
| `DBURL`                | `mongodb://localhost:27017/activity-tracker?directConnection=true&retryWrites=true&w=majority` | Connection string (Atlas or local)     |
| `PORT`                 | `8000`                                                                                 | Optional; defaults to 8000             |
| `SALT_WORK_FACTOR`     | `13`                                                                                   | bcrypt rounds                          |
| `ACCESS_TOKEN_SECRET`  | random ≥ 32 bytes                                                                      | Sign access JWTs                       |
| `REFRESH_TOKEN_SECRET` | random ≥ 32 bytes, **different** from `ACCESS_TOKEN_SECRET`                            | Sign refresh JWTs                      |

> ⚠ The committed `activity-server/.env` currently contains what looks like real credentials. See [`../SECURITY.md`](../SECURITY.md) — do not deploy as-is. Rotate the secrets and regenerate the file from `.env.example` (or your secret manager) before the first deploy.

## Layout

```
app.js                       # Express bootstrap
routes/                      # goalRoutes.js, userRoutes.js
controllers/                 # goalController.js, userController.js
models/                      # user, goal, goalHistory, category (Mongoose)
middleware/                  # auth.js (verifyAccessToken, verifyRefreshToken)
scripts/
  migrate-goal-history.js    # one-shot data migration
Dockerfile                   # node:16 image, yarn install, expose 8000
```

## Public endpoints

| Method | Path                | Notes                              |
|--------|---------------------|------------------------------------|
| POST   | `/login`            | body: `{ email, password }`        |
| POST   | `/signup`           | body: full user record             |
| POST   | `/refresh-tokens`   | body: `{ refreshToken }`           |

Everything else requires `Authorization: Bearer <accessToken>`. A valid access token gives `res.locals.user = decoded payload`; controllers must derive `accountId` from that, never from the request body. (See `AGENTS.md` §3.)

## Demo account

A read-only guest account is hard-coded in `controllers/userController.js`:

- email: `DEMO@FAKEACCOUNT.COM`
- password: `GUEST`
- `change_password` rejects this email; goal updates are **not** blocked (tracked as a refactor in `docs/feature_list.json`).

## Migrations

`scripts/migrate-goal-history.js` is the only committed migration. Run it once when upgrading from a pre-`GoalHistory` schema:

```bash
node activity-server/scripts/migrate-goal-history.js
```

It is idempotent on the unique key `(goalId, interval, periodStart)`.
