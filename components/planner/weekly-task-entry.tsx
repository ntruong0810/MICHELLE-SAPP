import type { FocusEvent, KeyboardEvent } from "react";
import type { WeeklyTask } from "@/lib/planner-models";

type WeeklyTaskEntryProps = {
  task: WeeklyTask;
  isEditing: boolean;
  draftContent: string;
  disabled: boolean;
  onBeginEdit: () => void;
  onDraftChange: (content: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  onToggle: () => void;
  onDelete: () => void;
};

export function WeeklyTaskEntry({
  task,
  isEditing,
  draftContent,
  disabled,
  onBeginEdit,
  onDraftChange,
  onCommit,
  onCancel,
  onToggle,
  onDelete,
}: WeeklyTaskEntryProps) {
  function handleBlur(blurEvent: FocusEvent<HTMLInputElement>) {
    const row = blurEvent.currentTarget.closest(".week-task-row");
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
    <div className={`week-task-row${task.isCompleted ? " week-task-row--completed" : ""}`}>
      <input
        className="week-task-checkbox"
        type="checkbox"
        checked={task.isCompleted}
        disabled={disabled}
        aria-label={`Mark ${task.content} ${task.isCompleted ? "incomplete" : "complete"}`}
        onChange={onToggle}
      />
      {isEditing ? (
        <input
          autoFocus
          className="week-inline-input"
          aria-label={`Edit ${task.content}`}
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
          {task.content}
        </button>
      )}
      {!isEditing ? (
        <button
          type="button"
          className="week-inline-delete"
          disabled={disabled}
          aria-label={`Delete ${task.content}`}
          title="Delete task"
          onClick={onDelete}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
