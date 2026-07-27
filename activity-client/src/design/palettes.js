/**
 * Named palettes.
 *
 * Every theme fills the same ten slots, so anything that reads
 * `theme.palette.chart.*` keeps working whichever is chosen. The slot keys are
 * the original Practice Chart colour names — `vermilion`, `brass`,
 * `ultramarine` — because they are referenced across the whole app; in a theme
 * where "vermilion" is green they are simply slot names. The settings screen
 * labels them by what they mean rather than by what they are called.
 */

/** The slots, in the order the settings table shows them. */
export const TOKENS = [
  { key: "ground", label: "Page", help: "Behind everything" },
  { key: "surface", label: "Raised", help: "Grouped regions" },
  { key: "surfaceRaised", label: "Dialogs", help: "Sheets and menus" },
  { key: "rule", label: "Rules", help: "Hairlines and bar lines" },
  { key: "ink", label: "Text", help: "Primary text" },
  { key: "inkMuted", label: "Muted text", help: "Labels and captions" },
  { key: "vermilion", label: "In progress", help: "Started, not finished" },
  { key: "brass", label: "Target reached", help: "Goal met for the period" },
  { key: "ultramarine", label: "Past target", help: "Overshoot on a more-is-better goal" },
  { key: "empty", label: "Nothing recorded", help: "The untouched dial and cell" },
];

export const TOKEN_KEYS = TOKENS.map((t) => t.key);

export const PALETTES = {
  "practice-dark": {
    label: "Practice Chart",
    note: "The default. Plate ink, a teacher's vermilion, brass for a target met.",
    mode: "dark",
    colors: {
      ground: "#0D1117",
      surface: "#151B24",
      surfaceRaised: "#1D2530",
      rule: "#2A3441",
      ink: "#EDEFF2",
      inkMuted: "#96A1B0",
      vermilion: "#E8503F",
      brass: "#D2A03C",
      ultramarine: "#5B84E8",
      empty: "#4A5566",
    },
  },

  "practice-light": {
    label: "Practice Chart Light",
    note: "The same world in daylight. Slate ground rather than paper.",
    mode: "light",
    colors: {
      ground: "#E8E6E1",
      surface: "#F4F2EE",
      surfaceRaised: "#FFFFFF",
      rule: "#C9C5BC",
      ink: "#16191E",
      inkMuted: "#5A6270",
      vermilion: "#C33A2A",
      brass: "#9A6F1C",
      ultramarine: "#2D53B8",
      empty: "#98948A",
    },
  },

  legacy: {
    label: "Legacy",
    note: "The original scheme: charcoal panels, red building to green, blue past the target.",
    mode: "dark",
    colors: {
      // #1B1B1B was the old body background, #303030 the goal container.
      ground: "#1B1B1B",
      surface: "#303030",
      surfaceRaised: "#424242",
      rule: "#4A4A4A",
      ink: "#FFFFFF",
      inkMuted: "#B3B3B3",
      // The old rings ran error -> warning -> success -> primary, straight from
      // MUI's dark defaults.
      vermilion: "#F44336",
      brass: "#66BB6A",
      ultramarine: "#90CAF9",
      empty: "#616161",
    },
  },

  blueprint: {
    label: "Blueprint",
    note: "Drafting ink and cyanotype. Cool throughout, with amber reserved for a target met.",
    mode: "dark",
    colors: {
      ground: "#0A1220",
      surface: "#101C2E",
      surfaceRaised: "#16263C",
      rule: "#24384F",
      ink: "#E6EEF7",
      inkMuted: "#8AA2BC",
      vermilion: "#4FB8D9",
      brass: "#F0B429",
      ultramarine: "#A78BFA",
      empty: "#3A4E66",
    },
  },

  terracotta: {
    label: "Terracotta",
    note: "Warm and light. Clay, olive and a deep red for work still to do.",
    mode: "light",
    colors: {
      ground: "#F2EAE1",
      surface: "#FAF5EF",
      surfaceRaised: "#FFFFFF",
      rule: "#D6C6B4",
      ink: "#241C16",
      inkMuted: "#6B5B4C",
      vermilion: "#B0432A",
      brass: "#6B7B2F",
      ultramarine: "#2F6B7B",
      empty: "#A99884",
    },
  },

  contrast: {
    label: "High contrast",
    note: "Maximum separation for low light or low vision. Pure black, pure white.",
    mode: "dark",
    colors: {
      ground: "#000000",
      surface: "#0D0D0D",
      surfaceRaised: "#1A1A1A",
      rule: "#5A5A5A",
      ink: "#FFFFFF",
      inkMuted: "#D0D0D0",
      vermilion: "#FF6B57",
      brass: "#FFD23F",
      ultramarine: "#7FB2FF",
      empty: "#6E6E6E",
    },
  },
};

export const DEFAULT_PALETTE_ID = "practice-dark";
export const SYSTEM_DARK = "practice-dark";
export const SYSTEM_LIGHT = "practice-light";
export const CUSTOM_ID = "custom";

/** #abc, #aabbcc and #aabbccdd are all accepted. */
export const isHex = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value).trim());

/** Fills any missing or malformed slot from a fallback, so a theme is never half-built. */
export const normalizePalette = (candidate, fallbackId = DEFAULT_PALETTE_ID) => {
  const fallback = PALETTES[fallbackId] ?? PALETTES[DEFAULT_PALETTE_ID];
  const colors = {};
  TOKEN_KEYS.forEach((key) => {
    const value = candidate?.colors?.[key];
    colors[key] = isHex(value) ? value : fallback.colors[key];
  });
  return {
    label: candidate?.label || "Custom",
    note: candidate?.note || "",
    mode: candidate?.mode === "light" ? "light" : "dark",
    colors,
  };
};

/**
 * Resolves the stored choice into a palette.
 * `system` follows the device, which is why it is a choice rather than a theme.
 */
export const resolvePalette = ({ themeId, custom, prefersDark }) => {
  if (themeId === "system") return PALETTES[prefersDark ? SYSTEM_DARK : SYSTEM_LIGHT];
  if (themeId === CUSTOM_ID) return normalizePalette(custom);
  return PALETTES[themeId] ?? PALETTES[DEFAULT_PALETTE_ID];
};

/**
 * Relative luminance contrast, so the theme editor can warn when a pairing
 * is unreadable rather than leaving it to be discovered in use.
 */
export const contrastRatio = (a, b) => {
  const lum = (hex) => {
    const clean = String(hex).replace("#", "");
    const full =
      clean.length === 3
        ? clean.split("").map((c) => c + c).join("")
        : clean.slice(0, 6);
    const parts = [0, 2, 4].map((i) => {
      const channel = parseInt(full.slice(i, i + 2), 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
