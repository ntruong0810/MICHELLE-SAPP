import assert from "node:assert/strict";
import test from "node:test";
import { eventsForDate } from "../lib/month-events.ts";
import {
  weeklyOnlyEventFromRow,
  weeklyOnlyEventToInsert,
} from "../lib/planner-data/weekly-only-events.ts";
import type { WeeklyOnlyEventRow } from "../lib/planner-data/weekly-only-events.ts";
import {
  weeklyTaskFromRow,
  weeklyTaskToInsert,
} from "../lib/planner-data/weekly-tasks.ts";
import type { WeeklyTaskRow } from "../lib/planner-data/weekly-tasks.ts";
import type { CalendarEvent, WeeklyOnlyEvent, WeeklyTask } from "../lib/planner-models.ts";
import {
  appendWeeklyOnlyEvent,
  deleteWeeklyOnlyEvent,
  editWeeklyOnlyEvent,
  replaceWeeklyOnlyEventId,
  resolveWeekEvents,
  weekEventsForDate,
} from "../lib/weekly-only-events.ts";
import {
  appendWeeklyTask,
  deleteWeeklyTask,
  editWeeklyTask,
  replaceWeeklyTaskId,
  weeklyTasksForDate,
  weeklyTasksForWeek,
} from "../lib/weekly-tasks.ts";

const weekStart = "2026-08-16";

function calendarEvent(id: string, content: string, sortOrder = 0): CalendarEvent {
  return { id, date: "2026-08-20", content, sortOrder, textSize: "medium" };
}

function weeklyEvent(id: string, content: string, sortOrder = 0): WeeklyOnlyEvent {
  return { id, date: "2026-08-20", weekStart, content, sortOrder };
}

function task(id: string, content: string, sortOrder = 0): WeeklyTask {
  return {
    id,
    date: "2026-08-20",
    weekStart,
    content,
    isCompleted: false,
    sortOrder,
  };
}

test("creates a trimmed weekly-only event after displayed Month events", () => {
  const result = appendWeeklyOnlyEvent([], [calendarEvent("month", "Beach day", 0)], {
    id: "temporary",
    date: "2026-08-20",
    weekStart,
    content: "  Dentist at 10  ",
  });
  assert.deepEqual(result, [weeklyEvent("temporary", "Dentist at 10", 1)]);
});

test("rejects empty weekly-only events and supports edit/delete", () => {
  const original = [weeklyEvent("a", "Dentist")];
  assert.equal(appendWeeklyOnlyEvent(original, [], {
    id: "empty",
    date: "2026-08-20",
    weekStart,
    content: "   ",
  }), original);
  assert.equal(editWeeklyOnlyEvent(original, "a", "  Dentist at 10  ")[0].content, "Dentist at 10");
  assert.deepEqual(deleteWeeklyOnlyEvent(original, "a"), []);
});

test("filters weekly-only events by Week/date and combines them with Month events", () => {
  const resolved = resolveWeekEvents(
    [calendarEvent("month", "Beach day")],
    [weeklyEvent("weekly", "Dentist", 1), {
      ...weeklyEvent("other-week", "Other week"),
      weekStart: "2026-08-23",
    }],
    weekStart,
  );
  assert.deepEqual(
    weekEventsForDate(resolved, "2026-08-20").map((event) => [event.content, event.origin]),
    [["Beach day", "calendar"], ["Dentist", "weekly"]],
  );
});

test("weekly-only events never enter Month event queries", () => {
  const monthEvents = [calendarEvent("month", "Beach day")];
  appendWeeklyOnlyEvent([], monthEvents, {
    id: "weekly",
    date: "2026-08-20",
    weekStart,
    content: "Dentist",
  });
  assert.deepEqual(eventsForDate(monthEvents, "2026-08-20").map((event) => event.content), ["Beach day"]);
});

test("reconciles weekly-only temporary IDs and database mappings without inserting id", () => {
  const row: WeeklyOnlyEventRow = {
    id: "8f114674-3b2f-443b-9ec5-204f3cc98355",
    user_id: "ef8121d8-b3ea-4499-a7cc-3ba5d2a8bd16",
    date: "2026-08-20",
    week_start: weekStart,
    content: "Dentist",
    sort_order: 1,
    created_at: "2026-08-09T12:00:00.000Z",
    updated_at: "2026-08-09T12:00:00.000Z",
  };
  const persisted = weeklyOnlyEventFromRow(row);
  assert.deepEqual(replaceWeeklyOnlyEventId([weeklyEvent("temporary", "Dentist", 1)], "temporary", persisted), [persisted]);
  assert.deepEqual(weeklyOnlyEventToInsert(persisted, row.user_id), {
    user_id: row.user_id,
    date: row.date,
    week_start: row.week_start,
    content: row.content,
    sort_order: row.sort_order,
  });
});

test("creates, toggles, edits, and deletes weekly tasks", () => {
  const created = appendWeeklyTask([], {
    id: "temporary",
    date: "2026-08-20",
    weekStart,
    content: "  Buy groceries  ",
  });
  assert.equal(created[0].content, "Buy groceries");
  assert.equal(created[0].sortOrder, 0);
  const toggled = editWeeklyTask(created, "temporary", { isCompleted: true });
  assert.equal(toggled[0].isCompleted, true);
  const edited = editWeeklyTask(toggled, "temporary", { content: "  Buy fruit  " });
  assert.equal(edited[0].content, "Buy fruit");
  assert.deepEqual(deleteWeeklyTask(edited, "temporary"), []);
});

test("rejects empty tasks and preserves ordering while filtering by Week/date", () => {
  const original = [task("second", "Second", 1), task("first", "First", 0)];
  assert.equal(appendWeeklyTask(original, {
    id: "empty",
    date: "2026-08-20",
    weekStart,
    content: " ",
  }), original);
  const all = [...original, { ...task("other", "Other week"), weekStart: "2026-08-23" }];
  assert.deepEqual(weeklyTasksForWeek(all, weekStart).map((item) => item.content), ["First", "Second"]);
  assert.deepEqual(weeklyTasksForDate(all, weekStart, "2026-08-20").map((item) => item.content), ["First", "Second"]);
});

test("reconciles task temporary IDs and database mappings without inserting id", () => {
  const row: WeeklyTaskRow = {
    id: "1484ae48-26e8-4d61-9476-a104aa367f58",
    user_id: "ef8121d8-b3ea-4499-a7cc-3ba5d2a8bd16",
    date: "2026-08-20",
    week_start: weekStart,
    content: "Buy groceries",
    is_completed: true,
    sort_order: 0,
    created_at: "2026-08-09T12:00:00.000Z",
    updated_at: "2026-08-09T12:00:00.000Z",
  };
  const persisted = weeklyTaskFromRow(row);
  assert.deepEqual(replaceWeeklyTaskId([task("temporary", "Buy groceries")], "temporary", persisted), [persisted]);
  assert.deepEqual(weeklyTaskToInsert(persisted, row.user_id), {
    user_id: row.user_id,
    date: row.date,
    week_start: row.week_start,
    content: row.content,
    is_completed: true,
    sort_order: 0,
  });
});
