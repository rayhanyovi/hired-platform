"use client";

import { useState } from "react";
import { AlertCircle, CalendarClock, CalendarDays, CheckCheck, CircleCheck, Inbox, ListChecks, Plus, Search, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { dayStart, isOverdue, sydney, TODAY } from "@/lib/calendar";
import { useDesk } from "@/lib/store";
import type { Subject, SubjectKind, Task } from "@/lib/types";
import { TaskRow } from "../records/tasks";
import { inputClass, compactSelectClass } from "../ui/modal";
import { Segmented } from "../ui/menu";
import { StatCard, StatRow } from "../ui/metrics";
import { Page, PageHeader } from "../ui/page-header";
import { Button, cx } from "../ui/primitives";
import { Swap } from "../ui/swap";

type Source = "all" | SubjectKind | "general";
type Show = "open" | "done" | "all";

const DAY = 86_400_000;

/** Buckets by due date, in the order you'd work through them. */
const GROUPS: { id: string; label: string; icon: typeof Inbox; test: (t: Task) => boolean }[] = [
  { id: "overdue", label: "Overdue", icon: AlertCircle, test: (t) => !t.done && isOverdue(t.due) },
  { id: "today", label: "Today", icon: CalendarClock, test: (t) => !t.done && t.due !== undefined && dayStart(t.due) === TODAY },
  { id: "week", label: "Next 7 days", icon: CalendarDays, test: (t) => !t.done && t.due !== undefined && dayStart(t.due) > TODAY && dayStart(t.due) <= TODAY + 7 * DAY },
  { id: "later", label: "Later", icon: CalendarDays, test: (t) => !t.done && t.due !== undefined && dayStart(t.due) > TODAY + 7 * DAY },
  { id: "none", label: "No date", icon: Inbox, test: (t) => !t.done && t.due === undefined },
  { id: "done", label: "Done", icon: CircleCheck, test: (t) => t.done },
];

/**
 * Every task on the desk in one place, whatever it's about. By default it
 * shows everything; filter by what the task hangs off, who owns it, or status.
 */
export function TasksPage() {
  const { tasks, me } = useDesk();
  const [source, setSource] = useState<Source>("all");
  const [show, setShow] = useState<Show>("open");
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");

  const bySource = (t: Task) => source === "all" || (source === "general" ? !t.subject : t.subject?.kind === source);
  const scoped = tasks.filter((t) => (!mine || t.ownerId === me.id) && (!query || `${t.title} ${t.subject?.name ?? ""}`.toLowerCase().includes(query.toLowerCase())));
  const visible = scoped.filter(bySource).filter((t) => (show === "all" ? true : show === "done" ? t.done : !t.done));
  const open = scoped.filter((t) => !t.done);
  const count = (s: Source) => open.filter((t) => (s === "all" ? true : s === "general" ? !t.subject : t.subject?.kind === s)).length;

  return (
    <Page wide>
      <PageHeader eyebrow="Tasks" title="Everything you said you'd do.">
        Tasks from every client, prospect and candidate, in one list. Add them here or from any record; they show on Home and on the Calendar when they have a date.
      </PageHeader>

      <StatRow className="mb-6" cols={4} dataTour="tasks-stats">
        <StatCard icon={ListChecks} tile="bg-offers-tile" label="Open" value={open.length} sub="Across every record" />
        <StatCard icon={AlertCircle} tile="bg-calls-tile" label="Overdue" value={open.filter((t) => isOverdue(t.due)).length} warm={open.some((t) => isOverdue(t.due))} sub="Past their due date" />
        <StatCard icon={CalendarClock} tile="bg-submittals-tile" label="Due today" value={open.filter((t) => t.due !== undefined && dayStart(t.due) === TODAY).length} sub="Before 5pm" />
        <StatCard icon={CheckCheck} tile="bg-placements-tile" label="Done" value={scoped.filter((t) => t.done).length} sub="This session and before" />
      </StatRow>

      <AddTask />

      <div data-tour="tasks-filters" className="mb-4 flex flex-wrap items-center gap-2">
        <div className="max-w-full overflow-x-auto">
          <Segmented
            label="What it's about"
            value={source}
            onChange={setSource}
            options={[
              { id: "all", label: "All", count: count("all") },
              { id: "candidate", label: "Candidates", count: count("candidate") },
              { id: "client", label: "Clients", count: count("client") },
              { id: "prospect", label: "Prospects", count: count("prospect") },
              { id: "general", label: "General", count: count("general") },
            ]}
          />
        </div>
        <Segmented
          label="Status"
          value={show}
          onChange={setShow}
          options={[
            { id: "open", label: "Open" },
            { id: "done", label: "Done" },
            { id: "all", label: "All" },
          ]}
        />
        <button
          onClick={() => setMine(!mine)}
          aria-pressed={mine}
          className={cx("h-8 rounded-lg border px-3 text-[12px] transition-colors", mine ? "border-line-strong bg-raised text-fg" : "border-line text-fg-muted hover:text-fg")}
        >
          Only mine
        </button>
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" aria-label="Search tasks" className={cx(inputClass, "h-8 pl-8 text-[12px]")} />
        </div>
      </div>

      <Swap id={`${source}-${show}-${mine}`}>
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-12 text-center text-[13px] text-fg-faint">Nothing here. Add a task above or from any record.</p>
        ) : (
          <div data-tour="tasks-list" className="grid gap-4 lg:grid-cols-2">
            {GROUPS.map((g) => {
              const items = visible.filter(g.test).sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity) || b.priority - a.priority);
              if (!items.length) return null;
              return (
                <section key={g.id} className="rounded-2xl border border-line bg-surface">
                  <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                    <g.icon className={cx("size-[18px]", g.id === "overdue" ? "text-bad" : "text-fg-muted")} strokeWidth={1.75} />
                    <h2 className="text-[14px] font-medium">{g.label}</h2>
                    <span className="font-mono text-[12px] text-fg-faint num">{items.length}</span>
                  </header>
                  <ul className="divide-y divide-line px-4">
                    {items.map((t) => (
                      <TaskRow key={t.id} task={t} showSubject />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Swap>
    </Page>
  );
}

const PRIORITY = { 3: SignalHigh, 2: SignalMedium, 1: SignalLow } as const;
const DUE: [string, number | null][] = [
  ["Today", 0],
  ["Tomorrow", 1],
  ["In 3 days", 3],
  ["Next week", 7],
  ["No date", null],
];

/** Add a task from here, optionally about a record. */
function AddTask() {
  const { talent, addTask, notify, clients } = useDesk();
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [due, setDue] = useState("1");
  const [priority, setPriority] = useState<Task["priority"]>(2);
  const P = PRIORITY[priority];
  const people = talent;
  const subjects: Subject[] = [
    ...people.map((r): Subject => ({ kind: "candidate", id: r.key, name: r.name })),
    ...clients.map((c): Subject => ({ kind: c.status === "active" ? "client" : "prospect", id: c.id, name: c.name })),
  ];

  const save = () => {
    if (!title.trim()) return;
    const subject = subjects.find((s) => `${s.kind}:${s.id}` === about);
    addTask({ title: title.trim(), due: due === "none" ? undefined : sydney(Number(due), 17), priority, subject });
    notify(subject ? `Task added to ${subject.name}` : "Task added");
    setTitle("");
  };

  return (
    <div data-tour="tasks-add" className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2">
      <button
        type="button"
        onClick={() => setPriority(((priority % 3) + 1) as Task["priority"])}
        aria-label={`Priority ${priority}. Click to change.`}
        title="Priority"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg"
      >
        <P className="size-4" />
      </button>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Add a task…"
        aria-label="New task"
        className="h-8 min-w-[180px] flex-1 bg-transparent px-1 text-[13px] text-fg outline-none placeholder:text-fg-faint"
      />
      <select value={about} onChange={(e) => setAbout(e.target.value)} aria-label="About" className={cx(compactSelectClass, "max-w-[200px]")}>
        <option value="">General</option>
        {(["candidate", "client", "prospect"] as const).map((kind) => (
          <optgroup key={kind} label={kind === "candidate" ? "Candidates" : kind === "client" ? "Clients" : "Prospects"}>
            {subjects
              .filter((s) => s.kind === kind)
              .map((s) => (
                <option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>
                  {s.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <select value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due" className={compactSelectClass}>
        {DUE.map(([label, d]) => (
          <option key={label} value={d === null ? "none" : String(d)}>
            {label}
          </option>
        ))}
      </select>
      <Button size="sm" variant="primary" onClick={save} disabled={!title.trim()} className="h-8">
        <Plus className="size-3.5" /> Add
      </Button>
    </div>
  );
}
