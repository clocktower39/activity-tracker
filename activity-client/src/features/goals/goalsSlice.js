import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { api } from "../../app/api";
import { normalizeInterval } from "../../lib/periods";

/**
 * Goals and categories only — never history. This is the small, stable half of
 * the data: fetched once per session and mutated in place thereafter.
 */
export const loadGoals = createAsyncThunk("goals/load", async () => api.bootstrap());

export const createGoal = createAsyncThunk("goals/create", async (goal) => {
  const { goal: created } = await api.createGoal(goal);
  return created;
});

export const saveGoal = createAsyncThunk("goals/save", async ({ id, patch }) => {
  const { goal } = await api.updateGoal(id, patch);
  return goal;
});

export const removeGoal = createAsyncThunk("goals/remove", async (id) => {
  await api.deleteGoal(id);
  return id;
});

export const reorderGoals = createAsyncThunk("goals/reorder", async (order) => {
  const { goals } = await api.reorderGoals(order);
  return goals;
});

export const saveCategories = createAsyncThunk("goals/saveCategories", async (categories) => {
  const data = await api.saveCategories(categories);
  return data.categories;
});

export const renameCategory = createAsyncThunk("goals/renameCategory", async ({ from, to }) => {
  const data = await api.renameCategory(from, to);
  return { categories: data.categories, from, to };
});

const initialState = {
  goals: [],
  categories: [],
  // Oldest and newest recorded periods on this account, so views can offer a
  // real "all time" range instead of assuming one.
  recordRange: { first: null, last: null },
  status: "idle",
  error: null,
};

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGoals.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadGoals.fulfilled, (state, action) => {
        state.status = "ready";
        state.goals = action.payload.goals.map((goal) => ({
          ...goal,
          interval: normalizeInterval(goal.interval),
        }));
        state.categories = action.payload.categories;
        state.recordRange = action.payload.recordRange || { first: null, last: null };
      })
      .addCase(loadGoals.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error?.message || "Couldn't load your goals";
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.goals.push({ ...action.payload, interval: normalizeInterval(action.payload.interval) });
      })
      .addCase(saveGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex((goal) => goal._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = {
            ...action.payload,
            interval: normalizeInterval(action.payload.interval),
          };
        }
      })
      .addCase(removeGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter((goal) => goal._id !== action.payload);
      })
      .addCase(reorderGoals.fulfilled, (state, action) => {
        state.goals = action.payload.map((goal) => ({
          ...goal,
          interval: normalizeInterval(goal.interval),
        }));
      })
      .addCase(saveCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(renameCategory.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
        state.goals.forEach((goal) => {
          if (goal.category === action.payload.from) goal.category = action.payload.to;
        });
      });
  },
});

export const { reset: resetGoals } = goalsSlice.actions;
export default goalsSlice.reducer;

// ----- Selectors -------------------------------------------------------------

export const selectGoalsState = (state) => state.goals;
export const selectAllGoals = (state) => state.goals.goals;
export const selectCategories = (state) => state.goals.categories;
export const selectRecordRange = (state) => state.goals.recordRange;
export const selectGoalsStatus = (state) => state.goals.status;

export const selectVisibleGoals = createSelector([selectAllGoals], (goals) =>
  goals.filter((goal) => !goal.hidden)
);

export const selectHiddenGoals = createSelector([selectAllGoals], (goals) =>
  goals.filter((goal) => goal.hidden)
);

export const selectGoalById = (id) =>
  createSelector([selectAllGoals], (goals) => goals.find((goal) => goal._id === id) || null);

/**
 * Goals grouped into their categories, in category order.
 *
 * A category a goal names but the list does not contain still gets its own
 * group, appended after the ordered ones. Only a goal with no category at all
 * falls through to "Uncategorised" — lumping named-but-unlisted categories
 * together there hid the fact that every account's category list had failed to
 * load, which is exactly the failure this guards against.
 */
export const selectGroupedGoals = createSelector(
  [selectVisibleGoals, selectCategories],
  (goals, categories) => {
    const ordered = categories.map((cat) => cat.category);
    const byCategory = new Map(ordered.map((name) => [name, []]));
    const extras = [];
    const uncategorised = [];

    [...goals]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.task.localeCompare(b.task))
      .forEach((goal) => {
        const name = (goal.category || "").trim();
        if (!name) {
          uncategorised.push(goal);
        } else if (byCategory.has(name)) {
          byCategory.get(name).push(goal);
        } else {
          if (!byCategory.has(name)) extras.push(name);
          byCategory.set(name, [goal]);
        }
      });

    const groups = [...ordered, ...extras]
      .map((name) => ({
        category: name,
        color: categories.find((cat) => cat.category === name)?.color ?? null,
        goals: byCategory.get(name) || [],
      }))
      .filter((group) => group.goals.length > 0);

    if (uncategorised.length > 0) {
      groups.push({ category: "Uncategorised", color: null, goals: uncategorised });
    }
    return groups;
  }
);
