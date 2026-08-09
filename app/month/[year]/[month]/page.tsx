import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MonthPlanner } from "@/components/planner/month-planner";
import { monthTitle } from "@/lib/calendar";

type MonthPageProps = { params: Promise<{ year: string; month: string }> };

function parseMonth(params: { year: string; month: string }) {
  const year = Number(params.year);
  const month = Number(params.month);
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export async function generateMetadata({ params }: MonthPageProps): Promise<Metadata> {
  const parsed = parseMonth(await params);
  return { title: parsed ? monthTitle(parsed.year, parsed.month) : "Month" };
}

export default async function MonthPage({ params }: MonthPageProps) {
  const parsed = parseMonth(await params);
  if (!parsed) notFound();
  return <MonthPlanner year={parsed.year} month={parsed.month} />;
}
