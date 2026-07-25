const { verifyAccess } = require("../lib/tokens");
const { ApiError } = require("../lib/apiError");
const { normalizeWeekStart } = require("../lib/periods");
const User = require("../models/user");

/**
 * Populates res.locals.user with { _id, email, tokenVersion }.
 *
 * Controllers must take the account id from here and never from the request
 * body — that is the only thing separating one user's data from another's.
 */
const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  let payload;
  try {
    payload = verifyAccess(token);
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    return next(new ApiError(401, expired ? "Token expired" : "Invalid token", { expired }));
  }

  // A password change bumps tokenVersion, which invalidates tokens minted before it.
  const user = await User.findById(payload.sub).lean();
  if (!user) return next(new ApiError(401, "Invalid token"));
  if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
    return next(new ApiError(401, "Session no longer valid, please sign in again"));
  }

  res.locals.user = {
    _id: user._id,
    email: user.email,
    isDemo: !!user.isDemo,
    // Every weekly period computation reads this. It is never ambient on the
    // server — one process serves many accounts with different week starts.
    weekStart: normalizeWeekStart(user.weekStart),
  };
  return next();
};

/** Blocks writes that a shared demo account must not be able to perform. */
const blockDemo = (req, res, next) => {
  if (res.locals.user?.isDemo) {
    return next(new ApiError(403, "This action is disabled for the demo account"));
  }
  return next();
};

module.exports = { requireAuth, blockDemo };
