# Evaluator rubric

Score the session's work across six dimensions, 0-2 each. The harness can use this rubric to self-evaluate before the user reviews.

| Dimension       | 0 (fail)                                                | 1 (partial)                              | 2 (pass)                                                |
|-----------------|---------------------------------------------------------|------------------------------------------|---------------------------------------------------------|
| Correctness     | Behavior diverges from `feature_list.json` verification | Matches for the happy path, edge case off | Matches in all cases the verification block exercises   |
| Verification    | No run recorded                                         | Ran something, but not the listed block  | Listed command ran; exit code recorded in `evidence`    |
| Scope discipline| Touched files outside the active feature                | Touched one unrelated file with reason   | Diff is restricted to the active feature's surface      |
| Reliability     | Re-running the verification gives a different result    | Sometimes flakes, sometimes passes       | Stable across ≥3 runs                                   |
| Maintainability | Next session cannot tell what changed or why            | Comment trail is sparse                  | Code is readable; `PROGRESS.md` summarises the change  |
| Handoff readiness| `PROGRESS.md` and `feature_list.json` disagree        | One is stale                             | Both consistent, `init.sh` still works                  |

### Conclusion

- **Accept** — total ≥ 10/12 and no 0s on Verification / Handoff.
- **Revise** — total 6-9 or a single 0 outside Verification / Handoff.
- **Block** — total < 6, or a 0 on Verification or Handoff.

### Tuning notes

The evaluator (a sub-agent, a reviewer, or the generating agent itself) is **a bad self-judge by default**. It will identify issues and then talk itself out of them. To make it reliable:

1. Run the rubric on a recently-completed feature.
2. Compare its scores to your own judgment.
3. Where they diverge, make the relevant dimension's pass/fail criteria more concrete.
4. Re-run.

Plan for 3-5 tuning rounds before the rubric is trustworthy.
