import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  isNotificationsSupported,
  requestNotificationPermission,
  scheduleDailyCheckin,
  showCheckinNotification,
} from "../../utils/notifications";

export default function NotificationsSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("daily_checkin_enabled") === "true"
  );
  const [dailyTime, setDailyTime] = useState(
    () => localStorage.getItem("daily_checkin_time") || "20:00"
  );
  const [notificationsSupported] = useState(isNotificationsSupported());
  const [supportNote] = useState(() => {
    if (typeof navigator === "undefined") return "";
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isFirefox = /Firefox/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    if (isAndroid && isFirefox) {
      return "Firefox on Android has limited Web Push support; background notifications may not work.";
    }
    if (isIOS) {
      return "iOS Safari requires installing the PWA to Home Screen for push notifications.";
    }
    return "";
  });
  const [diagnostics, setDiagnostics] = useState({
    notificationPermission: "unknown",
    serviceWorker: false,
    serviceWorkerReady: false,
    pushManager: false,
  });

  useEffect(() => {
    if (!notificationsSupported || !notificationsEnabled) return undefined;
    const cleanup = scheduleDailyCheckin(dailyTime, showCheckinNotification);
    return cleanup;
  }, [dailyTime, notificationsEnabled, notificationsSupported]);

  useEffect(() => {
    let cancelled = false;
    const updateDiagnostics = async () => {
      const permission = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
      const swAvailable = typeof navigator !== "undefined" && "serviceWorker" in navigator;
      const pushAvailable = typeof window !== "undefined" && "PushManager" in window;
      let swReady = false;
      if (swAvailable) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          swReady = Boolean(registration);
        } catch (error) {
          swReady = false;
        }
      }
      if (!cancelled) {
        setDiagnostics({
          notificationPermission: permission,
          serviceWorker: swAvailable,
          serviceWorkerReady: swReady,
          pushManager: pushAvailable,
        });
      }
    };
    updateDiagnostics();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleNotifications = async (event) => {
    const nextValue = event.target.checked;
    if (nextValue) {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        setNotificationsEnabled(false);
        localStorage.setItem("daily_checkin_enabled", "false");
        return;
      }
    }
    setNotificationsEnabled(nextValue);
    localStorage.setItem("daily_checkin_enabled", String(nextValue));
  };

  const handleTimeChange = (event) => {
    const nextValue = event.target.value;
    setDailyTime(nextValue);
    localStorage.setItem("daily_checkin_time", nextValue);
  };

  const handleTestNotification = async () => {
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await requestNotificationPermission();
    if (permission === "granted") {
      showCheckinNotification();
    }
  };

  return (
    <Container maxWidth="md" sx={{ height: "100%" }}>
      <Grid container size={12} sx={{ padding: "15px" }}>
        <Typography variant="h5" gutterBottom>
          Notifications
        </Typography>
      </Grid>
      <Paper>
        <Grid container spacing={2} sx={{ padding: "15px" }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="h6">Daily check-in</Typography>
            <Typography variant="body2" color="text.secondary">
              Ready to log today’s progress?
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Time"
              type="time"
              value={dailyTime}
              onChange={handleTimeChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              disabled={!notificationsEnabled}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button variant="outlined" onClick={handleTestNotification} disabled={!notificationsSupported}>
              Test
            </Button>
            <Switch
              checked={notificationsEnabled}
              onChange={handleToggleNotifications}
              disabled={!notificationsSupported}
              inputProps={{ "aria-label": "Enable daily check-in" }}
            />
          </Grid>
          {!notificationsSupported && (
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Notifications are not supported in this browser.
              </Typography>
            </Grid>
          )}
          {supportNote && (
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                {supportNote}
              </Typography>
            </Grid>
          )}
          <Grid size={12}>
            <Paper variant="outlined" sx={{ padding: 1.5 }}>
              <Typography variant="subtitle2">Diagnostics</Typography>
              <Typography variant="caption" color="text.secondary">
                Permission: {diagnostics.notificationPermission}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Service worker: {diagnostics.serviceWorker ? "available" : "missing"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Service worker registered: {diagnostics.serviceWorkerReady ? "yes" : "no"}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                PushManager: {diagnostics.pushManager ? "available" : "missing"}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
