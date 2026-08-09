import Link from "next/link";
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

export function WeekPlanner({ weekStart }: WeekPlannerProps) {
  const week = buildWeek(weekStart);
  if (!week) return null;
  const previous = adjacentWeek(week.weekStart, -1)!;
  const next = adjacentWeek(week.weekStart, 1)!;
  const middleDate = fromDateKey(week.days[3].date)!;
  const monthHref = monthPath(middleDate.getUTCFullYear(), middleDate.getUTCMonth() + 1);

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
        <div className="week-calendar" aria-label={`Week of ${week.weekStart}`}>
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
