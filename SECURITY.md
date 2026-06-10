# SECURITY.md

> Read this before any deploy, before opening a PR, and before sharing a screen / repo with anyone outside the project.

## 1. Active issue: credentials are committed

`activity-server/.env` is checked in and contains what looks like real credentials:

- `DBURL` (MongoDB Atlas, with a username and password)
- `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` (JWT signing secrets)

**Treat these as compromised.** They have been on disk in a development repo; the only safe assumption is that someone outside the project has seen them. The strings are not echoed here, but they are present in the file.

### Required actions, in order

1. **Rotate the MongoDB user password.** In MongoDB Atlas: Database Access → edit the user referenced in the connection string → set a new password → update `DBURL` in your local `.env`.
2. **Regenerate the JWT secrets.** Two new random strings, at least 32 bytes each, **different from each other**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
   Put one in `ACCESS_TOKEN_SECRET`, the other in `REFRESH_TOKEN_SECRET`.
3. **Rewrite git history** for `activity-server/.env`. Recommended: `git filter-repo --path activity-server/.env --invert-paths` (requires installing `git-filter-repo`). Coordinate with any collaborators before rewriting shared history. Force-push only after confirming no open PRs reference the old commits.
4. **Commit a sanitised `.env.example`.** The example file should list every required key with `<set-me>` placeholders, no real values. It is already added to the feature list as **F01**.

Until all four steps are done, F01 stays `in_progress` in `docs/feature_list.json`, and `AGENTS.md` §3 explicitly forbids adding more committed secrets.

## 2. Reporting a vulnerability

If you find a security issue in this repository:

1. **Do not** open a public GitHub issue.
2. Email the maintainer directly (replace with the real contact address before publishing this file).
3. Include: affected file / line, reproduction steps, impact estimate.
4. Expect acknowledgement within 72 hours. Disclosure timeline is coordinated case by case.

## 3. Day-to-day rules

- **Never commit `.env`, `.env.*.local`, or any file containing a credential.** The existing `.gitignore` files already cover these patterns; do not weaken them.
- **Never log a token, password, or full request body.** If a structured logger is added (tracked as F12), redact `Authorization`, `Cookie`, `password`, `currentPassword`, `newPassword`.
- **`accountId` is server-derived.** Client code never sends it; controllers never accept it from the body. (See `AGENTS.md` §3 and `ARCHITECTURE.md` §5.)
- **Public endpoints are exactly three:** `POST /login`, `POST /signup`, `POST /refresh-tokens`. Anything new must be added behind `verifyAccessToken`.
- **CORS is wide open today** (`app.use(cors())`). Tracked as F08. Tighten before any non-local origin is added.
- **Demo account is read-only for password change** but not for goal mutations. Do not depend on it for security; treat it as a UX shortcut, not a guard.
- **The local MongoDB connection string is commented out** in `.env`. If you switch to it, make sure the new connection string is not committed.

## 4. Dependency hygiene

- `npm audit` / `yarn audit` is not currently wired. Before the first deploy, run it in both packages and address anything ≥ moderate.
- Renovate / Dependabot is not configured. Pin major versions in `package.json`; treat any change to a security-sensitive dependency (`jsonwebtoken`, `bcrypt`, `mongoose`, `express`) as a feature in `docs/feature_list.json`, not a chore.

## 5. Out of scope for this file

- Threat-modelling the application as a whole. The app is single-tenant per user; cross-user data leakage would be a critical bug and should be tested manually after any change to `accountId` derivation.
- Operational security for the hosting environment (the deployed MongoDB cluster, the static file host, the JWT secret storage). The README assumes a single developer on a personal hobby project; harden before opening the app to other users.
