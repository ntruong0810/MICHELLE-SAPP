import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WeekPlanner } from "@/components/planner/week-planner";
import { buildWeek, weekTitle } from "@/lib/calendar";

type WeekPageProps = { params: Promise<{ weekStart: string }> };

export async function generateMetadata({ params }: WeekPageProps): Promise<Metadata> {
  const { weekStart } = await params;
  return { title: weekTitle(weekStart) ?? "Week" };
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { weekStart } = await params;
  const week = buildWeek(weekStart);
  if (!week) notFound();
  return <WeekPlanner weekStart={week.weekStart} />;
}
