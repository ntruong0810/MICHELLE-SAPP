import type { WeeklyTask } from "../planner-models.ts";
import { plannerConnection } from "./connection.ts";

const WEEKLY_TASK_COLUMNS = "id,user_id,date,week_start,content,is_completed,sort_order,created_at,updated_at";

export type WeeklyTaskRow = {
  id: string;
  user_id: string;
  date: string;
  week_start: string;
  content: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type WeeklyTaskInsert = {
  user_id: string;
  date: string;
  week_start: string;
  content: string;
  is_completed: boolean;
  sort_order: number;
};

export function weeklyTaskFromRow(row: WeeklyTaskRow): WeeklyTask {
  return {
    id: row.id,
    date: row.date,
    weekStart: row.week_start,
    content: row.content,
    isCompleted: row.is_completed,
    sortOrder: row.sort_order,
  };
}

export function weeklyTaskToInsert(task: WeeklyTask, userId: string): WeeklyTaskInsert {
  return {
    user_id: userId,
    date: task.date,
    week_start: task.weekStart,
    content: task.content,
    is_completed: task.isCompleted,
    sort_order: task.sortOrder,
  };
}

function reportTaskError(operation: string, error: {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
  console.error(`[planner] weekly task ${operation} failed`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

export async function loadWeeklyTasks(weekStart: string) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("weekly_tasks")
    .select(WEEKLY_TASK_COLUMNS)
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    reportTaskError("load", error);
    throw error;
  }
  return (data as WeeklyTaskRow[]).map(weeklyTaskFromRow);
}

export async function createWeeklyTask(task: WeeklyTask) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("weekly_tasks")
    .insert(weeklyTaskToInsert(task, userId))
    .select(WEEKLY_TASK_COLUMNS)
    .single();

  if (error) {
    reportTaskError("create", error);
    throw error;
  }
  return weeklyTaskFromRow(data as WeeklyTaskRow);
}

export async function updateWeeklyTask(task: WeeklyTask) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("weekly_tasks")
    .update({ content: task.content, sort_order: task.sortOrder })
    .eq("id", task.id)
    .eq("user_id", userId)
    .select(WEEKLY_TASK_COLUMNS)
    .single();

  if (error) {
    reportTaskError("update", error);
    throw error;
  }
  return weeklyTaskFromRow(data as WeeklyTaskRow);
}

export async function toggleWeeklyTask(task: WeeklyTask) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("weekly_tasks")
    .update({ is_completed: task.isCompleted })
    .eq("id", task.id)
    .eq("user_id", userId)
    .select(WEEKLY_TASK_COLUMNS)
    .single();

  if (error) {
    reportTaskError("toggle", error);
    throw error;
  }
  return weeklyTaskFromRow(data as WeeklyTaskRow);
}

export async function deleteWeeklyTask(taskId: string) {
  const { client, userId } = await plannerConnection();
  const { error } = await client
    .from("weekly_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    reportTaskError("delete", error);
    throw error;
  }
}
