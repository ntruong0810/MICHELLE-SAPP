import { redirect } from "next/navigation";
import { currentCalendarMonth, monthPath } from "@/lib/calendar";

type MonthIndexPageProps = {
  searchParams: Promise<{
    month?: string | string[];
    year?: string | string[];
  }>;
};

function singleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function MonthIndexPage({ searchParams }: MonthIndexPageProps) {
  const params = await searchParams;
  const month = Number(singleValue(params.month));
  const year = Number(singleValue(params.year));

  if (
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year) &&
    year >= 1900 &&
    year <= 2200
  ) {
    redirect(monthPath(year, month));
  }

  const current = currentCalendarMonth();
  redirect(monthPath(current.year, current.month));
}
