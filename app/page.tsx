import { currentCalendarMonth, monthPath } from "@/lib/calendar";
import { redirect } from "next/navigation";

export default function Home() {
  const { year, month } = currentCalendarMonth();
  redirect(monthPath(year, month));
}
