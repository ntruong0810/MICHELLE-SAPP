import type { WeeklyOnlyEvent } from "../planner-models.ts";
import { plannerConnection } from "./connection.ts";

const WEEKLY_EVENT_COLUMNS = "id,user_id,date,week_start,content,sort_order,created_at,updated_at";

export type WeeklyOnlyEventRow = {
  id: string;
  user_id: string;
  date: string;
  week_start: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WeeklyOnlyEventInsert = {
  user_id: string;
  date: string;
  week_start: string;
  content: string;
  sort_order: number;
};

export function weeklyOnlyEventFromRow(row: WeeklyOnlyEventRow): WeeklyOnlyEvent {
  return {
    id: row.id,
    date: row.date,
    weekStart: row.week_start,
    content: row.content,
    sortOrder: row.sort_order,
  };
}

export function weeklyOnlyEventToInsert(
  event: WeeklyOnlyEvent,
  userId: string,
): WeeklyOnlyEventInsert {
  return {
    user_id: userId,
    date: event.date,
    week_start: event.weekStart,
    content: event.content,
    sort_order: event.sortOrder,
  };
}

function reportEventError(operation: string, error: {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
  console.error(`[planner] weekly-only event ${operation} failed`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

export async function loadWeeklyOnlyEvents(weekStart: string) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("weekly_only_events")
    .select(WEEKLY_EVENT_COLUMNS)
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    reportEventError("load", error);
    throw error;
  }
  return (data as WeeklyOnlyEventRow[]).map(weeklyOnlyEventFromRow);
}

export async function createWeeklyOnlyEvent(event: WeeklyOnlyEvent) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("weekly_only_events")
    .insert(weeklyOnlyEventToInsert(event, userId))
    .select(WEEKLY_EVENT_COLUMNS)
    .single();

  if (error) {
    reportEventError("create", error);
    throw error;
  }
  return weeklyOnlyEventFromRow(data as WeeklyOnlyEventRow);
}

export async function updateWeeklyOnlyEvent(event: WeeklyOnlyEvent) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("weekly_only_events")
    .update({ content: event.content, sort_order: event.sortOrder })
    .eq("id", event.id)
    .eq("user_id", userId)
    .select(WEEKLY_EVENT_COLUMNS)
    .single();

  if (error) {
    reportEventError("update", error);
    throw error;
  }
  return weeklyOnlyEventFromRow(data as WeeklyOnlyEventRow);
}

export async function deleteWeeklyOnlyEvent(eventId: string) {
  const { client, userId } = await plannerConnection();
  const { error } = await client
    .from("weekly_only_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) {
    reportEventError("delete", error);
    throw error;
  }
}
