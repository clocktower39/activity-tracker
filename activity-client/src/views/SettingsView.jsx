import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import {
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { normalizeWeekStart, todayKey, WEEK_DAYS } from "../lib/periods";
import { selectThemeMode, setThemeMode, showToast } from "../features/ui/uiSlice";

/**
 * Settings as an index and a body rather than one long scroll.
 *
 * The tree on the left is the whole map of the page — three folders, eight
 * leaves — so what exists is visible without scrolling to find out. Each panel
 * on the right collapses, and picking a leaf opens that one and closes the
 * rest, which keeps the body roughly one screen whatever you are doing.
 *
 * The open panel is in the URL (`?s=`), so a section can be linked to and the
 * back button walks between them, as everywhere else in this app.
 */

const GROUPS = [
  { id: "preferences", label: "Preferences", items: ["appearance", "week-start"] },
  { id: "account", label: "Account", items: ["profile", "password", "session"] },
  { id: "goals", label: "Goals", items: ["categories", "hidden"] },
];

const SECTIONS = {
  appearance: {
    label: "Appearance",
    description: "Dark suits the evening catch-up; light reads better in daylight.",
  },
  "week-start": {
    label: "Start of the week",
    description:
      "Decides where weekly goals bucket, and where the bar lines fall in the week and month views. Changing it moves any weekly progress you have already recorded onto the new boundary.",
  },
  profile: { label: "Your details" },
  password: { label: "Password" },
  session: { label: "Session" },
  categories: {
    label: "Categories",
    description:
      "Goals are grouped by these, in this order — on Today, and down the side of the week, month and year charts. Drag a row by its handle to reorder, or focus the handle and use the arrow keys.",
  },
  hidden: {
    label: "Hidden goals",
    description: "These keep their history but stay off the chart. Bring one back whenever you like.",
  },
};

const DEFAULT_SECTION = "appearance";

export default function SettingsView() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);
  const categories = useSelector(selectCategories);
  const hiddenGoals = useSelector(selectHiddenGoals);
  const allGoals = useSelector(selectAllGoals);

  const [searchParams, setSearchParams] = useSearchParams();
  const focused = SECTIONS[searchParams.get("s")] ? searchParams.get("s") : DEFAULT_SECTION;

  // Panels the user has opened by hand, on top of the focused one. Picking from
  // the tree resets this, which is what makes the tree feel like navigation
  // rather than a second set of toggles.
  const [alsoOpen, setAlsoOpen] = useState(() => new Set());
  const panelRefs = useRef({});

  // Folders start open beside the content and closed above it. On a phone the
  // tree stacks on top, and left open it filled the first screen so every
  // setting sat below the fold — the opposite of easy to navigate. Only the
  // folders the user has actually toggled override this.
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const [groupOverrides, setGroupOverrides] = useState({});
  const groupExpanded = (id) => groupOverrides[id] ?? !compact;

  const isOpen = useCallback(
    (id) => id === focused || alsoOpen.has(id),
    [focused, alsoOpen]
  );

  const focus = useCallback(
    (id) => {
      setAlsoOpen(new Set());
      setSearchParams(id === DEFAULT_SECTION ? {} : { s: id }, { replace: true });
      if (compact) setGroupOverrides({});
    },
    [setSearchParams, compact]
  );

  // Bring the focused panel into view — on click, and equally when arriving on
  // a ?s= link, which otherwise opened the right panel somewhere below the fold.
  // Only when a section was actually named: the default one is already at top.
  const requested = searchParams.get("s");
  useEffect(() => {
    if (!requested || !SECTIONS[requested]) return;
    const node = panelRefs.current[requested];
    if (!node) return;
    // Let the panel expand before scrolling to where it ends up.
    const id = requestAnimationFrame(() =>
      node.scrollIntoView({ behavior: "smooth", block: "start" })
    );
    return () => cancelAnimationFrame(id);
  }, [requested]);

  const togglePanel = useCallback(
    (id) => {
      if (id === focused) {
        // Closing the focused panel: hand focus to nothing rather than leaving
        // a highlighted tree item with a closed body.
        setSearchParams({ s: "none" }, { replace: true });
        return;
      }
      setAlsoOpen((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [focused, setSearchParams]
  );

  const toggleGroup = (id) =>
    setGroupOverrides((prev) => ({ ...prev, [id]: !groupExpanded(id) }));

  const bodies = useMemo(
    () => ({
      appearance: (
        <AppearanceSection themeMode={themeMode} onChange={(mode) => dispatch(setThemeMode(mode))} />
      ),
      "week-start": <WeekStartSection user={user} />,
      profile: <ProfileSection user={user} />,
      password: <PasswordSection isDemo={user?.isDemo} />,
      session: (
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
      ),
      categories: <CategoriesSection categories={categories} goals={allGoals} />,
      hidden: <HiddenSection goals={hiddenGoals} />,
    }),
    [dispatch, themeMode, user, categories, allGoals, hiddenGoals]
  );

  return (
    <Container maxWidth="lg" sx={{ pt: 8 }}>
      <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
        Settings
      </Typography>
      <Typography variant="h2" sx={{ mb: 8 }}>
        {user?.firstName ? `${user.firstName}'s setup` : "Your setup"}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 5, md: 10 } }}>
        <Box
          component="nav"
          aria-label="Settings sections"
          sx={{
            flex: { md: "0 0 208px" },
            alignSelf: "flex-start",
            position: { md: "sticky" },
            top: { md: 88 },
            width: "100%",
          }}
        >
          {GROUPS.map((group) => {
            const collapsed = !groupExpanded(group.id);
            return (
              <Box key={group.id} sx={{ mb: 4 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!collapsed}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                    minHeight: 32,
                    px: 0,
                    border: 0,
                    bgcolor: "transparent",
                    cursor: "pointer",
                    color: "text.secondary",
                    fontFamily: (t) => t.typography.overline.fontFamily,
                    fontSize: (t) => t.typography.overline.fontSize,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  {collapsed ? (
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 16 }} />
                  )}
                  {group.label}
                </Box>
                <Box sx={{ height: 1, bgcolor: "divider", mt: 1 }} />

                <Collapse in={!collapsed}>
                  <Box sx={{ pt: 1 }}>
                    {group.items.map((id) => {
                      const active = id === focused;
                      return (
                        <Box
                          key={id}
                          component="button"
                          type="button"
                          onClick={() => focus(id)}
                          aria-current={active ? "true" : undefined}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            minHeight: 36,
                            textAlign: "left",
                            border: 0,
                            // A bar line marks the current item, the same marker
                            // the cadence switcher uses.
                            borderLeft: "2px solid",
                            borderColor: active ? "chart.vermilion" : "transparent",
                            pl: 3,
                            bgcolor: "transparent",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: "0.8125rem",
                            color: active ? "chart.vermilion" : "text.primary",
                            "&:hover": { color: active ? "chart.vermilion" : "chart.brass" },
                          }}
                        >
                          {SECTIONS[id].label}
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {GROUPS.flatMap((group) => group.items).map((id) => (
            <Panel
              key={id}
              id={id}
              title={SECTIONS[id].label}
              description={SECTIONS[id].description}
              open={isOpen(id)}
              onToggle={() => togglePanel(id)}
              innerRef={(node) => {
                panelRefs.current[id] = node;
              }}
            >
              {bodies[id]}
            </Panel>
          ))}
        </Box>
      </Box>
    </Container>
  );
}

function Panel({ id, title, description, open, onToggle, innerRef, children }) {
  return (
    <Box component="section" ref={innerRef} sx={{ mb: 6, scrollMarginTop: 88 }}>
      <Box
        component="button"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          width: "100%",
          minHeight: 44,
          px: 0,
          border: 0,
          bgcolor: "transparent",
          cursor: "pointer",
          color: open ? "text.primary" : "text.secondary",
          fontFamily: (t) => t.typography.overline.fontFamily,
          fontSize: (t) => t.typography.overline.fontSize,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          "&:hover": { color: "text.primary" },
        }}
      >
        {open ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
        {title}
      </Box>
      <Box sx={{ height: 2, bgcolor: open ? "chart.rule" : "divider", mb: 4 }} />

      <Collapse in={open} unmountOnExit>
        <Box id={`panel-${id}`} sx={{ pb: 6 }}>
          {description && (
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 5, maxWidth: "60ch" }}>
              {description}
            </Typography>
          )}
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

function AppearanceSection({ themeMode, onChange }) {
  return (
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
      // Sending the local date keeps the re-bucketing from pushing this week's
      // progress into a week that has not started here yet.
      const result = await dispatch(updateProfile({ weekStart: next, today: todayKey() })).unwrap();
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
    <>
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
    </>
  );
}

function CategoriesSection({ categories, goals }) {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState("");
  const [saving, setSaving] = useState(false);
  // { key, from } while a row is being dragged, so the row can be dimmed and
  // the commit skipped when nothing actually moved.
  const [dragging, setDragging] = useState(null);

  const rowNodes = useRef([]);
  const latestRows = useRef([]);
  useEffect(() => {
    latestRows.current = rows;
  }, [rows]);

  // Resync whenever the store changes, so an edit elsewhere is never clobbered.
  // `key` is the persisted name, held separately from the editable one: keying a
  // row by its live value remounts the field on every keystroke and drops focus,
  // and would make a dragged row lose its identity mid-drag.
  useEffect(() => {
    setRows(categories.map((cat) => ({ ...cat, key: cat.category })));
  }, [categories]);

  const countFor = (name) => goals.filter((goal) => goal.category === name).length;

  const commit = async (next) => {
    setSaving(true);
    try {
      // Built explicitly rather than spread: `key` is a client-side identity for
      // React and drag tracking, and has no business being persisted.
      await dispatch(
        saveCategories(
          next.map((row, index) => ({ category: row.category, color: row.color ?? null, order: index }))
        )
      ).unwrap();
    } catch (err) {
      dispatch(showToast({ message: err.message || "Couldn't save categories", tone: "error", id: Date.now() }));
      setRows(categories.map((cat) => ({ ...cat, key: cat.category })));
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
      setRows(categories.map((cat) => ({ ...cat, key: cat.category })));
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

  /**
   * Category order is the order goals are grouped in on every view, so this is a
   * real setting rather than decoration.
   *
   * Dragging runs on Pointer Events, so mouse, touch and pen are one code path
   * and no drag library is needed for a list this size. The handle is also a
   * keyboard control — focus it and use the arrow keys — because a drag that is
   * the only way to reorder is unusable without a pointer.
   */
  const moveTo = (from, to) => {
    if (to < 0 || to >= rows.length || to === from) return null;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    return next;
  };

  const onHandleDown = (index) => (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging({ key: rows[index].key, from: index, pointerId: event.pointerId });
  };

  const onHandleMove = (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    const current = latestRows.current.findIndex((row) => row.key === dragging.key);
    if (current === -1) return;

    // Land where the pointer is, by row midpoint, so the list reorders under
    // the finger rather than after it is lifted.
    const y = event.clientY;
    const over = rowNodes.current.findIndex((node) => {
      if (!node) return false;
      const box = node.getBoundingClientRect();
      return y >= box.top && y <= box.bottom;
    });
    if (over === -1 || over === current) return;
    moveTo(current, over);
  };

  const endDrag = (event) => {
    if (!dragging) return;
    if (event?.pointerId !== undefined) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    const landed = latestRows.current.findIndex((row) => row.key === dragging.key);
    setDragging(null);
    // Only write when the order actually changed.
    if (landed !== -1 && landed !== dragging.from) commit(latestRows.current);
  };

  const cancelDrag = () => {
    if (!dragging) return;
    setDragging(null);
    setRows(categories.map((cat) => ({ ...cat, key: cat.category })));
  };

  const onHandleKeyDown = (index) => (event) => {
    const delta = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = moveTo(index, index + delta);
    if (next) commit(next);
  };

  const add = () => {
    const name = adding.trim();
    if (!name) return;
    if (rows.some((row) => row.category.toLowerCase() === name.toLowerCase())) {
      dispatch(showToast({ message: "That category already exists", tone: "error", id: Date.now() }));
      return;
    }
    setAdding("");
    commit([...rows, { category: name, order: rows.length, color: null, key: name }]);
  };

  return (
    <>
      {rows.map((row, index) => {
        const isDragging = dragging?.key === row.key;
        return (
          <Box
            key={row.key}
            ref={(node) => {
              rowNodes.current[index] = node;
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              // A bar line marks the row in hand, the same marker used for the
              // current cadence and the current settings section.
              borderLeft: "2px solid",
              borderLeftColor: isDragging ? "chart.vermilion" : "transparent",
              pl: 2,
              bgcolor: isDragging ? "background.paper" : "transparent",
              opacity: dragging && !isDragging ? 0.55 : 1,
              transition: "opacity 120ms linear",
            }}
          >
            <Box
              role="button"
              tabIndex={0}
              aria-label={`Reorder ${row.category}, position ${index + 1} of ${rows.length}. Use the arrow keys to move it.`}
              onPointerDown={onHandleDown(index)}
              onPointerMove={onHandleMove}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onKeyDown={onHandleKeyDown(index)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                flexShrink: 0,
                cursor: dragging ? "grabbing" : "grab",
                color: isDragging ? "chart.vermilion" : "text.secondary",
                // Claim the gesture, or the browser scrolls the page instead of
                // letting the row be dragged.
                touchAction: "none",
                "&:hover": { color: "text.primary" },
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>

            <Typography
              variant="overline"
              sx={{ color: "text.secondary", width: 20, flexShrink: 0 }}
              aria-hidden
            >
              {index + 1}
            </Typography>

            <TextField
              value={row.category}
              onChange={(event) =>
                setRows((prev) => prev.map((item, i) => (i === index ? { ...item, category: event.target.value } : item)))
              }
              onBlur={(event) => rename(index, event.target.value)}
              variant="standard"
              sx={{ flexGrow: 1, minWidth: 0 }}
              inputProps={{ "aria-label": `Category name, position ${index + 1} of ${rows.length}` }}
            />

            {/* Goal counts are context, not a control; the first thing to give
                up room when the row gets tight. */}
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", display: { xs: "none", sm: "block" }, flexShrink: 0 }}
            >
              {countFor(row.category)} goals
            </Typography>

            <IconButton
              onClick={() => remove(index)}
              aria-label={`Delete ${row.category}`}
              disabled={saving || Boolean(dragging)}
              sx={{ width: 44, height: 44, flexShrink: 0 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}

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
    </>
  );
}

function HiddenSection({ goals }) {
  const dispatch = useDispatch();

  if (goals.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Nothing is hidden.
      </Typography>
    );
  }

  return goals.map((goal) => (
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
      <Button size="small" onClick={() => dispatch(saveGoal({ id: goal._id, patch: { hidden: false } }))}>
        Unhide
      </Button>
    </Box>
  ));
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
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        The demo account&apos;s password is shared, so it can&apos;t be changed.
      </Typography>
    );
  }

  return (
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
  );
}
