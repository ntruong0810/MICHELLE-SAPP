import type { FocusEvent, KeyboardEvent } from "react";
import type { WeeklyOnlyEvent } from "@/lib/planner-models";

type WeekOnlyEventEntryProps = {
  event: WeeklyOnlyEvent;
  isEditing: boolean;
  draftContent: string;
  disabled: boolean;
  onBeginEdit: () => void;
  onDraftChange: (content: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function WeekOnlyEventEntry({
  event,
  isEditing,
  draftContent,
  disabled,
  onBeginEdit,
  onDraftChange,
  onCommit,
  onCancel,
  onDelete,
}: WeekOnlyEventEntryProps) {
  function handleBlur(blurEvent: FocusEvent<HTMLInputElement>) {
    const row = blurEvent.currentTarget.closest(".week-event-row");
    if (row?.contains(blurEvent.relatedTarget as Node | null)) return;
    onCommit();
  }

  function handleKeyDown(keyEvent: KeyboardEvent<HTMLInputElement>) {
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      onCommit();
    } else if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="week-event-row">
      <span className="week-entry-mark" aria-hidden="true">•</span>
      {isEditing ? (
        <input
          autoFocus
          className="week-inline-input"
          aria-label={`Edit ${event.content}`}
          value={draftContent}
          onBlur={handleBlur}
          onChange={(changeEvent) => onDraftChange(changeEvent.target.value)}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          className="week-inline-content"
          disabled={disabled}
          onClick={onBeginEdit}
        >
          {event.content}
        </button>
      )}
      {!isEditing ? (
        <button
          type="button"
          className="week-inline-delete"
          disabled={disabled}
          aria-label={`Delete ${event.content}`}
          title="Delete Week event"
          onClick={onDelete}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
