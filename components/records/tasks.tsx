"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, CircleAlert, Plus, SignalHigh, SignalLow, SignalMedium, Target, UserRound, X } from "lucide-react";
import { dueLabel, isOverdue, sydney } from "@/lib/calendar";
import { useDesk } from "@/lib/store";
import type { Subject, Task } from "@/lib/types";
import { ActorAvatar } from "../ui/member";
import { cx } from "../ui/primitives";

export const PRIORITY_ICON = { 3: SignalHigh, 2: SignalMedium, 1: SignalLow } as const;
const PRIORITY_LABEL = { 3: "High", 2: "Medium", 1: "Low" } as const;

/** Opens whatever a task, note or message is about, on its own page. */
export function useOpenSubject() {
  const { setFocusPerson, setFocusProspect } = useDesk();
  const router = useRouter();
  return (s: Subject) => {
    if (s.kind === "candidate") {
      setFocusPerson(s.id);
      router.push("/candidates");
    } else if (s.kind === "prospect") {
      setFocusProspect(s.id);
      router.push("/prospects");
    } else router.push(`/clients/${s.id}`);
  };
}

export const SUBJECT_ICON = { candidate: UserRound, client: Building2, prospect: Target } as const;

export function SubjectChip({ subject, className }: { subject: Subject; className?: string }) {
  const open = useOpenSubject();
  const Icon = SUBJECT_ICON[subject.kind];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        open(subject);
      }}
      title={`Open ${subject.name}`}
      className={cx("inline-flex max-w-full min-w-0 items-center gap-1 rounded border border-line-strong px-1.5 py-px text-[11px] text-fg-muted transition-colors hover:border-fg/30 hover:text-fg", className)}
    >
      <Icon className="size-3 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{subject.name}</span>
    </button>
  );
}

const sortTasks = (a: Task, b: Task) => Number(a.done) - Number(b.done) || (a.due ?? Infinity) - (b.due ?? Infinity) || b.priority - a.priority;

/**
 * A task list with quick add. On a record it's scoped to that record; on Home
 * it shows everything, with a chip back to what each task is about.
 */
export function TaskList({
  tasks,
  subject,
  showSubject = false,
  emptyText = "No tasks yet. Add one to keep track of the next step.",
  addOpen,
  onAddOpenChange,
  defaultAdding = false,
  className,
}: {
  tasks: Task[];
  subject?: Subject;
  showSubject?: boolean;
  emptyText?: string;
  /** Lets a panel header own the "+" button. */
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
  /** Start with the quick-add box open, e.g. after "Add task" from a right-click menu. */
  defaultAdding?: boolean;
  className?: string;
}) {
  const [localAdd, setLocalAdd] = useState(defaultAdding);
  const adding = addOpen ?? localAdd;
  const setAdding = onAddOpenChange ?? setLocalAdd;
  const sorted = [...tasks].sort(sortTasks);

  return (
    <div className={className}>
      {adding ? (
        <QuickAdd subject={subject} onDone={() => setAdding(false)} />
      ) : (
        addOpen === undefined && (
          <button
            onClick={() => setAdding(true)}
            className="mb-2 flex h-9 w-full items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 text-[12px] text-fg-faint transition-colors hover:border-fg/30 hover:text-fg"
          >
            <Plus className="size-3.5" /> Add a task
          </button>
        )
      )}
      {sorted.length === 0 ? (
        !adding && <p className="px-1 py-6 text-center text-[12px] leading-relaxed text-fg-faint">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-line">
          {sorted.map((t) => (
            <TaskRow key={t.id} task={t} showSubject={showSubject} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function TaskRow({ task: t, showSubject }: { task: Task; showSubject?: boolean }) {
  const { toggleTask, removeTask } = useDesk();
  const P = PRIORITY_ICON[t.priority];
  const overdue = !t.done && isOverdue(t.due);
  return (
    <li className={cx("group flex items-start gap-3 py-2.5 transition-opacity", t.done && "opacity-45")}>
      <button
        role="checkbox"
        aria-checked={t.done}
        aria-label={`Done: ${t.title}`}
        onClick={() => toggleTask(t.id)}
        className={cx(
          "mt-px grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
          t.done ? "border-transparent bg-placements text-white" : "border-line-strong hover:border-fg/40",
        )}
      >
        {t.done && <Check className="size-3" strokeWidth={3} />}
      </button>
      <span className="min-w-0 flex-1">
        <span className={cx("block text-[13px] leading-snug text-fg", t.done && "line-through")}>{t.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fg-faint">
          {showSubject && t.subject && <SubjectChip subject={t.subject} />}
          <span className="inline-flex items-center gap-1" title={`${PRIORITY_LABEL[t.priority]} priority`}>
            <P className={cx("size-3.5", t.priority === 3 ? "text-fg-muted" : "text-fg-faint")} aria-hidden="true" />
            <span className="sr-only">{PRIORITY_LABEL[t.priority]} priority</span>
          </span>
          {t.due !== undefined && (
            <span className={cx("inline-flex items-center gap-1 num", overdue ? "text-bad" : dueLabel(t.due) === "Today" && !t.done ? "text-warm" : "")}>
              {overdue && <CircleAlert className="size-3" />}
              {dueLabel(t.due)}
            </span>
          )}
        </span>
      </span>
      <ActorAvatar id={t.ownerId} size="xs" />
      <button
        onClick={() => removeTask(t.id)}
        aria-label={`Remove ${t.title}`}
        className="grid size-5 shrink-0 place-items-center rounded text-fg-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-fg focus-visible:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

const DUE_OPTIONS: [string, number | undefined][] = [
  ["Today", 0],
  ["Tomorrow", 1],
  ["In 3 days", 3],
  ["Next week", 7],
  ["No date", undefined],
];

function QuickAdd({ subject, onDone }: { subject?: Subject; onDone: () => void }) {
  const { addTask, notify } = useDesk();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<number | undefined>(1);
  const [priority, setPriority] = useState<Task["priority"]>(2);
  const P = PRIORITY_ICON[priority];

  const save = () => {
    if (!title.trim()) return;
    const at = due === undefined ? undefined : sydney(due, 17);
    addTask({ title: title.trim(), due: at, priority, subject });
    notify(subject ? `Task added to ${subject.name}` : "Task added");
    setTitle("");
    onDone();
  };

  return (
    <div className="mb-2 rounded-lg border border-line-strong bg-ink-sunken p-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPriority(((priority % 3) + 1) as Task["priority"])}
          title={`${PRIORITY_LABEL[priority]} priority. Click to change.`}
          aria-label={`Priority: ${PRIORITY_LABEL[priority]}`}
          className="grid size-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
        >
          <P className="size-4" />
        </button>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") onDone();
          }}
          placeholder="Type your task…"
          aria-label="Task"
          className="h-7 min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-faint"
        />
      </div>
      <div className="mt-2 flex items-center gap-1.5 pl-9">
        <select
          value={due === undefined ? "none" : String(due)}
          onChange={(e) => setDue(e.target.value === "none" ? undefined : Number(e.target.value))}
          aria-label="Due"
          className="compact-select h-7 rounded-md border border-line-strong bg-surface px-2 text-[11px] text-fg-muted outline-none"
        >
          {DUE_OPTIONS.map(([label, d]) => (
            <option key={label} value={d === undefined ? "none" : String(d)}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={onDone} className="ml-auto h-7 rounded-md px-2.5 text-[12px] text-fg-muted hover:bg-hover hover:text-fg">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!title.trim()}
          className="h-7 rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
