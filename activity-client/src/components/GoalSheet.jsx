import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/EditOutlined";
import GoalFormDialog from "./GoalFormDialog";
import PeriodBars from "./PeriodBars";
import { fetchRange, recordProgress } from "../features/history/historySlice";
import { useAutoFetch } from "../hooks/useAutoFetch";
import {
  addPeriods,
  dayjs,
  entryKey,
  getPeriodKey,
  periodLabel,
  progressState,
} from "../lib/periods";

const HISTORY_PERIODS = 14;

/**
 * Everything a ring cannot hold: exact adjustment, a note, and the recent run of
 * periods. Reached by long press or by Enter on the ring.
 */
export default function GoalSheet({ goal, date, onClose }) {
  const dispatch = useDispatch();
  const entries = useSelector((state) => state.history.entries);
  const [editing, setEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(null);

  const open = Boolean(goal);

  // Trailing window for the bar chart, fetched once and cached.
  const range = useMemo(() => {
    if (!goal) return null;
    const to = getPeriodKey(goal.interval, date);
    const from = addPeriods(goal.interval, to, -(HISTORY_PERIODS - 1)).format("YYYY-MM-DD");
    return { from, to, interval: goal.interval, goalId: goal._id };
  }, [goal, date]);

  useAutoFetch(() => (range ? dispatch(fetchRange(range)) : undefined), [range?.from, range?.to, range?.goalId]);

  const entry = goal ? entries[entryKey(goal._id, goal.interval, date)] : null;
  const achieved = entry?.achieved ?? 0;
  const target = entry?.target ?? (Number(goal?.defaultTarget) || 0);
  const note = noteDraft ?? entry?.note ?? "";

  const adjust = useCallback(
    (delta) => {
      if (!goal) return;
      if (delta < 0 && achieved <= 0) return;
      dispatch(recordProgress({ goal, date, delta }));
    },
    [dispatch, goal, date, achieved]
  );

  const saveNote = useCallback(() => {
    if (!goal || noteDraft === null || noteDraft === (entry?.note ?? "")) return;
    dispatch(recordProgress({ goal, date, delta: 0, achieved, note: noteDraft }));
    setNoteDraft(null);
  }, [dispatch, goal, date, achieved, noteDraft, entry]);

  const series = useMemo(() => {
    if (!goal || !range) return [];
    const out = [];
    let cursor = dayjs.utc(range.from);
    const end = dayjs.utc(range.to);
    let guard = 0;
    while (!cursor.isAfter(end) && guard < 60) {
      const key = getPeriodKey(goal.interval, cursor);
      const row = entries[entryKey(goal._id, goal.interval, cursor)];
      out.push({
        key,
        achieved: row?.achieved ?? 0,
        target: row?.target ?? (Number(goal.defaultTarget) || 0),
        current: key === getPeriodKey(goal.interval, date),
      });
      cursor = addPeriods(goal.interval, cursor, 1);
      guard += 1;
    }
    return out;
  }, [goal, range, entries, date]);

  const handleClose = () => {
    setNoteDraft(null);
    onClose();
  };

  if (!goal) return null;

  const state = progressState(achieved, target, goal.trackingMode);

  return (
    <>
      <Dialog
        open={open && !editing}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby="goal-sheet-title"
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, p: 6, pb: 4 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                {goal.category} · {periodLabel(goal.interval, date)}
              </Typography>
              <Typography id="goal-sheet-title" variant="h3" sx={{ wordBreak: "break-word" }}>
                {goal.task}
              </Typography>
            </Box>
            <IconButton onClick={() => setEditing(true)} aria-label="Edit this goal" size="small">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={handleClose} aria-label="Close" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ height: 1, bgcolor: "divider" }} />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              py: 8,
            }}
          >
            <IconButton
              onClick={() => adjust(-1)}
              disabled={achieved <= 0}
              aria-label={`Remove one from ${goal.task}`}
              sx={{ border: "1px solid", borderColor: "divider", width: 48, height: 48 }}
            >
              <RemoveIcon />
            </IconButton>

            <Box sx={{ textAlign: "center", minWidth: 120 }}>
              <Typography
                sx={{
                  fontFamily: (t) => t.typography.h1.fontFamily,
                  fontSize: "3rem",
                  lineHeight: 1,
                  fontWeight: 500,
                  color:
                    state === "complete"
                      ? "chart.brass"
                      : state === "over"
                        ? "chart.ultramarine"
                        : state === "partial"
                          ? "chart.vermilion"
                          : "text.secondary",
                }}
              >
                {achieved}
              </Typography>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                of {target}
              </Typography>
            </Box>

            <IconButton
              onClick={() => adjust(1)}
              aria-label={`Add one to ${goal.task}`}
              sx={{ border: "1px solid", borderColor: "divider", width: 48, height: 48 }}
            >
              <AddIcon />
            </IconButton>
          </Box>

          <Box sx={{ px: 6, pb: 6 }}>
            <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 3 }}>
              Last {series.length} {goal.interval === "daily" ? "days" : "periods"}
            </Typography>
            <PeriodBars series={series} interval={goal.interval} trackingMode={goal.trackingMode} />
          </Box>

          <Box sx={{ height: 1, bgcolor: "divider" }} />

          <Box sx={{ p: 6 }}>
            <TextField
              label="Note"
              placeholder="Anything worth remembering about this one"
              fullWidth
              multiline
              minRows={2}
              value={note}
              onChange={(event) => setNoteDraft(event.target.value)}
              onBlur={saveNote}
              inputProps={{ maxLength: 2000 }}
            />
            {noteDraft !== null && noteDraft !== (entry?.note ?? "") && (
              <Button onClick={saveNote} size="small" sx={{ mt: 3 }}>
                Save note
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <GoalFormDialog
        open={editing}
        goal={goal}
        onClose={() => setEditing(false)}
        onDeleted={() => {
          setEditing(false);
          handleClose();
        }}
      />
    </>
  );
}
