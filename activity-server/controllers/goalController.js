const Goal = require("../models/goal");
const Category = require("../models/category");
const GoalHistory = require("../models/goalHistory");
const mongoose = require("mongoose");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const INTERVALS = new Set(["daily", "weekly", "monthly", "yearly", "none"]);

const normalizeInterval = (value) => {
  if (!value) return "daily";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "no schedule" || normalized === "unscheduled" || normalized === "nonscheduled") {
    return "none";
  }
  return INTERVALS.has(normalized) ? normalized : "daily";
};

const getPeriodStart = (interval, date) => {
  const normalized = normalizeInterval(interval);
  const base = dayjs.utc(date);
  switch (normalized) {
    case "weekly":
      return base.startOf("week");
    case "monthly":
      return base.startOf("month");
    case "yearly":
      return base.startOf("year");
    case "none":
    case "daily":
    default:
      return base.startOf("day");
  }
};

const serializeHistoryItem = (item) => ({
  _id: item._id,
  date: item.periodStart,
  targetPerDuration: item.targetPerDuration,
  achieved: item.achieved,
  note: item.note,
});

const get_goals = async (req, res, next) => {
  const { selectedDate } = req.body;
  const formattedSelectedDate = dayjs.utc(selectedDate, "YYYY-MM-DD").startOf("day");

  try {
    // Fetch categories
    const categories = await Category.findOne({ accountId: res.locals.user._id });

    // Convert user ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(res.locals.user._id);

    // Fetch goals (history lives in a separate collection now)
    const goals = await Goal.find({ accountId: userObjectId }).lean();

    const ensureHistoryOps = goals
      .map((goal) => {
        const interval = normalizeInterval(goal.interval);
        if (interval === "none") return null;
        const periodStart = getPeriodStart(interval, formattedSelectedDate).toDate();
        return {
          updateOne: {
            filter: {
              goalId: goal._id,
              interval,
              periodStart,
            },
            update: {
              $setOnInsert: {
                accountId: userObjectId,
                targetPerDuration: Number(goal.defaultTarget) || 0,
                achieved: 0,
                note: "",
              },
            },
            upsert: true,
          },
        };
      })
      .filter(Boolean);

    if (ensureHistoryOps.length > 0) {
      await GoalHistory.bulkWrite(ensureHistoryOps, { ordered: false });
    }

    const goalIds = goals.map((goal) => goal._id);
    const historyItems = goalIds.length
      ? await GoalHistory.find({ accountId: userObjectId, goalId: { $in: goalIds } }).lean()
      : [];

    const historyByGoalId = new Map();
    historyItems.forEach((item) => {
      const key = item.goalId.toString();
      if (!historyByGoalId.has(key)) historyByGoalId.set(key, []);
      historyByGoalId.get(key).push(serializeHistoryItem(item));
    });

    const updatedGoals = goals.map((goal) => ({
      ...goal,
      interval: normalizeInterval(goal.interval),
      history: historyByGoalId.get(goal._id.toString()) || [],
    }));

    res.send({ goals: updatedGoals, categories: categories?.categories || [] });
  } catch (err) {
    next(err);
  }
};

const update_goal = async (req, res, next) => {
  const { goalId, goal } = req.body;

  try {
    const existingGoal = await Goal.findOne({ _id: goalId, accountId: res.locals.user._id });
    if (!existingGoal) {
      return res.status(404).send({ message: "Goal not found" });
    }

    const allowedFields = ["task", "interval", "defaultTarget", "category", "order", "hidden"];
    const updatePayload = {};
    allowedFields.forEach((field) => {
      if (goal?.[field] !== undefined) {
        updatePayload[field] = field === "interval" ? normalizeInterval(goal[field]) : goal[field];
      }
    });

    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: goalId, accountId: res.locals.user._id },
      { $set: updatePayload },
      { new: true }
    );

    res.send(updatedGoal);
  } catch (err) {
    next(err);
  }
};

const add_goal = (req, res, next) => {
  const interval = normalizeInterval(req.body.interval);
  const { history, ...goalData } = req.body;
  let goal = new Goal({
    ...goalData,
    interval,
    accountId: res.locals.user._id,
  });

  let saveGoal = () => {
    goal
      .save()
      .then((data) => {
        res.sendStatus(200);
      })
      .catch((err) => next(err));
  };
  saveGoal();
};

const delete_goal = (req, res, next) => {
  Goal.findByIdAndDelete(req.body.goalId, (err, docs) => {
    if (err) return next(err);
    GoalHistory.deleteMany({ goalId: req.body.goalId, accountId: res.locals.user._id })
      .then(() => res.sendStatus(200))
      .catch((error) => next(error));
  });
};

const update_categories = async (req, res, next) => {
  let { categories } = req.body;

  try {
    const doc = await Category.findOneAndUpdate(
      { accountId: res.locals.user._id },
      { categories },
      { new: true }
    );
    // Search through goals and update categories as needed
    res.send(doc);
  } catch (err) {
    next(err);
  }
};

const update_history_item = async (req, res, next) => {
  const { goalId, historyItem } = req.body;

  try {
    const goal = await Goal.findOne({ _id: goalId, accountId: res.locals.user._id }).lean();

    if (!goal) {
      return res.status(404).send({ message: "Goal not found" });
    }

    if (!historyItem?._id) {
      return res.status(400).send({ message: "History item id is required" });
    }

    const interval = normalizeInterval(goal.interval);
    const periodStart = getPeriodStart(interval, historyItem.date).toDate();

    const updatedHistoryItem = await GoalHistory.findOneAndUpdate(
      { _id: historyItem._id, goalId, accountId: res.locals.user._id },
      {
        $set: {
          interval,
          periodStart,
          targetPerDuration: Number(historyItem.targetPerDuration) || 0,
          achieved: Number(historyItem.achieved) || 0,
          note: historyItem.note,
        },
      },
      { new: true }
    );

    if (!updatedHistoryItem) {
      return res.status(404).send({ message: "History item not found" });
    }

    return res.send({ message: "Save successful", historyItem: serializeHistoryItem(updatedHistoryItem) });
  } catch (err) {
    next(err);
  }
};


const new_history_item = async (req, res, next) => {
  const { goalId, historyItem } = req.body;

  try {
    const goal = await Goal.findOne({
      _id: goalId,
      accountId: res.locals.user._id,
    }).lean();
    if (!goal) {
      return res.status(404).send({ message: "Goal not found" });
    }
    const interval = normalizeInterval(goal.interval);
    const periodStart = getPeriodStart(interval, historyItem?.date ?? new Date()).toDate();

    const newHistoryItemDoc = await GoalHistory.findOneAndUpdate(
      { goalId, accountId: res.locals.user._id, interval, periodStart },
      {
        $setOnInsert: {
          targetPerDuration: Number(historyItem?.targetPerDuration ?? goal.defaultTarget) || 0,
          achieved: Number(historyItem?.achieved) || 0,
          note: historyItem?.note,
        },
      },
      { new: true, upsert: true }
    );

    res.send({ message: "Save successful", newHistoryItem: serializeHistoryItem(newHistoryItemDoc) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  get_goals,
  update_goal,
  add_goal,
  delete_goal,
  update_categories,
  update_history_item,
  new_history_item,
};
