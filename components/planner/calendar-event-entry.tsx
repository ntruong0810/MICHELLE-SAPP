import type { FocusEvent, KeyboardEvent } from "react";
import type { CalendarEvent } from "@/lib/planner-models";

type CalendarEventEntryProps = {
  event: CalendarEvent;
  isEditing: boolean;
  draftContent: string;
  onBeginEdit: () => void;
  onDraftChange: (content: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function CalendarEventEntry({
  event,
  isEditing,
  draftContent,
  onBeginEdit,
  onDraftChange,
  onCommit,
  onCancel,
  onDelete,
}: CalendarEventEntryProps) {
  if (!isEditing) {
    return (
      <div className="calendar-event-row">
        <button
          type="button"
          className={`calendar-event calendar-event--${event.textSize}`}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onBeginEdit();
          }}
        >
          {event.content}
        </button>
        <button
          type="button"
          className="calendar-event-delete"
          aria-label={`Delete ${event.content}`}
          title="Delete"
          onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onDelete();
          }}
        >
          ×
        </button>
      </div>
    );
  }

  function handleBlur(blurEvent: FocusEvent<HTMLInputElement>) {
    const editor = blurEvent.currentTarget.closest(".calendar-event-editor");
    if (editor?.contains(blurEvent.relatedTarget as Node | null)) return;
    onCommit();
  }

  function handleKeyDown(keyEvent: KeyboardEvent<HTMLInputElement>) {
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      onCommit();
    }
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="calendar-event-editor" onClick={(clickEvent) => clickEvent.stopPropagation()}>
      <input
        autoFocus
        className={`calendar-event-input calendar-event--${event.textSize}`}
        aria-label={`Edit ${event.content}`}
        value={draftContent}
        onBlur={handleBlur}
        onChange={(changeEvent) => onDraftChange(changeEvent.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
