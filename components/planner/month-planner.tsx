import Link from "next/link";
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
import { MonthJump } from "./month-jump";
import { PlannerShell } from "./planner-shell";

type MonthPlannerProps = { year: number; month: number };

const SAMPLE_NOTES: Record<number, { content: string; tone?: string }> = {
  3: { content: "Coffee with Maya", tone: "sage" },
  8: { content: "Farmers market", tone: "blue" },
  14: { content: "Dinner at 7", tone: "" },
  20: { content: "Beach day", tone: "blue" },
  25: { content: "Call Mom", tone: "sage" },
};

export function MonthPlanner({ year, month }: MonthPlannerProps) {
  const weeks = buildMonthWeeks(year, month);
  const previous = adjacentMonth(year, month, -1);
  const next = adjacentMonth(year, month, 1);
  const today = new Date(Date.UTC(year, month - 1, Math.min(15, new Date(Date.UTC(year, month, 0)).getUTCDate())));
  const currentWeek = toDateKey(startOfWeek(today));

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
      <div className="month-tools"><MonthJump year={year} month={month} /></div>
      <div className="month-scroll">
        <div className="month-calendar" aria-label={`${MONTH_LABELS[month - 1]} ${year} calendar`}>
          <div className="weekday-row" aria-hidden="true">
            {WEEKDAY_LABELS.map((day) => <div className="weekday-label" key={day}>{day}</div>)}
            <div />
          </div>
          {weeks.map((week) => (
            <div className="calendar-week" key={week.weekStart}>
              {week.days.map((day) => {
                const note = day.isCurrentMonth ? SAMPLE_NOTES[day.dayNumber] : undefined;
                const dayTone = day.weekday === 0 ? "sunday" : day.weekday === 6 ? "saturday" : "";
                return (
                  <div className={`day-cell${day.isCurrentMonth ? "" : " outside"}`} key={day.date} aria-label={day.date}>
                    <span className={`day-number ${dayTone}`}>{day.dayNumber}</span>
                    {note ? <p className={`day-note ${note.tone ?? ""}`}>{note.content}</p> : null}
                  </div>
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
    </PlannerShell>
  );
}
