import { Link as RouterLink } from "react-router";
import { Box, Button, Container, Typography } from "@mui/material";

export default function NotFoundView() {
  return (
    <Container maxWidth="sm" sx={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
      <Box sx={{ py: 12 }}>
        <Typography variant="overline" sx={{ color: "chart.vermilion", display: "block", mb: 3 }}>
          Nothing here
        </Typography>
        <Typography variant="h2" sx={{ mb: 3 }}>
          That page isn&apos;t part of the chart
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 8 }}>
          The link may be old, or the address slightly off.
        </Typography>
        <Button component={RouterLink} to="/" variant="outlined">
          Back to today
        </Button>
      </Box>
    </Container>
  );
}
