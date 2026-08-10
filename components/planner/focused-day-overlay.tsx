import { useEffect } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { fromDateKey, MONTH_LABELS, WEEKDAY_LABELS } from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/planner-models";
import { CalendarEventEntry } from "./calendar-event-entry";
import type { MonthDraft } from "./day-cell";

type FocusedDayOverlayProps = {
  date: string;
  events: CalendarEvent[];
  activeDraft: MonthDraft | null;
  onClose: () => void;
  onBeginCreate: (date: string) => void;
  onBeginEdit: (event: CalendarEvent) => void;
  onDraftChange: (content: string) => void;
  onCommitDraft: () => void;
  onCancelDraft: () => void;
  onDeleteEvent: (eventId: string) => void;
};

export function FocusedDayOverlay({
  date,
  events,
  activeDraft,
  onClose,
  onBeginCreate,
  onBeginEdit,
  onDraftChange,
  onCommitDraft,
  onCancelDraft,
  onDeleteEvent,
}: FocusedDayOverlayProps) {
  const parsedDate = fromDateKey(date)!;
  const title = `${WEEKDAY_LABELS[parsedDate.getUTCDay()]}, ${MONTH_LABELS[parsedDate.getUTCMonth()]} ${parsedDate.getUTCDate()}`;
  const isCreating = activeDraft?.kind === "create" && activeDraft.date === date;

  useEffect(() => {
    function handleEscape(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape" && !activeDraft) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeDraft, onClose]);

  function handleCreateKeyDown(keyEvent: ReactKeyboardEvent<HTMLInputElement>) {
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
    <div
      className="focused-day-backdrop"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <section className="focused-day" role="dialog" aria-modal="true" aria-labelledby="focused-day-title">
        <header className="focused-day-header">
          <div>
            <p className="focused-day-kicker">Daily notes</p>
            <h2 id="focused-day-title">{title}</h2>
          </div>
          <button type="button" className="focused-day-close" aria-label="Close focused day" onClick={onClose}>×</button>
        </header>
        <div className="focused-day-events">
          {events.length === 0 && !isCreating ? <p className="focused-day-empty">A blank page for little plans.</p> : null}
          {events.map((event) => (
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
              className="calendar-event-input focused-day-new-event"
              aria-label={`New event for ${date}`}
              placeholder="Write a note…"
              value={activeDraft.content}
              onBlur={onCommitDraft}
              onChange={(changeEvent) => onDraftChange(changeEvent.target.value)}
              onKeyDown={handleCreateKeyDown}
            />
          ) : (
            <button type="button" className="focused-day-write-target" onClick={() => onBeginCreate(date)}>
              Click to write…
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
