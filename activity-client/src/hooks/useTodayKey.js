import { useEffect, useState } from "react";
import { todayKey } from "../lib/periods";

/**
 * The user's local calendar date, kept current while the app is open.
 *
 * This is an installed PWA that people leave running, so "today" cannot be read
 * once at mount and trusted forever — it goes stale at local midnight and the
 * app would keep offering yesterday. Re-checked on a slow timer and, more
 * usefully, whenever the tab is brought back to the foreground, which is what
 * actually happens when someone opens the app the next morning.
 */
export const useTodayKey = () => {
  const [key, setKey] = useState(todayKey);

  useEffect(() => {
    const check = () => setKey((prev) => (todayKey() === prev ? prev : todayKey()));

    const timer = setInterval(check, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  return key;
};
