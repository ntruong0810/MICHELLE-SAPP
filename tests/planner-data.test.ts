import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarEventFromRow,
  calendarEventToInsert,
  calendarEventToUpdate,
  monthGridDateRange,
  weekDateRange,
} from "../lib/planner-data/calendar-events.ts";
import type { CalendarEventRow } from "../lib/planner-data/calendar-events.ts";
import type { CalendarEvent } from "../lib/planner-models.ts";

const row: CalendarEventRow = {
  id: "8ae8fe6e-cdf3-41cc-a24c-d23ef803951d",
  user_id: "6507c4d8-1adc-4ddf-bb87-4706c42fa272",
  date: "2026-08-20",
  content: "Beach day",
  sort_order: 2,
  created_at: "2026-08-09T12:00:00.000Z",
  updated_at: "2026-08-09T12:00:00.000Z",
};

const event: CalendarEvent = {
  id: row.id,
  date: row.date,
  content: row.content,
  sortOrder: row.sort_order,
};

test("maps a snake_case database row to the CalendarEvent model", () => {
  assert.deepEqual(calendarEventFromRow(row), event);
});

test("builds a create payload without the temporary local event ID", () => {
  assert.deepEqual(calendarEventToInsert(event, row.user_id), {
    user_id: row.user_id,
    date: "2026-08-20",
    content: "Beach day",
    sort_order: 2,
  });
});

test("builds an update payload without leaking database-only fields", () => {
  assert.deepEqual(calendarEventToUpdate(event), {
    date: "2026-08-20",
    content: "Beach day",
    sort_order: 2,
  });
});

test("loads the complete visible date range for a six-row month", () => {
  assert.deepEqual(monthGridDateRange(2026, 8), {
    startDate: "2026-07-26",
    endDate: "2026-09-05",
  });
});

test("loads the complete visible date range for a four-row month", () => {
  assert.deepEqual(monthGridDateRange(2026, 2), {
    startDate: "2026-02-01",
    endDate: "2026-02-28",
  });
});

test("loads exactly the selected Sunday-first Week range", () => {
  assert.deepEqual(weekDateRange("2026-08-16"), {
    startDate: "2026-08-16",
    endDate: "2026-08-22",
  });
});

test("normalizes Week ranges across a month and year boundary", () => {
  assert.deepEqual(weekDateRange("2026-12-28"), {
    startDate: "2026-12-27",
    endDate: "2027-01-02",
  });
});
