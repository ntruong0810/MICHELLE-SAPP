"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import {
  adjacentWeek,
  buildWeek,
  fromDateKey,
  MONTH_LABELS,
  monthPath,
  WEEKDAY_LABELS,
  weekPath,
  weekTitle,
} from "@/lib/calendar";
import { loadCalendarEvents, weekDateRange } from "@/lib/planner-data/calendar-events";
import {
  createWeeklyOnlyEvent as persistCreatedWeeklyEvent,
  deleteWeeklyOnlyEvent as persistDeletedWeeklyEvent,
  loadWeeklyOnlyEvents,
  updateWeeklyOnlyEvent as persistUpdatedWeeklyEvent,
} from "@/lib/planner-data/weekly-only-events";
import {
  createWeeklyTask as persistCreatedTask,
  deleteWeeklyTask as persistDeletedTask,
  loadWeeklyTasks,
  toggleWeeklyTask as persistToggledTask,
  updateWeeklyTask as persistUpdatedTask,
} from "@/lib/planner-data/weekly-tasks";
import type { CalendarEvent, WeeklyOnlyEvent, WeeklyTask } from "@/lib/planner-models";
import {
  appendWeeklyOnlyEvent,
  deleteWeeklyOnlyEvent,
  editWeeklyOnlyEvent,
  resolveWeekEvents,
  weekEventsForDate,
} from "@/lib/weekly-only-events";
import {
  appendWeeklyTask,
  deleteWeeklyTask,
  editWeeklyTask,
  weeklyTasksForDate,
} from "@/lib/weekly-tasks";
import { PlannerShell } from "./planner-shell";
import { WeekOnlyEventEntry } from "./week-only-event-entry";
import { WeeklyTaskEntry } from "./weekly-task-entry";

type WeekPlannerProps = { weekStart: string };
type SaveState = "loading" | "idle" | "saving" | "saved" | "error";
type InlineDraft = { id: string; content: string };

const MIN_EVENTS_PERCENT = 20;
const MAX_EVENTS_PERCENT = 80;

function clampEventsPercent(value: number) {
  return Math.min(MAX_EVENTS_PERCENT, Math.max(MIN_EVENTS_PERCENT, value));
}

export function WeekPlanner({ weekStart }: WeekPlannerProps) {
  const [eventsPercent, setEventsPercent] = useState(58);
  const [isResizing, setIsResizing] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyOnlyEvent[]>([]);
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [newEventDrafts, setNewEventDrafts] = useState<Record<string, string>>({});
  const [newTaskDrafts, setNewTaskDrafts] = useState<Record<string, string>>({});
  const [activeEventDraft, setActiveEventDraft] = useState<InlineDraft | null>(null);
  const [activeTaskDraft, setActiveTaskDraft] = useState<InlineDraft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [errorKind, setErrorKind] = useState<"load" | "save" | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const [nextWeeklyEventId, setNextWeeklyEventId] = useState(1);
  const [nextTaskId, setNextTaskId] = useState(1);
  const retryActionRef = useRef<(() => void) | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const week = buildWeek(weekStart)!;
  const previous = adjacentWeek(week.weekStart, -1)!;
  const next = adjacentWeek(week.weekStart, 1)!;
  const middleDate = fromDateKey(week.days[3].date)!;
  const monthHref = monthPath(middleDate.getUTCFullYear(), middleDate.getUTCMonth() + 1);
  const displayedEvents = resolveWeekEvents(calendarEvents, weeklyEvents, weekStart);
  const isBusy = saveState === "loading" || saveState === "saving";
  const weekSizingStyle = {
    "--week-events-track": `${eventsPercent}fr`,
    "--week-tasks-track": `${100 - eventsPercent}fr`,
  } as CSSProperties;

  useEffect(() => {
    let cancelled = false;
    const range = weekDateRange(weekStart);
    if (!range) return;

    queueMicrotask(() => {
      if (cancelled) return;
      setCalendarEvents([]);
      setWeeklyEvents([]);
      setTasks([]);
      setNewEventDrafts({});
      setNewTaskDrafts({});
      setActiveEventDraft(null);
      setActiveTaskDraft(null);
      retryActionRef.current = null;
      setErrorKind(null);
      setSaveState("loading");

      Promise.allSettled([
        loadCalendarEvents(range),
        loadWeeklyOnlyEvents(weekStart),
        loadWeeklyTasks(weekStart),
      ]).then(([calendarResult, weeklyEventResult, taskResult]) => {
        if (cancelled) return;
        if (calendarResult.status === "fulfilled") {
          setCalendarEvents(calendarResult.value);
        } else {
          console.error("[planner] week calendar event load failed", calendarResult.reason);
        }
        if (weeklyEventResult.status === "fulfilled") setWeeklyEvents(weeklyEventResult.value);
        if (taskResult.status === "fulfilled") setTasks(taskResult.value);
        const failed = [calendarResult, weeklyEventResult, taskResult]
          .some((result) => result.status === "rejected");
        setErrorKind(failed ? "load" : null);
        setSaveState(failed ? "error" : "idle");
      });
    });

    return () => {
      cancelled = true;
    };
  }, [weekStart, loadVersion]);

  async function runSave<T>(
    operation: () => Promise<T>,
    onSuccess: (result: T) => void,
    onFailure: () => void,
    retry: () => void,
  ) {
    if (saveState === "saving") return;
    setSaveState("saving");
    try {
      onSuccess(await operation());
      retryActionRef.current = null;
      setErrorKind(null);
      setSaveState("saved");
    } catch {
      onFailure();
      retryActionRef.current = retry;
      setErrorKind("save");
      setSaveState("error");
    }
  }

  function saveCreatedEvent(event: WeeklyOnlyEvent) {
    void runSave(
      () => persistCreatedWeeklyEvent(event),
      (persisted) => setWeeklyEvents((current) => current.map((item) => (
        item.id === event.id ? persisted : item
      ))),
      () => {},
      () => saveCreatedEvent(event),
    );
  }

  function submitNewEvent(date: string) {
    if (isBusy) return;
    const nextEvents = appendWeeklyOnlyEvent(weeklyEvents, calendarEvents, {
      id: `weekly-event-${weekStart}-${date}-${nextWeeklyEventId}`,
      date,
      weekStart,
      content: newEventDrafts[date] ?? "",
    });
    if (nextEvents === weeklyEvents) return;
    const created = nextEvents.at(-1)!;
    setNextWeeklyEventId((current) => current + 1);
    setWeeklyEvents(nextEvents);
    setNewEventDrafts((current) => ({ ...current, [date]: "" }));
    saveCreatedEvent(created);
  }

  function commitEventEdit() {
    if (!activeEventDraft || isBusy) return;
    const current = weeklyEvents.find((event) => event.id === activeEventDraft.id);
    const nextEvents = editWeeklyOnlyEvent(
      weeklyEvents,
      activeEventDraft.id,
      activeEventDraft.content,
    );
    setActiveEventDraft(null);
    if (!current || nextEvents === weeklyEvents || current.content === activeEventDraft.content.trim()) return;
    const updated = nextEvents.find((event) => event.id === activeEventDraft.id)!;
    setWeeklyEvents(nextEvents);
    const save = () => void runSave(
      () => persistUpdatedWeeklyEvent(updated),
      (persisted) => setWeeklyEvents((items) => items.map((item) => item.id === persisted.id ? persisted : item)),
      () => {},
      save,
    );
    save();
  }

  function deleteEvent(event: WeeklyOnlyEvent, applyOptimistic = true) {
    if (applyOptimistic) setWeeklyEvents((current) => deleteWeeklyOnlyEvent(current, event.id));
    const save = () => void runSave(
      () => persistDeletedWeeklyEvent(event.id),
      () => {},
      () => setWeeklyEvents((current) => current.some((item) => item.id === event.id)
        ? current
        : [...current, event]),
      () => deleteEvent(event),
    );
    save();
  }

  function saveCreatedTask(task: WeeklyTask) {
    void runSave(
      () => persistCreatedTask(task),
      (persisted) => setTasks((current) => current.map((item) => item.id === task.id ? persisted : item)),
      () => {},
      () => saveCreatedTask(task),
    );
  }

  function submitNewTask(date: string) {
    if (isBusy) return;
    const nextTasks = appendWeeklyTask(tasks, {
      id: `weekly-task-${weekStart}-${date}-${nextTaskId}`,
      date,
      weekStart,
      content: newTaskDrafts[date] ?? "",
    });
    if (nextTasks === tasks) return;
    const created = nextTasks.at(-1)!;
    setNextTaskId((current) => current + 1);
    setTasks(nextTasks);
    setNewTaskDrafts((current) => ({ ...current, [date]: "" }));
    saveCreatedTask(created);
  }

  function commitTaskEdit() {
    if (!activeTaskDraft || isBusy) return;
    const current = tasks.find((task) => task.id === activeTaskDraft.id);
    const nextTasks = editWeeklyTask(tasks, activeTaskDraft.id, { content: activeTaskDraft.content });
    setActiveTaskDraft(null);
    if (!current || nextTasks === tasks || current.content === activeTaskDraft.content.trim()) return;
    const updated = nextTasks.find((task) => task.id === activeTaskDraft.id)!;
    setTasks(nextTasks);
    const save = () => void runSave(
      () => persistUpdatedTask(updated),
      (persisted) => setTasks((items) => items.map((item) => item.id === persisted.id ? persisted : item)),
      () => {},
      save,
    );
    save();
  }

  function toggleTask(task: WeeklyTask, applyOptimistic = true) {
    const updated = { ...task, isCompleted: !task.isCompleted };
    if (applyOptimistic) setTasks((current) => editWeeklyTask(current, task.id, {
      isCompleted: updated.isCompleted,
    }));
    const save = () => void runSave(
      () => persistToggledTask(updated),
      (persisted) => setTasks((items) => items.map((item) => item.id === persisted.id ? persisted : item)),
      () => setTasks((items) => editWeeklyTask(items, task.id, { isCompleted: task.isCompleted })),
      () => toggleTask(task),
    );
    save();
  }

  function deleteTask(task: WeeklyTask, applyOptimistic = true) {
    if (applyOptimistic) setTasks((current) => deleteWeeklyTask(current, task.id));
    const save = () => void runSave(
      () => persistDeletedTask(task.id),
      () => {},
      () => setTasks((current) => current.some((item) => item.id === task.id)
        ? current
        : [...current, task]),
      () => deleteTask(task),
    );
    save();
  }

  function retryLastOperation() {
    if (retryActionRef.current) retryActionRef.current();
    else setLoadVersion((current) => current + 1);
  }

  function resizeFromPointer(pointerEvent: PointerEvent<HTMLButtonElement>) {
    const day = pointerEvent.currentTarget.closest<HTMLElement>(".week-day");
    const header = day?.querySelector<HTMLElement>(".week-day-header");
    if (!day || !header) return;
    const dayBounds = day.getBoundingClientRect();
    const headerBounds = header.getBoundingClientRect();
    const handleHeight = pointerEvent.currentTarget.getBoundingClientRect().height;
    const writingHeight = dayBounds.height - headerBounds.height - handleHeight;
    if (writingHeight <= 0) return;
    const pointerOffset = pointerEvent.clientY - headerBounds.bottom - handleHeight / 2;
    setEventsPercent(clampEventsPercent(Math.round((pointerOffset / writingHeight) * 100)));
  }

  function handleResizePointerDown(pointerEvent: PointerEvent<HTMLButtonElement>) {
    pointerEvent.preventDefault();
    activePointerRef.current = pointerEvent.pointerId;
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    setIsResizing(true);
    resizeFromPointer(pointerEvent);
  }

  function handleResizePointerMove(pointerEvent: PointerEvent<HTMLButtonElement>) {
    if (activePointerRef.current === pointerEvent.pointerId) resizeFromPointer(pointerEvent);
  }

  function finishResize(pointerEvent: PointerEvent<HTMLButtonElement>) {
    if (activePointerRef.current !== pointerEvent.pointerId) return;
    activePointerRef.current = null;
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    setIsResizing(false);
  }

  function handleResizeKeyDown(keyEvent: KeyboardEvent<HTMLButtonElement>) {
    if (keyEvent.key === "ArrowUp") {
      keyEvent.preventDefault();
      setEventsPercent((current) => clampEventsPercent(current - 2));
    } else if (keyEvent.key === "ArrowDown") {
      keyEvent.preventDefault();
      setEventsPercent((current) => clampEventsPercent(current + 2));
    } else if (keyEvent.key === "Home") {
      keyEvent.preventDefault();
      setEventsPercent(MIN_EVENTS_PERCENT);
    } else if (keyEvent.key === "End") {
      keyEvent.preventDefault();
      setEventsPercent(MAX_EVENTS_PERCENT);
    }
  }

  return (
    <PlannerShell activeView="week" monthHref={monthHref} weekHref={weekPath(week.weekStart)}>
      <div className="calendar-heading">
        <Link className="nav-arrow" href={weekPath(previous)} aria-label="Previous week">‹</Link>
        <div>
          <p className="calendar-kicker">Weekly pages</p>
          <h1 className="calendar-title">{weekTitle(week.weekStart)}</h1>
        </div>
        <Link className="nav-arrow" href={weekPath(next)} aria-label="Next week">›</Link>
      </div>
      <div className="week-tools">
        <Link className="back-to-month" href={monthHref}>← Back to month</Link>
        <div className={`planner-save-state${saveState === "error" ? " planner-save-state--error" : ""}`} role="status" aria-live="polite">
          {saveState === "loading" ? <span>Loading…</span> : null}
          {saveState === "saving" ? <span>Saving…</span> : null}
          {saveState === "saved" ? <span>Saved</span> : null}
          {saveState === "error" ? (
            <><span>{errorKind === "save" ? "Couldn’t save" : "Couldn’t load"}</span><button type="button" onClick={retryLastOperation}>Retry</button></>
          ) : null}
        </div>
      </div>
      <div className="week-scroll">
        <div className={`week-calendar${isResizing ? " week-calendar--resizing" : ""}`} aria-label={`Week of ${week.weekStart}`} aria-busy={saveState === "loading"} style={weekSizingStyle}>
          {week.days.map((day) => {
            const date = fromDateKey(day.date)!;
            const dayEvents = weekEventsForDate(displayedEvents, day.date);
            return (
              <section className="week-day" key={day.date} aria-label={day.date}>
                <header className="week-day-header">
                  <span className="week-day-name">{WEEKDAY_LABELS[day.weekday]}</span>
                  <span className="week-day-number">{day.dayNumber}</span>
                  <span className="week-day-name">{MONTH_LABELS[date.getUTCMonth()].slice(0, 3)}</span>
                </header>
                <div className="week-section week-events">
                  <p className="week-section-label">Events</p>
                  <div className="week-inline-list">
                    {dayEvents.map((event) => event.origin === "calendar" ? (
                      <div className="week-event-row week-event-row--calendar" key={`calendar-${event.id}`}><span className="week-entry-mark" aria-hidden="true">•</span><span className="week-calendar-entry">{event.content}</span></div>
                    ) : (
                      <WeekOnlyEventEntry
                        key={`weekly-${event.id}`}
                        event={weeklyEvents.find((item) => item.id === event.id)!}
                        isEditing={activeEventDraft?.id === event.id}
                        draftContent={activeEventDraft?.id === event.id ? activeEventDraft.content : event.content}
                        disabled={isBusy}
                        onBeginEdit={() => setActiveEventDraft({ id: event.id, content: event.content })}
                        onDraftChange={(content) => setActiveEventDraft((draft) => draft ? { ...draft, content } : null)}
                        onCommit={commitEventEdit}
                        onCancel={() => setActiveEventDraft(null)}
                        onDelete={() => deleteEvent(weeklyEvents.find((item) => item.id === event.id)!)}
                      />
                    ))}
                    <form className="week-event-new" onSubmit={(submitEvent) => { submitEvent.preventDefault(); submitNewEvent(day.date); }}>
                      <span className="week-entry-mark" aria-hidden="true">•</span>
                      <input className="week-inline-input" aria-label={`New Week event for ${day.date}`} placeholder="Write an event…" value={newEventDrafts[day.date] ?? ""} onChange={(changeEvent) => setNewEventDrafts((current) => ({ ...current, [day.date]: changeEvent.target.value }))} onKeyDown={(keyEvent) => { if (keyEvent.key === "Escape") setNewEventDrafts((current) => ({ ...current, [day.date]: "" })); }} />
                    </form>
                  </div>
                </div>
                <button type="button" className="week-resize-handle" role="separator" aria-label={`Adjust Events and Tasks height for the week from ${day.date}`} aria-orientation="horizontal" aria-valuemin={MIN_EVENTS_PERCENT} aria-valuemax={MAX_EVENTS_PERCENT} aria-valuenow={eventsPercent} aria-valuetext={`${eventsPercent}% Events, ${100 - eventsPercent}% Tasks`} onKeyDown={handleResizeKeyDown} onPointerDown={handleResizePointerDown} onPointerMove={handleResizePointerMove} onPointerUp={finishResize} onPointerCancel={finishResize} />
                <div className="week-section week-tasks">
                  <p className="week-section-label">Tasks</p>
                  <div className="week-inline-list">
                    {weeklyTasksForDate(tasks, weekStart, day.date).map((task) => (
                      <WeeklyTaskEntry key={task.id} task={task} isEditing={activeTaskDraft?.id === task.id} draftContent={activeTaskDraft?.id === task.id ? activeTaskDraft.content : task.content} disabled={isBusy} onBeginEdit={() => setActiveTaskDraft({ id: task.id, content: task.content })} onDraftChange={(content) => setActiveTaskDraft((draft) => draft ? { ...draft, content } : null)} onCommit={commitTaskEdit} onCancel={() => setActiveTaskDraft(null)} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task)} />
                    ))}
                    <form className="week-task-new" onSubmit={(submitEvent) => { submitEvent.preventDefault(); submitNewTask(day.date); }}>
                      <span className="task-box" aria-hidden="true" />
                      <input className="week-inline-input" aria-label={`New task for ${day.date}`} placeholder="Write a task…" value={newTaskDrafts[day.date] ?? ""} onChange={(changeEvent) => setNewTaskDrafts((current) => ({ ...current, [day.date]: changeEvent.target.value }))} onKeyDown={(keyEvent) => { if (keyEvent.key === "Escape") setNewTaskDrafts((current) => ({ ...current, [day.date]: "" })); }} />
                    </form>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </PlannerShell>
  );
}
