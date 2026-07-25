import { Component } from "react";
import { Box, Button, Typography } from "@mui/material";

/** Stops a single render throw from blanking the whole app. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          p: 6,
          textAlign: "center",
        }}
      >
        <Typography variant="overline" sx={{ color: "chart.vermilion" }}>
          Something broke
        </Typography>
        <Typography variant="h3">This screen stopped responding</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: "48ch" }}>
          Your recorded progress is safe on the server — nothing was lost. Reloading usually clears it.
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Box>
    );
  }
}
