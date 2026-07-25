import { useEffect } from "react";

/**
 * Runs a dispatch when its dependencies change.
 *
 * Deliberately does NOT abort the previous request. The history cache is keyed
 * by data identity — (goalId, interval, period) — not by "what the view is
 * currently showing, so a response that arrives late simply fills the right
 * slot and can never overwrite a newer one. Aborting bought nothing and cost
 * correctness: the abort's rejection resolves after the next dispatch has
 * already been skipped by the thunk's `condition`, which then clears the cache
 * key and leaves the view permanently empty.
 */
export const useAutoFetch = (run, deps) => {
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
