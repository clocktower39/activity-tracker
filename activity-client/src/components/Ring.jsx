import { memo, useEffect, useState } from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useLongPress } from "../hooks/useLongPress";
import { dynamicMark, progressState } from "../lib/periods";
import { stateColor } from "../design/theme";

const SIZE = 100;
const CENTER = SIZE / 2;
const TRACK_R = 42;
const LAP_R = 33;
const STROKE = 7;

const circumference = (r) => 2 * Math.PI * r;

const STATE_LABEL = {
  empty: "not started",
  partial: "in progress",
  complete: "target reached",
  over: "past target",
};

/**
 * The signature interaction: an engraved dial that records one tap of progress.
 *
 * State is never carried by colour alone — the count sits at the centre, the
 * accessible name spells out count, target and state, and a goal past its target
 * picks up a dynamic mark.
 */
function Ring({
  goal,
  achieved,
  target,
  size: sizeOverride,
  pending = false,
  error = null,
  onIncrement,
  onOpen,
}) {
  const theme = useTheme();
  const chart = theme.palette.chart;
  const roomy = useMediaQuery(theme.breakpoints.up("sm"));
  // Scaled by the reader's display size, so shrinking the interface really does
  // fit more dials to a row. Still far above the 44px touch floor at the
  // smallest setting (0.75 x 60 = 45).
  const size = sizeOverride ?? Math.round((roomy ? 96 : 60) * (theme.scale ?? 1));

  const mode = goal.trackingMode === "more" ? "more" : "target";
  const state = progressState(achieved, target, mode);
  const mark = dynamicMark(achieved, target, mode);
  const color = stateColor(chart, state);

  const ratio = target > 0 ? achieved / target : achieved > 0 ? 1 : 0;
  const primaryTurn = Math.min(1, ratio);
  // A second, inner arc counts the overshoot on more-is-better goals.
  const lapTurn = mode === "more" && ratio > 1 ? Math.min(1, ratio - Math.floor(ratio) || 1) : 0;

  // ----- The cadence: the one authored moment in the app --------------------
  // Derived during render rather than in an effect, so the settle starts on the
  // same commit that crosses the target instead of one frame later.
  const isComplete = state === "complete" || state === "over";
  const [wasComplete, setWasComplete] = useState(isComplete);
  const [settling, setSettling] = useState(false);

  if (isComplete !== wasComplete) {
    setWasComplete(isComplete);
    setSettling(isComplete);
  }

  useEffect(() => {
    if (!settling) return undefined;
    const timer = setTimeout(() => setSettling(false), 420);
    return () => clearTimeout(timer);
  }, [settling]);

  const handlers = useLongPress({
    onPress: onIncrement,
    onLongPress: onOpen,
  });

  const trackC = circumference(TRACK_R);
  const lapC = circumference(LAP_R);

  const label = `${goal.task}. ${achieved} of ${target}, ${STATE_LABEL[state]}.${
    mark ? ` ${mark === "f" ? "forte" : mark === "ff" ? "fortissimo" : "beyond"}.` : ""
  }`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        width: size + 8,
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-describedby={error ? `${goal._id}-error` : undefined}
        {...handlers}
        onKeyDown={(event) => {
          // The long press is a gesture, not the only route: Space records,
          // Enter opens the detail sheet.
          if (event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            onIncrement?.(event);
          } else if (event.key === "Enter") {
            event.preventDefault();
            onOpen?.(event);
          }
        }}
        sx={{
          position: "relative",
          width: size,
          height: size,
          cursor: "pointer",
          borderRadius: "50%",
          userSelect: "none",
          touchAction: "manipulation",
          opacity: pending ? 0.72 : 1,
          transition: "opacity 120ms linear",
          // Hover must raise contrast, not lower it — `rule` is dimmer than
          // `empty` in dark mode, so hovering used to fade the affordance.
          "&:hover .ring-track": { stroke: error ? chart.vermilion : chart.inkMuted },
        }}
      >
        <Box
          component="svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          sx={{
            width: "100%",
            height: "100%",
            transform: "rotate(-90deg)",
            overflow: "visible",
          }}
          aria-hidden="true"
        >
          <circle
            className="ring-track"
            cx={CENTER}
            cy={CENTER}
            r={TRACK_R}
            fill="none"
            stroke={error ? chart.vermilion : chart.empty}
            strokeWidth={1}
            strokeDasharray={error ? "3 3" : undefined}
            style={{ transition: "stroke 160ms linear" }}
          />

          {primaryTurn > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={TRACK_R}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              strokeDasharray={trackC}
              strokeDashoffset={trackC * (1 - primaryTurn)}
              style={{
                transition: settling
                  ? "stroke-dashoffset 420ms cubic-bezier(0.16, 1, 0.3, 1), stroke 420ms cubic-bezier(0.16, 1, 0.3, 1)"
                  : "stroke-dashoffset 120ms linear, stroke 120ms linear",
              }}
            />
          )}

          {lapTurn > 0 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={LAP_R}
              fill="none"
              stroke={chart.ultramarine}
              strokeWidth={2.5}
              strokeDasharray={lapC}
              strokeDashoffset={lapC * (1 - lapTurn)}
              style={{ transition: "stroke-dashoffset 120ms linear" }}
            />
          )}
        </Box>

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            pointerEvents: "none",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: (t) => t.typography.h1.fontFamily,
              fontVariantNumeric: "tabular-nums",
              fontSize: Math.max(22, size * 0.3),
              lineHeight: 1,
              fontWeight: 500,
              color: state === "empty" ? chart.inkMuted : chart.ink,
              transform: settling ? "scale(1.12)" : "scale(1)",
              transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {achieved}
          </Typography>
          {mark ? (
            <Typography
              component="span"
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: Math.max(12, size * 0.16),
                lineHeight: 1,
                color: chart.ultramarine,
                mt: 0.25,
              }}
            >
              {mark}
            </Typography>
          ) : (
            <Typography
              component="span"
              sx={{
                fontFamily: (t) => t.typography.overline.fontFamily,
                fontSize: Math.max(10, size * 0.12),
                lineHeight: 1,
                letterSpacing: "0.06em",
                color: chart.inkMuted,
                mt: 0.5,
              }}
            >
              /{target}
            </Typography>
          )}
        </Box>
      </Box>

      <Typography
        variant="body2"
        align="center"
        sx={{
          color: chart.ink,
          lineHeight: 1.25,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {goal.task}
      </Typography>

      {error && (
        <Typography
          id={`${goal._id}-error`}
          variant="caption"
          align="center"
          sx={{ color: chart.vermilion, lineHeight: 1.2 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default memo(Ring);
