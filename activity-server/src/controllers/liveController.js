const { subscribe, publish } = require("../lib/liveHub");

// nginx closes an upstream that sends nothing for 30 s (proxy_read_timeout on
// the live host), and Cloudflare drops idle connections after 100 s. A comment
// line every 15 s keeps the stream inside both without changing either.
const HEARTBEAT_MS = 15 * 1000;

// Client ids are random per tab (crypto.randomUUID). Anything else is ignored
// rather than trusted: the id only decides which stream to skip.
const cleanClientId = (value) =>
  typeof value === "string" && /^[A-Za-z0-9-]{8,64}$/.test(value) ? value : null;

/** GET /api/live — one long-lived event stream per open tab. Read-only. */
const stream = (req, res) => {
  const accountId = res.locals.user._id;
  const clientId = cleanClientId(req.get("X-Client-Id"));

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Tells nginx not to buffer this response, which would hold events back.
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  // `retry` is the browser's reconnect delay; the client manages its own, but
  // this keeps a plain EventSource sensible too.
  res.write("retry: 5000\n\n");
  res.write("event: ready\ndata: {}\n\n");

  const unsubscribe = subscribe(accountId, res, clientId);
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
};

/**
 * Which part of the client's data a successful write touched. Paths are
 * relative to the /api router. Unknown writes publish nothing.
 */
const scopesFor = (path) => {
  if (path.startsWith("/goals") || path.startsWith("/categories")) return ["goals", "history"];
  if (path.startsWith("/history")) return ["history"];
  // weekStart lives on the profile and re-buckets weekly history server-side.
  if (path === "/auth/profile") return ["profile", "history"];
  if (path.startsWith("/calendar")) return ["calendar"];
  return [];
};

/**
 * Router middleware, mounted after requireAuth: once a write finishes
 * successfully, tell the account's other tabs. Reads never publish.
 */
const publishWrites = (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  const path = req.path;
  res.on("finish", () => {
    if (res.statusCode >= 400 || !res.locals.user) return;
    publish(res.locals.user._id, scopesFor(path), cleanClientId(req.get("X-Client-Id")));
  });
  return next();
};

module.exports = { stream, publishWrites, scopesFor };
