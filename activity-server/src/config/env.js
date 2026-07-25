const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const required = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
};

const int = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got "${raw}".`);
  }
  return parsed;
};

const list = (name, fallback) => {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const isProduction = process.env.NODE_ENV === "production";

const accessTokenSecret = required("ACCESS_TOKEN_SECRET");
const refreshTokenSecret = required("REFRESH_TOKEN_SECRET");

if (accessTokenSecret === refreshTokenSecret) {
  throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different values.");
}

// Short secrets are trivially brute-forced offline. Hard-fail in production; warn
// in development so an old .env does not block local work.
for (const [name, secret] of [
  ["ACCESS_TOKEN_SECRET", accessTokenSecret],
  ["REFRESH_TOKEN_SECRET", refreshTokenSecret],
]) {
  if (secret.length < 32) {
    const message = `${name} is ${secret.length} characters; 32+ is required. Generate one with: openssl rand -base64 48`;
    if (isProduction) throw new Error(message);
    console.warn(`[config] WARNING: ${message}`);
  }
}

module.exports = {
  isProduction,
  port: int("PORT", 8000),
  dbUrl: required("DBURL"),
  saltWorkFactor: int("SALT_WORK_FACTOR", 12),
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "180m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || "90d",
  // In development the Vite dev server may bind a few different ports.
  corsOrigins: list("CORS_ORIGINS", [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
  ]),
};
