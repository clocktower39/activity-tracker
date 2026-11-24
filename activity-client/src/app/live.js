import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { openLiveStream } from "./api";
import { refreshProfile } from "../features/auth/authSlice";
import { refreshGoals } from "../features/goals/goalsSlice";
import { remoteChanged } from "../features/history/historySlice";

/**
 * Keeps this tab in step with the account's other open pages.
 *
 * The server streams a `changed` event naming what another tab wrote
 * ("goals", "history", "profile", "calendar"); this tab then re-reads that part
 * through the normal API. The stream is server-sent events over fetch, not a
 * WebSocket: it needs nothing from nginx beyond a plain proxy, and a heartbeat
 * every 15 s keeps it alive through nginx's 30 s read timeout.
 *
 * When the stream drops it reconnects with backoff, and on reconnect re-reads
 * everything once, since a change may have happened while it was down. A hidden
 * tab keeps its stream (it is one idle connection), so coming back to it shows
 * the current state with no reload.
 */

const MIN_DELAY = 1000;
const MAX_DELAY = 30 * 1000;
const ALL_SCOPES = ["goals", "history", "profile"];

const applyScopes = (dispatch, scopes) => {
  if (scopes.includes("profile")) dispatch(refreshProfile());
  if (scopes.includes("goals")) dispatch(refreshGoals());
  if (scopes.includes("history")) dispatch(remoteChanged());
  // "calendar" has no cached state outside Settings, which reads it on open.
  if (scopes.includes("calendar")) window.dispatchEvent(new CustomEvent("activity:calendar-changed"));
};

/** Splits an SSE byte stream into { event, data } messages. */
async function* readEvents(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        let event = "message";
        const data = [];
        for (const line of raw.split("\n")) {
          if (line.startsWith(":")) continue; // heartbeat comment
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
        }
        if (data.length) yield { event, data: data.join("\n") };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const useLiveUpdates = (enabled) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled || typeof fetch === "undefined" || typeof TextDecoder === "undefined") return undefined;
    const controller = new AbortController();
    const { signal } = controller;
    let delay = MIN_DELAY;
    let connectedBefore = false;
    let timer = null;

    const wait = (ms) =>
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const run = async () => {
      while (!signal.aborted) {
        try {
          const res = await openLiveStream(signal);
          for await (const { event, data } of readEvents(res.body, signal)) {
            if (event === "ready") {
              // A reconnect may have missed changes: re-read once, then go quiet.
              if (connectedBefore) applyScopes(dispatch, ALL_SCOPES);
              connectedBefore = true;
              delay = MIN_DELAY;
            } else if (event === "changed") {
              try {
                applyScopes(dispatch, JSON.parse(data).scopes || []);
              } catch {
                applyScopes(dispatch, ALL_SCOPES);
              }
            }
          }
        } catch (err) {
          if (signal.aborted) return;
          // Signed out elsewhere: the normal request path handles the session.
          if (err?.status === 401) return;
        }
        if (signal.aborted) return;
        await wait(delay);
        delay = Math.min(delay * 2, MAX_DELAY);
      }
    };

    run();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [enabled, dispatch]);
};
