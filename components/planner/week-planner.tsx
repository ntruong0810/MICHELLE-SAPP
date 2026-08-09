"use client";

import Link from "next/link";
import { useRef, useState } from "react";
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
import { PlannerShell } from "./planner-shell";

type WeekPlannerProps = { weekStart: string };

const SAMPLE_EVENTS: Record<number, string> = {
  1: "Coffee with Maya",
  3: "Dentist · 10am",
  5: "Movie night",
};

const SAMPLE_TASKS: Record<number, string> = {
  1: "Pick up flowers",
  2: "Call Mom",
  5: "Grocery list",
};

const MIN_EVENTS_PERCENT = 20;
const MAX_EVENTS_PERCENT = 80;

function clampEventsPercent(value: number) {
  return Math.min(MAX_EVENTS_PERCENT, Math.max(MIN_EVENTS_PERCENT, value));
}

export function WeekPlanner({ weekStart }: WeekPlannerProps) {
  const [eventsPercent, setEventsPercent] = useState(58);
  const [isResizing, setIsResizing] = useState(false);
  const activePointerRef = useRef<number | null>(null);
  const week = buildWeek(weekStart);
  if (!week) return null;
  const previous = adjacentWeek(week.weekStart, -1)!;
  const next = adjacentWeek(week.weekStart, 1)!;
  const middleDate = fromDateKey(week.days[3].date)!;
  const monthHref = monthPath(middleDate.getUTCFullYear(), middleDate.getUTCMonth() + 1);
  const weekSizingStyle = {
    "--week-events-track": `${eventsPercent}fr`,
    "--week-tasks-track": `${100 - eventsPercent}fr`,
  } as CSSProperties;

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
    if (activePointerRef.current !== pointerEvent.pointerId) return;
    resizeFromPointer(pointerEvent);
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
      <Link className="back-to-month" href={monthHref}>← Back to month</Link>
      <div className="week-scroll">
        <div
          className={`week-calendar${isResizing ? " week-calendar--resizing" : ""}`}
          aria-label={`Week of ${week.weekStart}`}
          style={weekSizingStyle}
        >
          {week.days.map((day) => {
            const date = fromDateKey(day.date)!;
            return (
              <section className="week-day" key={day.date} aria-label={day.date}>
                <header className="week-day-header">
                  <span className="week-day-name">{WEEKDAY_LABELS[day.weekday]}</span>
                  <span className="week-day-number">{day.dayNumber}</span>
                  <span className="week-day-name">{MONTH_LABELS[date.getUTCMonth()].slice(0, 3)}</span>
                </header>
                <div className="week-section week-events">
                  <p className="week-section-label">Events</p>
                  {SAMPLE_EVENTS[day.weekday] ? <p className="week-entry">{SAMPLE_EVENTS[day.weekday]}</p> : null}
                </div>
                <button
                  type="button"
                  className="week-resize-handle"
                  role="separator"
                  aria-label={`Adjust Events and Tasks height for the week from ${day.date}`}
                  aria-orientation="horizontal"
                  aria-valuemin={MIN_EVENTS_PERCENT}
                  aria-valuemax={MAX_EVENTS_PERCENT}
                  aria-valuenow={eventsPercent}
                  aria-valuetext={`${eventsPercent}% Events, ${100 - eventsPercent}% Tasks`}
                  onKeyDown={handleResizeKeyDown}
                  onPointerDown={handleResizePointerDown}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={finishResize}
                  onPointerCancel={finishResize}
                />
                <div className="week-section week-tasks">
                  <p className="week-section-label">Tasks</p>
                  {SAMPLE_TASKS[day.weekday] ? (
                    <p className="week-task"><span className="task-box" aria-hidden="true" />{SAMPLE_TASKS[day.weekday]}</p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </PlannerShell>
  );
}
