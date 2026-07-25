import { Box, Button, Typography } from "@mui/material";

export default function EmptyState({ title, body, actionLabel, onAction }) {
  return (
    <Box
      sx={{
        py: 20,
        px: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        textAlign: "center",
      }}
    >
      {/* An empty stave: the chart before anything is written on it. */}
      <Box aria-hidden sx={{ width: "min(200px, 60%)", mb: 2 }}>
        {[0, 1, 2, 3].map((line) => (
          <Box key={line} sx={{ height: 1, bgcolor: "chart.empty", mb: 2 }} />
        ))}
      </Box>

      <Typography variant="h3" sx={{ color: "text.primary" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: "44ch" }}>
        {body}
      </Typography>
      {actionLabel && (
        <Button variant="outlined" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
