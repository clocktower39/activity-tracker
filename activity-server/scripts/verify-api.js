#!/usr/bin/env node
/**
 * End-to-end check against a running server.
 *
 *   node server.js &
 *   node scripts/verify-api.js [email] [password]
 *
 * Defaults to the demo account. Exercises every route the client uses, asserts
 * the write paths round-trip, and prints the payload size of the read paths so
 * regressions in transfer size are visible rather than theoretical.
 */
const BASE = process.env.API_URL || "http://localhost:8000/api";
const EMAIL = process.argv[2] || "demo@fakeaccount.com";
const PASSWORD = process.argv[3] || "GUEST";

let passed = 0;
let failed = 0;
let token = null;

const bytes = (n) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;

const call = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, json, size: text.length };
};

const check = (name, condition, detail = "") => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}${detail ? `  (${detail})` : ""}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ""}`);
  }
};

const today = new Date().toISOString().slice(0, 10);
const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

const main = async () => {
  console.log(`\n=== API verification against ${BASE} ===\n`);

  console.log("Auth");
  const badLogin = await call("POST", "/auth/login", { email: EMAIL, password: "definitely-wrong" });
  check("rejects a wrong password with 401", badLogin.status === 401);
  check(
    "does not reveal whether the account exists",
    badLogin.json?.error?.message === "Incorrect email or password"
  );

  const login = await call("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  check("logs in", login.status === 200 && !!login.json?.accessToken);
  if (login.status !== 200) {
    console.log(`\nCannot continue without a session: ${JSON.stringify(login.json)}\n`);
    process.exit(1);
  }
  token = login.json.accessToken;

  const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  check("token carries no password field", !("password" in claims), Object.keys(claims).join(", "));
  check("token identifies the user by id", !!claims.sub);

  const noAuth = await (async () => {
    const saved = token;
    token = null;
    const res = await call("GET", "/bootstrap");
    token = saved;
    return res;
  })();
  check("rejects an unauthenticated read with 401", noAuth.status === 401);

  console.log("\nRead paths");
  const boot = await call("GET", "/bootstrap");
  check("bootstrap returns goals and categories", boot.status === 200 && Array.isArray(boot.json?.goals));
  check("bootstrap ships no history", !JSON.stringify(boot.json).includes('"history"'), bytes(boot.size));

  const day = await call("GET", `/history?date=${today}`);
  check("history for a date returns entries", day.status === 200 && Array.isArray(day.json?.entries), bytes(day.size));
  check(
    "history for a date returns at most one row per goal",
    new Set((day.json?.entries || []).map((e) => String(e.goalId))).size === (day.json?.entries || []).length
  );

  const range = await call("GET", `/history/range?from=${yearAgo}&to=${today}`);
  check("history range responds", range.status === 200, bytes(range.size));

  const summary = await call("GET", `/stats/summary?from=${yearAgo}&to=${today}&bucket=month`);
  check(
    "monthly summary aggregates server-side",
    summary.status === 200 && Array.isArray(summary.json?.buckets),
    `${summary.json?.buckets?.length ?? 0} buckets, ${bytes(summary.size)}`
  );

  const byGoal = await call("GET", `/stats/by-goal?from=${yearAgo}&to=${today}`);
  check("per-goal stats respond", byGoal.status === 200 && Array.isArray(byGoal.json?.goals), bytes(byGoal.size));

  const streaks = await call("GET", "/stats/streaks?days=120");
  check("streaks respond", streaks.status === 200 && Array.isArray(streaks.json?.streaks), bytes(streaks.size));

  // Whether a streak is still alive depends on which period the caller is in,
  // which is a fact about their calendar rather than the server's clock.
  const streaksToday = await call("GET", `/stats/streaks?days=120&today=${today}`);
  check("streaks accept the caller's local date", streaksToday.status === 200);
  const streaksBadToday = await call("GET", "/stats/streaks?days=120&today=25-07-2026");
  check("rejects a malformed local date", streaksBadToday.status === 400);

  const badRange = await call("GET", `/history/range?from=${today}&to=not-a-date`);
  check("rejects a malformed date with 400", badRange.status === 400);

  console.log("\nWrite paths");
  const goal = (boot.json?.goals || []).find((g) => !g.hidden);
  if (!goal) {
    console.log("  SKIP  no visible goal on this account to tick");
  } else {
    const before = (day.json?.entries || []).find((e) => String(e.goalId) === String(goal._id));
    const baseline = before?.achieved ?? 0;

    const up = await call("POST", "/history/progress", { goalId: goal._id, date: today, delta: 1 });
    check(
      "increments progress",
      up.status === 200 && up.json?.entry?.achieved === baseline + 1,
      `${baseline} -> ${up.json?.entry?.achieved}`
    );

    // Two concurrent increments must both land. The old client read-modify-wrote
    // an absolute value, so one of these would have been lost.
    const [a, b] = await Promise.all([
      call("POST", "/history/progress", { goalId: goal._id, date: today, delta: 1 }),
      call("POST", "/history/progress", { goalId: goal._id, date: today, delta: 1 }),
    ]);
    const after = Math.max(a.json?.entry?.achieved ?? 0, b.json?.entry?.achieved ?? 0);
    check("concurrent increments do not overwrite each other", after === baseline + 3, `expected ${baseline + 3}, got ${after}`);

    const reset = await call("POST", "/history/progress", { goalId: goal._id, date: today, achieved: baseline });
    check("restores the original value", reset.status === 200 && (reset.json?.entry?.achieved ?? 0) === baseline);

    const below = await call("POST", "/history/progress", { goalId: goal._id, date: today, delta: -999 });
    check("clamps at zero rather than going negative", (below.json?.entry?.achieved ?? -1) === 0);

    if (baseline > 0) {
      await call("POST", "/history/progress", { goalId: goal._id, date: today, achieved: baseline });
    }

    const foreign = await call("POST", "/history/progress", {
      goalId: "000000000000000000000000",
      date: today,
      delta: 1,
    });
    check("refuses to write to another account's goal", foreign.status === 404);
  }

  console.log("\nWeek start");
  const profile = await call("GET", "/auth/me");
  const originalWeekStart = profile.json?.user?.weekStart;
  check("account exposes a weekStart", Number.isInteger(originalWeekStart), `= ${originalWeekStart}`);

  // A throwaway weekly goal, so the re-bucketing path is exercised against real
  // data rather than asserted in the abstract.
  const created = await call("POST", "/goals", {
    task: `__verify_weekly_${Date.now()}`,
    category: "Verification",
    defaultTarget: 1,
    interval: "weekly",
  });
  const weeklyGoal = created.json?.goal;
  check("creates a weekly goal", created.status === 201 && !!weeklyGoal);

  if (weeklyGoal) {
    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const periodStartFor = async () => {
      const res = await call("GET", `/history?date=${today}`);
      const row = (res.json?.entries || []).find((e) => String(e.goalId) === String(weeklyGoal._id));
      return row ? new Date(row.periodStart) : null;
    };

    await call("POST", "/history/progress", { goalId: weeklyGoal._id, date: today, delta: 1 });
    const before = await periodStartFor();
    check(
      "weekly period starts on the account's chosen day",
      before && before.getUTCDay() === originalWeekStart,
      before ? `${before.toISOString().slice(0, 10)} is a ${DAY_NAMES[before.getUTCDay()]}` : "no row"
    );

    // Move the boundary and confirm the recorded progress follows it.
    const moveTo = (originalWeekStart + 3) % 7;
    const changed = await call("PATCH", "/auth/profile", { weekStart: moveTo });
    check("accepts a new week start", changed.status === 200 && changed.json?.user?.weekStart === moveTo);
    check(
      "reports what it re-bucketed",
      (changed.json?.rebucketed?.moved ?? 0) >= 1,
      `moved ${changed.json?.rebucketed?.moved}, merged ${changed.json?.rebucketed?.merged}`
    );

    const after = await periodStartFor();
    check(
      "the recorded week moved to the new boundary",
      after && after.getUTCDay() === moveTo,
      after ? `${after.toISOString().slice(0, 10)} is a ${DAY_NAMES[after.getUTCDay()]}` : "row lost"
    );
    check("progress survived the move", after !== null);

    const restored = await call("PATCH", "/auth/profile", { weekStart: originalWeekStart });
    check("restores the original week start", restored.json?.user?.weekStart === originalWeekStart);

    const bad = await call("PATCH", "/auth/profile", { weekStart: 9 });
    check("rejects a week start outside 0-6", bad.status === 400);

    const removed = await call("DELETE", `/goals/${weeklyGoal._id}`);
    check("cleans up the throwaway goal", removed.status === 200);
  }

  console.log("\nToken rotation");
  const refreshed = await call("POST", "/auth/refresh", { refreshToken: login.json.refreshToken });
  check("refresh issues a new pair", refreshed.status === 200 && !!refreshed.json?.refreshToken);
  const badRefresh = await call("POST", "/auth/refresh", { refreshToken: "nope" });
  check("rejects a bogus refresh token", badRefresh.status === 401);

  console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error("\nVerification crashed:", err);
  process.exit(1);
});
