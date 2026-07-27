import { createSlice } from "@reduxjs/toolkit";
import {
  CUSTOM_ID,
  DEFAULT_PALETTE_ID,
  normalizePalette,
  PALETTES,
} from "../../design/palettes";

/**
 * Reads the chosen theme, translating the two values the old light/dark control
 * used so nobody's setting is lost by the upgrade.
 */
const storedThemeId = () => {
  const saved = localStorage.getItem("activity.themeId");
  if (saved && (PALETTES[saved] || saved === "system" || saved === CUSTOM_ID)) return saved;

  const legacyMode = localStorage.getItem("activity.themeMode");
  if (legacyMode === "light") return "practice-light";
  if (legacyMode === "system") return "system";
  return DEFAULT_PALETTE_ID;
};

const storedCustom = () => {
  try {
    const raw = localStorage.getItem("activity.customPalette");
    return raw ? normalizePalette(JSON.parse(raw)) : normalizePalette(PALETTES[DEFAULT_PALETTE_ID]);
  } catch {
    return normalizePalette(PALETTES[DEFAULT_PALETTE_ID]);
  }
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
    themeId: storedThemeId(),
    customPalette: storedCustom(),
    scale: storedScale(),
    // Transient message shown in the status line. Not an error dialog — a failed
    // tap should be legible without interrupting the next one.
    toast: null,
  },
  reducers: {
    setThemeId(state, action) {
      state.themeId = action.payload;
      localStorage.setItem("activity.themeId", action.payload);
    },
    /** One slot at a time, as the builder's colour inputs change. */
    setCustomColor(state, action) {
      const { key, value } = action.payload;
      state.customPalette.colors[key] = value;
      localStorage.setItem("activity.customPalette", JSON.stringify(state.customPalette));
    },
    setCustomMode(state, action) {
      state.customPalette.mode = action.payload === "light" ? "light" : "dark";
      localStorage.setItem("activity.customPalette", JSON.stringify(state.customPalette));
    },
    /** Seeds the builder from an existing theme, so editing starts somewhere. */
    seedCustomFrom(state, action) {
      const source = PALETTES[action.payload] ?? PALETTES[DEFAULT_PALETTE_ID];
      state.customPalette = normalizePalette({ ...source, label: "Custom", note: "" });
      localStorage.setItem("activity.customPalette", JSON.stringify(state.customPalette));
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

export const { setThemeId, setCustomColor, setCustomMode, seedCustomFrom, setScale, showToast, clearToast } =
  uiSlice.actions;
export default uiSlice.reducer;

export const selectThemeId = (state) => state.ui.themeId;
export const selectCustomPalette = (state) => state.ui.customPalette;
export const selectScale = (state) => state.ui.scale;
export const selectToast = (state) => state.ui.toast;
