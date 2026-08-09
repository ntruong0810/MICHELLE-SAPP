export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type CalendarDay = {
  date: string;
  dayNumber: number;
  weekday: number;
  isCurrentMonth: boolean;
};

export type CalendarWeek = {
  weekStart: string;
  days: CalendarDay[];
};

const DAY_MS = 86_400_000;

export function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * DAY_MS);
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getUTCDay());
}

export function buildMonthWeeks(year: number, month: number): CalendarWeek[] {
  assertMonth(year, month);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const gridStart = startOfWeek(first);
  const gridEnd = addDays(startOfWeek(last), 6);
  const weeks: CalendarWeek[] = [];

  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, weekday) => {
      const date = addDays(cursor, weekday);
      return {
        date: toDateKey(date),
        dayNumber: date.getUTCDate(),
        weekday,
        isCurrentMonth: date.getUTCFullYear() === year && date.getUTCMonth() === month - 1,
      };
    });
    weeks.push({ weekStart: days[0].date, days });
  }

  return weeks;
}

export function buildWeek(weekStart: string): CalendarWeek | null {
  const parsed = fromDateKey(weekStart);
  if (!parsed) return null;
  const sunday = startOfWeek(parsed);
  const days = Array.from({ length: 7 }, (_, weekday) => {
    const date = addDays(sunday, weekday);
    return {
      date: toDateKey(date),
      dayNumber: date.getUTCDate(),
      weekday,
      isCurrentMonth: true,
    };
  });
  return { weekStart: days[0].date, days };
}

export function adjacentMonth(year: number, month: number, offset: number) {
  assertMonth(year, month);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function adjacentWeek(weekStart: string, offset: number): string | null {
  const parsed = fromDateKey(weekStart);
  return parsed ? toDateKey(addDays(startOfWeek(parsed), offset * 7)) : null;
}

export function monthPath(year: number, month: number): string {
  return `/month/${year}/${String(month).padStart(2, "0")}`;
}

export function weekPath(weekStart: string): string {
  return `/week/${weekStart}`;
}

export function monthTitle(year: number, month: number): string {
  assertMonth(year, month);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

export function weekTitle(weekStart: string): string | null {
  const week = buildWeek(weekStart);
  if (!week) return null;
  const first = fromDateKey(week.days[0].date)!;
  const last = fromDateKey(week.days[6].date)!;
  const firstMonth = MONTH_LABELS[first.getUTCMonth()].slice(0, 3).toUpperCase();
  const lastMonth = MONTH_LABELS[last.getUTCMonth()].slice(0, 3).toUpperCase();
  const year = last.getUTCFullYear();
  if (first.getUTCMonth() === last.getUTCMonth()) {
    return `${firstMonth} ${first.getUTCDate()} – ${last.getUTCDate()}, ${year}`;
  }
  return `${firstMonth} ${first.getUTCDate()} – ${lastMonth} ${last.getUTCDate()}, ${year}`;
}

export function currentCalendarMonth(now = new Date()) {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function assertMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    throw new RangeError("Year must be between 1900 and 2200.");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("Month must be between 1 and 12.");
  }
}
