"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ListChecks, Check, ChevronLeft, ChevronRight, Clock, MapPin, Plus, UsersRound, X } from "lucide-react";
import {
  addDays,
  CALENDAR_KINDS,
  dayLabel,
  dayStart,
  fromInputs,
  kindStyle,
  monthLabel,
  parts,
  sameDay,
  timeLabel,
  toDateInput,
  TODAY,
  weekdayShort,
  weekStart,
} from "@/lib/calendar";
import { memberName, useDesk } from "@/lib/store";
import { NOW_MS } from "@/lib/time";
import type { CalendarEvent, CalendarKind, Subject, Task } from "@/lib/types";
import { SubjectChip } from "../records/tasks";
import { Field, inputClass, Modal } from "../ui/modal";
import { Segmented } from "../ui/menu";
import { Page } from "../ui/page-header";
import { Swap } from "../ui/swap";
import { Button, cx } from "../ui/primitives";

type View = "day" | "week" | "month";
type Kind = CalendarKind | "task";
type Item = { id: string; kind: Kind; title: string; start: number; minutes: number; allDay: boolean; event?: CalendarEvent; task?: Task };

const FIRST_HOUR = 7;
const LAST_HOUR = 21;
const HOUR_PX = 52;

/** Calendar: interviews, meetings, calls, follow-ups and start dates, with tasks on the day they're due. */
export function CalendarPage() {
  const { calendar, tasks, me } = useDesk();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(TODAY);
  const [hidden, setHidden] = useState<Kind[]>([]);
  const [mine, setMine] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [creating, setCreating] = useState<number | null>(null);

  const items: Item[] = [
    ...calendar.map((e): Item => ({ id: e.id, kind: e.kind, title: e.title, start: e.start, minutes: e.minutes, allDay: !!e.allDay, event: e })),
    ...tasks.filter((t) => t.due !== undefined).map((t): Item => ({ id: t.id, kind: "task", title: t.title, start: t.due!, minutes: 0, allDay: true, task: t })),
  ].filter((i) => !hidden.includes(i.kind) && (!mine || (i.event?.ownerId ?? i.task?.ownerId) === me.id));

  const step = (dir: 1 | -1) => {
    if (view === "day") setAnchor(addDays(anchor, dir));
    else if (view === "week") setAnchor(addDays(anchor, dir * 7));
    else {
      const p = parts(anchor);
      setAnchor(dayStart(Date.UTC(p.y, p.m + dir, 1, 12) - 11 * 3_600_000));
    }
  };

  const days = view === "day" ? [dayStart(anchor)] : Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i));
  const title =
    view === "month"
      ? monthLabel(anchor)
      : view === "day"
        ? dayLabel(anchor)
        : `${parts(days[0]).d} ${monthLabel(days[0]).split(" ")[0].slice(0, 3)} – ${parts(days[6]).d} ${monthLabel(days[6])}`;

  return (
    <Page wide>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">{title}</h1>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => setAnchor(TODAY)}>
            Today
          </Button>
          <button onClick={() => step(-1)} aria-label="Previous" className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => step(1)} aria-label="Next" className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented
            label="Calendar view"
            value={view}
            onChange={setView}
            options={[
              { id: "day", label: "Day" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
            ]}
          />
          <Button size="sm" variant="primary" onClick={() => setCreating(sameDay(anchor, TODAY) ? NOW_MS : anchor)}>
            <Plus className="size-3.5" /> New event
          </Button>
        </div>
      </div>

      <div data-tour="calendar-filters" className="mb-4 flex flex-wrap items-center gap-1.5">
        {CALENDAR_KINDS.map((k) => {
          const on = !hidden.includes(k.id);
          return (
            <button
              key={k.id}
              aria-pressed={on}
              onClick={() => setHidden(on ? [...hidden, k.id] : hidden.filter((x) => x !== k.id))}
              className={cx(
                "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] transition-colors",
                on ? "border-line-strong bg-surface text-fg-muted hover:text-fg" : "border-line text-fg-faint line-through decoration-fg-faint/60",
              )}
            >
              <span className={cx("size-2 rounded-full", k.dot, !on && "opacity-30")} />
              {k.label}
            </button>
          );
        })}
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[12px] text-fg-muted">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="accent-[var(--color-fg)]" />
          Only mine
        </label>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Swap id={view} className="min-w-0">
          {view === "month" ? (
            <MonthGrid
              anchor={anchor}
              items={items}
              onPick={setSelected}
              onDay={(d) => {
                setAnchor(d);
                setView("day");
              }}
            />
          ) : (
            <TimeGrid
              days={days}
              items={items}
              onPick={setSelected}
              onSlot={setCreating}
              onDay={(d) => {
                setAnchor(d);
                setView("day");
              }}
            />
          )}
        </Swap>
        <aside className="min-w-0 space-y-4">
          {selected ? <Details item={selected} onClose={() => setSelected(null)} /> : <Upcoming items={items} onPick={setSelected} />}
        </aside>
      </div>

      {creating !== null && <NewEvent at={creating} onClose={() => setCreating(null)} />}
    </Page>
  );
}

/* ── Week and day ─────────────────────────────────────────────────── */

/** Side-by-side lanes for events that overlap on the same day. */
function lanes(list: Item[]) {
  const sorted = [...list].sort((a, b) => a.start - b.start);
  const out = new Map<string, { lane: number; of: number }>();
  let group: Item[] = [];
  let groupEnd = 0;
  const flush = () => {
    const ends: number[] = [];
    for (const it of group) {
      let lane = ends.findIndex((e) => e <= it.start);
      if (lane === -1) lane = ends.length;
      ends[lane] = it.start + Math.max(it.minutes, 20) * 60_000;
      out.set(it.id, { lane, of: 0 });
    }
    for (const it of group) out.get(it.id)!.of = ends.length;
    group = [];
  };
  for (const it of sorted) {
    if (group.length && it.start >= groupEnd) flush();
    group.push(it);
    groupEnd = Math.max(groupEnd, it.start + Math.max(it.minutes, 20) * 60_000);
  }
  flush();
  return out;
}

function TimeGrid({ days, items, onPick, onSlot, onDay }: { days: number[]; items: Item[]; onPick: (i: Item) => void; onSlot: (at: number) => void; onDay: (d: number) => void }) {
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i);
  const now = parts(NOW_MS);
  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;
  return (
    <div data-tour="calendar-grid" className="overflow-x-auto rounded-xl border border-line bg-surface">
      <div className={days.length > 1 ? "min-w-[760px]" : undefined}>
        <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
          <span className="px-2 py-2 text-[10px] text-fg-faint">AEDT</span>
          {days.map((d) => {
            const today = sameDay(d, TODAY);
            return (
              <div key={d} className="border-l border-line px-2 py-2 text-center">
                <div className="text-[11px] text-fg-faint">{weekdayShort(parts(d).wd)}</div>
                <div className={cx("mx-auto mt-0.5 grid size-7 place-items-center rounded-full text-[14px] num", today ? "bg-primary font-semibold text-primary-foreground" : "text-fg")}>{parts(d).d}</div>
              </div>
            );
          })}
        </div>
        {/* All-day: start dates and tasks due. */}
        <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
          <span className="px-2 py-1.5 text-[10px] text-fg-faint">All day</span>
          {days.map((d) => {
            // Start dates first, then tasks. A busy day collapses so the hours stay in view.
            const all = items.filter((i) => i.allDay && sameDay(i.start, d)).sort((a, b) => Number(!!a.task) - Number(!!b.task));
            const cap = days.length === 1 ? all.length : 2;
            return (
              <div key={d} className="min-h-8 space-y-1 border-l border-line p-1">
                {all.slice(0, cap).map((i) => (
                  <Chip key={i.id} item={i} onPick={onPick} />
                ))}
                {all.length > cap && (
                  <button onClick={() => onDay(d)} className="px-1 text-[11px] text-fg-faint hover:text-fg">
                    +{all.length - cap} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="relative grid max-h-[620px] overflow-y-auto" style={{ gridTemplateColumns: cols }}>
          <div>
            {hours.map((h) => (
              <div key={h} className="relative pr-2 text-right font-mono text-[10px] text-fg-faint" style={{ height: HOUR_PX }}>
                <span className="relative -top-1.5">{h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`}</span>
              </div>
            ))}
          </div>
          {days.map((d) => {
            const timed = items.filter((i) => !i.allDay && sameDay(i.start, d));
            const layout = lanes(timed);
            const today = sameDay(d, TODAY);
            return (
              <div key={d} className={cx("relative border-l border-line", today && "bg-white/[0.015]")}>
                {hours.map((h) => (
                  <button
                    key={h}
                    onClick={() => onSlot(d + h * 3_600_000)}
                    aria-label={`New event ${dayLabel(d)} at ${h}:00`}
                    className="block w-full border-b border-line/60 transition-colors hover:bg-white/[0.02]"
                    style={{ height: HOUR_PX }}
                  />
                ))}
                {today && now.h >= FIRST_HOUR && now.h < LAST_HOUR && (
                  <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: (now.h - FIRST_HOUR + now.min / 60) * HOUR_PX }}>
                    <span className="-ml-1 size-2 rounded-full bg-brand" />
                    <span className="h-px flex-1 bg-brand/70" />
                  </div>
                )}
                {timed.map((i) => {
                  const p = parts(i.start);
                  const top = Math.max(0, (p.h - FIRST_HOUR + p.min / 60) * HOUR_PX);
                  const height = Math.max(22, (i.minutes / 60) * HOUR_PX - 2);
                  const { lane, of } = layout.get(i.id)!;
                  const k = kindStyle(i.kind);
                  return (
                    <button
                      key={i.id}
                      onClick={() => onPick(i)}
                      className={cx("absolute z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left transition-[filter] hover:brightness-125", k.chip)}
                      style={{ top, height, left: `calc(${(lane / of) * 100}% + 2px)`, width: `calc(${100 / of}% - 4px)` }}
                    >
                      <span className="flex items-center gap-1 truncate text-[11px] leading-tight font-medium">
                        <span className={cx("size-1.5 shrink-0 rounded-full", k.dot)} />
                        <span className="truncate">{i.title}</span>
                      </span>
                      {height > 34 && <span className="block truncate font-mono text-[10px] text-fg-muted">{timeLabel(i.start)} · {i.minutes}m</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Chip({ item: i, onPick, time = false }: { item: Item; onPick: (i: Item) => void; time?: boolean }) {
  const k = kindStyle(i.kind);
  return (
    <button onClick={() => onPick(i)} className={cx("flex w-full items-center gap-1.5 truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] transition-[filter] hover:brightness-125", k.chip, i.task?.done && "line-through opacity-50")}>
      <span className={cx("size-1.5 shrink-0 rounded-full", k.dot)} />
      {time && !i.allDay && <span className="shrink-0 font-mono text-[10px] text-fg-muted">{timeLabel(i.start)}</span>}
      <span className="truncate">{i.title}</span>
    </button>
  );
}

/* ── Month ────────────────────────────────────────────────────────── */

function MonthGrid({ anchor, items, onPick, onDay }: { anchor: number; items: Item[]; onPick: (i: Item) => void; onDay: (d: number) => void }) {
  const p = parts(anchor);
  const first = Date.UTC(p.y, p.m, 1) - 11 * 3_600_000;
  const start = weekStart(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div data-tour="calendar-grid" className="overflow-x-auto rounded-xl border border-line bg-surface">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-7 border-b border-line">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="px-2 py-2 text-center text-[11px] text-fg-faint">
              {weekdayShort(i)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const inMonth = parts(d).m === p.m;
            const today = sameDay(d, TODAY);
            const day = items.filter((it) => sameDay(it.start, d)).sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start - b.start);
            return (
              <div key={d} className={cx("min-h-[112px] border-line p-1.5", i % 7 !== 0 && "border-l", i >= 7 && "border-t", !inMonth && "bg-ink-sunken/50")}>
                <button
                  onClick={() => onDay(d)}
                  className={cx("mb-1 grid size-6 place-items-center rounded-full text-[12px] num transition-colors", today ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "text-fg-muted hover:bg-hover" : "text-fg-faint hover:bg-hover")}
                >
                  {parts(d).d}
                </button>
                <div className="space-y-1">
                  {day.slice(0, 3).map((it) => (
                    <Chip key={it.id} item={it} onPick={onPick} time />
                  ))}
                  {day.length > 3 && (
                    <button onClick={() => onDay(d)} className="px-1 text-[11px] text-fg-faint hover:text-fg">
                      +{day.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Side panel ───────────────────────────────────────────────────── */

function Upcoming({ items, onPick }: { items: Item[]; onPick: (i: Item) => void }) {
  const next = items.filter((i) => !i.allDay && i.start >= NOW_MS - 30 * 60_000).sort((a, b) => a.start - b.start).slice(0, 7);
  const dueToday = items.filter((i) => i.task && !i.task.done && sameDay(i.start, TODAY));
  return (
    <>
      <section data-tour="calendar-upcoming" className="rounded-xl border border-line bg-surface">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <CalendarDays className="size-4 text-fg-muted" strokeWidth={1.75} />
          <h2 className="text-[13px] font-medium">Coming up</h2>
        </header>
        {next.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12px] text-fg-faint">Nothing booked.</p>
        ) : (
          <ul className="divide-y divide-line">
            {next.map((i) => {
              const k = kindStyle(i.kind);
              return (
                <li key={i.id}>
                  <button onClick={() => onPick(i)} className="flex w-full gap-3 px-4 py-2.5 text-left transition-colors hover:bg-raised/50">
                    <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", k.dot)} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-fg">{i.title}</span>
                      <span className="block font-mono text-[10px] text-fg-faint">
                        {sameDay(i.start, TODAY) ? "Today" : dayLabel(i.start, true)} · {timeLabel(i.start)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {dueToday.length > 0 && (
        <section className="min-w-0 rounded-xl border border-line bg-surface px-4 py-3">
          <h2 className="mb-2 flex min-w-0 items-center gap-2 overflow-hidden text-[13px] font-medium">
            <ListChecks className="size-4 text-fg-muted" strokeWidth={1.75} /> Tasks due today <span className="font-mono text-[11px] text-fg-faint num">{dueToday.length}</span>
          </h2>
          <ul className="space-y-1.5">
            {dueToday.map((i) => (
              <li key={i.id}>
                <button onClick={() => onPick(i)} className="block w-full min-w-0 truncate text-left text-[12px] text-fg-muted hover:text-fg" title={[i.title, i.task?.subject?.name].filter(Boolean).join(" · ")}>
                  {i.title}
                  {i.task?.subject && <span className="text-fg-faint"> · {i.task.subject.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Details({ item: i, onClose }: { item: Item; onClose: () => void }) {
  const { toggleTask, tasks } = useDesk();
  const k = kindStyle(i.kind);
  const e = i.event;
  const task = i.task ? tasks.find((t) => t.id === i.task!.id) : undefined;
  const subject = e?.subject ?? task?.subject;
  return (
    <section className="animate-pop rounded-xl border border-line-strong bg-surface">
      <header className="flex items-start gap-2 border-b border-line px-4 py-3">
        <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", k.dot)} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-fg-faint">{k.label.replace(/s$/, "")}</div>
          <h2 className="text-[14px] leading-snug font-medium">{i.title}</h2>
        </div>
        <button onClick={onClose} aria-label="Close" className="grid size-7 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
          <X className="size-4" />
        </button>
      </header>
      <div className="space-y-3 px-4 py-3 text-[12px]">
        <p className="flex items-center gap-2 text-fg-muted">
          <Clock className="size-3.5 shrink-0 text-fg-faint" />
          {dayLabel(i.start)}
          {!i.allDay && ` · ${timeLabel(i.start)}–${timeLabel(i.start + i.minutes * 60_000)}`}
        </p>
        {e?.where && (
          <p className="flex items-center gap-2 text-fg-muted">
            <MapPin className="size-3.5 shrink-0 text-fg-faint" /> {e.where}
          </p>
        )}
        {e?.with && (
          <p className="flex items-center gap-2 text-fg-muted">
            <UsersRound className="size-3.5 shrink-0 text-fg-faint" /> {e.with.join(", ")}
          </p>
        )}
        {e?.detail && <p className="rounded-lg border border-line bg-ink-sunken px-3 py-2 leading-relaxed text-fg-muted">{e.detail}</p>}
        {subject && (
          <div className="flex items-center gap-2">
            <span className="text-fg-faint">About</span>
            <SubjectChip subject={subject} />
          </div>
        )}
        <p className="text-fg-faint">Owner: {memberName(e?.ownerId ?? task?.ownerId ?? "sam")}</p>
      </div>
      <footer className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        {task && (
          <Button size="sm" variant={task.done ? "secondary" : "primary"} onClick={() => toggleTask(task.id)}>
            <Check className="size-3.5" /> {task.done ? "Reopen" : "Mark done"}
          </Button>
        )}
        {e?.dealId && (
          <Link href={`/deals/${e.dealId}`} className="inline-flex h-7 items-center gap-1 rounded-lg border border-line-strong bg-raised px-2.5 text-xs font-medium text-fg transition-colors hover:bg-hover">
            Open deal <ArrowRight className="size-3.5" />
          </Link>
        )}
      </footer>
    </section>
  );
}

/* ── New event ────────────────────────────────────────────────────── */

function NewEvent({ at, onClose }: { at: number; onClose: () => void }) {
  const { talent, addCalendarEvent, notify, clients } = useDesk();
  const p = parts(at);
  const [form, setForm] = useState({
    title: "",
    kind: "meeting" as CalendarKind,
    date: toDateInput(at),
    time: `${String(Math.min(Math.max(p.h + (p.min ? 1 : 0), 8), 20)).padStart(2, "0")}:00`,
    minutes: 30,
    about: "",
    where: "",
  });
  const people = talent;
  const subjects: Subject[] = [
    ...people.map((r): Subject => ({ kind: "candidate", id: r.key, name: r.name })),
    ...clients.map((c): Subject => ({ kind: c.status === "active" ? "client" : "prospect", id: c.id, name: c.name })),
  ];
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    if (!form.title.trim()) return;
    const subject = subjects.find((s) => `${s.kind}:${s.id}` === form.about);
    const dealId = subject?.kind === "candidate" ? people.find((r) => r.key === subject.id)?.deal?.id : undefined;
    addCalendarEvent({
      title: form.title.trim(),
      kind: form.kind,
      start: fromInputs(form.date, form.time),
      minutes: Number(form.minutes),
      subject,
      dealId,
      where: form.where.trim() || undefined,
    });
    notify(`Scheduled ${form.title.trim()}`);
    onClose();
  };

  return (
    <Modal
      title="New event"
      description="Shows on the calendar and in the history of whoever it's about."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!form.title.trim()}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title" htmlFor="ev-title">
            <input id="ev-title" value={form.title} onChange={set("title")} placeholder="e.g. Intro call with Atlas Freight" className={inputClass} />
          </Field>
        </div>
        <Field label="Type" htmlFor="ev-kind">
          <select id="ev-kind" value={form.kind} onChange={set("kind")} className={inputClass}>
            {CALENDAR_KINDS.filter((k) => k.id !== "task").map((k) => (
              <option key={k.id} value={k.id}>
                {k.label.replace(/s$/, "")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="About" htmlFor="ev-about">
          <select id="ev-about" value={form.about} onChange={set("about")} className={inputClass}>
            <option value="">Nobody in particular</option>
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
        </Field>
        <Field label="Date" htmlFor="ev-date">
          <input id="ev-date" type="date" value={form.date} onChange={set("date")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Time" htmlFor="ev-time">
            <input id="ev-time" type="time" step={900} value={form.time} onChange={set("time")} className={inputClass} />
          </Field>
          <Field label="Length" htmlFor="ev-len">
            <select id="ev-len" value={form.minutes} onChange={set("minutes")} className={inputClass}>
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Where" hint="Optional" htmlFor="ev-where">
            <input id="ev-where" value={form.where} onChange={set("where")} placeholder="Google Meet, an address, a phone number" className={inputClass} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
