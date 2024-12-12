const Goal = require("../models/goal");
const Category = require("../models/category");
const mongoose = require("mongoose");
const dayjs = require("dayjs");

const get_goals = async (req, res, next) => {
  const { selectedDate } = req.body;
  const formattedSelectedDate = dayjs(selectedDate);

  try {
    // Fetch categories
    const categories = await Category.findOne({ accountId: res.locals.user._id });

    // Fetch goals with filtered history
    const goals = await Goal.aggregate([
      {
        $match: {
          accountId: res.locals.user._id, // Match based on user
        },
      },
      {
        $project: {
          task: 1, // Include task field
          interval: 1, // Include interval field
          defaultTarget: 1, // Include defaultTarget field
          category: 1, // Include category field
          order: 1, // Include order field
          history: {
            $filter: {
              input: "$history", // The history array
              as: "entry", // Alias for each element in the array
              cond: { $lt: ["$$entry.date", new Date(formattedSelectedDate.utc())] }, // Filter condition
            },
          },
        },
      },
      {
        $addFields: {
          history: { $slice: ["$history", -30] }, // Limit to the last 30 entries
        },
      },
    ]);

    // Adjust the goals to ensure a history entry for the selected date
    const adjustedGoals = goals.map((goal) => {
      const historyExists = goal.history.some((day) => {
        const formatDayDate = dayjs(day.date).utc().add(1, "day").format("YYYY-MM-DD");
        return formatDayDate === formattedSelectedDate;
      });

      if (!historyExists) {
        // Add a default history entry for the selected date
        goal.history.push({
          date: new Date(formattedSelectedDate),
          targetPerDuration: Number(goal.defaultTarget),
          achieved: 0,
        });
      }

      return goal;
    });

    res.send({ goals: adjustedGoals, categories: categories?.categories || [] });
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
    goal.save((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
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
    const goal = await Goal.findOne({ 
        _id: goalId, 
     });
    if (!goal || goal.accountId.toString() !== res.locals.user._id) {
      return res.status(404).send({ message: "Goal not found" });
    }
    // Find and update the matching history item
    const itemIndex = goal.history.findIndex((item) => item._id.toString() === historyItem._id);

    if (itemIndex !== -1) {
      // Update the history item at the found index
      goal.history[itemIndex] = { ...goal.history[itemIndex], ...historyItem };
    } else {
      return res.status(404).send({ message: "History item not found" });
    }

    // Save the updated goal
    await goal.save();

    res.send({ message: "Save successful", goal });
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
    const itemIndex = goal.history.findIndex((item) => item._id.toString() === historyItem?._id && item.date === historyItem.date);

    if (itemIndex === -1) {
      // Add to the history item
      goal.history = [ ...goal.history, { ...historyItem }, ];
    } else {
      return res.status(404).send({ message: "History item not found" });
    }
    // Save the updated goal
    await goal.save();

    res.send({ message: "Save successful", goal });
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
