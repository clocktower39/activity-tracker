import { createTheme } from "@mui/material/styles";

/**
 * Practice Chart — see DESIGN.md for the direction contract.
 *
 * Plate-ink ground. Vermilion is the mark a teacher leaves in a margin: attend
 * to this. Brass is a target reached. Ultramarine is past it. Both modes are
 * authored, not derived from one another.
 */

export const palettes = {
  dark: {
    ground: "#0D1117",
    surface: "#151B24",
    surfaceRaised: "#1D2530",
    rule: "#2A3441",
    ink: "#EDEFF2",
    inkMuted: "#96A1B0",
    vermilion: "#E8503F",
    brass: "#D2A03C",
    ultramarine: "#5B84E8",
    // An empty dial must still read as a dial. This is the lowest-contrast
    // element in the app and it carries the "nothing recorded" state.
    empty: "#4A5566",
  },
  light: {
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
};

const FONT_UI =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const FONT_NUM = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

export const fonts = { ui: FONT_UI, num: FONT_NUM };

/** Colour for a progress state. Never the only carrier of that state. */
export const stateColor = (chart, state) => {
  switch (state) {
    case "partial":
      return chart.vermilion;
    case "complete":
      return chart.brass;
    case "over":
      return chart.ultramarine;
    default:
      return chart.empty;
  }
};

export const buildTheme = (mode) => {
  const c = palettes[mode];

  return createTheme({
    palette: {
      mode,
      background: { default: c.ground, paper: c.surface },
      text: { primary: c.ink, secondary: c.inkMuted },
      primary: { main: c.vermilion, contrastText: mode === "dark" ? "#0D1117" : "#FFFFFF" },
      secondary: { main: c.brass },
      info: { main: c.ultramarine },
      error: { main: c.vermilion },
      divider: c.rule,
      // The world's own vocabulary, reachable from any component via the theme.
      chart: c,
    },

    shape: { borderRadius: 3 },

    spacing: 4,

    typography: {
      fontFamily: FONT_UI,
      // Display sizes step down on small screens so a full date stays on one
      // line at 390px rather than breaking mid-phrase.
      h1: {
        fontFamily: FONT_NUM,
        fontSize: "2.25rem",
        fontWeight: 500,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        "@media (min-width:600px)": { fontSize: "3rem" },
      },
      h2: {
        fontFamily: FONT_NUM,
        fontSize: "1.5rem",
        fontWeight: 500,
        letterSpacing: "-0.02em",
        lineHeight: 1.15,
        "@media (min-width:600px)": { fontSize: "2rem" },
      },
      h3: { fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.01em" },
      body1: { fontSize: "1rem", lineHeight: 1.5 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
      // Tempo marks: the small tracked caps that label a section or a cadence.
      overline: {
        fontFamily: FONT_NUM,
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        lineHeight: 1,
      },
      button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            colorScheme: mode,
          },
          body: {
            backgroundColor: c.ground,
            // Counts must not jitter as they increment.
            fontVariantNumeric: "tabular-nums",
            overscrollBehaviorY: "none",
            WebkitTapHighlightColor: "transparent",
          },
          "*:focus-visible": {
            outline: `2px solid ${c.vermilion}`,
            outlineOffset: 2,
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*": {
              animationDuration: "0.01ms !important",
              transitionDuration: "0.01ms !important",
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { minHeight: 44, borderRadius: 3 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 3 },
        },
      },
      // Fields are ruled, not boxed — the same grammar as every other structure
      // in this world. A notched outline would be the one boxed component on a
      // surface whose whole system is rules and ink weight.
      MuiTextField: {
        defaultProps: { variant: "standard", size: "small" },
      },
      MuiInput: {
        styleOverrides: {
          root: {
            "&:before": { borderBottom: `1px solid ${c.rule}` },
            "&:hover:not(.Mui-disabled):before": { borderBottom: `1px solid ${c.inkMuted}` },
            "&:after": { borderBottom: `2px solid ${c.vermilion}` },
          },
          input: { fontFamily: FONT_UI, paddingBottom: 6 },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: FONT_NUM,
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: c.inkMuted,
            "&.Mui-focused": { color: c.vermilion },
          },
        },
      },
      MuiSelect: {
        defaultProps: { variant: "standard" },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { marginTop: 4 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 3, backgroundColor: c.ground },
          input: { fontFamily: FONT_UI },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: c.surfaceRaised,
            backgroundImage: "none",
            border: `1px solid ${c.rule}`,
            borderRadius: 4,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: c.surfaceRaised,
            color: c.ink,
            border: `1px solid ${c.rule}`,
            fontFamily: FONT_NUM,
            fontSize: "0.6875rem",
          },
        },
      },
    },
  });
};
