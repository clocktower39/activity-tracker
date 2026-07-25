import { createSlice } from "@reduxjs/toolkit";

const storedTheme = () => {
  const saved = localStorage.getItem("activity.themeMode");
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "dark";
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    themeMode: storedTheme(),
    // Transient message shown in the status line. Not an error dialog — a failed
    // tap should be legible without interrupting the next one.
    toast: null,
  },
  reducers: {
    setThemeMode(state, action) {
      state.themeMode = action.payload;
      localStorage.setItem("activity.themeMode", action.payload);
    },
    showToast(state, action) {
      state.toast = { message: action.payload.message, tone: action.payload.tone || "info", id: action.payload.id };
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { setThemeMode, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;

export const selectThemeMode = (state) => state.ui.themeMode;
export const selectToast = (state) => state.ui.toast;
