const mongoose = require("mongoose");
const { dbUrl } = require("../config/env");

const connect = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 15000 });
  return mongoose.connection;
};

const disconnect = () => mongoose.disconnect();

module.exports = { connect, disconnect };
