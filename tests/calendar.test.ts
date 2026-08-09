import assert from "node:assert/strict";
import test from "node:test";
import {
  adjacentMonth,
  adjacentWeek,
  buildMonthWeeks,
  buildWeek,
  fromDateKey,
  monthPath,
  weekTitle,
} from "../lib/calendar.ts";

test("builds August 2026 as six complete Sunday-first weeks", () => {
  const weeks = buildMonthWeeks(2026, 8);
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0].days[0].date, "2026-07-26");
  assert.equal(weeks[5].days[6].date, "2026-09-05");
  assert.ok(weeks.every((week) => week.days.length === 7));
});

test("builds February 2026 as four complete weeks", () => {
  const weeks = buildMonthWeeks(2026, 2);
  assert.equal(weeks.length, 4);
  assert.equal(weeks[0].weekStart, "2026-02-01");
  assert.equal(weeks[3].days[6].date, "2026-02-28");
});

test("normalizes any date to its Sunday week", () => {
  const week = buildWeek("2026-08-12");
  assert.equal(week?.weekStart, "2026-08-09");
  assert.equal(week?.days[6].date, "2026-08-15");
  assert.equal(weekTitle("2026-08-12"), "AUG 9 – 15, 2026");
});

test("moves cleanly across month, week, and year boundaries", () => {
  assert.deepEqual(adjacentMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.equal(adjacentWeek("2026-12-30", 1), "2027-01-03");
  assert.equal(weekTitle("2026-12-30"), "DEC 27 – JAN 2, 2027");
});

test("rejects impossible date keys", () => {
  assert.equal(fromDateKey("2026-02-29"), null);
  assert.equal(fromDateKey("not-a-date"), null);
});

test("formats Month jump routes with a two-digit month and unchanged year", () => {
  assert.equal(monthPath(2026, 1), "/month/2026/01");
  assert.equal(monthPath(2026, 8), "/month/2026/08");
  assert.equal(monthPath(2026, 12), "/month/2026/12");
});
