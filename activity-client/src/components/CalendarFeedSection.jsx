import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Box, Button, TextField, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { api } from "../app/api";
import { showToast } from "../features/ui/uiSlice";

/**
 * A private calendar link for Google Calendar's "From URL". Each weekly and
 * monthly goal shows up on the day it is next due.
 *
 * The link carries this device's time zone (`?tz=`) because the server never
 * guesses what day it is for anyone; nothing is stored per user.
 */
const feedUrl = (token) => {
  const base = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, "");
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return `${base}/api/calendar/${token}.ics?tz=${encodeURIComponent(tz)}`;
};

export default function CalendarFeedSection() {
  const dispatch = useDispatch();
  const [token, setToken] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    let live = true;
    api
      .calendarStatus()
      .then((data) => live && setToken(data.token))
      .catch(() => live && setToken(null));
    return () => {
      live = false;
    };
  }, []);

  const toast = (message, tone) => dispatch(showToast({ message, tone, id: Date.now() }));

  const run = async (fn, message) => {
    setBusy(true);
    try {
      const data = await fn();
      setToken(data.token);
      setConfirmReset(false);
      toast(message);
    } catch (err) {
      toast(err.message || "That didn't work", "error");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl(token));
      toast("Link copied");
    } catch {
      toast("Couldn't copy — select the link and copy it by hand", "error");
    }
  };

  if (token === undefined) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Loading…
      </Typography>
    );
  }

  if (!token) {
    return (
      <Button variant="contained" disabled={busy} onClick={() => run(api.calendarRotate, "Calendar link created")}>
        {busy ? "Creating…" : "Create calendar link"}
      </Button>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 560 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <TextField
          label="Your calendar link"
          value={feedUrl(token)}
          fullWidth
          slotProps={{ htmlInput: { readOnly: true, onFocus: (e) => e.target.select() } }}
        />
        <Button onClick={copy} startIcon={<ContentCopyIcon />} sx={{ minHeight: 56, flexShrink: 0 }}>
          Copy
        </Button>
      </Box>

      <Box component="ol" sx={{ m: 0, pl: 5, color: "text.secondary", typography: "body2", "& li": { mb: 1 } }}>
        <li>Open Google Calendar on a computer.</li>
        <li>
          Next to <b>Other calendars</b>, choose <b>+</b> then <b>From URL</b>.
        </li>
        <li>Paste the link and choose <b>Add calendar</b>.</li>
      </Box>

      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Keep it private: anyone with the link can see your weekly and monthly goal names and when
        they&apos;re due. Google refreshes subscribed calendars every few hours, so a tap here can
        take a while to show there.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        {confirmReset ? (
          <>
            <Typography variant="body2" sx={{ color: "chart.vermilion" }}>
              The old link stops working. Re-add the new one in Google Calendar.
            </Typography>
            <Button
              disabled={busy}
              sx={{ color: "chart.vermilion" }}
              onClick={() => run(api.calendarRotate, "New link created — the old one no longer works")}
            >
              Reset link
            </Button>
            <Button disabled={busy} sx={{ color: "text.secondary" }} onClick={() => setConfirmReset(false)}>
              Keep
            </Button>
          </>
        ) : (
          <>
            <Button disabled={busy} onClick={() => setConfirmReset(true)}>
              Reset link
            </Button>
            <Button
              disabled={busy}
              sx={{ color: "text.secondary" }}
              onClick={() => run(api.calendarDisable, "Calendar link turned off")}
            >
              Turn off
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
