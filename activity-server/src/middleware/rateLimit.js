const { ApiError } = require("../lib/apiError");

/**
 * Minimal fixed-window limiter, kept in process memory.
 *
 * Enough to blunt online password guessing on a single-instance deployment.
 * If this ever runs behind more than one process, move the counter to Mongo or
 * Redis — per-process counts multiply the effective limit.
 */
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20, message } = {}) => {
  const hits = new Map();

  const sweep = (now) => {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  };

  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 5000) sweep(now);

    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return next(
        new ApiError(429, message || "Too many attempts, please try again later", { retryAfter })
      );
    }

    return next();
  };
};

module.exports = { rateLimit };
