import { useEffect, useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { CalendarDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/planner-models";
import { CalendarEventEntry } from "./calendar-event-entry";

export type MonthDraft =
  | { kind: "create"; date: string; content: string }
  | { kind: "edit"; date: string; eventId: string; content: string };

export type MonthDraftTarget =
  | { kind: "create"; date: string }
  | { kind: "edit"; eventId: string };

type DayCellProps = {
  day: CalendarDay;
  previousDate: string | null;
  nextDate: string | null;
  events: CalendarEvent[];
  activeDraft: MonthDraft | null;
  onBeginCreate: (date: string) => void;
  onBeginEdit: (event: CalendarEvent) => void;
  onDraftChange: (content: string) => void;
  onCommitDraft: (expectedDraft?: MonthDraftTarget) => void;
  onCancelDraft: () => void;
  onDeleteEvent: (eventId: string) => void;
  onMoveToDate: (date: string) => void;
  onOpenFocusedDay: (date: string) => void;
  onOpenMedia: (date: string) => void;
};

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({
  day,
  previousDate,
  nextDate,
  events,
  activeDraft,
  onBeginCreate,
  onBeginEdit,
  onDraftChange,
  onCommitDraft,
  onCancelDraft,
  onDeleteEvent,
  onMoveToDate,
  onOpenFocusedDay,
  onOpenMedia,
}: DayCellProps) {
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenCount = Math.max(0, events.length - MAX_VISIBLE_EVENTS);
  const isCreating = activeDraft?.kind === "create" && activeDraft.date === day.date;
  const dayTone = day.weekday === 0 ? "sunday" : day.weekday === 6 ? "saturday" : "";
  const draftInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreating) return;
    const input = draftInputRef.current;
    input?.focus({ preventScroll: true });
    input?.setSelectionRange(input.value.length, input.value.length);
  }, [isCreating]);

  function handleWritingAreaPointerDown(pointerEvent: PointerEvent<HTMLDivElement>) {
    const target = pointerEvent.target as HTMLElement;
    if (target.closest("button, input")) return;

    pointerEvent.preventDefault();
    if (isCreating) {
      draftInputRef.current?.focus({ preventScroll: true });
      return;
    }
    if (activeDraft) onCommitDraft();
    onBeginCreate(day.date);
  }

  function handleCreateKeyDown(keyEvent: KeyboardEvent<HTMLInputElement>) {
    if (keyEvent.key === "Tab") {
      const adjacentDate = keyEvent.shiftKey ? previousDate : nextDate;
      if (!adjacentDate) return;

      keyEvent.preventDefault();
      onCommitDraft({ kind: "create", date: day.date });
      onMoveToDate(adjacentDate);
      return;
    }

    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      onCommitDraft();
    }
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      onCancelDraft();
    }
  }

  return (
    <div className={`day-cell${day.isCurrentMonth ? "" : " outside"}`} aria-label={day.date}>
      <span className={`day-number ${dayTone}`}>{day.dayNumber}</span>
      <div className="day-writing-area" onPointerDown={handleWritingAreaPointerDown}>
        {visibleEvents.map((event) => (
          <CalendarEventEntry
            key={event.id}
            event={event}
            isEditing={activeDraft?.kind === "edit" && activeDraft.eventId === event.id}
            draftContent={activeDraft?.kind === "edit" && activeDraft.eventId === event.id ? activeDraft.content : event.content}
            onBeginEdit={() => onBeginEdit(event)}
            onDraftChange={onDraftChange}
            onCommit={() => onCommitDraft({ kind: "edit", eventId: event.id })}
            onCancel={onCancelDraft}
            onDelete={() => onDeleteEvent(event.id)}
            onTabPrevious={previousDate ? () => onMoveToDate(previousDate) : undefined}
            onTabNext={nextDate ? () => onMoveToDate(nextDate) : undefined}
          />
        ))}
        {isCreating ? (
          <input
            autoFocus
            ref={draftInputRef}
            className="calendar-event-input"
            aria-label={`New event for ${day.date}`}
            placeholder="Write a note…"
            value={activeDraft.content}
            onBlur={() => onCommitDraft({ kind: "create", date: day.date })}
            onChange={(changeEvent) => onDraftChange(changeEvent.target.value)}
            onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
            onKeyDown={handleCreateKeyDown}
          />
        ) : null}
        {hiddenCount > 0 ? (
          <button
            type="button"
            className="day-overflow"
            onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
            onClick={() => onOpenFocusedDay(day.date)}
          >
            {hiddenCount} more…
          </button>
        ) : null}
        {!isCreating ? <span className="day-write-prompt">Write here</span> : null}
      </div>
      <button
        type="button"
        className="day-media-trigger"
        aria-label={`Open photos and stickers for ${day.date}`}
        title="Photos & Stickers"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onOpenMedia(day.date)}
      >
        <span aria-hidden="true">✿</span>
      </button>
    </div>
  );
}
