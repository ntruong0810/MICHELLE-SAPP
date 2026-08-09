import { buildMonthWeeks } from "../calendar.ts";
import type { CalendarEvent, TextSize } from "../planner-models.ts";
import {
  ensureAnonymousPlannerUser,
  getSupabaseBrowserClient,
} from "../supabase/client.ts";

const EVENT_COLUMNS = "id,user_id,date,content,text_size,sort_order,created_at,updated_at";

export type CalendarEventRow = {
  id: string;
  user_id: string;
  date: string;
  content: string;
  text_size: TextSize;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CalendarEventInsert = {
  id: string;
  user_id: string;
  date: string;
  content: string;
  text_size: TextSize;
  sort_order: number;
};

export type CalendarEventUpdate = {
  date: string;
  content: string;
  text_size: TextSize;
  sort_order: number;
};

export type CalendarEventDateRange = {
  startDate: string;
  endDate: string;
};

export function calendarEventFromRow(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    content: row.content,
    textSize: row.text_size,
    sortOrder: row.sort_order,
  };
}

export function calendarEventToInsert(
  event: CalendarEvent,
  userId: string,
): CalendarEventInsert {
  return {
    id: event.id,
    user_id: userId,
    date: event.date,
    content: event.content,
    text_size: event.textSize,
    sort_order: event.sortOrder,
  };
}

export function calendarEventToUpdate(event: CalendarEvent): CalendarEventUpdate {
  return {
    date: event.date,
    content: event.content,
    text_size: event.textSize,
    sort_order: event.sortOrder,
  };
}

export function monthGridDateRange(year: number, month: number): CalendarEventDateRange {
  const weeks = buildMonthWeeks(year, month);
  return {
    startDate: weeks[0].days[0].date,
    endDate: weeks.at(-1)!.days[6].date,
  };
}

async function plannerConnection() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const userId = await ensureAnonymousPlannerUser(client);
  return { client, userId };
}

export async function loadCalendarEvents(range: CalendarEventDateRange) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("calendar_events")
    .select(EVENT_COLUMNS)
    .eq("user_id", userId)
    .gte("date", range.startDate)
    .lte("date", range.endDate)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as CalendarEventRow[]).map(calendarEventFromRow);
}

export async function createCalendarEvent(event: CalendarEvent) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("calendar_events")
    .upsert(calendarEventToInsert(event, userId), { onConflict: "id" })
    .select(EVENT_COLUMNS)
    .single();

  if (error) throw error;
  return calendarEventFromRow(data as CalendarEventRow);
}

export async function updateCalendarEvent(event: CalendarEvent) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("calendar_events")
    .update(calendarEventToUpdate(event))
    .eq("id", event.id)
    .eq("user_id", userId)
    .select(EVENT_COLUMNS)
    .single();

  if (error) throw error;
  return calendarEventFromRow(data as CalendarEventRow);
}

export async function deleteCalendarEvent(eventId: string) {
  const { client, userId } = await plannerConnection();
  const { error } = await client
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) throw error;
}
