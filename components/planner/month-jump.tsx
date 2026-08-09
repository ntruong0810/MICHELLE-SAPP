"use client";

import { useState } from "react";
import { MONTH_LABELS, monthPath } from "@/lib/calendar";

type MonthJumpProps = {
  year: number;
  month: number;
};

export function MonthJump({ year, month }: MonthJumpProps) {
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const years = Array.from({ length: 21 }, (_, index) => year - 10 + index);

  return (
    <div className="month-jump" aria-label="Jump to month and year">
      <select aria-label="Month" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
        {MONTH_LABELS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
      </select>
      <select aria-label="Year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
        {years.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <button type="button" onClick={() => { window.location.href = monthPath(selectedYear, selectedMonth); }}>
        Go
      </button>
    </div>
  );
}
