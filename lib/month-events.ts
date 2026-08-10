import type { CalendarEvent } from "./planner-models.ts";

type NewCalendarEvent = {
  id: string;
  date: string;
  content: string;
};

type CalendarEventChanges = {
  content?: string;
};

export function eventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events
    .filter((event) => event.date === date)
    .toSorted((left, right) => left.sortOrder - right.sortOrder);
}

export function appendCalendarEvent(
  events: CalendarEvent[],
  input: NewCalendarEvent,
): CalendarEvent[] {
  const content = input.content.trim();
  if (!content) return events;

  const currentDateEvents = eventsForDate(events, input.date);
  const sortOrder = currentDateEvents.length
    ? Math.max(...currentDateEvents.map((event) => event.sortOrder)) + 1
    : 0;

  return [
    ...events,
    {
      id: input.id,
      date: input.date,
      content,
      sortOrder,
    },
  ];
}

export function updateCalendarEvent(
  events: CalendarEvent[],
  eventId: string,
  changes: CalendarEventChanges,
): CalendarEvent[] {
  return events.map((event) => {
    if (event.id !== eventId) return event;

    const content = changes.content?.trim();
    return {
      ...event,
      ...(content ? { content } : {}),
    };
  });
}

export function deleteCalendarEvent(
  events: CalendarEvent[],
  eventId: string,
): CalendarEvent[] {
  return events.filter((event) => event.id !== eventId);
}
