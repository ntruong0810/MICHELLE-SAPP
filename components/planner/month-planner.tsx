"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  adjacentMonth,
  buildMonthWeeks,
  MONTH_LABELS,
  monthPath,
  startOfWeek,
  toDateKey,
  WEEKDAY_LABELS,
  weekPath,
} from "@/lib/calendar";
import {
  appendCalendarEvent,
  deleteCalendarEvent,
  eventsForDate,
  updateCalendarEvent,
} from "@/lib/month-events";
import {
  createCalendarEvent as persistCreatedEvent,
  deleteCalendarEvent as persistDeletedEvent,
  loadCalendarEvents,
  monthGridDateRange,
  updateCalendarEvent as persistUpdatedEvent,
} from "@/lib/planner-data/calendar-events";
import type { CalendarEvent } from "@/lib/planner-models";
import { DayCell } from "./day-cell";
import type { MonthDraft, MonthDraftTarget } from "./day-cell";
import { DayMediaPanel } from "./day-media-panel";
import { FocusedDayOverlay } from "./focused-day-overlay";
import { MonthJump } from "./month-jump";
import { PlannerDecorations } from "./planner-decorations";
import { PlannerShell } from "./planner-shell";

type MonthPlannerProps = { year: number; month: number };

type SaveState = "idle" | "saving" | "saved" | "error";

type CalendarEventMutation =
  | { kind: "create"; event: CalendarEvent }
  | { kind: "update"; event: CalendarEvent }
  | { kind: "delete"; eventId: string };

export function MonthPlanner({ year, month }: MonthPlannerProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const eventsRef = useRef<CalendarEvent[]>([]);
  const [activeDraft, setActiveDraft] = useState<MonthDraft | null>(null);
  const activeDraftRef = useRef<MonthDraft | null>(null);
  const nextEventIdRef = useRef(1);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [mediaDate, setMediaDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadVersion, setLoadVersion] = useState(0);
  const mutationQueueRef = useRef<CalendarEventMutation[]>([]);
  const isFlushingMutationsRef = useRef(false);
  const isMountedRef = useRef(true);
  const weeks = buildMonthWeeks(year, month);
  const calendarDays = weeks.flatMap((week) => week.days);
  const calendarDayIndex = new Map(calendarDays.map((day, index) => [day.date, index]));
  const previous = adjacentMonth(year, month, -1);
  const next = adjacentMonth(year, month, 1);
  const today = new Date(Date.UTC(year, month - 1, Math.min(15, new Date(Date.UTC(year, month, 0)).getUTCDate())));
  const currentWeek = toDateKey(startOfWeek(today));

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const range = monthGridDateRange(year, month);

    queueMicrotask(() => {
      if (cancelled) return;
      activeDraftRef.current = null;
      setActiveDraft(null);
      eventsRef.current = [];
      setEvents([]);
      setFocusedDate(null);
      setMediaDate(null);
      setIsLoading(true);
      setSaveState("idle");

      loadCalendarEvents(range)
        .then((loadedEvents) => {
          if (cancelled) return;
          eventsRef.current = loadedEvents;
          setEvents(loadedEvents);
          setSaveState("saved");
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          console.error("[planner] calendar event load failed", error);
          setSaveState("error");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [year, month, loadVersion]);

  function replaceEvents(nextEvents: CalendarEvent[]) {
    eventsRef.current = nextEvents;
    setEvents(nextEvents);
  }

  function replaceActiveDraft(draft: MonthDraft | null) {
    activeDraftRef.current = draft;
    setActiveDraft(draft);
  }

  function changeDraftContent(content: string) {
    const draft = activeDraftRef.current;
    if (!draft) return;
    replaceActiveDraft({ ...draft, content });
  }

  function createLocalEventId() {
    return `event-${Date.now()}-${nextEventIdRef.current++}`;
  }

  function beginCreate(date: string) {
    if (isLoading) return;
    replaceActiveDraft({ kind: "create", date, content: "" });
  }

  function beginEdit(event: CalendarEvent) {
    replaceActiveDraft({
      kind: "edit",
      date: event.date,
      eventId: event.id,
      content: event.content,
    });
  }

  function moveKeyboardEntryToDate(date: string) {
    const firstEvent = eventsForDate(eventsRef.current, date)[0];
    if (firstEvent) beginEdit(firstEvent);
    else beginCreate(date);
  }

  function commitDraft(expectedDraft?: MonthDraftTarget) {
    const draft = activeDraftRef.current;
    if (!draft) return;
    if (expectedDraft?.kind === "create" && (
      draft.kind !== "create" || draft.date !== expectedDraft.date
    )) return;
    if (expectedDraft?.kind === "edit" && (
      draft.kind !== "edit" || draft.eventId !== expectedDraft.eventId
    )) return;
    replaceActiveDraft(null);

    if (draft.kind === "create") {
      const nextEvents = appendCalendarEvent(eventsRef.current, {
        id: createLocalEventId(),
        date: draft.date,
        content: draft.content,
      });
      if (nextEvents === eventsRef.current) return;

      const createdEvent = nextEvents.at(-1)!;
      replaceEvents(nextEvents);
      enqueueMutation({ kind: "create", event: createdEvent });
    } else {
      const currentEvent = eventsRef.current.find((event) => event.id === draft.eventId);
      if (!currentEvent || currentEvent.content === draft.content.trim()) return;

      const nextEvents = updateCalendarEvent(
        eventsRef.current,
        draft.eventId,
        { content: draft.content },
      );
      const updatedEvent = nextEvents.find((event) => event.id === draft.eventId)!;
      if (updatedEvent.content === currentEvent.content) return;
      replaceEvents(nextEvents);
      enqueueMutation({ kind: "update", event: updatedEvent });
    }
  }

  function deleteEvent(eventId: string) {
    replaceEvents(deleteCalendarEvent(eventsRef.current, eventId));
    const draft = activeDraftRef.current;
    if (draft?.kind === "edit" && draft.eventId === eventId) replaceActiveDraft(null);
    enqueueMutation({ kind: "delete", eventId });
  }

  function enqueueMutation(mutation: CalendarEventMutation) {
    mutationQueueRef.current.push(mutation);
    void flushMutationQueue();
  }

  function reconcileCreatedEvent(temporaryId: string, persistedEvent: CalendarEvent) {
    const currentEvents = eventsRef.current;
    if (currentEvents.some((event) => event.id === temporaryId)) {
      replaceEvents(currentEvents.map((event) => (
        event.id === temporaryId
          ? { ...event, id: persistedEvent.id }
          : event
      )));
    }

    const draft = activeDraftRef.current;
    if (draft?.kind === "edit" && draft.eventId === temporaryId) {
      replaceActiveDraft({ ...draft, eventId: persistedEvent.id });
    }

    mutationQueueRef.current = mutationQueueRef.current.map((queuedMutation, index) => {
      if (index === 0) return queuedMutation;
      if (queuedMutation.kind === "update" && queuedMutation.event.id === temporaryId) {
        return {
          ...queuedMutation,
          event: { ...queuedMutation.event, id: persistedEvent.id },
        };
      }
      if (queuedMutation.kind === "delete" && queuedMutation.eventId === temporaryId) {
        return { ...queuedMutation, eventId: persistedEvent.id };
      }
      return queuedMutation;
    });
  }

  async function persistMutation(mutation: CalendarEventMutation) {
    if (mutation.kind === "create") {
      const persistedEvent = await persistCreatedEvent(mutation.event);
      reconcileCreatedEvent(mutation.event.id, persistedEvent);
    } else if (mutation.kind === "update") {
      await persistUpdatedEvent(mutation.event);
    } else {
      await persistDeletedEvent(mutation.eventId);
    }
  }

  async function flushMutationQueue() {
    if (isFlushingMutationsRef.current || mutationQueueRef.current.length === 0) return;
    isFlushingMutationsRef.current = true;
    if (isMountedRef.current) setSaveState("saving");

    while (mutationQueueRef.current.length > 0) {
      try {
        await persistMutation(mutationQueueRef.current[0]);
        mutationQueueRef.current.shift();
      } catch {
        isFlushingMutationsRef.current = false;
        if (isMountedRef.current) setSaveState("error");
        return;
      }
    }

    isFlushingMutationsRef.current = false;
    if (isMountedRef.current) setSaveState("saved");
  }

  function retryPersistence() {
    if (mutationQueueRef.current.length > 0) {
      void flushMutationQueue();
    } else {
      setLoadVersion((current) => current + 1);
    }
  }

  const saveLabel = isLoading
    ? "Loading…"
    : saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Couldn’t save"
          : "";

  return (
    <PlannerShell activeView="month" monthHref={monthPath(year, month)} weekHref={weekPath(currentWeek)}>
      <div className="calendar-heading">
        <Link className="nav-arrow" href={monthPath(previous.year, previous.month)} aria-label="Previous month">‹</Link>
        <div>
          <p className="calendar-kicker">Monthly notes</p>
          <h1 className="calendar-title">{MONTH_LABELS[month - 1]} {year}</h1>
        </div>
        <Link className="nav-arrow" href={monthPath(next.year, next.month)} aria-label="Next month">›</Link>
      </div>
      <div className="month-tools">
        <MonthJump key={`${year}-${month}`} year={year} month={month} />
        <div className={`planner-save-state planner-save-state--${saveState}`} role="status" aria-live="polite">
          <span>{saveLabel}</span>
          {saveState === "error" && !isLoading ? (
            <button type="button" onClick={retryPersistence}>Retry</button>
          ) : null}
        </div>
      </div>
      <div className="month-calendar-stage">
        <PlannerDecorations view="month" />
        <div className="month-scroll">
          <div
            className="month-calendar"
            aria-label={`${MONTH_LABELS[month - 1]} ${year} calendar`}
            aria-busy={isLoading}
          >
            <div className="weekday-row" aria-hidden="true">
              {WEEKDAY_LABELS.map((day) => <div className="weekday-label" key={day}>{day}</div>)}
              <div />
            </div>
            {weeks.map((week) => (
              <div className="calendar-week" key={week.weekStart}>
                {week.days.map((day) => {
                  const dayEvents = eventsForDate(events, day.date);

                  return (
                    <DayCell
                      key={day.date}
                      day={day}
                      previousDate={calendarDays[(calendarDayIndex.get(day.date) ?? 0) - 1]?.date ?? null}
                      nextDate={calendarDays[(calendarDayIndex.get(day.date) ?? 0) + 1]?.date ?? null}
                      events={dayEvents}
                      activeDraft={activeDraft}
                      onBeginCreate={beginCreate}
                      onBeginEdit={beginEdit}
                      onDraftChange={changeDraftContent}
                      onCommitDraft={commitDraft}
                      onCancelDraft={() => replaceActiveDraft(null)}
                      onDeleteEvent={deleteEvent}
                      onMoveToDate={moveKeyboardEntryToDate}
                      onOpenFocusedDay={setFocusedDate}
                      onOpenMedia={setMediaDate}
                    />
                  );
                })}
                <div className="week-row-link-wrap">
                  <Link className="week-row-link" href={weekPath(week.weekStart)} aria-label={`Open week beginning ${week.weekStart}`}>
                    Week<br />→
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {focusedDate ? (
        <FocusedDayOverlay
          date={focusedDate}
          events={eventsForDate(events, focusedDate)}
          activeDraft={activeDraft}
          onClose={() => {
            commitDraft();
            setFocusedDate(null);
          }}
          onBeginCreate={beginCreate}
          onBeginEdit={beginEdit}
          onDraftChange={changeDraftContent}
          onCommitDraft={commitDraft}
          onCancelDraft={() => replaceActiveDraft(null)}
          onDeleteEvent={deleteEvent}
        />
      ) : null}
      {mediaDate ? (
        <DayMediaPanel date={mediaDate} onClose={() => setMediaDate(null)} />
      ) : null}
    </PlannerShell>
  );
}
