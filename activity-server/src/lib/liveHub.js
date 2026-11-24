/**
 * Live updates between an account's open pages.
 *
 * Each signed-in tab holds one server-sent-events stream (GET /api/live). When
 * a write succeeds, every other stream on the same account hears which part of
 * its data changed and re-fetches just that part. Nothing about the change
 * itself travels over the stream — the tab asks the API again, through the same
 * bounded, authenticated reads it always uses — so the stream can never show a
 * tab something its own requests could not.
 *
 * Kept in memory: the API runs as a single process. A second process would need
 * a shared channel (Redis pub/sub, a Mongo change stream) before this holds.
 */

/** accountId (string) -> Set of { res, clientId } */
const streams = new Map();

const subscribe = (accountId, res, clientId) => {
  const key = String(accountId);
  const entry = { res, clientId };
  if (!streams.has(key)) streams.set(key, new Set());
  streams.get(key).add(entry);
  return () => {
    const set = streams.get(key);
    if (!set) return;
    set.delete(entry);
    if (set.size === 0) streams.delete(key);
  };
};

/**
 * Tells the account's other tabs that `scopes` changed. The tab that made the
 * change already has the result, so its own stream (matched by client id) is
 * skipped.
 */
const publish = (accountId, scopes, fromClientId) => {
  const set = streams.get(String(accountId));
  if (!set || scopes.length === 0) return;
  const frame = `event: changed\ndata: ${JSON.stringify({ scopes })}\n\n`;
  for (const { res, clientId } of set) {
    if (fromClientId && clientId === fromClientId) continue;
    res.write(frame);
  }
};

/** For tests and the health check. */
const streamCount = () => {
  let n = 0;
  for (const set of streams.values()) n += set.size;
  return n;
};

module.exports = { subscribe, publish, streamCount };
