import type { PlannerMedia } from "./planner-models.ts";

export const PLANNER_STICKERS = [
  { key: "flower", label: "Pink flower" },
  { key: "star", label: "Happy star" },
  { key: "heart", label: "Pink heart" },
  { key: "rainbow", label: "Pastel rainbow" },
  { key: "cherry", label: "Cherries" },
  { key: "sparkles", label: "Sparkles" },
] as const;

export type PlannerStickerKey = (typeof PLANNER_STICKERS)[number]["key"];

export function isPlannerStickerKey(value: string | null): value is PlannerStickerKey {
  return PLANNER_STICKERS.some((sticker) => sticker.key === value);
}

export function appendPlannerMedia(
  media: PlannerMedia[],
  created: PlannerMedia,
) {
  return [...media, created];
}

export function removePlannerMedia(media: PlannerMedia[], mediaId: string) {
  return media.filter((item) => item.id !== mediaId);
}

export function plannerMediaForDate(
  media: PlannerMedia[],
  date: string,
  kind?: PlannerMedia["kind"],
) {
  return media.filter((item) => (
    item.date === date && (!kind || item.kind === kind)
  ));
}
