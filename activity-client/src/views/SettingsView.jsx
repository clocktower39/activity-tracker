import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Container,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import {
  changePassword,
  selectUser,
  signedOut,
  updateProfile,
} from "../features/auth/authSlice";
import {
  renameCategory,
  saveCategories,
  saveGoal,
  selectAllGoals,
  selectCategories,
  selectHiddenGoals,
} from "../features/goals/goalsSlice";
import { invalidate, resetHistory } from "../features/history/historySlice";
import { normalizeWeekStart, WEEK_DAYS } from "../lib/periods";
import { selectThemeMode, setThemeMode, showToast } from "../features/ui/uiSlice";

const Section = ({ title, description, children }) => (
  <Box component="section" sx={{ mb: 12 }}>
    <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
      {title}
    </Typography>
    <Box sx={{ height: 2, bgcolor: "divider", mb: 4 }} />
    {description && (
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 5, maxWidth: "60ch" }}>
        {description}
      </Typography>
    )}
    {children}
  </Box>
);

export default function SettingsView() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const categories = useSelector(selectCategories);
  const hiddenGoals = useSelector(selectHiddenGoals);
  const allGoals = useSelector(selectAllGoals);

  return (
    <Container maxWidth="md" sx={{ pt: 8 }}>
      <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
        Settings
      </Typography>
      <Typography variant="h2" sx={{ mb: 10 }}>
        {user?.firstName ? `${user.firstName}'s setup` : "Your setup"}
      </Typography>

      <AppearanceSection themeMode={themeMode} onChange={(mode) => dispatch(setThemeMode(mode))} />
      <WeekStartSection user={user} />
      <ProfileSection user={user} />
      <CategoriesSection categories={categories} goals={allGoals} />
      <HiddenSection goals={hiddenGoals} />
      <PasswordSection isDemo={user?.isDemo} />

      <Section title="Session">
        <Button
          variant="outlined"
          onClick={() => {
            dispatch(resetHistory());
            dispatch(signedOut());
          }}
          sx={{ color: "chart.vermilion", borderColor: "chart.vermilion" }}
        >
          Sign out
        </Button>
      </Section>
    </Container>
  );
}

function AppearanceSection({ themeMode, onChange }) {
  return (
    <Section title="Appearance" description="Dark suits the evening catch-up; light reads better in daylight.">
      <TextField
        select
        label="Theme"
        value={themeMode}
        onChange={(event) => onChange(event.target.value)}
        sx={{ minWidth: 220 }}
      >
        <MenuItem value="dark">Dark</MenuItem>
        <MenuItem value="light">Light</MenuItem>
        <MenuItem value="system">Match my device</MenuItem>
      </TextField>
    </Section>
  );
}

function WeekStartSection({ user }) {
  const dispatch = useDispatch();
  const current = normalizeWeekStart(user?.weekStart);
  const [saving, setSaving] = useState(false);

  const change = async (value) => {
    const next = Number(value);
    if (next === current) return;
    setSaving(true);
    try {
      const result = await dispatch(updateProfile({ weekStart: next })).unwrap();
      // Weekly history is re-bucketed server-side, so anything already fetched
      // is keyed to the old boundary and has to be dropped.
      dispatch(invalidate());
      dispatch(resetHistory());
      const moved = result?.rebucketed?.moved ?? 0;
      const merged = result?.rebucketed?.merged ?? 0;
      dispatch(
        showToast({
          message: moved
            ? `Weeks now start on ${WEEK_DAYS[next].label}. ${moved} weekly ${
                moved === 1 ? "entry" : "entries"
              } moved${merged ? `, ${merged} merged` : ""}.`
            : `Weeks now start on ${WEEK_DAYS[next].label}.`,
          id: Date.now(),
        })
      );
    } catch (err) {
      dispatch(
        showToast({ message: err.message || "Couldn't change that", tone: "error", id: Date.now() })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="Start of the week"
      description="Decides where weekly goals bucket, and where the bar lines fall in the week and month views. Changing it moves any weekly progress you have already recorded onto the new boundary."
    >
      <TextField
        select
        label="Weeks begin on"
        value={current}
        onChange={(event) => change(event.target.value)}
        disabled={saving}
        sx={{ minWidth: 220 }}
      >
        {WEEK_DAYS.map((day) => (
          <MenuItem key={day.value} value={day.value}>
            {day.label}
          </MenuItem>
        ))}
      </TextField>
    </Section>
  );
}

function ProfileSection({ user }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" });
  }, [user]);

  const dirty =
    form.firstName !== (user?.firstName ?? "") || form.lastName !== (user?.lastName ?? "");

  const save = async () => {
    setSaving(true);
    try {
      await dispatch(updateProfile(form)).unwrap();
      dispatch(showToast({ message: "Saved", id: Date.now() }));
    } catch (err) {
      dispatch(showToast({ message: err.message || "Couldn't save", tone: "error", id: Date.now() }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Account">
      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", mb: 4 }}>
        <TextField
          label="First name"
          value={form.firstName}
          onChange={(event) => setForm((p) => ({ ...p, firstName: event.target.value }))}
        />
        <TextField
          label="Last name"
          value={form.lastName}
          onChange={(event) => setForm((p) => ({ ...p, lastName: event.target.value }))}
        />
        <TextField label="Email" value={user?.email ?? ""} disabled helperText="Email can't be changed here" />
      </Box>
      <Box sx={{ display: "flex", gap: 3 }}>
        <Button variant="contained" onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {dirty && (
          <Button
            onClick={() => setForm({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" })}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
        )}
      </Box>
    </Section>
  );
}

function CategoriesSection({ categories, goals }) {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState("");
  const [saving, setSaving] = useState(false);

  // Resync whenever the store changes, so an edit elsewhere is never clobbered.
  useEffect(() => {
    setRows(categories.map((cat) => ({ ...cat })));
  }, [categories]);

  const countFor = (name) => goals.filter((goal) => goal.category === name).length;

  const commit = async (next) => {
    setSaving(true);
    try {
      await dispatch(saveCategories(next.map((row, index) => ({ ...row, order: index })))).unwrap();
    } catch (err) {
      dispatch(showToast({ message: err.message || "Couldn't save categories", tone: "error", id: Date.now() }));
      setRows(categories.map((cat) => ({ ...cat })));
    } finally {
      setSaving(false);
    }
  };

  const rename = async (index, nextName) => {
    const previous = categories[index]?.category;
    if (!previous || !nextName.trim() || previous === nextName.trim()) return;
    try {
      // Renames go through their own endpoint so every goal follows the name.
      await dispatch(renameCategory({ from: previous, to: nextName.trim() })).unwrap();
    } catch (err) {
      dispatch(showToast({ message: err.message || "Couldn't rename", tone: "error", id: Date.now() }));
      setRows(categories.map((cat) => ({ ...cat })));
    }
  };

  const remove = (index) => {
    const row = rows[index];
    const used = countFor(row.category);
    if (used > 0) {
      dispatch(
        showToast({
          message: `${row.category} still holds ${used} goal${used === 1 ? "" : "s"}. Move them first.`,
          tone: "error",
          id: Date.now(),
        })
      );
      return;
    }
    commit(rows.filter((_, i) => i !== index));
  };

  const add = () => {
    const name = adding.trim();
    if (!name) return;
    if (rows.some((row) => row.category.toLowerCase() === name.toLowerCase())) {
      dispatch(showToast({ message: "That category already exists", tone: "error", id: Date.now() }));
      return;
    }
    setAdding("");
    commit([...rows, { category: name, order: rows.length, color: null }]);
  };

  return (
    <Section title="Categories" description="Goals are grouped by these, in this order.">
      {rows.map((row, index) => (
        <Box
          key={`${row.category}-${index}`}
          sx={{ display: "flex", alignItems: "center", gap: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <TextField
            value={row.category}
            onChange={(event) =>
              setRows((prev) => prev.map((item, i) => (i === index ? { ...item, category: event.target.value } : item)))
            }
            onBlur={(event) => rename(index, event.target.value)}
            variant="standard"
            sx={{ flexGrow: 1 }}
            inputProps={{ "aria-label": `Category name ${index + 1}` }}
          />
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            {countFor(row.category)} goals
          </Typography>
          <IconButton
            onClick={() => remove(index)}
            aria-label={`Delete ${row.category}`}
            size="small"
            disabled={saving}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 5 }}>
        <TextField
          placeholder="New category"
          value={adding}
          onChange={(event) => setAdding(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          sx={{ flexGrow: 1, maxWidth: 320 }}
        />
        <Button startIcon={<AddIcon />} onClick={add} disabled={!adding.trim() || saving}>
          Add
        </Button>
      </Box>
    </Section>
  );
}

function HiddenSection({ goals }) {
  const dispatch = useDispatch();

  return (
    <Section
      title="Hidden goals"
      description="These keep their history but stay off the chart. Bring one back whenever you like."
    >
      {goals.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nothing is hidden.
        </Typography>
      ) : (
        goals.map((goal) => (
          <Box
            key={goal._id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              py: 3,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body1">{goal.task}</Typography>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                {goal.category}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => dispatch(saveGoal({ id: goal._id, patch: { hidden: false } }))}
            >
              Unhide
            </Button>
          </Box>
        ))
      )}
    </Section>
  );
}

function PasswordSection({ isDemo }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (form.next.length < 8) return setError("New password must be at least 8 characters");
    if (form.next !== form.confirm) return setError("New passwords don't match");

    setSaving(true);
    try {
      await dispatch(changePassword({ currentPassword: form.current, newPassword: form.next })).unwrap();
      setForm({ current: "", next: "", confirm: "" });
      dispatch(showToast({ message: "Password changed. Other devices were signed out.", id: Date.now() }));
    } catch (err) {
      setError(err.message || "Couldn't change your password");
    } finally {
      setSaving(false);
    }
  };

  if (isDemo) {
    return (
      <Section title="Password">
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          The demo account&apos;s password is shared, so it can&apos;t be changed.
        </Typography>
      </Section>
    );
  }

  return (
    <Section title="Password">
      <Box component="form" onSubmit={submit} sx={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 360 }}>
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={form.current}
          onChange={(event) => setForm((p) => ({ ...p, current: event.target.value }))}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={form.next}
          onChange={(event) => setForm((p) => ({ ...p, next: event.target.value }))}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(event) => setForm((p) => ({ ...p, confirm: event.target.value }))}
        />
        {error && (
          <Typography role="alert" variant="body2" sx={{ color: "chart.vermilion" }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !form.current || !form.next}
          sx={{ alignSelf: "flex-start" }}
        >
          {saving ? "Changing…" : "Change password"}
        </Button>
      </Box>
    </Section>
  );
}
