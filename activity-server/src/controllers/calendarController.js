const crypto = require("crypto");
const User = require("../models/user");
const Goal = require("../models/goal");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { buildFeed, validTimeZone } = require("../lib/calendarFeed");

/**
 * The private calendar feed Google Calendar subscribes to ("From URL").
 *
 * The feed itself is the one deliberately public read in the API: Google
 * fetches it with no session, so the long random token in the path is the
 * credential. It is a capability URL — whoever has the link can read the
 * account's weekly/monthly goal names and due dates, nothing else — and it
 * can be reset (old link dies) or turned off at any time from Settings.
 */

const newToken = () => crypto.randomBytes(24).toString("base64url");
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{32}$/;

/** Whether this account has a feed, and its token so Settings can show the link. */
const status = asyncHandler(async (req, res) => {
  const user = await User.findById(res.locals.user._id).select("+calendarToken").lean();
  res.json({ token: user?.calendarToken ?? null });
});

/** Create the feed, or replace its token so any copy of the old link stops working. */
const rotate = asyncHandler(async (req, res) => {
  const token = newToken();
  await User.updateOne({ _id: res.locals.user._id }, { $set: { calendarToken: token } });
  res.json({ token });
});

const disable = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: res.locals.user._id }, { $unset: { calendarToken: 1 } });
  res.json({ token: null });
});

/** GET /api/calendar/<token>.ics?tz=Area/City — public, rate-limited. */
const feed = asyncHandler(async (req, res) => {
  const file = String(req.params.file || "");
  const token = file.endsWith(".ics") ? file.slice(0, -4) : "";
  // Same 404 for a malformed token as for an unknown one: no oracle.
  if (!TOKEN_SHAPE.test(token)) throw new ApiError(404, "Not found");
  const user = await User.findOne({ calendarToken: token }).select("_id weekStart").lean();
  if (!user) throw new ApiError(404, "Not found");

  const tz = validTimeZone(req.query.tz) ? req.query.tz : "UTC";
  const goals = await Goal.find({ accountId: user._id, archivedAt: null, hidden: { $ne: true } })
    .select("task interval rolling defaultTarget category")
    .lean();

  const body = await buildFeed({ user, goals, tz });
  res.set({
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": 'inline; filename="activity-tracker.ics"',
    "Cache-Control": "private, max-age=900",
    // Keep the capability URL out of anything this response links to.
    "Referrer-Policy": "no-referrer",
  });
  res.send(body);
});

module.exports = { status, rotate, disable, feed };
