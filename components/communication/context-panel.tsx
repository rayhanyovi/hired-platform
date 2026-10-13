"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Lightbulb, ListChecks, Mail, Phone, StickyNote, Tag, UserPlus, UserRound } from "lucide-react";
import { dayLabel, kindStyle, timeLabel } from "@/lib/calendar";
import { eventsFor, firstName, summarize, type Conversation } from "@/lib/conversations";
import { tasksFor } from "@/lib/people";
import { prospectStage } from "@/lib/prospects";
import { useDesk } from "@/lib/store";
import { NOW_MS } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { AmaraByline, StreamText } from "../ai/stream";
import { TobChip } from "../clients/parts";
import { Notes } from "../records/record";
import { TaskList, useOpenSubject } from "../records/tasks";
import { AmaraButton, Avatar, Heat, cx } from "../ui/primitives";
import { useContextMenu } from "../ui/context-menu";
import { LabelChip, LabelPicker } from "./labels";
import { ADD_AS, NewPersonAvatar, suggestFor, type AddAs } from "./recognize";

/** Who you're talking to, where they are with you, and what's coming up, beside the conversation. */
export function ContextPanel({ conv, contact, onAddToDesk }: { conv: Conversation; contact: { email?: string; phone?: string }; onAddToDesk: (as?: AddAs) => void }) {
  const { talent, placements, clients, tasks, calendar } = useDesk();
  const openSubject = useOpenSubject();
  const row = useMemo(
    () => (conv.subject?.kind === "candidate" ? talent.find((r) => r.ids.includes(conv.subject!.id)) : undefined),
    [conv.subject, talent],
  );
  const company = conv.subject && conv.subject.kind !== "candidate" ? clients.find((c) => c.id === conv.subject!.id) : undefined;
  const subject: Subject | undefined = row ? { kind: "candidate", id: row.key, name: row.name } : conv.subject;
  const myTasks = row ? tasksFor(row, tasks) : tasks.filter((t) => t.subject && t.subject.id === conv.subject?.id);
  const events = eventsFor(conv, calendar);
  const upcoming = events.filter((e) => e.start >= NOW_MS - 3_600_000).slice(0, 3);
  const facts = conv.followUp?.context ?? row?.deal?.signals ?? (row?.matches.length ? row.matches : undefined);

  return (
    <div data-tour="comm-context" className="divide-y divide-line">
      <section className="p-5">
        <div className="flex items-center gap-3">
          {conv.unknown ? <NewPersonAvatar size="lg" /> : <Avatar name={conv.name} size="lg" />}
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium">{conv.name}</div>
            <div className="truncate text-[12px] text-fg-faint">{row?.headline ?? conv.detail}</div>
          </div>
        </div>
        <dl className="mt-4 space-y-2 text-[12px]">
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-fg-faint" strokeWidth={1.75} />
              <dd className="truncate text-fg-muted">{contact.email}</dd>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0 text-fg-faint" strokeWidth={1.75} />
              <dd className="font-mono text-fg-muted num">{contact.phone}</dd>
            </div>
          )}
        </dl>
        <Labels conv={conv} />

        {conv.unknown && <NotOnDesk conv={conv} onAddToDesk={onAddToDesk} />}
        {row && (
          <div className="mt-4 rounded-lg border border-line bg-ink-sunken/60 px-3.5 py-3 text-[12px]">
            <div className="flex items-center gap-2">
              <span className={cx("size-1.5 rounded-full", "bg-fg-faint")} />
              <span className="text-fg">{placements.filter((p) => p.candidateId === row.key).length} placement records</span>
              {row.deal && (
                <span className="ml-auto">
                  <Heat deal={row.deal} />
                </span>
              )}
            </div>
            {row.roleTitle && (
              <div className="mt-1 truncate text-fg-faint">
                {row.roleTitle} · {row.client}
              </div>
            )}
          </div>
        )}
        {company && (
          <div className="mt-4 rounded-lg border border-line bg-ink-sunken/60 px-3.5 py-3 text-[12px]">
            <div className="flex items-center gap-2">
              <span className={cx("size-1.5 rounded-full", company.status === "active" ? "bg-good" : prospectStage(company.stage).dot)} />
              <span className="text-fg">{company.status === "active" ? "Active client" : `Prospect · ${prospectStage(company.stage).label}`}</span>
              <span className="ml-auto">
                <TobChip clientName={company.name} />
              </span>
            </div>
            <div className="mt-1 truncate text-fg-faint">
              {company.industry} · {company.location}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {subject && (
            <button onClick={() => openSubject(subject)} className="inline-flex h-7 items-center gap-1 rounded-lg border border-line-strong bg-raised px-2.5 text-xs font-medium text-fg hover:bg-hover">
              <UserRound className="size-3.5" /> Open {subject.kind === "candidate" ? "candidate" : subject.kind}
            </button>
          )}
          {row?.deal && (
            <Link href={`/deals/${row.deal.id}`} className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs text-fg-muted hover:bg-hover hover:text-fg">
              Deal page <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </section>

      <Summary key={conv.key} conv={conv} />

      {facts && facts.length > 0 && (
        <Block icon={Lightbulb} title="What we know">
          <ul className="space-y-1.5">
            {facts.slice(0, 4).map((f) => (
              <li key={f} className="flex gap-2 text-[12px] leading-relaxed text-fg-muted">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-fg-faint" />
                {f}
              </li>
            ))}
          </ul>
        </Block>
      )}

      <Block icon={CalendarDays} title="Coming up" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <p className="text-[12px] text-fg-faint">Nothing booked with {firstName(conv.name)}.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="flex gap-2.5 text-[12px]">
                <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", kindStyle(e.kind).dot)} />
                <span className="min-w-0">
                  <span className="block truncate text-fg">{e.title}</span>
                  <span className="block font-mono text-[11px] text-fg-faint">
                    {dayLabel(e.start, true)}
                    {!e.allDay && ` · ${timeLabel(e.start)}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {subject && (
        <Block icon={ListChecks} title="Tasks" count={myTasks.filter((t) => !t.done).length}>
          <TaskList tasks={myTasks} subject={subject} emptyText="No tasks yet." />
        </Block>
      )}

      {subject && (
        <Block icon={StickyNote} title="Notes">
          <Notes subject={subject} ids={row?.ids} />
        </Block>
      )}
    </div>
  );
}

/** Your labels on this conversation. Add or remove them here, or from the list. */
function Labels({ conv }: { conv: Conversation }) {
  const { labels, conversationFlags, toggleLabel } = useDesk();
  const { show, menu } = useContextMenu();
  const applied = labels.filter((l) => conversationFlags[conv.key]?.labels?.includes(l.id));
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      {applied.map((l) => (
        <LabelChip key={l.id} label={l} wide onRemove={() => toggleLabel(conv.key, conv.name, l.id)} />
      ))}
      <button
        onClick={(e) => show(e, "Label as", () => <LabelPicker convKey={conv.key} name={conv.name} />)}
        className="inline-flex h-5 items-center gap-1 rounded-md border border-dashed border-line-strong px-1.5 text-[11px] text-fg-faint transition-colors hover:border-fg/25 hover:text-fg"
      >
        <Tag className="size-3" /> {applied.length ? "Edit" : "Add label"}
      </button>
      {menu}
    </div>
  );
}

/** Someone new: what we can tell about them, and the three things they could become. */
function NotOnDesk({ conv, onAddToDesk }: { conv: Conversation; onAddToDesk: (as?: AddAs) => void }) {
  const { clients } = useDesk();
  const { sig, company, as } = suggestFor(conv, clients);
  return (
    <div className="mt-4 rounded-lg border border-dashed border-line-strong px-3.5 py-3 text-[12px]">
      <div className="flex items-center gap-2 text-fg">
        <UserPlus className="size-3.5 text-fg-muted" strokeWidth={1.75} />
        Not on your desk yet
      </div>
      <p className="mt-1 leading-relaxed text-fg-faint">
        {company ? `Writes from the same domain as ${company.name}.` : sig ? `Their message says ${sig.title}${sig.company ? ` at ${sig.company}` : ""}.` : "Add them so tasks, notes and history have a home."}
      </p>
      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {ADD_AS.map((a) => (
          <button
            key={a.id}
            onClick={() => onAddToDesk(a.id)}
            className={cx(
              "flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-[11px] transition-colors",
              a.id === as ? "border-fg/25 bg-raised text-fg" : "border-line-strong text-fg-muted hover:bg-hover hover:text-fg",
            )}
          >
            <a.icon className="size-4" strokeWidth={1.75} />
            {a.short}
          </button>
        ))}
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, count, children }: { icon: typeof Mail; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[12px] font-medium text-fg-muted">
        <Icon className="size-3.5" strokeWidth={1.75} />
        {title}
        {!!count && <span className="font-mono text-[11px] text-fg-faint num">{count}</span>}
      </h3>
      {children}
    </section>
  );
}

/** Amara's read of the whole conversation, on request. */
function Summary({ conv }: { conv: Conversation }) {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const s = summarize(conv);
  return (
    <section className="p-5">
      {run === 0 ? (
        <AmaraButton size="sm" onClick={() => setRun(1)} className="w-full justify-center">
          Summarise this conversation
        </AmaraButton>
      ) : (
        <div className="amara-edge rounded-xl bg-[linear-gradient(180deg,rgb(139_92_246/0.07),transparent_60%)] p-3.5">
          <AmaraByline>{done ? "Amara's read" : "Reading"}</AmaraByline>
          <div className="mt-2 text-[12.5px] leading-relaxed text-fg">
            <StreamText key={run} text={s.text} delay={300} onDone={() => setDone(true)} />
          </div>
          {done && <p className="mt-2 text-[11px] text-fg-faint">{s.sources}</p>}
        </div>
      )}
    </section>
  );
}
