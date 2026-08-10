import assert from "node:assert/strict";
import test from "node:test";
import {
  plannerMediaFromRow,
  stickerMediaToInsert,
  type PlannerMediaRow,
} from "../lib/planner-data/planner-media.ts";
import {
  appendPlannerMedia,
  isPlannerStickerKey,
  plannerMediaForDate,
  removePlannerMedia,
} from "../lib/planner-media.ts";

const stickerRow: PlannerMediaRow = {
  id: "media-1",
  user_id: "user-1",
  date: "2026-08-20",
  kind: "sticker",
  storage_path: null,
  sticker_key: "flower",
  created_at: "2026-08-20T12:00:00.000Z",
};

test("maps planner media rows without leaking database-only fields", () => {
  assert.deepEqual(plannerMediaFromRow(stickerRow), {
    id: "media-1",
    date: "2026-08-20",
    kind: "sticker",
    storagePath: null,
    stickerKey: "flower",
    previewUrl: undefined,
  });
});

test("creates a sticker insert owned by the current planner user", () => {
  assert.deepEqual(stickerMediaToInsert("2026-08-20", "star", "user-1"), {
    user_id: "user-1",
    date: "2026-08-20",
    kind: "sticker",
    storage_path: null,
    sticker_key: "star",
  });
});

test("recognizes supported stickers and updates the gallery immutably", () => {
  const item = plannerMediaFromRow(stickerRow);
  const appended = appendPlannerMedia([], item);

  assert.equal(isPlannerStickerKey("flower"), true);
  assert.equal(isPlannerStickerKey("unknown"), false);
  assert.deepEqual(appended, [item]);
  assert.deepEqual(removePlannerMedia(appended, item.id), []);
  assert.deepEqual(appended, [item]);
});

test("selects photos for one Week day from the shared media collection", () => {
  const photo = plannerMediaFromRow({
    ...stickerRow,
    id: "photo-1",
    kind: "photo",
    storage_path: "user-1/2026-08-20/photo.jpg",
    sticker_key: null,
  }, "https://example.test/photo.jpg");
  const sticker = plannerMediaFromRow(stickerRow);

  assert.deepEqual(
    plannerMediaForDate([photo, sticker], "2026-08-20", "photo"),
    [photo],
  );
  assert.deepEqual(
    plannerMediaForDate([photo, sticker], "2026-08-21", "photo"),
    [],
  );
});
