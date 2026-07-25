import { Box, Container, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

/**
 * The chart's tempo indication: which period you are looking at, how far through
 * it you are, and the controls to move between periods.
 *
 * The completion figure is the display element — tabular, at scale, so the eye
 * lands on the number before the words.
 */
export default function TempoLine({
  label,
  sublabel,
  achieved,
  target,
  onPrevious,
  onNext,
  nextDisabled,
  previousLabel = "Previous",
  nextLabel = "Next",
  onToday,
  todayDisabled,
}) {
  const percent = target > 0 ? Math.round((achieved / target) * 100) : 0;

  return (
    <Container maxWidth="md" sx={{ pt: 8, pb: 6 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
            {sublabel}
          </Typography>
          <Typography variant="h2" sx={{ color: "text.primary", mb: 3, wordBreak: "break-word" }}>
            {label}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <Typography
              component="span"
              sx={{
                fontFamily: (t) => t.typography.h1.fontFamily,
                fontSize: "1.375rem",
                fontWeight: 500,
                color: percent >= 100 ? "chart.brass" : "chart.vermilion",
              }}
            >
              {percent}%
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {achieved} of {target} recorded
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <IconButton onClick={onPrevious} aria-label={previousLabel} sx={{ color: "text.secondary" }}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={onNext}
            aria-label={nextLabel}
            disabled={nextDisabled}
            sx={{ color: "text.secondary" }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {onToday && !todayDisabled && (
        <Box
          component="button"
          type="button"
          onClick={onToday}
          sx={{
            mt: 4,
            px: 0,
            py: 1,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            fontFamily: (t) => t.typography.overline.fontFamily,
            fontSize: (t) => t.typography.overline.fontSize,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "chart.vermilion",
            borderBottom: "1px solid currentColor",
          }}
        >
          Back to now
        </Box>
      )}
    </Container>
  );
}
