const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const ACCESS_KEY = "activity.accessToken";
const REFRESH_KEY = "activity.refreshToken";

export const tokens = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Single in-flight refresh. Without this, several requests expiring together
 * each start their own refresh and all but one lose the race, rotating the
 * token out from under the others.
 */
let refreshInFlight = null;

const doRefresh = async () => {
  const refreshToken = tokens.refresh();
  if (!refreshToken) throw new ApiError(401, "Not signed in");

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError(401, "Session expired");
        return res.json();
      })
      .then((data) => {
        tokens.set(data);
        return data;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

const parse = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
};

/**
 * @param {string} path  path under /api, e.g. "/bootstrap"
 * @param {object} opts  { method, body, signal, auth }
 */
export const request = async (path, { method = "GET", body, signal, auth = true, _retried } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokens.access();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }

  // One transparent refresh-and-retry on an expired access token.
  if (res.status === 401 && auth && !_retried && tokens.refresh()) {
    try {
      await doRefresh();
      return request(path, { method, body, signal, auth, _retried: true });
    } catch {
      tokens.clear();
      window.dispatchEvent(new CustomEvent("activity:signed-out"));
      throw new ApiError(401, "Your session expired. Please sign in again.");
    }
  }

  const data = await parse(res);

  if (!res.ok) {
    if (res.status === 401 && auth) {
      tokens.clear();
      window.dispatchEvent(new CustomEvent("activity:signed-out"));
    }
    throw new ApiError(res.status, data?.error?.message || "Something went wrong", data?.error?.details);
  }

  return data;
};

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  updateProfile: (payload) => request("/auth/profile", { method: "PATCH", body: payload }),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),

  bootstrap: () => request("/bootstrap"),

  createGoal: (goal) => request("/goals", { method: "POST", body: goal }),
  updateGoal: (id, patch) => request(`/goals/${id}`, { method: "PATCH", body: patch }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: "DELETE" }),
  reorderGoals: (order) => request("/goals/reorder", { method: "PATCH", body: { order } }),

  saveCategories: (categories) => request("/categories", { method: "PUT", body: { categories } }),
  renameCategory: (from, to) => request("/categories/rename", { method: "POST", body: { from, to } }),

  historyForDate: (date, signal) => request(`/history?date=${date}`, { signal }),
  historyRange: ({ from, to, interval, goalId }, signal) => {
    const params = new URLSearchParams({ from, to });
    if (interval) params.set("interval", interval);
    if (goalId) params.set("goalId", goalId);
    return request(`/history/range?${params}`, { signal });
  },
  recordProgress: (payload) => request("/history/progress", { method: "POST", body: payload }),

  summary: ({ from, to, bucket }, signal) =>
    request(`/stats/summary?${new URLSearchParams({ from, to, bucket })}`, { signal }),
  matrix: ({ from, to, bucket }, signal) =>
    request(`/stats/matrix?${new URLSearchParams({ from, to, bucket })}`, { signal }),
  byGoal: ({ from, to }, signal) =>
    request(`/stats/by-goal?${new URLSearchParams({ from, to })}`, { signal }),
  // `days` accepts a number or the string "all". `today` is the caller's local
  // calendar date — whether a streak is still alive depends on which period the
  // user is in, which the server cannot know from UTC alone.
  streaks: (days = 365, today, signal) =>
    request(`/stats/streaks?${new URLSearchParams({ days: String(days), ...(today ? { today } : {}) })}`, {
      signal,
    }),
};

export { BASE as API_BASE };
