const express = require("express");
const authController = require("../controllers/authController");
const goalController = require("../controllers/goalController");
const historyController = require("../controllers/historyController");
const statsController = require("../controllers/statsController");
const calendarController = require("../controllers/calendarController");
const liveController = require("../controllers/liveController");
const { requireAuth, blockDemo } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const { asyncHandler } = require("../lib/apiError");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many sign-in attempts, please wait a few minutes",
});

router.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ----- Public -----------------------------------------------------------
router.post("/auth/signup", authLimiter, authController.signup);
router.post("/auth/login", authLimiter, authController.login);
router.post("/auth/refresh", authController.refresh);

// The calendar feed Google Calendar subscribes to. Public by necessity — the
// subscriber has no session — so the token in the path is the credential.
// Generous enough for calendar clients, tight enough to stop token guessing.
const feedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many calendar requests, please wait a few minutes",
});
router.get("/calendar/:file", feedLimiter, calendarController.feed);

// ----- Everything below requires a valid access token -------------------
router.use(asyncHandler(requireAuth));
// After a successful write, tell the account's other open tabs to re-fetch.
router.use(liveController.publishWrites);

// One server-sent-events stream per open tab. Read-only: it only listens.
router.get("/live", liveController.stream);

router.get("/auth/me", authController.me);
router.patch("/auth/profile", authController.updateProfile);
router.post("/auth/change-password", blockDemo, authLimiter, authController.changePassword);

router.get("/bootstrap", goalController.bootstrap);

// Goal and history writes stay open to the demo account — a demo that cannot
// tick a circle demonstrates nothing. Only credential changes are blocked.
router.post("/goals", goalController.createGoal);
// Declared before /goals/:id so "reorder" is not parsed as an id.
router.patch("/goals/reorder", goalController.reorderGoals);
router.patch("/goals/:id", goalController.updateGoal);
router.delete("/goals/:id", goalController.deleteGoal);

router.put("/categories", goalController.updateCategories);
router.post("/categories/rename", goalController.renameCategory);

router.get("/history", historyController.getForDate);
router.get("/history/range", historyController.getRange);
router.get("/history/rolling", historyController.getRolling);
router.post("/history/progress", historyController.recordProgress);

router.get("/calendar", calendarController.status);
router.post("/calendar/token", calendarController.rotate);
router.delete("/calendar/token", calendarController.disable);

router.get("/stats/summary", statsController.summary);
router.get("/stats/matrix", statsController.matrix);
router.get("/stats/by-goal", statsController.byGoal);
router.get("/stats/streaks", statsController.streaks);

module.exports = router;
