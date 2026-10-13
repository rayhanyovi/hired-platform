"use client";

import { useId, useState } from "react";
import { motion } from "motion/react";
import { TAB_SPRING } from "../ui/swap";
import { memberName, useDesk } from "@/lib/store";
import { ago } from "@/lib/time";
import type { AuditEvent, Subject } from "@/lib/types";
import { EVENT_ICON } from "../deals/activity";
import { ActorAvatar } from "../ui/member";
import { cx } from "../ui/primitives";

/** Tabs inside an expanded row or record panel. */
export function RecordTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  aside,
}: {
  tabs: { id: T; label: string; count?: number; icon?: React.ReactNode }[];
  value: T;
  onChange: (t: T) => void;
  label: string;
  aside?: React.ReactNode;
}) {
  const line = useId();
  return (
    <div className="flex items-center gap-1 border-b border-line" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "relative -mb-px inline-flex h-9 items-center gap-1.5 px-2 text-[12px] whitespace-nowrap transition-colors duration-200",
            value === t.id ? "text-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {value === t.id && <motion.span layoutId={line} transition={TAB_SPRING} className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-fg" aria-hidden="true" />}
          {t.icon}
          {t.label}
          {!!t.count && <span className="font-mono text-[10px] text-fg-faint num">{t.count}</span>}
        </button>
      ))}
      {aside && <div className="ml-auto flex items-center">{aside}</div>}
    </div>
  );
}

/** A record's story from the agency event log, newest first. */
export function History({ events, empty = "Nothing has happened here yet." }: { events: AuditEvent[]; empty?: string }) {
  if (!events.length) return <p className="py-6 text-center text-[12px] text-fg-faint">{empty}</p>;
  return (
    <ol className="relative space-y-4 py-3 before:absolute before:top-4 before:bottom-4 before:left-[11px] before:w-px before:bg-line">
      {events.map((e) => {
        const Icon = EVENT_ICON[e.kind];
        return (
          <li key={e.id} className="relative flex gap-3">
            <span className="z-10 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-fg-faint">
              <Icon className="size-3" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] leading-snug text-fg-muted">{e.summary}</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-fg-faint">
                <ActorAvatar id={e.actorId} size="xs" />
                {memberName(e.actorId)} · {ago(e.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Notes({ subject, ids }: { subject: Subject; ids?: string[] }) {
  const { notes, addNote, notify } = useDesk();
  const [body, setBody] = useState("");
  const mine = notes.filter((n) => (ids ?? [subject.id]).includes(n.subjectId));
  const save = () => {
    if (!body.trim()) return;
    addNote(subject, body.trim());
    setBody("");
    notify("Note saved");
  };
  return (
    <div>
      <div className="rounded-lg border border-line-strong bg-ink-sunken focus-within:border-fg/30">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
          }}
          placeholder={`Add a note about ${subject.name.split(" ")[0]}…`}
          aria-label="New note"
          rows={2}
          className="block w-full resize-none bg-transparent px-3 py-2 text-[13px] text-fg outline-none placeholder:text-fg-faint"
        />
        {body.trim() && (
          <div className="flex justify-end border-t border-line px-2 py-1.5">
            <button onClick={save} className="h-7 rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover">
              Save note
            </button>
          </div>
        )}
      </div>
      {mine.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-fg-faint">No notes yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {mine.map((n) => (
            <li key={n.id} className="rounded-lg border border-line bg-surface px-3 py-2.5">
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-fg-muted">{n.body}</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-fg-faint">
                <ActorAvatar id={n.authorId} size="xs" />
                {memberName(n.authorId)} · {ago(n.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Label/value rows in an expanded record's info column. */
export function InfoRow({ icon: Icon, label, children }: { icon: typeof EVENT_ICON.call; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-fg-faint" strokeWidth={1.75} />
      <span className="w-[68px] shrink-0 text-[11px] leading-5 text-fg-faint">{label}</span>
      <span className="min-w-0 flex-1 text-[12px] leading-5 text-fg">{children}</span>
    </div>
  );
}
