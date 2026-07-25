import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { buildTheme } from "./design/theme";
import { selectThemeMode } from "./features/ui/uiSlice";
import { restoreSession, signedOut } from "./features/auth/authSlice";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import AppShell from "./components/AppShell";
import TodayView from "./views/TodayView";
import PeriodView from "./views/PeriodView";
import ReviewView from "./views/ReviewView";
import SettingsView from "./views/SettingsView";
import SignInView from "./views/SignInView";
import SignUpView from "./views/SignUpView";
import NotFoundView from "./views/NotFoundView";

export default function App() {
  const dispatch = useDispatch();
  const mode = useSelector(selectThemeMode);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  const theme = useMemo(() => buildTheme(resolved), [resolved]);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // The API layer fires this when a refresh fails, so an expired session drops
  // straight to the sign-in screen instead of leaving a half-dead app.
  useEffect(() => {
    const onSignedOut = () => dispatch(signedOut());
    window.addEventListener("activity:signed-out", onSignedOut);
    return () => window.removeEventListener("activity:signed-out", onSignedOut);
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter basename="/activity-tracker">
          <Routes>
            <Route path="/signin" element={<SignInView />} />
            <Route path="/signup" element={<SignUpView />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<TodayView />} />
                <Route path="week" element={<PeriodView interval="weekly" />} />
                <Route path="month" element={<PeriodView interval="monthly" />} />
                <Route path="year" element={<PeriodView interval="yearly" />} />
                <Route path="review" element={<ReviewView />} />
                <Route path="settings/*" element={<SettingsView />} />
              </Route>
            </Route>

            <Route path="/login" element={<Navigate to="/signin" replace />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
