import type { WeeklyTask } from "./planner-models.ts";

type NewWeeklyTask = {
  id: string;
  date: string;
  weekStart: string;
  content: string;
};

type WeeklyTaskChanges = {
  content?: string;
  isCompleted?: boolean;
};

export function weeklyTasksForWeek(tasks: WeeklyTask[], weekStart: string): WeeklyTask[] {
  return tasks
    .filter((task) => task.weekStart === weekStart)
    .toSorted((left, right) => (
      left.date.localeCompare(right.date)
      || left.sortOrder - right.sortOrder
      || left.id.localeCompare(right.id)
    ));
}

export function weeklyTasksForDate(
  tasks: WeeklyTask[],
  weekStart: string,
  date: string,
): WeeklyTask[] {
  return weeklyTasksForWeek(tasks, weekStart).filter((task) => task.date === date);
}

export function appendWeeklyTask(tasks: WeeklyTask[], input: NewWeeklyTask): WeeklyTask[] {
  const content = input.content.trim();
  if (!content) return tasks;
  const dayTasks = weeklyTasksForDate(tasks, input.weekStart, input.date);
  const sortOrder = dayTasks.length
    ? Math.max(...dayTasks.map((task) => task.sortOrder)) + 1
    : 0;
  return [...tasks, { ...input, content, isCompleted: false, sortOrder }];
}

export function editWeeklyTask(
  tasks: WeeklyTask[],
  taskId: string,
  changes: WeeklyTaskChanges,
): WeeklyTask[] {
  const content = changes.content?.trim();
  if (changes.content !== undefined && !content) return tasks;
  return tasks.map((task) => task.id === taskId ? {
    ...task,
    ...(content ? { content } : {}),
    ...(changes.isCompleted === undefined ? {} : { isCompleted: changes.isCompleted }),
  } : task);
}

export function deleteWeeklyTask(tasks: WeeklyTask[], taskId: string): WeeklyTask[] {
  return tasks.filter((task) => task.id !== taskId);
}

export function replaceWeeklyTaskId(
  tasks: WeeklyTask[],
  temporaryId: string,
  persistedTask: WeeklyTask,
): WeeklyTask[] {
  return tasks.map((task) => task.id === temporaryId ? persistedTask : task);
}
