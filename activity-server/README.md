# activity-server

Node 20+ / Express 5 / Mongoose 9 API. See the [top-level README](../README.md)
and [ARCHITECTURE.md](../ARCHITECTURE.md) for the full picture — in particular
**§3, the data-loading contract**, before touching any read path.

## Scripts

| Command | Purpose |
|---|---|
| `yarn start` | Production (`node server.js`) |
| `yarn dev` | Nodemon reload on change |
| `yarn verify` | End-to-end API check against a running server |
| `yarn maintenance` | Data maintenance report (dry-run; `--apply` to commit) |

## Environment

Copy `.env.example` to `.env` and fill it in.

| Key | Notes |
|---|---|
| `DBURL` | Connection string (Atlas or local). **Required.** |
| `PORT` | Optional; defaults to 8000 |
| `SALT_WORK_FACTOR` | bcrypt rounds; defaults to 12 |
| `ACCESS_TOKEN_SECRET` | ≥ 32 chars. `openssl rand -base64 48` |
| `REFRESH_TOKEN_SECRET` | ≥ 32 chars, **different** from the access secret |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | Default `180m` / `90d` |
| `CORS_ORIGINS` | Comma-separated browser origins |

`src/config/env.js` validates all of this at startup: it throws on a missing
`DBURL` or secret, refuses identical secrets, and rejects secrets under 32
characters in production (warning in development). `server.js` connects to
MongoDB *before* listening, so a bad `DBURL` fails immediately rather than
producing a server that accepts requests and 500s on every one.

> ⚠ The committed `.env` contains real-looking credentials and its secrets are
> 19–20 characters. See [`../SECURITY.md`](../SECURITY.md) — rotate before deploying.

## Layout

```
server.js                    # connect, then listen; graceful shutdown
src/
  app.js                     # Express bootstrap, CORS allow-list, error handler
  config/env.js              # validated environment
  db/connect.js
  lib/periods.js             # period math — mirrored by the client
  lib/tokens.js              # JWT sign/verify; payload is identifiers only
  lib/apiError.js            # ApiError + asyncHandler
  middleware/                # auth.js, errorHandler.js, rateLimit.js
  models/                    # user, goal, goalHistory, category
  controllers/               # auth, goal, history, stats
  routes/index.js
scripts/
  maintenance.js             # idempotent data maintenance, dry-run by default
  verify-api.js              # 22 end-to-end assertions
Dockerfile
```

## Endpoints

Everything lives under `/api`. Public: `POST /api/auth/signup`, `/api/auth/login`,
`/api/auth/refresh` (all rate-limited). Everything else requires
`Authorization: Bearer <accessToken>`.

See [ARCHITECTURE.md §4](../ARCHITECTURE.md) for the full table.

`requireAuth` sets `res.locals.user`; controllers derive `accountId` from that
and never from the request body.

## Demo account

`demo@fakeaccount.com` / `GUEST`, identified by the `isDemo` flag on the user
document rather than a hard-coded email comparison. It can record progress and
edit goals so the app is demonstrable; only credential changes are blocked.

## Maintenance

```bash
node scripts/maintenance.js                        # report only
node scripts/maintenance.js --apply                # commit the changes
node scripts/maintenance.js --apply --purge-empty  # also delete placeholder rows
```

Idempotent. It normalises emails, flags the demo account, backfills
`tokenVersion`, folds legacy embedded `Goal.history` into `GoalHistory` (summing
period collisions instead of keeping only the first), converts
`Category.accountId` from String to ObjectId, folds in categories that goals
reference but the list lacks, and syncs indexes.

`--purge-empty` is the only destructive option and is never implied. It removes
`GoalHistory` rows with `achieved: 0` and no note — placeholders the old read
path created on every page view.
