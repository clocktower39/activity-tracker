import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import { clearToast, selectToast } from "../features/ui/uiSlice";

/**
 * A status line, not a dialog. A failed tap should be legible without blocking
 * the next one.
 */
export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => dispatch(clearToast()), 4000);
    return () => clearTimeout(timer);
  }, [dispatch, toast]);

  if (!toast) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 76,
        zIndex: 20,
        maxWidth: "min(92vw, 40rem)",
        px: 4,
        py: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: toast.tone === "error" ? "chart.vermilion" : "divider",
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" sx={{ color: "text.primary" }}>
        {toast.message}
      </Typography>
    </Box>
  );
}
