import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { createGoal, removeGoal, saveGoal, selectCategories } from "../features/goals/goalsSlice";
import { showToast } from "../features/ui/uiSlice";
import { INTERVAL_OPTIONS } from "../lib/periods";

const blank = {
  task: "",
  category: "",
  defaultTarget: "1",
  interval: "daily",
  trackingMode: "target",
  hidden: false,
};

const toForm = (goal) =>
  goal
    ? {
        task: goal.task ?? "",
        category: goal.category ?? "",
        defaultTarget: String(goal.defaultTarget ?? 1),
        interval: goal.interval ?? "daily",
        trackingMode: goal.trackingMode === "more" ? "more" : "target",
        hidden: Boolean(goal.hidden),
      }
    : blank;

export default function GoalFormDialog({ open, goal = null, onClose, onDeleted }) {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);

  const [form, setForm] = useState(() => toForm(goal));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reseed whenever the dialog opens, so it never shows a previous goal's values.
  useEffect(() => {
    if (open) {
      setForm(toForm(goal));
      setErrors({});
      setConfirmDelete(false);
    }
  }, [open, goal]);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const next = {};
    if (!form.task.trim()) next.task = "Give it a name";
    if (!form.category.trim()) next.category = "Pick or type a category";
    const target = Number(form.defaultTarget);
    if (!Number.isFinite(target) || target < 0) next.defaultTarget = "Must be 0 or more";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      task: form.task.trim(),
      category: form.category.trim(),
      defaultTarget: Number(form.defaultTarget),
      interval: form.interval,
      trackingMode: form.trackingMode,
      hidden: form.hidden,
    };

    try {
      if (goal) await dispatch(saveGoal({ id: goal._id, patch: payload })).unwrap();
      else await dispatch(createGoal(payload)).unwrap();
      onClose();
    } catch (err) {
      dispatch(showToast({ message: err.message || "Couldn't save that goal", tone: "error", id: Date.now() }));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setSaving(true);
    try {
      await dispatch(removeGoal(goal._id)).unwrap();
      dispatch(showToast({ message: `Deleted "${goal.task}" and its history`, id: Date.now() }));
      onDeleted?.();
    } catch (err) {
      dispatch(showToast({ message: err.message || "Couldn't delete that goal", tone: "error", id: Date.now() }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="goal-form-title">
      <DialogTitle id="goal-form-title" sx={{ px: 6, pt: 6, pb: 2 }}>
        <Typography variant="overline" sx={{ color: "chart.vermilion", display: "block", mb: 2 }}>
          {goal ? "Edit" : "New goal"}
        </Typography>
        <Typography variant="h3">{goal ? goal.task : "What do you want to track?"}</Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 6, display: "flex", flexDirection: "column", gap: 5, pt: 4 }}>
        <TextField
          label="Task"
          value={form.task}
          onChange={(event) => set("task")(event.target.value)}
          error={Boolean(errors.task)}
          helperText={errors.task}
          autoFocus={!goal}
          fullWidth
        />

        <Autocomplete
          freeSolo
          options={categories.map((cat) => cat.category)}
          value={form.category}
          onInputChange={(_event, value) => set("category")(value ?? "")}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Category"
              error={Boolean(errors.category)}
              helperText={errors.category || "Type a new name to create one"}
            />
          )}
        />

        <Box sx={{ display: "flex", gap: 4 }}>
          <TextField
            label="Target"
            type="number"
            value={form.defaultTarget}
            onChange={(event) => set("defaultTarget")(event.target.value)}
            error={Boolean(errors.defaultTarget)}
            helperText={errors.defaultTarget}
            inputProps={{ min: 0, inputMode: "numeric" }}
            sx={{ flex: 1 }}
          />
          <TextField
            select
            label="Cadence"
            value={form.interval}
            onChange={(event) => set("interval")(event.target.value)}
            sx={{ flex: 1 }}
          >
            {INTERVAL_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <TextField
          select
          label="Going past the target"
          value={form.trackingMode}
          onChange={(event) => set("trackingMode")(event.target.value)}
          helperText={
            form.trackingMode === "more"
              ? "Extra keeps counting and earns a mark — f, ff, fff"
              : "Hitting the target is the whole job"
          }
        >
          <MenuItem value="target">Done is done</MenuItem>
          <MenuItem value="more">More is better</MenuItem>
        </TextField>

        {goal && (
          <FormControlLabel
            control={
              <Switch checked={form.hidden} onChange={(event) => set("hidden")(event.target.checked)} />
            }
            label={
              <Typography variant="body2">
                Hide from the chart{" "}
                <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
                  — keeps its history
                </Typography>
              </Typography>
            }
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 6, pb: 6, pt: 4, gap: 2 }}>
        {goal && !confirmDelete && (
          <Button
            onClick={() => setConfirmDelete(true)}
            sx={{ color: "chart.vermilion", mr: "auto" }}
            disabled={saving}
          >
            Delete
          </Button>
        )}
        {goal && confirmDelete && (
          <Box sx={{ mr: "auto", display: "flex", alignItems: "center", gap: 3 }}>
            <Typography variant="body2" sx={{ color: "chart.vermilion" }}>
              Delete this and all its history?
            </Typography>
            <Button onClick={doDelete} disabled={saving} sx={{ color: "chart.vermilion" }}>
              Yes, delete
            </Button>
            <Button onClick={() => setConfirmDelete(false)} sx={{ color: "text.secondary" }}>
              Keep
            </Button>
          </Box>
        )}

        <Button onClick={onClose} disabled={saving} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving} variant="contained">
          {saving ? "Saving…" : goal ? "Save changes" : "Add goal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
