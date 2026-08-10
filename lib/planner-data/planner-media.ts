import type { PlannerMedia } from "../planner-models.ts";
import type { PlannerStickerKey } from "../planner-media.ts";
import { getSupabaseBrowserClient } from "../supabase/client.ts";
import { plannerConnection } from "./connection.ts";

const MEDIA_COLUMNS = "id,user_id,date,kind,storage_path,sticker_key,created_at";
const PHOTO_BUCKET = "planner-photos";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type PlannerMediaRow = {
  id: string;
  user_id: string;
  date: string;
  kind: "photo" | "sticker";
  storage_path: string | null;
  sticker_key: string | null;
  created_at: string;
};

export type PlannerMediaInsert = {
  user_id: string;
  date: string;
  kind: "photo" | "sticker";
  storage_path: string | null;
  sticker_key: string | null;
};

export type PlannerMediaDateRange = {
  startDate: string;
  endDate: string;
};

export function plannerMediaFromRow(
  row: PlannerMediaRow,
  previewUrl?: string,
): PlannerMedia {
  return {
    id: row.id,
    date: row.date,
    kind: row.kind,
    storagePath: row.storage_path,
    stickerKey: row.sticker_key,
    previewUrl,
  };
}

export function stickerMediaToInsert(
  date: string,
  stickerKey: PlannerStickerKey,
  userId: string,
): PlannerMediaInsert {
  return {
    user_id: userId,
    date,
    kind: "sticker",
    storage_path: null,
    sticker_key: stickerKey,
  };
}

function photoMediaToInsert(
  date: string,
  storagePath: string,
  userId: string,
): PlannerMediaInsert {
  return {
    user_id: userId,
    date,
    kind: "photo",
    storage_path: storagePath,
    sticker_key: null,
  };
}

async function photoPreviewUrl(storagePath: string) {
  const client = getSupabaseBrowserClient();
  if (!client) return undefined;
  const { data, error } = await client.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

async function withPhotoPreview(item: PlannerMedia) {
  if (item.kind !== "photo" || !item.storagePath) return item;
  return {
    ...item,
    previewUrl: await photoPreviewUrl(item.storagePath),
  };
}

export async function loadPlannerMediaRange(
  range: PlannerMediaDateRange,
  kind?: PlannerMedia["kind"],
) {
  const { client, userId } = await plannerConnection();
  let query = client
    .from("planner_media")
    .select(MEDIA_COLUMNS)
    .eq("user_id", userId)
    .gte("date", range.startDate)
    .lte("date", range.endDate);
  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  const items = (data as PlannerMediaRow[]).map((row) => plannerMediaFromRow(row));
  return Promise.all(items.map(async (item) => {
    try {
      return await withPhotoPreview(item);
    } catch {
      return item;
    }
  }));
}

export function loadPlannerMedia(date: string) {
  return loadPlannerMediaRange({ startDate: date, endDate: date });
}

function safePhotoExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{2,5}$/.test(extension)) return extension;
  return file.type === "image/png" ? "png" : "jpg";
}

function localPhotoName(file: File) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `photo-${Date.now()}-${suffix}.${safePhotoExtension(file)}`;
}

export async function uploadPlannerPhoto(date: string, file: File) {
  if (!PHOTO_TYPES.has(file.type)) {
    throw new Error("Please choose a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photos must be 8 MB or smaller.");
  }

  const { client, userId } = await plannerConnection();
  const storagePath = `${userId}/${date}/${localPhotoName(file)}`;
  const { error: uploadError } = await client.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await client
    .from("planner_media")
    .insert(photoMediaToInsert(date, storagePath, userId))
    .select(MEDIA_COLUMNS)
    .single();

  if (error) {
    await client.storage.from(PHOTO_BUCKET).remove([storagePath]);
    throw error;
  }

  return withPhotoPreview(plannerMediaFromRow(data as PlannerMediaRow));
}

export async function createPlannerSticker(
  date: string,
  stickerKey: PlannerStickerKey,
) {
  const { client, userId } = await plannerConnection();
  const { data, error } = await client
    .from("planner_media")
    .insert(stickerMediaToInsert(date, stickerKey, userId))
    .select(MEDIA_COLUMNS)
    .single();

  if (error) throw error;
  return plannerMediaFromRow(data as PlannerMediaRow);
}

export async function deletePlannerMedia(item: PlannerMedia) {
  const { client, userId } = await plannerConnection();
  const { error } = await client
    .from("planner_media")
    .delete()
    .eq("id", item.id)
    .eq("user_id", userId);
  if (error) throw error;

  if (item.kind === "photo" && item.storagePath) {
    const { error: storageError } = await client.storage
      .from(PHOTO_BUCKET)
      .remove([item.storagePath]);
    if (storageError) {
      console.error("[planner] orphaned photo cleanup failed", storageError);
    }
  }
}
