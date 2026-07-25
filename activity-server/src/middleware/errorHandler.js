const { ApiError } = require("../lib/apiError");
const { isProduction } = require("../config/env");

const notFound = (req, res, next) => {
  next(new ApiError(404, `No route matches ${req.method} ${req.originalUrl}`));
};

/**
 * Single place where an error becomes a response.
 *
 * Only ApiError messages are sent verbatim. Everything else becomes a generic
 * 500 so stack traces and driver internals never reach a client — the previous
 * handler sent `err.stack` in the response body.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: Object.fromEntries(
          Object.entries(err.errors || {}).map(([key, value]) => [key, value.message])
        ),
      },
    });
  }

  // Duplicate key on a unique index.
  if (err?.code === 11000) {
    return res.status(409).json({ error: { message: "That record already exists" } });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({ error: { message: "Malformed identifier" } });
  }

  console.error("[error]", err);
  return res.status(500).json({
    error: {
      message: "Something went wrong",
      ...(isProduction ? {} : { debug: err?.message }),
    },
  });
};

module.exports = { notFound, errorHandler };
