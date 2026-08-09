import { MonthPlanner } from "@/components/planner/month-planner";
import { currentCalendarMonth } from "@/lib/calendar";

export default function Home() {
  const { year, month } = currentCalendarMonth();
  return <MonthPlanner year={year} month={month} />;
}
