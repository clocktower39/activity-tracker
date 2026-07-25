import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useLocation } from "react-router";
import { Box, Container, IconButton, Tooltip, Typography } from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import TuneIcon from "@mui/icons-material/Tune";
import { loadGoals, selectGoalsStatus } from "../features/goals/goalsSlice";
import Toast from "./Toast";

const CADENCES = [
  { to: "/", label: "Today", end: true },
  { to: "/week", label: "Week" },
  { to: "/month", label: "Month" },
  { to: "/year", label: "Year" },
];

/**
 * The chart's frame: a tempo line at the top, the staff in the middle, and the
 * cadence switcher within thumb reach at the bottom.
 */
export default function AppShell() {
  const dispatch = useDispatch();
  const status = useSelector(selectGoalsStatus);
  const location = useLocation();

  // Goals and categories load once per session; every view reads the same copy.
  useEffect(() => {
    if (status === "idle") dispatch(loadGoals());
  }, [dispatch, status]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="md" sx={{ display: "flex", alignItems: "center", gap: 3, py: 3 }}>
          <Typography
            variant="overline"
            sx={{ color: "chart.vermilion", flexGrow: 1, letterSpacing: "0.14em" }}
          >
            Activity Tracker
          </Typography>

          <Tooltip title="Review">
            <IconButton
              component={NavLink}
              to="/review"
              aria-label="Review streaks and totals"
              size="small"
              sx={{
                color: location.pathname === "/review" ? "chart.vermilion" : "text.secondary",
              }}
            >
              <InsightsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton
              component={NavLink}
              to="/settings"
              aria-label="Settings"
              size="small"
              sx={{
                color: location.pathname.startsWith("/settings")
                  ? "chart.vermilion"
                  : "text.secondary",
              }}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Container>
      </Box>

      {/* Clears the fixed cadence bar plus the iOS home indicator. */}
      <Box
        component="main"
        sx={{ flexGrow: 1, pb: "calc(80px + env(safe-area-inset-bottom))" }}
      >
        <Outlet />
      </Box>

      <Box
        component="nav"
        aria-label="Cadence"
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          bgcolor: "background.default",
          borderTop: "1px solid",
          borderColor: "divider",
          pb: "env(safe-area-inset-bottom)",
        }}
      >
        <Container maxWidth="md" sx={{ display: "flex" }}>
          {CADENCES.map((cadence) => (
            <Box
              key={cadence.to}
              component={NavLink}
              to={cadence.to}
              end={cadence.end}
              sx={{
                flex: 1,
                minHeight: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                fontFamily: (t) => t.typography.overline.fontFamily,
                fontSize: (t) => t.typography.overline.fontSize,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "text.secondary",
                // A bar line above the active cadence: the world's own marker,
                // rather than a pill or an underline.
                borderTop: "2px solid transparent",
                mt: "-1px",
                "&.active": { color: "chart.vermilion", borderTopColor: "chart.vermilion" },
              }}
            >
              {cadence.label}
            </Box>
          ))}
        </Container>
      </Box>

      <Toast />
    </Box>
  );
}
