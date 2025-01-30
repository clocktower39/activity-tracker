const Goal = require("../models/goal");
const Category = require("../models/category");
const mongoose = require("mongoose");
const dayjs = require("dayjs");

const get_goals = async (req, res, next) => {
  const { selectedDate } = req.body;
  const formattedSelectedDate = dayjs.utc(selectedDate).subtract(1, "day").startOf("day");

  try {
    // Fetch categories
    const categories = await Category.findOne({ accountId: res.locals.user._id });

    // Convert user ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(res.locals.user._id);

    // Fetch goals with full history
    const goals = await Goal.find({ accountId: userObjectId });

    // Process goals and ensure unique history entries using MongoDB atomic operation
    const updatedGoals = await Promise.all(
      goals.map(async (goal) => {
        goal.history = goal.history || [];

        // Check if an entry for the selected date exists
        const historyExists = goal.history.some((entry) =>
          dayjs.utc(entry.date).isSame(formattedSelectedDate, "day")
        );

        if (!historyExists) {
          const newHistoryEntry = {
            _id: new mongoose.Types.ObjectId(),
            date: formattedSelectedDate.toDate(), // Correctly formatted UTC midnight
            targetPerDuration: Number(goal.defaultTarget),
            achieved: 0,
          };

          // **Atomic MongoDB update to prevent duplicate entries**
          const updatedGoal = await Goal.findOneAndUpdate(
            { _id: goal._id, "history.date": { $ne: formattedSelectedDate.toDate() } }, // Ensures no duplicate
            { $push: { history: newHistoryEntry } }, // Add only if it doesn't exist
            { new: true }
          );

          if (updatedGoal) {
            return updatedGoal.toObject();
          }
        }

        return goal.toObject();
      })
    );

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

    // Extract history from the request body
    const { history, ...goalWithoutHistory } = goal;

    // Update fields other than history
    let updatedGoal = await Goal.findOneAndUpdate(
      { _id: goalId, accountId: res.locals.user._id },
      { $set: goalWithoutHistory },
      { new: true }
    );

    // Handle history updates
    if (history && history.length > 0) {
      const existingHistory = existingGoal.history || [];
      const updatedHistory = existingHistory.map((item) => {
        const newItem = history.find((h) => h.id === item.id); // Match by unique identifier
        return newItem ? { ...item, ...newItem } : item; // Merge if matched, keep as is if not
      });

      // Add any new history items that are not in the existing history
      const newHistory = history.filter((h) => !existingHistory.some((item) => item.id === h.id));

      updatedGoal = await Goal.findOneAndUpdate(
        { _id: goalId, accountId: res.locals.user._id },
        {
          $set: { history: [...updatedHistory, ...newHistory] }, // Merge updated and new history
        },
        { new: true }
      );
    }

    res.send(updatedGoal);
  } catch (err) {
    next(err);
  }
};

const add_goal = (req, res, next) => {
  let goal = new Goal({
    ...req.body,
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
    res.sendStatus(200);
  });
};

const update_categories = async (req, res, next) => {
  let { categories } = req.body;

  Category.findOneAndUpdate(
    { accountId: res.locals.user._id },
    { categories },
    {
      new: true,
    },
    (err, doc) => {
      if (err) return next(err);
      // Search through goals and update categories as needed
      res.send(doc);
    }
  );
};

const update_history_item = async (req, res, next) => {
  const { goalId, historyItem } = req.body;

  try {
    const goal = await Goal.findOne({ _id: goalId });

    if (!goal || goal.accountId.toString() !== res.locals.user._id) {
      return res.status(404).send({ message: "Goal not found" });
    }

    // Convert historyItem._id to ObjectId if necessary
    const historyItemId = new mongoose.Types.ObjectId(historyItem._id);

    // Find and update the matching history item
    const itemIndex = goal.history.findIndex((item) => item._id.toString() === historyItemId.toString());

    if (itemIndex !== -1) {

      // Update the history item at the found index
      goal.history[itemIndex] = { ...goal.history[itemIndex].toObject(), ...historyItem };

      // Ensure Mongoose detects the change
      goal.markModified(`history.${itemIndex}`);

      // Save the updated goal
      await goal.save();

      return res.send({ message: "Save successful", goal });
    } else {
      return res.status(404).send({ message: "History item not found" });
    }
  } catch (err) {
    next(err);
  }
};


const new_history_item = async (req, res, next) => {
  const { goalId, historyItem } = req.body;

  try {
    const goal = await Goal.findOne({
      _id: goalId,
    });
    if (!goal || goal.accountId.toString() !== res.locals.user._id) {
      return res.status(404).send({ message: "Goal not found" });
    }
    // Find and update the matching history item
    const itemIndex = goal.history.findIndex(
      (item) => item._id.toString() === historyItem?._id && item.date === historyItem.date
    );

    if (itemIndex === -1) {
      // Add to the history item
      goal.history = [...goal.history, { ...historyItem }];
    } else {
      return res.status(404).send({ message: "History item not found" });
    }
    // Save the updated goal
    await goal.save();

    // Retrieve the newly added history item
    const savedNewHistoryItem = goal.history[goal.history.length - 1]; // The last added item
    
    res.send({ message: "Save successful", goal, newHistoryItem: savedNewHistoryItem, });
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
