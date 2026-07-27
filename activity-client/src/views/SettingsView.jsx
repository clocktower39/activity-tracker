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
  Slider,
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
import {
  seedCustomFrom,
  selectCustomPalette,
  selectScale,
  selectThemeId,
  setCustomColor,
  setCustomMode,
  setScale,
  setThemeId,
  showToast,
} from "../features/ui/uiSlice";
import {
  contrastRatio,
  CUSTOM_ID,
  isHex,
  PALETTES,
  resolvePalette,
  TOKENS,
} from "../design/palettes";

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
  { id: "preferences", label: "Preferences", items: ["appearance", "display-size", "week-start"] },
  { id: "account", label: "Account", items: ["profile", "password", "session"] },
  { id: "goals", label: "Goals", items: ["categories", "hidden"] },
];

const SECTIONS = {
  appearance: {
    label: "Theme",
    description:
      "Every theme fills the same ten slots, so the meaning of a colour never changes — only the colour does. Pick one to see its values, or build your own from any of them.",
  },
  "display-size": {
    label: "Display size",
    description:
      "Scales the whole interface, not just the text — so it does the job page zoom does, without the pinching. Smaller fits more rings to a row.",
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
      appearance: <ThemeSection />,
      "display-size": <DisplaySizeSection />,
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
    [dispatch, user, categories, allGoals, hiddenGoals]
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

function ThemeSection() {
  const dispatch = useDispatch();
  const themeId = useSelector(selectThemeId);
  const custom = useSelector(selectCustomPalette);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const active = resolvePalette({ themeId, custom, prefersDark });
  const editing = themeId === CUSTOM_ID;

  const options = [
    ...Object.entries(PALETTES).map(([id, palette]) => ({ id, ...palette })),
    { id: "system", label: "Match my device", note: "Practice Chart, following your device's light or dark setting.", mode: prefersDark ? "dark" : "light" },
    { id: CUSTOM_ID, ...custom, label: "Custom", note: "Your own, built from any theme above." },
  ];

  return (
    <>
      <TextField
        select
        label="Theme"
        value={themeId}
        onChange={(event) => dispatch(setThemeId(event.target.value))}
        sx={{ minWidth: 260, mb: 4 }}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="body2" sx={{ color: "text.secondary", mb: 6, maxWidth: "60ch" }}>
        {options.find((o) => o.id === themeId)?.note}
      </Typography>

      {/* Every slot, with its value. Editable only for Custom — a built-in that
          could be edited in place would stop being the thing it is named. */}
      <Box sx={{ mb: 5 }}>
        {TOKENS.map((token) => (
          <TokenRow
            key={token.key}
            token={token}
            value={active.colors[token.key]}
            ground={active.colors.ground}
            editable={editing}
            onChange={(value) => dispatch(setCustomColor({ key: token.key, value }))}
          />
        ))}
      </Box>

      {editing ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          <TextField
            select
            label="Base mode"
            value={custom.mode}
            onChange={(event) => dispatch(setCustomMode(event.target.value))}
            helperText="Sets how form controls and menus render"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="light">Light</MenuItem>
          </TextField>

          <TextField
            select
            label="Start over from"
            value=""
            onChange={(event) => {
              dispatch(seedCustomFrom(event.target.value));
              dispatch(showToast({ message: `Custom reset from ${PALETTES[event.target.value].label}`, id: Date.now() }));
            }}
            helperText="Replaces every value below"
            sx={{ minWidth: 200 }}
          >
            {Object.entries(PALETTES).map(([id, palette]) => (
              <MenuItem key={id} value={id}>
                {palette.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      ) : (
        <Button
          onClick={() => {
            dispatch(seedCustomFrom(themeId === "system" ? (prefersDark ? "practice-dark" : "practice-light") : themeId));
            dispatch(setThemeId(CUSTOM_ID));
          }}
        >
          Build a custom theme from this one
        </Button>
      )}
    </>
  );
}

/**
 * One slot: a swatch, what it is for, and its value. In Custom the swatch is a
 * colour picker and the value is typeable, so a hex can be pasted in.
 *
 * Text slots carry their contrast against the page colour, because a theme is
 * easy to build and hard to notice you have made unreadable.
 */
function TokenRow({ token, value, ground, editable, onChange }) {
  // Derived during render rather than in an effect: the field shows what is
  // stored, except while a partly-typed hex is in it.
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const isText = token.key === "ink" || token.key === "inkMuted";
  const ratio = isText ? contrastRatio(value, ground) : null;
  const poor = ratio !== null && ratio < 4.5;

  const commit = (next) => {
    setDraft(next);
    if (isHex(next)) onChange(next);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        py: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        component={editable ? "input" : "div"}
        type={editable ? "color" : undefined}
        value={editable ? (isHex(draft) ? draft.slice(0, 7) : "#000000") : undefined}
        onChange={editable ? (event) => commit(event.target.value) : undefined}
        aria-label={editable ? `${token.label} colour` : undefined}
        title={value}
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          p: 0,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: value,
          cursor: editable ? "pointer" : "default",
          appearance: editable ? "none" : undefined,
        }}
      />

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          {token.label}
        </Typography>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {token.help}
          {ratio !== null && ` · ${ratio.toFixed(1)}:1`}
          {poor && " — below 4.5:1"}
        </Typography>
      </Box>

      {editable ? (
        <TextField
          value={draft}
          onChange={(event) => commit(event.target.value)}
          variant="standard"
          error={!isHex(draft)}
          inputProps={{ "aria-label": `${token.label} hex value`, spellCheck: false }}
          sx={{ width: 108, flexShrink: 0, input: { fontFamily: (t) => t.typography.h1.fontFamily } }}
        />
      ) : (
        <Typography
          variant="overline"
          sx={{ color: poor ? "chart.vermilion" : "text.secondary", flexShrink: 0 }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}

function DisplaySizeSection() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const scale = useSelector(selectScale);
  const roomy = useMediaQuery(theme.breakpoints.up("sm"));

  // The same maths GoalRow uses, so the preview is the real layout rather than
  // an impression of it.
  const previewRef = useRef(null);
  const [perRow, setPerRow] = useState(null);
  const cell = Math.round((roomy ? 96 : 60) * scale) + 12;

  useEffect(() => {
    const measure = () => {
      const width = previewRef.current?.clientWidth;
      if (width) setPerRow(Math.max(1, Math.floor(width / cell)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cell]);

  return (
    <>
      {/* Inset, or the 75% and 150% mark labels are clipped at the edges. */}
      <Box sx={{ maxWidth: 420, mb: 6, px: 4 }}>
        <Slider
          value={scale}
          min={0.75}
          max={1.5}
          step={0.05}
          marks={[
            { value: 0.75, label: "75%" },
            { value: 1, label: "100%" },
            { value: 1.25, label: "125%" },
            { value: 1.5, label: "150%" },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
          onChange={(_event, value) => dispatch(setScale(value))}
          aria-label="Display size"
          getAriaValueText={(v) => `${Math.round(v * 100)} percent`}
          sx={{ color: "chart.vermilion" }}
        />
      </Box>

      <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 3 }}>
        {Math.round(scale * 100)}%
        {perRow ? ` · ${perRow} ring${perRow === 1 ? "" : "s"} per row at this width` : ""}
      </Typography>

      {/* Dials at the real size, in the real container, wrapping the real way. */}
      <Box
        ref={previewRef}
        aria-hidden
        sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: 3 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            sx={{ flex: "0 0 auto", width: cell, display: "flex", justifyContent: "center" }}
          >
            <Box
              sx={{
                width: Math.round((roomy ? 96 : 60) * scale),
                height: Math.round((roomy ? 96 : 60) * scale),
                borderRadius: "50%",
                border: "2px solid",
                borderColor: i % 3 === 0 ? "chart.brass" : "chart.empty",
              }}
            />
          </Box>
        ))}
      </Box>

      <Button onClick={() => dispatch(setScale(1))} disabled={scale === 1} sx={{ mt: 5 }}>
        Reset to 100%
      </Button>
    </>
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
  // How far the held row has been pulled from its resting slot, so it follows
  // the pointer instead of only snapping between slots.
  const [dragShift, setDragShift] = useState(0);

  const rowNodes = useRef([]);
  // Row centres, measured once when the drag starts. See onHandleMove.
  const dragGeom = useRef(null);
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

    // Measure every row ONCE, here. Page coordinates rather than viewport ones
    // so a scroll mid-drag cannot skew them.
    dragGeom.current = {
      centers: rowNodes.current.map((node) => {
        if (!node) return 0;
        const box = node.getBoundingClientRect();
        return box.top + window.scrollY + box.height / 2;
      }),
      startY: event.pageY,
      startIndex: index,
    };
    setDragShift(0);
    setDragging({ key: rows[index].key, from: index, pointerId: event.pointerId });
  };

  /**
   * Where the held row wants to be, decided against the layout as it was when
   * the drag started.
   *
   * Measuring live rows instead is what made this fight itself: reordering
   * moves the rows, so the next event measures geometry the previous event just
   * changed, the pointer lands back inside the row it displaced, and the two
   * swap on every frame. Fixed centres make the target a pure function of how
   * far the pointer has travelled, so it changes only when the pointer really
   * crosses into another slot.
   */
  const onHandleMove = (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId || !dragGeom.current) return;
    const { centers, startY, startIndex } = dragGeom.current;

    const current = latestRows.current.findIndex((row) => row.key === dragging.key);
    if (current === -1) return;

    const held = centers[startIndex] + (event.pageY - startY);

    let target = 0;
    let closest = Infinity;
    centers.forEach((centre, i) => {
      const distance = Math.abs(centre - held);
      if (distance < closest) {
        closest = distance;
        target = i;
      }
    });

    // Keep the row under the pointer while its slot changes beneath it.
    if (target !== current) moveTo(current, target);
    setDragShift(held - centers[target]);
  };

  const endDrag = (event) => {
    if (!dragging) return;
    if (event && event.pointerId !== undefined && event.pointerId !== dragging.pointerId) return;
    const landed = latestRows.current.findIndex((row) => row.key === dragging.key);
    setDragging(null);
    setDragShift(0);
    dragGeom.current = null;
    // Only write when the order actually changed.
    if (landed !== -1 && landed !== dragging.from) commit(latestRows.current);
  };

  const cancelDrag = () => {
    if (!dragging) return;
    setDragging(null);
    setDragShift(0);
    dragGeom.current = null;
    setRows(categories.map((cat) => ({ ...cat, key: cat.category })));
  };

  /**
   * Move and release are bound to the window, not the handle.
   *
   * Pointer capture on the handle looks like the obvious choice and is wrong
   * here: reordering moves the row — and the handle inside it — to a new place
   * in the DOM, and a captured element that gets moved loses its capture. The
   * drag then went dead after the second reorder, silently, part way down the
   * list. The window never moves.
   */
  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event) => onHandleMove(event);
    const up = (event) => endDrag(event);
    const cancel = () => cancelDrag();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  });

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
              // The held row tracks the pointer with no transition, or it lags
              // behind the finger. The rest ease into their new slots.
              transform: isDragging ? `translateY(${dragShift}px)` : "none",
              transition: isDragging
                ? "opacity 120ms linear"
                : "transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 120ms linear",
              position: "relative",
              zIndex: isDragging ? 2 : 1,
            }}
          >
            <Box
              role="button"
              tabIndex={0}
              aria-label={`Reorder ${row.category}, position ${index + 1} of ${rows.length}. Use the arrow keys to move it.`}
              onPointerDown={onHandleDown(index)}
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
