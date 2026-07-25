#!/usr/bin/env node
/**
 * One-off data maintenance for the v2 schema. Safe to re-run.
 *
 *   node scripts/maintenance.js              # report only, changes nothing
 *   node scripts/maintenance.js --apply      # normalise emails, flag demo, sync indexes
 *   node scripts/maintenance.js --apply --purge-empty
 *
 * --purge-empty deletes GoalHistory rows with achieved 0 and no note. Those are
 * placeholders the old read path created on every page view; they carry no
 * information. It is the only destructive option and is never implied.
 */
const mongoose = require("mongoose");
const { connect, disconnect } = require("../src/db/connect");
const User = require("../src/models/user");
const Goal = require("../src/models/goal");
const Category = require("../src/models/category");
const GoalHistory = require("../src/models/goalHistory");
const { normalizeInterval, DEFAULT_WEEK_START } = require("../src/lib/periods");
const { rebucketWeeks } = require("../src/lib/rebucketWeeks");

/** What weekly periods were bucketed by before weekStart existed: ISO weeks. */
const LEGACY_WEEK_START = 1; // Monday

const apply = process.argv.includes("--apply");
const purgeEmpty = process.argv.includes("--purge-empty");
const DEMO_EMAIL = "demo@fakeaccount.com";

const label = apply ? "APPLY" : "DRY RUN";

const main = async () => {
  await connect();
  console.log(`\n=== Maintenance (${label}) ===\n`);

  // 1. Emails to lowercase. The schema now lowercases on write and on query, so
  //    a stored mixed-case address would stop matching at login.
  const users = await User.find({}).select("+password").lean();
  const needsLowercase = users.filter((u) => u.email !== u.email.toLowerCase());
  console.log(`Users: ${users.length} total, ${needsLowercase.length} with mixed-case email`);
  for (const user of needsLowercase) {
    console.log(`  ${user.email} -> ${user.email.toLowerCase()}`);
    if (apply) {
      await User.collection.updateOne(
        { _id: user._id },
        { $set: { email: user.email.toLowerCase() } }
      );
    }
  }

  // 2. Flag the demo account so the guard is a field, not a string comparison.
  // Case-insensitive so this reports accurately during a dry run, before step 1
  // has had a chance to normalise the stored address.
  const demo = await User.collection.findOne({
    email: { $regex: `^${DEMO_EMAIL}$`, $options: "i" },
  });
  if (demo) {
    console.log(`Demo account: ${DEMO_EMAIL} -> isDemo true`);
    if (apply) await User.collection.updateOne({ _id: demo._id }, { $set: { isDemo: true } });
  } else {
    console.log("Demo account: not found (nothing to flag)");
  }

  // 3. Default tokenVersion / themeMode for documents predating those fields.
  const missingTokenVersion = await User.collection.countDocuments({ tokenVersion: { $exists: false } });
  console.log(`Users missing tokenVersion: ${missingTokenVersion}`);
  if (apply && missingTokenVersion) {
    await User.collection.updateMany(
      { tokenVersion: { $exists: false } },
      { $set: { tokenVersion: 0 } }
    );
  }

  const badTheme = await User.collection.countDocuments({
    themeMode: { $nin: ["light", "dark", "system"] },
  });
  console.log(`Users with an unsupported themeMode: ${badTheme}`);
  if (apply && badTheme) {
    await User.collection.updateMany(
      { themeMode: { $nin: ["light", "dark", "system"] } },
      { $set: { themeMode: "dark" } }
    );
  }

  // 3b. Week start.
  //
  // Weekly periods used to be ISO weeks (Monday), hard-coded. They are now a
  // per-account setting defaulting to Sunday, so an account that has no setting
  // yet is holding Monday-bucketed rows while the app is about to ask Sunday
  // questions of them. Give it the default and move its rows to match.
  const withoutWeekStart = await User.collection
    .find({ weekStart: { $exists: false } }, { projection: { _id: 1, email: 1 } })
    .toArray();
  console.log(`Users without a weekStart: ${withoutWeekStart.length}`);

  for (const account of withoutWeekStart) {
    const summary = await rebucketWeeks(account._id, LEGACY_WEEK_START, DEFAULT_WEEK_START, {
      dryRun: !apply,
    });
    console.log(
      `  ${account.email}: weekStart -> ${DEFAULT_WEEK_START} (Sunday)` +
        (summary.scanned
          ? `, ${summary.moved}/${summary.scanned} weekly rows move${
              summary.merged ? `, ${summary.merged} merge` : ""
            }`
          : ", no weekly rows")
    );
    if (apply) {
      await User.collection.updateOne(
        { _id: account._id },
        { $set: { weekStart: DEFAULT_WEEK_START } }
      );
    }
  }

  // 4. Normalise goal intervals and drop the legacy embedded history array.
  const goals = await Goal.collection.find({}).toArray();
  const badInterval = goals.filter((g) => normalizeInterval(g.interval) !== g.interval);
  const withLegacyHistory = goals.filter((g) => Array.isArray(g.history) && g.history.length > 0);
  console.log(`Goals: ${goals.length} total, ${badInterval.length} with a non-canonical interval`);
  console.log(`Goals still carrying an embedded history array: ${withLegacyHistory.length}`);

  for (const goal of badInterval) {
    console.log(`  "${goal.task}": ${goal.interval} -> ${normalizeInterval(goal.interval)}`);
    if (apply) {
      await Goal.collection.updateOne(
        { _id: goal._id },
        { $set: { interval: normalizeInterval(goal.interval) } }
      );
    }
  }

  // Fold any surviving embedded entries into GoalHistory before removing the
  // field, summing collisions rather than silently keeping only the first.
  if (withLegacyHistory.length > 0) {
    const merged = new Map();
    for (const goal of withLegacyHistory) {
      const interval = normalizeInterval(goal.interval);
      for (const item of goal.history) {
        if (!item?.date) continue;
        const { getPeriodStartDate } = require("../src/lib/periods");
        const periodStart = getPeriodStartDate(interval, item.date);
        const key = `${goal._id}|${interval}|${periodStart.toISOString()}`;
        const existing = merged.get(key);
        if (existing) {
          existing.achieved += Number(item.achieved) || 0;
          existing.note = existing.note || item.note || "";
        } else {
          merged.set(key, {
            goalId: goal._id,
            accountId: goal.accountId,
            interval,
            periodStart,
            targetPerDuration: Number(item.targetPerDuration ?? goal.defaultTarget) || 0,
            achieved: Number(item.achieved) || 0,
            note: item.note || "",
          });
        }
      }
    }
    console.log(`  ${merged.size} history entries to fold into GoalHistory`);
    if (apply && merged.size > 0) {
      await GoalHistory.bulkWrite(
        [...merged.values()].map((entry) => ({
          updateOne: {
            filter: { goalId: entry.goalId, interval: entry.interval, periodStart: entry.periodStart },
            update: { $setOnInsert: entry },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      await Goal.collection.updateMany({}, { $unset: { history: "" } });
    }
  }

  // 5. Categories.
  //
  // The old schema declared this field as `account` while the data used
  // `accountId`, so Mongoose never cast it and every document stored the id as
  // a plain String. Goals store a real ObjectId, so the two never matched and
  // category lookups have silently returned nothing for every account.
  const strayAccountField = await Category.collection.countDocuments({ account: { $exists: true } });
  console.log(`Category docs with a legacy \`account\` field: ${strayAccountField}`);
  if (apply && strayAccountField) {
    await Category.collection.updateMany({ account: { $exists: true } }, [
      { $set: { accountId: { $ifNull: ["$accountId", "$account"] } } },
      { $unset: "account" },
    ]);
  }

  const categoryDocs = await Category.collection.find({}).toArray();
  const stringIds = categoryDocs.filter((doc) => typeof doc.accountId === "string");
  console.log(`Category docs whose accountId is a String instead of an ObjectId: ${stringIds.length}`);
  for (const doc of stringIds) {
    console.log(`  ${doc.accountId} -> ObjectId (${doc.categories?.length ?? 0} categories)`);
    if (apply) {
      await Category.collection.updateOne(
        { _id: doc._id },
        { $set: { accountId: new mongoose.Types.ObjectId(doc.accountId) } }
      );
    }
  }

  // Any category a goal refers to but the list does not contain would vanish
  // from the grouped view. Fold them in rather than losing the grouping.
  const accounts = await User.collection.find({}, { projection: { _id: 1, email: 1 } }).toArray();
  for (const account of accounts) {
    const used = await Goal.collection.distinct("category", { accountId: account._id });
    const doc = await Category.collection.findOne({
      $or: [{ accountId: account._id }, { accountId: String(account._id) }],
    });
    const listed = new Set((doc?.categories || []).map((entry) => entry.category));
    const missing = used.filter((name) => name && !listed.has(name));
    if (missing.length === 0) continue;

    console.log(`  ${account.email}: adding ${missing.length} category(ies) used by goals: ${missing.join(", ")}`);
    if (apply) {
      const merged = [
        ...(doc?.categories || []),
        ...missing.map((name, index) => ({
          category: name,
          order: (doc?.categories?.length ?? 0) + index,
          color: null,
        })),
      ].map((entry, index) => ({ ...entry, order: index }));

      await Category.collection.updateOne(
        { _id: doc?._id ?? new mongoose.Types.ObjectId() },
        { $set: { accountId: account._id, categories: merged } },
        { upsert: true }
      );
    }
  }

  // 6. Rows carrying nothing.
  //
  // `$lte: 0` rather than `0`: the old client did a read-modify-write on the
  // decrement with no server-side clamp, so a few rows went negative. They carry
  // no progress, they violate the `min: 0` on the current schema, and they drag
  // the achieved totals down. The current server clamps at zero, so no new ones
  // can appear.
  const emptyFilter = {
    achieved: { $lte: 0 },
    $or: [{ note: "" }, { note: null }, { note: { $exists: false } }],
  };
  const emptyCount = await GoalHistory.countDocuments(emptyFilter);
  // countDocuments, not estimatedDocumentCount — the estimate reads cached
  // collection metadata and drifts, and this number decides a deletion.
  const totalHistory = await GoalHistory.countDocuments({});
  console.log(
    `\nGoalHistory: ${totalHistory} rows, ${emptyCount} empty placeholders (${
      totalHistory ? Math.round((emptyCount / totalHistory) * 100) : 0
    }%)`
  );
  if (purgeEmpty) {
    if (apply) {
      const { deletedCount } = await GoalHistory.deleteMany(emptyFilter);
      console.log(`  deleted ${deletedCount} placeholder rows`);
    } else {
      console.log("  --purge-empty given, but --apply was not; nothing deleted");
    }
  } else {
    console.log("  left in place (pass --purge-empty to remove them)");
  }

  // 7. Bring indexes in line with the models.
  if (apply) {
    console.log("\nSyncing indexes...");
    for (const model of [User, Goal, Category, GoalHistory]) {
      await model.syncIndexes();
      console.log(`  ${model.modelName} ok`);
    }
  }

  console.log(`\n=== Done (${label}) ===`);
  if (!apply) console.log("Nothing was changed. Re-run with --apply to commit these changes.\n");

  await disconnect();
};

main().catch(async (err) => {
  console.error("Maintenance failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
