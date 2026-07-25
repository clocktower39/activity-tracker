const Goal = require("../models/goal");
const GoalHistory = require("../models/goalHistory");
const Category = require("../models/category");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { normalizeInterval } = require("../lib/periods");

const WRITABLE = [
  "task",
  "interval",
  "defaultTarget",
  "category",
  "order",
  "hidden",
  "color",
  "icon",
  "trackingMode",
];

const pickWritable = (body) => {
  const out = {};
  for (const field of WRITABLE) {
    if (body[field] === undefined) continue;
    if (field === "interval") out[field] = normalizeInterval(body[field]);
    else if (field === "defaultTarget" || field === "order") out[field] = Number(body[field]);
    else out[field] = body[field];
  }
  return out;
};

/**
 * Everything the app needs to render its shell: goals and categories, with no
 * history at all. History is fetched separately, scoped to what is on screen.
 * This response is a few KB; the endpoint it replaces sent ~5.8 MB.
 */
const bootstrap = asyncHandler(async (req, res) => {
  const accountId = res.locals.user._id;
  const [goals, categoryDoc, oldest, newest] = await Promise.all([
    Goal.find({ accountId, archivedAt: null }).sort({ order: 1, task: 1 }).lean(),
    Category.findOne({ accountId }).lean(),
    // Two index-only lookups. The client needs to know where the record starts
    // to offer an "all time" range without guessing.
    GoalHistory.findOne({ accountId }).sort({ periodStart: 1 }).select("periodStart").lean(),
    GoalHistory.findOne({ accountId }).sort({ periodStart: -1 }).select("periodStart").lean(),
  ]);

  res.json({
    goals: goals.map((goal) => ({ ...goal, interval: normalizeInterval(goal.interval) })),
    categories: (categoryDoc?.categories || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    recordRange: {
      first: oldest?.periodStart ?? null,
      last: newest?.periodStart ?? null,
    },
  });
});

const createGoal = asyncHandler(async (req, res) => {
  const payload = pickWritable(req.body);
  if (!payload.task) throw new ApiError(400, "A task name is required");
  if (!payload.category) throw new ApiError(400, "A category is required");
  if (!Number.isFinite(payload.defaultTarget) || payload.defaultTarget < 0) {
    throw new ApiError(400, "Target must be a number of 0 or more");
  }

  if (!Number.isFinite(payload.order)) {
    const last = await Goal.findOne({ accountId: res.locals.user._id }).sort({ order: -1 }).lean();
    payload.order = (last?.order ?? -1) + 1;
  }

  const goal = await Goal.create({ ...payload, accountId: res.locals.user._id });
  res.status(201).json({ goal: goal.toObject() });
});

const updateGoal = asyncHandler(async (req, res) => {
  const payload = pickWritable(req.body);
  if (Object.keys(payload).length === 0) throw new ApiError(400, "Nothing to update");
  if (payload.defaultTarget !== undefined && !Number.isFinite(payload.defaultTarget)) {
    throw new ApiError(400, "Target must be a number");
  }

  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, accountId: res.locals.user._id },
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!goal) throw new ApiError(404, "Goal not found");

  // Changing the interval re-buckets every future write. Existing rows keep
  // their old interval so past data stays where the user recorded it.
  res.json({ goal });
});

/** Bulk reorder, so drag-and-drop is one request rather than one per goal. */
const reorderGoals = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0) {
    throw new ApiError(400, "`order` must be a non-empty array of goal ids");
  }

  await Goal.bulkWrite(
    order.map((goalId, index) => ({
      updateOne: {
        filter: { _id: goalId, accountId: res.locals.user._id },
        update: { $set: { order: index } },
      },
    }))
  );

  const goals = await Goal.find({ accountId: res.locals.user._id, archivedAt: null })
    .sort({ order: 1 })
    .lean();
  res.json({ goals });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({
    _id: req.params.id,
    accountId: res.locals.user._id,
  });
  if (!goal) throw new ApiError(404, "Goal not found");

  // History rows are meaningless without their goal.
  const { deletedCount } = await GoalHistory.deleteMany({
    goalId: goal._id,
    accountId: res.locals.user._id,
  });

  res.json({ deleted: true, historyRemoved: deletedCount ?? 0 });
});

const updateCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) throw new ApiError(400, "`categories` must be an array");

  const cleaned = categories
    .map((entry, index) => ({
      category: String(entry?.category ?? "").trim(),
      order: Number.isFinite(Number(entry?.order)) ? Number(entry.order) : index,
      color: entry?.color ?? null,
    }))
    .filter((entry) => entry.category.length > 0);

  const names = cleaned.map((entry) => entry.category.toLowerCase());
  if (new Set(names).size !== names.length) {
    throw new ApiError(400, "Category names must be unique");
  }

  const doc = await Category.findOneAndUpdate(
    { accountId: res.locals.user._id },
    { $set: { categories: cleaned } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({ categories: doc.categories });
});

/**
 * Rename a category everywhere at once. Goals store the category as a string,
 * so renaming without this leaves every goal pointing at a name that no longer
 * exists and they vanish from the grouped view.
 */
const renameCategory = asyncHandler(async (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) throw new ApiError(400, "`from` and `to` are both required");

  const accountId = res.locals.user._id;
  const doc = await Category.findOne({ accountId });
  if (!doc) throw new ApiError(404, "No categories found");

  const entry = doc.categories.find((item) => item.category === from);
  if (!entry) throw new ApiError(404, `No category named "${from}"`);
  if (doc.categories.some((item) => item.category === to)) {
    throw new ApiError(409, `A category named "${to}" already exists`);
  }

  entry.category = to;
  await doc.save();
  await Goal.updateMany({ accountId, category: from }, { $set: { category: to } });

  res.json({ categories: doc.toObject().categories });
});

module.exports = {
  bootstrap,
  createGoal,
  updateGoal,
  reorderGoals,
  deleteGoal,
  updateCategories,
  renameCategory,
};
