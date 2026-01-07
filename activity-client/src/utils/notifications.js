export const isNotificationsSupported = () =>
  typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

export const requestNotificationPermission = async () => {
  if (!isNotificationsSupported()) return "unsupported";
  return Notification.requestPermission();
};

export const showCheckinNotification = async () => {
  if (!isNotificationsSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const payload = {
    body: "Ready to log today’s progress?",
    icon: "/activity-tracker/favicon_144.png",
    badge: "/activity-tracker/favicon_16.png",
    tag: "daily-checkin",
    renotify: true,
  };

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.showNotification) {
      await registration.showNotification("Daily check-in", payload);
      return true;
    }
  } catch (error) {
    // Fall back to the Notification constructor below.
  }

  try {
    new Notification("Daily check-in", payload);
    return true;
  } catch (error) {
    return false;
  }
};

export const scheduleDailyCheckin = (time24h, onNotify) => {
  if (!isNotificationsSupported()) return () => {};
  if (!time24h) return () => {};

  const [hours, minutes] = time24h.split(":").map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return () => {};

  let intervalId = null;
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const timeoutId = setTimeout(() => {
    onNotify();
    intervalId = setInterval(onNotify, 24 * 60 * 60 * 1000);
  }, next.getTime() - now.getTime());

  return () => {
    clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
  };
};
