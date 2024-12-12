const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const mongoose = require("mongoose");
const { ValidationError } = require("express-validation");
const cors = require("cors");
require("dotenv").config();
const goalRoutes = require("./routes/goalRoutes");
const userRoutes = require("./routes/userRoutes");

const dayjs = require("dayjs");
const advancedFormat = require("dayjs/plugin/advancedFormat");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);
dayjs.extend(advancedFormat);

const dbUrl = process.env.DBURL;

let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
  PORT = 8000;
}

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", goalRoutes);
app.use("/", userRoutes);

const connectToDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("MongoDB connection successful");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

connectToDB();

// Error handling Function
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err);
  }
  console.error(err.stack);
  res.status(500).send(err.stack);
});

let server = http.listen(PORT, async () => {
  console.log(`Server is listening on port ${server.address().port}`);
});
