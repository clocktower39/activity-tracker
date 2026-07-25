const app = require("./src/app");
const { connect } = require("./src/db/connect");
const { port } = require("./src/config/env");

/**
 * Connect before listening. The old bootstrap started the HTTP server
 * regardless and only logged a connection failure, so a bad DBURL produced a
 * server that accepted requests and 500'd on every one of them.
 */
const start = async () => {
  try {
    await connect();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

  const shutdown = (signal) => () => {
    console.log(`\n${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", shutdown("SIGINT"));
  process.on("SIGTERM", shutdown("SIGTERM"));
};

start();
