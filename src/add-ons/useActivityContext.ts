/**
 * THE ONE PLACE THIS APP DECIDES WHAT ITS SEEDED ADD-ON HISTORY IS TRUE OF.
 *
 * `SeededActivityEntry` (see `host.ts`) is declared relative — "316 minutes
 * ago, about your most recent job" — and `resolveActivity` turns that into a
 * day, a time and one of THIS works' own references. Both halves of that
 * context are host facts, and both have to be the SAME host facts everywhere,
 * or the manage drawer and the Add-ons shelf will date the same seeded line
 * differently and a reviewer will be looking at two answers to one question.
 *
 * So there is one hook, called by both, rather than two object literals that
 * happen to agree today.
 *
 * WHY THE REFERENCES ARE DERIVED AND NOT WRITTEN DOWN. A hand-kept list beside
 * `JOBS` is a second copy of the works' paperwork that nothing compares with
 * the first: delete a job from the demo and the list still names it. Sorting
 * the job board's own references is the works stating a fact about itself.
 *
 * `Job.ref` is `MP-` and four digits for every job this works has ever issued
 * (`data/demo.ts`), and the number IS the order they were taken in, so a plain
 * descending string sort is "newest first" exactly. If a works ever issues a
 * reference in another shape, this is the line that has to learn about it —
 * which is why it is one line in one file and not an assumption spread over
 * two screens.
 */

import { useMemo } from "react";

import type { Job } from "../data/types.ts";
import { useStore } from "../state/store.ts";
import type { ActivityContext } from "./host.ts";

/** The works' own job references, newest first. Pure, for the suites. */
export function activityRefs(jobs: readonly Job[]): readonly string[] {
  return [...jobs].map((job) => job.ref).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

export function useActivityContext(): ActivityContext {
  const now = useStore((s) => s.now);
  const jobs = useStore((s) => s.jobs);
  /*
   * THE WORKS' DAY, NOT THE PIN — repaired 2026-08-11, round 6, and found by
   * porting the studio's own suite into this repo.
   *
   * This read `now.iso`, which is the pinned instant the demo starts from and
   * never moves. The dock's "advance a day" moves `dayOffset`, so the job board
   * said Thursday while the Add-ons shelf went on dating the carrier's last
   * booking to Wednesday — the same seeded line, two different days, on two
   * screens of one shop. That is precisely the untruth `resolveActivity` was
   * built to stop, in the app that built it: the studio's context has read
   * `todayIso()` since round 4 and this one never did.
   *
   * The TIME of day still comes from the pin, and should: the demo clock's hour
   * and minute are what every other dated thing in this works is drawn against.
   */
  const dayOffset = useStore((s) => s.dayOffset);
  const todayIso = useStore((s) => s.todayIso);
  const iso = todayIso();
  void dayOffset; // subscribed so the shelf re-dates when the dock advances
  // Depend on the clock BY ITS PARTS: `now` is rebuilt by the store on every
  // change and an object identity here would re-sort the board's references on
  // every render for nothing.
  return useMemo(
    () => ({ now: { iso, hour: now.hour, minute: now.minute }, refs: activityRefs(jobs) }),
    [iso, now.hour, now.minute, jobs],
  );
}
