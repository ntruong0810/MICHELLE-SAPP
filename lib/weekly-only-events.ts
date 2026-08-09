import type { CalendarEvent, WeeklyOnlyEvent } from "./planner-models.ts";

export type WeekEventItem = {
  id: string;
  date: string;
  content: string;
  sortOrder: number;
  origin: "calendar" | "weekly";
};

type NewWeeklyOnlyEvent = {
  id: string;
  date: string;
  weekStart: string;
  content: string;
};

export function resolveWeekEvents(
  calendarEvents: CalendarEvent[],
  weeklyEvents: WeeklyOnlyEvent[],
  weekStart: string,
): WeekEventItem[] {
  return [
    ...calendarEvents.map<WeekEventItem>((event) => ({
      id: event.id,
      date: event.date,
      content: event.content,
      sortOrder: event.sortOrder,
      origin: "calendar",
    })),
    ...weeklyEvents
      .filter((event) => event.weekStart === weekStart)
      .map<WeekEventItem>((event) => ({
        id: event.id,
        date: event.date,
        content: event.content,
        sortOrder: event.sortOrder,
        origin: "weekly",
      })),
  ].toSorted((left, right) => (
    left.date.localeCompare(right.date)
    || left.sortOrder - right.sortOrder
    || (left.origin === right.origin ? 0 : left.origin === "calendar" ? -1 : 1)
    || left.id.localeCompare(right.id)
  ));
}

export function weekEventsForDate(events: WeekEventItem[], date: string): WeekEventItem[] {
  return events.filter((event) => event.date === date);
}

export function appendWeeklyOnlyEvent(
  weeklyEvents: WeeklyOnlyEvent[],
  calendarEvents: CalendarEvent[],
  input: NewWeeklyOnlyEvent,
): WeeklyOnlyEvent[] {
  const content = input.content.trim();
  if (!content) return weeklyEvents;

  const displayedEvents = weekEventsForDate(
    resolveWeekEvents(calendarEvents, weeklyEvents, input.weekStart),
    input.date,
  );
  const sortOrder = displayedEvents.length
    ? Math.max(...displayedEvents.map((event) => event.sortOrder)) + 1
    : 0;

  return [...weeklyEvents, { ...input, content, sortOrder }];
}

export function editWeeklyOnlyEvent(
  events: WeeklyOnlyEvent[],
  eventId: string,
  content: string,
): WeeklyOnlyEvent[] {
  const trimmedContent = content.trim();
  if (!trimmedContent) return events;
  return events.map((event) => event.id === eventId
    ? { ...event, content: trimmedContent }
    : event);
}

export function deleteWeeklyOnlyEvent(
  events: WeeklyOnlyEvent[],
  eventId: string,
): WeeklyOnlyEvent[] {
  return events.filter((event) => event.id !== eventId);
}

export function replaceWeeklyOnlyEventId(
  events: WeeklyOnlyEvent[],
  temporaryId: string,
  persistedEvent: WeeklyOnlyEvent,
): WeeklyOnlyEvent[] {
  return events.map((event) => event.id === temporaryId ? persistedEvent : event);
}
