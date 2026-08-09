export type TextSize = "small" | "medium" | "large" | "xlarge";

export type CalendarEvent = {
  id: string;
  date: string;
  content: string;
  textSize: TextSize;
  sortOrder: number;
};

export type WeeklyEventState = {
  sourceEventId: string;
  weekStart: string;
  status: "overridden" | "hidden";
  localContent?: string;
  localTextSize?: TextSize;
};

export type WeeklyOnlyEvent = {
  id: string;
  date: string;
  weekStart: string;
  content: string;
  textSize: TextSize;
  sortOrder: number;
};

export type WeeklyTask = {
  id: string;
  date: string;
  content: string;
  isCompleted: boolean;
  sortOrder: number;
};

export type PlannerMedia = {
  id: string;
  date: string;
  eventId?: string;
  kind: "photo" | "sticker";
  storagePath: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
};
