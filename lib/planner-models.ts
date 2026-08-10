export type CalendarEvent = {
  id: string;
  date: string;
  content: string;
  sortOrder: number;
};

export type WeeklyOnlyEvent = {
  id: string;
  date: string;
  weekStart: string;
  content: string;
  sortOrder: number;
};

export type WeeklyTask = {
  id: string;
  date: string;
  weekStart: string;
  content: string;
  isCompleted: boolean;
  sortOrder: number;
};

export type PlannerMedia = {
  id: string;
  date: string;
  kind: "photo" | "sticker";
  storagePath: string | null;
  stickerKey: string | null;
  previewUrl?: string;
};
