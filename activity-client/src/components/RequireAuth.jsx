import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";
import { Box, CircularProgress, Typography } from "@mui/material";
import { selectAuthStatus, selectUser } from "../features/auth/authSlice";

export default function RequireAuth() {
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
  const location = useLocation();

  // "idle"/"restoring" means we have not finished checking yet. Rendering the
  // sign-in screen here would flash it on every reload for a signed-in user.
  if (status === "idle" || status === "restoring") {
    return (
      <Box
        role="status"
        aria-live="polite"
        sx={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <CircularProgress size={22} thickness={5} sx={{ color: "chart.vermilion" }} />
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Signing you in
        </Typography>
      </Box>
    );
  }

  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
