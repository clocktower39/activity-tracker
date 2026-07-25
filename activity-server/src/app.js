const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { corsOrigins, isProduction, trustProxy } = require("./config/env");

const app = express();

// Decides which X-Forwarded-For entry becomes req.ip, which the auth rate
// limiter counts against. A number is a hop count; "loopback" trusts only local
// proxies. See config/env.js and docs/deployment.md.
app.set("trust proxy", Number.isNaN(Number(trustProxy)) ? trustProxy : Number(trustProxy));

// Only mounted when the client is served from a different origin. In the normal
// deployment nginx serves both from one host, so there is nothing to allow.
if (corsOrigins.length > 0) {
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and non-browser callers (curl, health checks) send no Origin.
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    })
  );
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

if (!isProduction) {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      // Never log headers or bodies here — they carry tokens and passwords.
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });
}

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
