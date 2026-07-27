import { createSlice } from "@reduxjs/toolkit";

const storedTheme = () => {
  const saved = localStorage.getItem("activity.themeMode");
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "dark";
};

/**
 * 0.75–1.5, clamped on read so a hand-edited value cannot break the layout.
 *
 * The absent case is checked before the number is parsed: `Number(null)` is 0,
 * which is finite, so a missing setting fell through the guard and clamped to
 * the minimum — every new reader started at 75%.
 */
const storedScale = () => {
  const raw = localStorage.getItem("activity.scale");
  if (raw === null || raw === "") return 1;
  const saved = Number(raw);
  if (!Number.isFinite(saved) || saved <= 0) return 1;
  return Math.min(1.5, Math.max(0.75, saved));
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    themeMode: storedTheme(),
    scale: storedScale(),
    // Transient message shown in the status line. Not an error dialog — a failed
    // tap should be legible without interrupting the next one.
    toast: null,
  },
  reducers: {
    setThemeMode(state, action) {
      state.themeMode = action.payload;
      localStorage.setItem("activity.themeMode", action.payload);
    },
    setScale(state, action) {
      const next = Math.min(1.5, Math.max(0.75, Number(action.payload) || 1));
      state.scale = next;
      localStorage.setItem("activity.scale", String(next));
    },
    showToast(state, action) {
      state.toast = { message: action.payload.message, tone: action.payload.tone || "info", id: action.payload.id };
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { setThemeMode, setScale, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;

export const selectThemeMode = (state) => state.ui.themeMode;
export const selectScale = (state) => state.ui.scale;
export const selectToast = (state) => state.ui.toast;
