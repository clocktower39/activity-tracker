import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, Navigate } from "react-router";
import { Box, Button, Container, Link, TextField, Typography } from "@mui/material";
import { clearError, selectAuthError, selectAuthStatus, selectUser, signUp } from "../features/auth/authSlice";

export default function SignUpView() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [touched, setTouched] = useState(false);

  const submitting = status === "submitting";
  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) dispatch(clearError());
  };

  // Every rule the server enforces is checked here too, so the user finds out
  // before a round trip rather than after one.
  const problems = {
    firstName: !form.firstName.trim() ? "Required" : null,
    lastName: !form.lastName.trim() ? "Required" : null,
    email: !form.email.trim()
      ? "Required"
      : !/^\S+@\S+\.\S+$/.test(form.email.trim())
        ? "That doesn't look like an email"
        : null,
    password: !form.password
      ? "Required"
      : form.password.length < 8
        ? "At least 8 characters"
        : null,
    confirm: form.confirm !== form.password ? "Passwords don't match" : null,
  };
  const valid = Object.values(problems).every((problem) => problem === null);

  if (user) return <Navigate to="/" replace />;

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!valid) return;
    dispatch(
      signUp({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    );
  };

  const field = (name, label, type = "text", autoComplete) => (
    <TextField
      label={label}
      type={type}
      autoComplete={autoComplete}
      value={form[name]}
      onChange={set(name)}
      error={touched && Boolean(problems[name])}
      helperText={(touched && problems[name]) || " "}
      fullWidth
    />
  );

  return (
    <Container maxWidth="xs" sx={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
      <Box component="form" onSubmit={submit} sx={{ width: "100%", py: 12 }}>
        <Typography variant="overline" sx={{ color: "chart.vermilion", display: "block", mb: 3 }}>
          Activity Tracker
        </Typography>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Start a record
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 8 }}>
          One tap a day is all it takes to begin.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Box sx={{ display: "flex", gap: 4 }}>
            {field("firstName", "First name", "text", "given-name")}
            {field("lastName", "Last name", "text", "family-name")}
          </Box>
          {field("email", "Email", "email", "username")}
          {field("password", "Password", "password", "new-password")}
          {field("confirm", "Confirm password", "password", "new-password")}

          {error && (
            <Typography role="alert" variant="body2" sx={{ color: "chart.vermilion" }}>
              {error}
            </Typography>
          )}

          <Button type="submit" variant="contained" disabled={submitting} size="large">
            {submitting ? "Creating…" : "Create account"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: "text.secondary", mt: 8 }}>
          Already have one?{" "}
          <Link component={RouterLink} to="/signin" sx={{ color: "chart.vermilion" }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
