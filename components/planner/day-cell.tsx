import { useEffect, useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { CalendarDay } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/planner-models";
import { CalendarEventEntry } from "./calendar-event-entry";

export type MonthDraft =
  | { kind: "create"; date: string; content: string }
  | { kind: "edit"; date: string; eventId: string; content: string };

type DayCellProps = {
  day: CalendarDay;
  events: CalendarEvent[];
  activeDraft: MonthDraft | null;
  onBeginCreate: (date: string) => void;
  onBeginEdit: (event: CalendarEvent) => void;
  onDraftChange: (content: string) => void;
  onCommitDraft: () => void;
  onCancelDraft: () => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenFocusedDay: (date: string) => void;
};

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({
  day,
  events,
  activeDraft,
  onBeginCreate,
  onBeginEdit,
  onDraftChange,
  onCommitDraft,
  onCancelDraft,
  onDeleteEvent,
  onOpenFocusedDay,
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
            onCommit={onCommitDraft}
            onCancel={onCancelDraft}
            onDelete={() => onDeleteEvent(event.id)}
          />
        ))}
        {isCreating ? (
          <input
            autoFocus
            ref={draftInputRef}
            className="calendar-event-input calendar-event--medium"
            aria-label={`New event for ${day.date}`}
            placeholder="Write a note…"
            value={activeDraft.content}
            onBlur={onCommitDraft}
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
    </div>
  );
}
