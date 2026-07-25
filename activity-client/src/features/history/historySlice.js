import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { api } from "../../app/api";
import { entryKey, getPeriodKey, normalizeInterval } from "../../lib/periods";

/**
 * History cache.
 *
 * Entries are stored flat, keyed by (goalId, interval, periodKey) — the same
 * identity the server uses. Two views showing the same period read the same
 * object, so switching between Today and Week refetches nothing.
 *
 * `dates` and `ranges` record what has already been fetched. Every thunk checks
 * that record first and returns early rather than re-requesting. The old build
 * re-downloaded the account's entire history on every date change.
 */

const rangeKey = ({ from, to, interval }) => `${interval || "all"}|${from}|${to}`;

const normalizeEntry = (raw) => ({
  _id: raw._id,
  goalId: String(raw.goalId),
  interval: normalizeInterval(raw.interval),
  periodKey: getPeriodKey(raw.interval, raw.periodStart),
  target: Number(raw.targetPerDuration) || 0,
  achieved: Number(raw.achieved) || 0,
  note: raw.note || "",
});

const storeEntries = (state, rows) => {
  rows.forEach((raw) => {
    const entry = normalizeEntry(raw);
    const key = `${entry.goalId}|${entry.interval}|${entry.periodKey}`;
    // An in-flight optimistic write is newer than this response; don't stomp it.
    if (state.pending[key]) return;
    state.entries[key] = entry;
  });
};

/** True when some already-loaded range fully covers the one being asked for. */
const isCovered = (state, { from, to, interval }) => {
  const wanted = interval || "all";
  return Object.entries(state.ranges).some(([key, status]) => {
    if (status !== "ready") return false;
    const [rangeInterval, rangeFrom, rangeTo] = key.split("|");
    if (rangeInterval !== wanted && rangeInterval !== "all") return false;
    return rangeFrom <= from && rangeTo >= to;
  });
};

export const fetchDate = createAsyncThunk(
  "history/fetchDate",
  async (date, { signal }) => {
    const data = await api.historyForDate(date, signal);
    return { date, entries: data.entries };
  },
  {
    condition: (date, { getState }) => {
      const status = getState().history.dates[date];
      return status !== "ready" && status !== "loading";
    },
  }
);

export const fetchRange = createAsyncThunk(
  "history/fetchRange",
  async (params, { signal }) => {
    const data = await api.historyRange(params, signal);
    return { params, entries: data.entries };
  },
  {
    condition: (params, { getState }) => {
      const state = getState().history;
      const key = rangeKey(params);
      if (state.ranges[key] === "ready" || state.ranges[key] === "loading") return false;
      return !isCovered(state, params);
    },
  }
);

export const fetchSummary = createAsyncThunk(
  "history/fetchSummary",
  async (params, { signal }) => {
    const data = await api.summary(params, signal);
    return { key: `${params.bucket}|${params.from}|${params.to}`, buckets: data.buckets };
  },
  {
    condition: (params, { getState }) => {
      const key = `${params.bucket}|${params.from}|${params.to}`;
      return !getState().history.summaries[key];
    },
  }
);

/**
 * Per-goal totals per bucket, aggregated server-side. The Year view uses this
 * rather than a year of daily rows.
 */
export const fetchMatrix = createAsyncThunk(
  "history/fetchMatrix",
  async (params, { signal }) => {
    const data = await api.matrix(params, signal);
    return { key: `${params.bucket}|${params.from}|${params.to}`, cells: data.cells };
  },
  {
    condition: (params, { getState }) => {
      const key = `${params.bucket}|${params.from}|${params.to}`;
      return !getState().history.matrices[key];
    },
  }
);

export const fetchStreaks = createAsyncThunk(
  "history/fetchStreaks",
  async (days = 365) => {
    const data = await api.streaks(days);
    return { key: String(days), streaks: data.streaks };
  },
  {
    condition: (days = 365, { getState }) => !getState().history.streaks[String(days)],
  }
);

/**
 * Record progress against a goal.
 *
 * Applies the change locally first so the ring responds instantly, then sends an
 * atomic increment. On failure the optimistic value is rolled back and the error
 * surfaced — a tap that did not land must never look like one that did.
 */
export const recordProgress = createAsyncThunk(
  "history/recordProgress",
  async ({ goal, date, delta, achieved, note }) => {
    const data = await api.recordProgress({
      goalId: goal._id,
      date: getPeriodKey(goal.interval, date),
      ...(achieved !== undefined ? { achieved } : { delta }),
      ...(note !== undefined ? { note } : {}),
    });
    return { goal, date, entry: data.entry };
  }
);

const initialState = {
  entries: {},
  dates: {},
  ranges: {},
  summaries: {},
  matrices: {},
  streaks: {},
  pending: {},
  errors: {},
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    reset: () => initialState,
    /** Drops cached reads so the next view re-fetches. Entries survive. */
    invalidate(state) {
      state.dates = {};
      state.ranges = {};
      state.summaries = {};
    },
    dismissError(state, action) {
      delete state.errors[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDate.pending, (state, action) => {
        state.dates[action.meta.arg] = "loading";
      })
      .addCase(fetchDate.fulfilled, (state, action) => {
        state.dates[action.payload.date] = "ready";
        storeEntries(state, action.payload.entries);
      })
      .addCase(fetchDate.rejected, (state, action) => {
        if (action.meta.aborted) delete state.dates[action.meta.arg];
        else state.dates[action.meta.arg] = "error";
      })

      .addCase(fetchRange.pending, (state, action) => {
        state.ranges[rangeKey(action.meta.arg)] = "loading";
      })
      .addCase(fetchRange.fulfilled, (state, action) => {
        state.ranges[rangeKey(action.payload.params)] = "ready";
        storeEntries(state, action.payload.entries);
      })
      .addCase(fetchRange.rejected, (state, action) => {
        const key = rangeKey(action.meta.arg);
        if (action.meta.aborted) delete state.ranges[key];
        else state.ranges[key] = "error";
      })

      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summaries[action.payload.key] = action.payload.buckets;
      })
      .addCase(fetchMatrix.fulfilled, (state, action) => {
        state.matrices[action.payload.key] = action.payload.cells;
      })
      .addCase(fetchStreaks.fulfilled, (state, action) => {
        state.streaks[action.payload.key] = action.payload.streaks;
      })

      .addCase(recordProgress.pending, (state, action) => {
        const { goal, date, delta, achieved, note } = action.meta.arg;
        const key = entryKey(goal._id, goal.interval, date);
        const existing = state.entries[key];
        const target = existing?.target ?? (Number(goal.defaultTarget) || 0);

        const before = existing?.achieved ?? 0;
        const next =
          achieved !== undefined ? Math.max(0, achieved) : Math.max(0, before + (delta || 0));

        state.entries[key] = {
          ...(existing || {
            goalId: String(goal._id),
            interval: normalizeInterval(goal.interval),
            periodKey: getPeriodKey(goal.interval, date),
            note: "",
          }),
          target,
          achieved: next,
          ...(note !== undefined ? { note } : {}),
        };

        // Remember the pre-tap value so a failure can restore it exactly, even
        // if several taps are in flight.
        state.pending[key] = (state.pending[key] || 0) + 1;
        if (state.pending[key] === 1) state.entries[key]._rollback = before;
        delete state.errors[key];
      })
      .addCase(recordProgress.fulfilled, (state, action) => {
        const { goal, date, entry } = action.payload;
        const key = entryKey(goal._id, goal.interval, date);
        state.pending[key] = Math.max(0, (state.pending[key] || 1) - 1);

        // Only trust the server's value once every optimistic write has landed;
        // an earlier response would undo a later tap.
        if (state.pending[key] === 0) {
          delete state.pending[key];
          state.entries[key] = normalizeEntry(entry);
        }
      })
      .addCase(recordProgress.rejected, (state, action) => {
        const { goal, date } = action.meta.arg;
        const key = entryKey(goal._id, goal.interval, date);
        state.pending[key] = Math.max(0, (state.pending[key] || 1) - 1);

        if (state.pending[key] === 0) {
          delete state.pending[key];
          const rollback = state.entries[key]?._rollback ?? 0;
          if (rollback === 0 && !state.entries[key]?.note) delete state.entries[key];
          else if (state.entries[key]) {
            state.entries[key].achieved = rollback;
            delete state.entries[key]._rollback;
          }
        }
        state.errors[key] = action.error?.message || "That didn't save";
      });
  },
});

export const { reset: resetHistory, invalidate, dismissError } = historySlice.actions;
export default historySlice.reducer;

// ----- Selectors -------------------------------------------------------------

const selectEntries = (state) => state.history.entries;
const selectErrors = (state) => state.history.errors;

export const selectEntry = (goalId, interval, date) => (state) =>
  state.history.entries[entryKey(goalId, interval, date)] || null;

export const selectEntryError = (goalId, interval, date) => (state) =>
  state.history.errors[entryKey(goalId, interval, date)] || null;

export const selectDateStatus = (date) => (state) => state.history.dates[date] || "idle";

export const selectSummary = (bucket, from, to) => (state) =>
  state.history.summaries[`${bucket}|${from}|${to}`] || null;

export const selectMatrix = (bucket, from, to) => (state) =>
  state.history.matrices[`${bucket}|${from}|${to}`] || null;

export const selectStreaks = (days) => (state) => state.history.streaks[String(days)] || null;

/** Progress for one goal in one period, falling back to a zero entry. */
export const makeSelectProgress = () =>
  createSelector(
    [selectEntries, selectErrors, (_state, props) => props],
    (entries, errors, { goal, date }) => {
      const key = entryKey(goal._id, goal.interval, date);
      const entry = entries[key];
      return {
        achieved: entry?.achieved ?? 0,
        target: entry?.target ?? (Number(goal.defaultTarget) || 0),
        note: entry?.note ?? "",
        error: errors[key] || null,
      };
    }
  );
