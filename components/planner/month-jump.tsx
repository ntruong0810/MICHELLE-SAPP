"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MONTH_LABELS, monthPath } from "@/lib/calendar";

type MonthJumpProps = {
  year: number;
  month: number;
};

export function MonthJump({ year, month }: MonthJumpProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const years = Array.from({ length: 21 }, (_, index) => year - 10 + index);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(monthPath(selectedYear, selectedMonth));
  }

  return (
    <form className="month-jump" action="/month" method="get" aria-label="Jump to month and year" onSubmit={handleSubmit}>
      <select name="month" aria-label="Month" value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
        {MONTH_LABELS.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
      </select>
      <select name="year" aria-label="Year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
        {years.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <button type="submit">
        Go
      </button>
    </form>
  );
}
