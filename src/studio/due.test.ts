/**
 * A job's ready-by chip against today: "due tomorrow" only for the next day
 * on the calendar; the next working day after a weekend or a closure is said
 * by its weekday ("due Monday", seen on a Friday).
 */
import { describe, expect, it } from "vitest";

import { dueOf } from "./facts.ts";

const WEEK = ["mon", "tue", "wed", "thu", "fri"];
const job = (readyBy: string) => ({ id: 1, stage: "prepress", ready_by: readyBy });

describe("a job's ready-by against today", () => {
  it("says tomorrow for the next calendar day", () => {
    expect(dueOf(job("2026-11-06"), "2026-11-05", WEEK, [])).toEqual({ tone: "tomorrow", day: "2026-11-06" });
  });

  it("says the weekday for Monday seen on a Friday, never tomorrow", () => {
    expect(dueOf(job("2026-11-09"), "2026-11-06", WEEK, [])).toEqual({ tone: "next", day: "2026-11-09" });
  });

  it("says the weekday for the day after a closure", () => {
    expect(dueOf(job("2026-11-12"), "2026-11-10", WEEK, [{ from: "2026-11-11", to: "2026-11-11" }])).toEqual({ tone: "next", day: "2026-11-12" });
  });

  it("keeps today and a later day as they were", () => {
    expect(dueOf(job("2026-11-06"), "2026-11-06", WEEK, []).tone).toBe("today");
    expect(dueOf(job("2026-11-10"), "2026-11-06", WEEK, []).tone).toBe("later");
  });
});
