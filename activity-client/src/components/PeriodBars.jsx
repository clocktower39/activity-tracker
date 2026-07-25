import { useTheme } from "@mui/material";
import { Box, Typography } from "@mui/material";
import { progressState, shortPeriodLabel } from "../lib/periods";
import { stateColor } from "../design/theme";

/**
 * A run of periods as bars against the target line.
 *
 * Hand-drawn rather than pulled from a chart library: the whole vocabulary here
 * is a baseline, bar lines and one reference rule, which is a few elements, not
 * a dependency. The target rule is the point of the graphic — it says whether
 * each bar cleared it.
 */
export default function PeriodBars({ series, interval, trackingMode = "target", height = 96 }) {
  const theme = useTheme();
  const chart = theme.palette.chart;

  if (!series || series.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Nothing recorded in this stretch yet.
      </Typography>
    );
  }

  const target = series.find((point) => point.target > 0)?.target || 0;
  const peak = Math.max(target, ...series.map((point) => point.achieved), 1);
  const targetY = target > 0 ? height - (target / peak) * height : null;

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          height,
          display: "flex",
          alignItems: "flex-end",
          gap: "3px",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {targetY !== null && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${targetY}px`,
              borderTop: "1px dashed",
              borderColor: "chart.empty",
              pointerEvents: "none",
            }}
          />
        )}

        {series.map((point) => {
          const state = progressState(point.achieved, point.target, trackingMode);
          // Each bar occupies the full track and is scaled from its base, so the
          // animation never triggers layout. A recorded period keeps a 2px floor
          // so a small value is still visible; an empty one collapses to nothing.
          const ratio =
            point.achieved > 0 ? Math.max(2 / height, point.achieved / peak) : 0;
          return (
            <Box
              key={point.key}
              title={`${shortPeriodLabel(interval, point.key)}: ${point.achieved} of ${point.target}`}
              sx={{
                flex: 1,
                minWidth: 4,
                height: `${height}px`,
                bgcolor: stateColor(chart, state),
                opacity: point.current ? 1 : 0.75,
                outline: point.current ? `1px solid ${chart.ink}` : "none",
                outlineOffset: 1,
                transformOrigin: "bottom",
                transform: `scaleY(${ratio})`,
                transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          );
        })}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {shortPeriodLabel(interval, series[0].key)}
        </Typography>
        {target > 0 && (
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            target {target}
          </Typography>
        )}
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {shortPeriodLabel(interval, series[series.length - 1].key)}
        </Typography>
      </Box>
    </Box>
  );
}
