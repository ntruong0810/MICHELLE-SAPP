"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fromDateKey, MONTH_LABELS } from "@/lib/calendar";
import type { PlannerMedia } from "@/lib/planner-models";

type WeekPhotoStripProps = {
  date: string;
  photos: PlannerMedia[];
};

const MAX_STACKED_PHOTOS = 3;

export function WeekPhotoStrip({ date, photos }: WeekPhotoStripProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const availablePhotos = photos.filter((photo) => (
    photo.kind === "photo" && photo.previewUrl
  ));
  const stackedPhotos = availablePhotos.slice(-MAX_STACKED_PHOTOS);
  const parsedDate = fromDateKey(date)!;
  const dateLabel = `${MONTH_LABELS[parsedDate.getUTCMonth()]} ${parsedDate.getUTCDate()}, ${parsedDate.getUTCFullYear()}`;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]',
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (availablePhotos.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="week-photo-stack"
        style={{
          position: "relative",
          width: "min(100%, clamp(74px, 48cqh, 130px))",
          aspectRatio: "4 / 3",
        }}
        aria-label={`Open ${availablePhotos.length} ${availablePhotos.length === 1 ? "photo" : "photos"} for ${dateLabel}`}
        onClick={() => setIsOpen(true)}
      >
        {stackedPhotos.map((photo, index) => {
          const depth = stackedPhotos.length - index - 1;
          return (
            <span
              className="week-photo-stack-card"
              data-depth={depth}
              key={photo.id}
              style={{
                position: "absolute",
                inset: "7px 9px 5px 3px",
                zIndex: index + 1,
              }}
            >
              <Image
                className="week-photo-thumbnail"
                src={photo.previewUrl!}
                alt=""
                fill
                sizes="100px"
                unoptimized
              />
              {depth === 0 && availablePhotos.length > 1 ? (
                <span className="week-photo-more" aria-hidden="true">+{availablePhotos.length - 1}</span>
              ) : null}
            </span>
          );
        })}
      </button>

      {isOpen ? createPortal((
        <div
          className="week-photo-viewer-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            ref={dialogRef}
            className="week-photo-viewer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="week-photo-viewer-header">
              <div>
                <p>{dateLabel}</p>
                <h2 id={titleId}>Photos</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="week-photo-viewer-close"
                aria-label="Close photo gallery"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="week-photo-viewer-grid">
              {availablePhotos.map((photo, index) => (
                <a
                  className="week-photo-viewer-frame"
                  href={photo.previewUrl}
                  key={photo.id}
                  target="_blank"
                  rel="noreferrer"
                  style={{ position: "relative" }}
                  aria-label={`Open photo ${index + 1} in a new tab`}
                >
                  <Image
                    className="week-photo-viewer-image"
                    src={photo.previewUrl!}
                    alt={`Planner photo ${index + 1}`}
                    fill
                    sizes="(max-width: 700px) 88vw, 340px"
                    unoptimized
                  />
                </a>
              ))}
            </div>
          </section>
        </div>
      ), document.body) : null}
    </>
  );
}
