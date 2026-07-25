import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, Navigate, useLocation } from "react-router";
import { Box, Button, Container, Link, TextField, Typography } from "@mui/material";
import { clearError, selectAuthError, selectAuthStatus, selectUser, signIn } from "../features/auth/authSlice";

export default function SignInView() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [email, setEmail] = useState(() => localStorage.getItem("activity.lastEmail") || "");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const submitting = status === "submitting";

  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!email.trim() || !password) return;
    const result = await dispatch(signIn({ email: email.trim(), password }));
    // Only remember the address once it actually worked.
    if (signIn.fulfilled.match(result)) localStorage.setItem("activity.lastEmail", email.trim());
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
      <Box component="form" onSubmit={submit} sx={{ width: "100%", py: 12 }}>
        <Typography variant="overline" sx={{ color: "chart.vermilion", display: "block", mb: 3 }}>
          Activity Tracker
        </Typography>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Sign in
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 8 }}>
          Pick up where your record left off.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) dispatch(clearError());
            }}
            error={touched && !email.trim()}
            helperText={touched && !email.trim() ? "Enter your email" : " "}
            fullWidth
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) dispatch(clearError());
            }}
            error={touched && !password}
            helperText={touched && !password ? "Enter your password" : " "}
            fullWidth
          />

          {error && (
            <Typography role="alert" variant="body2" sx={{ color: "chart.vermilion" }}>
              {error}
            </Typography>
          )}

          <Button type="submit" variant="contained" disabled={submitting} size="large">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: "text.secondary", mt: 8 }}>
          No account yet?{" "}
          <Link component={RouterLink} to="/signup" sx={{ color: "chart.vermilion" }}>
            Create one
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
