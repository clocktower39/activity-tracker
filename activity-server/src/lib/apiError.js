/** An error whose message and status are safe to send to a client. */
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.expose = true;
  }
}

/**
 * Wraps an async route handler so a rejected promise reaches Express's error
 * handler instead of hanging the request. Express 5 does this for async
 * handlers already, but being explicit keeps the behaviour obvious.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiError, asyncHandler };
