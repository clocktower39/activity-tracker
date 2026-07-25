# SECURITY.md

> Read this before any deploy, before opening a PR, and before sharing a screen / repo with anyone outside the project.

## 1. Correction: credentials were never committed

An earlier version of this file stated that `activity-server/.env` was checked in
and that its contents should be treated as compromised, and `docs/feature_list.json`
carried an F01 task to purge it from history with `git filter-repo`.

**That was wrong.** Every blob on every branch in this repository has been scanned
against the live Atlas connection string, both JWT secrets, and `mongodb+srv://`:
zero matches. `.env` has never been tracked, and both packages' `.gitignore`
covered it from the start. There is no history to rewrite and nothing to force-push.

If you want to re-verify at any point:

```bash
git rev-list --objects --all | awk '{print $1}' | sort -u |
while read h; do
  [ "$(git cat-file -t "$h" 2>/dev/null)" = blob ] || continue
  git cat-file blob "$h" 2>/dev/null | grep -qF 'mongodb+srv://' && echo "HIT $h"
done
```

## 2. Active issue: the JWT secrets are too weak to deploy

Not because they leaked — because of what they are. `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET` in the local `.env` are 20 and 19 characters, and both are
guessable English phrases rather than random strings. Anyone who guesses one can
mint a valid token for any account.

`src/config/env.js` enforces this: it refuses to start when `NODE_ENV=production`
if either secret is under 32 characters, and warns in development. **The app
cannot be deployed until they are replaced.**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Run it twice. The two values must differ from each other — the config check
rejects identical secrets.

Rotating the Atlas password at the same time is cheap and sensible hygiene, but
it is not a response to a known exposure: nothing in this repository ever
contained it.

Tracked as **F01**.

## 3. Reporting a vulnerability

If you find a security issue in this repository:

1. **Do not** open a public GitHub issue. This repository is public.
2. Email the maintainer directly (replace with the real contact address before
   relying on this file).
3. Include: affected file / line, reproduction steps, impact estimate.
4. Expect acknowledgement within 72 hours. Disclosure timeline is coordinated
   case by case.

## 4. Day-to-day rules

- **Never commit `.env`, `.env.*.local`, or any file containing a credential.**
  The existing `.gitignore` files cover these patterns; do not weaken them.
- **Never put a document in a JWT payload.** Tokens carry `sub`, `email`,
  `tokenVersion` and `type` only. The v1 code signed the whole Mongoose document,
  which put the bcrypt password hash inside every token handed to a browser —
  JWTs are base64, not encrypted. `User.password` is now `select: false` and
  `toPublicJSON()` is the only shape that may leave the server.
- **Never log a token, password, or full request body.** The development request
  logger in `src/app.js` deliberately logs method, path, status and duration
  only. A structured production logger is still unbuilt (F12); when it lands it
  must redact `Authorization`, `Cookie`, `password`, `currentPassword`,
  `newPassword`.
- **`accountId` is server-derived.** Client code never sends it; controllers
  never accept it from the body. See `AGENTS.md` §3 and `ARCHITECTURE.md` §6.
- **Public endpoints are exactly three:** `POST /api/auth/signup`,
  `POST /api/auth/login`, `POST /api/auth/refresh`. Everything else sits behind
  `requireAuth`, and anything new must too.
- **The demo account is a flag, not a string comparison.** `User.isDemo` gates
  credential changes via `blockDemo`. Goal and history writes stay open so the
  demo is usable; do not treat it as a security boundary.

## 5. Deployment posture

Established in `docs/deployment.md`; the parts that matter for security:

- **The API binds loopback in production.** `HOST` defaults to `127.0.0.1` when
  `NODE_ENV=production`, so only the reverse proxy on the same machine can reach
  it. Setting `0.0.0.0` on a public VPS publishes the API on its port directly,
  past TLS, Cloudflare and every nginx rule.
- **CORS is off unless asked for.** nginx serves the client and proxies `/api` on
  the same origin, so no cross-origin request is made and no headers are emitted.
  The allow-list only mounts when `CORS_ORIGINS` is set. (The old "wide open
  `app.use(cors())`" is gone; F08 is closed.)
- **`TRUST_PROXY` must match the real topology.** It decides which
  `X-Forwarded-For` entry becomes `req.ip`, and `req.ip` is what the auth rate
  limiter counts. Behind Cloudflare without the matching nginx `real_ip` block,
  every visitor shares one bucket and twenty failed sign-ins lock out everybody.
  `docs/deployment.md` §4 has the config and a two-device test that proves it
  rather than assuming it.
- **Auth routes are rate limited** (20 per 15 minutes per IP) and sign-in returns
  one message for both a bad address and a bad password, so it cannot be used to
  enumerate accounts.
- **Password changes invalidate other sessions** by bumping `User.tokenVersion`,
  which `requireAuth` checks on every request. Refresh tokens rotate on use.

## 6. Dependency hygiene

- `npm audit` / `yarn audit` is not currently wired. Before the first deploy, run
  it in both packages and address anything ≥ moderate.
- Renovate / Dependabot is not configured. Pin major versions in `package.json`;
  treat any change to a security-sensitive dependency (`jsonwebtoken`, `bcrypt`,
  `mongoose`, `express`) as a feature in `docs/feature_list.json`, not a chore.

## 7. Out of scope for this file

- Threat-modelling the application as a whole. Each account's data is isolated by
  `accountId`; cross-account leakage would be critical, and `scripts/verify-api.js`
  asserts one case of it — writing to another account's goal returns 404. Extend
  that suite rather than testing by hand when `accountId` derivation changes.
- Operational security for the hosting environment: the MongoDB cluster's network
  access list, the VPS, Cloudflare account access, and where the production `.env`
  lives. The app is a personal project with a handful of real users; harden
  further before opening sign-up to strangers.
