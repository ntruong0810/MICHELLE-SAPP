import assert from "node:assert/strict";
import test from "node:test";
import {
  appendCalendarEvent,
  deleteCalendarEvent,
  eventsForDate,
  updateCalendarEvent,
} from "../lib/month-events.ts";
import type { CalendarEvent } from "../lib/planner-models.ts";

function add(events: CalendarEvent[], id: string, date: string, content: string) {
  return appendCalendarEvent(events, { id, date, content });
}

test("creates multiple independent events on the same ISO date", () => {
  let events: CalendarEvent[] = [];
  events = add(events, "beach", "2026-08-20", "Beach day");
  events = add(events, "dinner", "2026-08-20", "Dinner at 7");

  assert.deepEqual(eventsForDate(events, "2026-08-20").map((event) => event.content), [
    "Beach day",
    "Dinner at 7",
  ]);
  assert.deepEqual(eventsForDate(events, "2026-08-20").map((event) => event.sortOrder), [0, 1]);
});

test("editing one event leaves neighboring events unchanged", () => {
  let events: CalendarEvent[] = [];
  events = add(events, "beach", "2026-08-20", "Beach day");
  events = add(events, "dinner", "2026-08-20", "Dinner at 7");
  events = updateCalendarEvent(events, "beach", { content: "Beach day with friends" });

  assert.equal(events.find((event) => event.id === "beach")?.content, "Beach day with friends");
  assert.equal(events.find((event) => event.id === "dinner")?.content, "Dinner at 7");
});

test("deleting one event preserves the remaining event and its ordering", () => {
  let events: CalendarEvent[] = [];
  events = add(events, "first", "2026-08-20", "First");
  events = add(events, "second", "2026-08-20", "Second");
  events = add(events, "third", "2026-08-20", "Third");
  events = deleteCalendarEvent(events, "second");

  assert.deepEqual(eventsForDate(events, "2026-08-20").map(({ id, sortOrder }) => ({ id, sortOrder })), [
    { id: "first", sortOrder: 0 },
    { id: "third", sortOrder: 2 },
  ]);
});

test("events remain associated only with their own date", () => {
  let events: CalendarEvent[] = [];
  events = add(events, "twenty", "2026-08-20", "Beach day");
  events = add(events, "twenty-one", "2026-08-21", "Library visit");

  assert.deepEqual(eventsForDate(events, "2026-08-20").map((event) => event.id), ["twenty"]);
  assert.deepEqual(eventsForDate(events, "2026-08-21").map((event) => event.id), ["twenty-one"]);
});

test("committing an empty creation draft discards it", () => {
  const events = appendCalendarEvent([], {
    id: "empty",
    date: "2026-08-20",
    content: "   ",
  });

  assert.deepEqual(events, []);
});
