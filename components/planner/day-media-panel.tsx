"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { fromDateKey, MONTH_LABELS } from "@/lib/calendar";
import {
  deletePlannerMedia as persistDeletedMedia,
  loadPlannerMedia,
  uploadPlannerPhoto,
} from "@/lib/planner-data/planner-media";
import {
  appendPlannerMedia,
  isPlannerStickerKey,
  removePlannerMedia,
} from "@/lib/planner-media";
import type { PlannerMedia } from "@/lib/planner-models";
import { StickerArt } from "./sticker-art";

type DayMediaPanelProps = {
  date: string;
  onClose: () => void;
};

type MediaState = "loading" | "idle" | "saving" | "error";

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Couldn’t save this item. Please try again.";
}

function EmptyMediaIllustration() {
  return (
    <svg className="day-media-empty-art" viewBox="0 0 220 90" aria-hidden="true">
      <path d="M38 70c18-2 27-10 32-23 5 10 16 15 30 16 21 2 34 0 50-7 7 7 16 12 29 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M69 46c7-17 22-22 35-12 11-12 28-8 35 3 6 10 2 22-8 27-15 7-43 4-55-3-7-4-10-9-7-15Z" fill="#fff9ef" stroke="currentColor" strokeWidth="2" />
      <path d="M89 35c-6-15 4-23 17-11M117 34c7-15 18-17 21-4" fill="#fff9ef" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="96" cy="45" r="1.8" fill="currentColor" />
      <circle cx="118" cy="45" r="1.8" fill="currentColor" />
      <path d="M104 52q4 4 8 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M174 28c5-9 14-5 12 2-2 6-9 10-12 12-4-3-10-7-11-12-1-7 7-11 11-2Z" fill="none" stroke="#e7929c" strokeWidth="3" />
    </svg>
  );
}

export function DayMediaPanel({ date, onClose }: DayMediaPanelProps) {
  const [media, setMedia] = useState<PlannerMedia[]>([]);
  const [state, setState] = useState<MediaState>("loading");
  const [message, setMessage] = useState("");
  const titleId = useId();
  const photoInputId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const parsedDate = fromDateKey(date)!;
  const dateLabel = `${MONTH_LABELS[parsedDate.getUTCMonth()]} ${parsedDate.getUTCDate()}, ${parsedDate.getUTCFullYear()}`;

  useEffect(() => {
    let cancelled = false;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    queueMicrotask(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
      loadPlannerMedia(date)
        .then((items) => {
          if (cancelled) return;
          setMedia(items);
          setState("idle");
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setMessage(errorMessage(error));
          setState("error");
        });
    });

    return () => {
      cancelled = true;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [date]);

  useEffect(() => {
    function handleDialogKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), label[tabindex="0"]',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => document.removeEventListener("keydown", handleDialogKeyDown);
  }, [onClose]);

  async function addPhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setState("saving");
    setMessage("");
    try {
      const created = await uploadPlannerPhoto(date, file);
      setMedia((current) => appendPlannerMedia(current, created));
      setState("idle");
    } catch (error) {
      setMessage(errorMessage(error));
      setState("error");
    }
  }

  async function deleteMedia(item: PlannerMedia) {
    const previousMedia = media;
    setMedia((current) => removePlannerMedia(current, item.id));
    setState("saving");
    setMessage("");
    try {
      await persistDeletedMedia(item);
      setState("idle");
    } catch (error) {
      setMedia(previousMedia);
      setMessage(errorMessage(error));
      setState("error");
    }
  }

  function handlePhotoLabelKeyDown(event: KeyboardEvent<HTMLLabelElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    document.getElementById(photoInputId)?.click();
  }

  const isBusy = state === "loading" || state === "saving";

  return (
    <div
      className="day-media-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="day-media-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={isBusy}
      >
        <header className="day-media-header">
          <div>
            <p className="day-media-date">{dateLabel}</p>
            <h2 id={titleId}>Photos &amp; Stickers</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="day-media-close" aria-label="Close photos and stickers" onClick={onClose}>×</button>
        </header>

        <div className="day-media-body">
          <div className="day-media-actions">
            <input
              id={photoInputId}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isBusy}
              tabIndex={-1}
              onChange={(event) => void addPhoto(event)}
            />
            <label
              className="day-media-action"
              htmlFor={photoInputId}
              aria-disabled={isBusy}
              tabIndex={isBusy ? -1 : 0}
              onKeyDown={handlePhotoLabelKeyDown}
            >
              <span aria-hidden="true">＋</span> Add photo
            </label>
          </div>

          {state === "loading" ? <p className="day-media-status">Opening your little gallery…</p> : null}
          {message ? <p className="day-media-error" role="alert">{message}</p> : null}

          {state !== "loading" && media.length === 0 ? (
            <div className="day-media-empty">
              <EmptyMediaIllustration />
              <p>Add a photo or a tiny sticker to this day.</p>
            </div>
          ) : null}

          {media.length > 0 ? (
            <div className="day-media-gallery" aria-label={`Photos and stickers for ${dateLabel}`}>
              {media.map((item) => (
                <div className={`day-media-card day-media-card--${item.kind}`} key={item.id}>
                  {item.kind === "photo" && item.previewUrl ? (
                    <Image className="day-media-photo" src={item.previewUrl} alt="Planner photo" fill sizes="(max-width: 520px) 42vw, 150px" unoptimized />
                  ) : item.kind === "sticker" && isPlannerStickerKey(item.stickerKey) ? (
                    <StickerArt stickerKey={item.stickerKey} />
                  ) : (
                    <span className="day-media-missing">Preview unavailable</span>
                  )}
                  <button
                    type="button"
                    className="day-media-delete"
                    aria-label={`Delete ${item.kind}`}
                    disabled={isBusy}
                    onClick={() => void deleteMedia(item)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <p className="day-media-save-state" role="status" aria-live="polite">
            {state === "saving" ? "Saving…" : state === "idle" && media.length > 0 ? "Saved" : ""}
          </p>
        </div>
      </section>
    </div>
  );
}
