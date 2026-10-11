"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, RotateCcw, Send } from "lucide-react";
import { draftFollowUp, subjectFor } from "@/lib/ai";
import { FOLLOW_UP_LABEL } from "@/lib/data";
import { useDesk } from "@/lib/store";
import type { Channel, FollowUp, Tone } from "@/lib/types";
import { AmaraByline, StreamText } from "../ai/stream";
import { Page, PageHeader } from "../ui/page-header";
import { AmaraButton, Avatar, Button, Kbd, cx } from "../ui/primitives";

const TONES: { id: Tone; label: string }[] = [
  { id: "direct", label: "Direct" },
  { id: "warm", label: "Warm" },
  { id: "brief", label: "Brief" },
];

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
  { id: "linkedin", label: "LinkedIn" },
];

export function Inbox() {
  const { followUps, sentCount, selectedFollowUpId, selectFollowUp } =
    useDesk();
  const selected =
    followUps.find((f) => f.id === selectedFollowUpId) ?? followUps[0];
  const overdue = followUps.filter((f) => f.daysWaiting >= 3);
  const recent = followUps.filter((f) => f.daysWaiting < 3);

  // On narrow screens the composer sits below the list, so bring it into view.
  const pick = (id: string) => {
    selectFollowUp(id);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        document
          .getElementById("composer")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  };

  return (
    <Page wide>
      <PageHeader eyebrow="Follow-ups" title="Nobody gets ghosted.">
        Candidates remember the recruiter who told them the truth. Amara drafts
        every update from your notes. You read it, tweak it, and send it.
      </PageHeader>

      {!selected ? (
        <Cleared sent={sentCount} />
      ) : (
        <div className="grid overflow-hidden rounded-2xl border border-line bg-ink-sunken lg:grid-cols-[340px_minmax(0,1fr)]">
          <nav
            data-tour="fu-list"
            aria-label="People waiting on you"
            className="border-b border-line lg:border-r lg:border-b-0"
          >
            <Group
              title="Overdue"
              hint="3+ days"
              items={overdue}
              selectedId={selected.id}
              onSelect={pick}
            />
            <Group
              title="This week"
              items={recent}
              selectedId={selected.id}
              onSelect={pick}
            />
          </nav>
          <Composer
            key={selected.id}
            followUp={selected}
            remaining={followUps.length}
          />
        </div>
      )}
    </Page>
  );
}

function Group({
  title,
  hint,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  hint?: string;
  items: FollowUp[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="p-2">
      <div className="flex items-baseline justify-between px-3 pt-2 pb-2 text-[11px] tracking-[0.08em] text-fg-faint uppercase">
        <span>
          {title} <span className="ml-1 font-mono num">{items.length}</span>
        </span>
        {hint && <span className="normal-case tracking-normal">{hint}</span>}
      </div>
      <ul className="space-y-0.5">
        {items.map((f) => {
          const active = f.id === selectedId;
          return (
            <li key={f.id}>
              <button
                onClick={() => onSelect(f.id)}
                aria-current={active ? "true" : undefined}
                className={cx(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  active ? "bg-raised" : "hover:bg-surface",
                )}
              >
                <Avatar name={f.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cx(
                        "truncate text-[13px]",
                        active ? "text-fg" : "text-fg-muted",
                      )}
                    >
                      {f.name}
                    </span>
                    <span
                      className={cx(
                        "shrink-0 font-mono text-[10px] num",
                        f.daysWaiting >= 3 ? "text-warm" : "text-fg-faint",
                      )}
                    >
                      {f.daysWaiting}d
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-fg-faint">
                    {FOLLOW_UP_LABEL[f.kind]} ·{" "}
                    {f.client === "—" ? f.role : f.client}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Composer({
  followUp: f,
  remaining,
}: {
  followUp: FollowUp;
  remaining: number;
}) {
  const { markSent, notify, selectFollowUp, openDeal } = useDesk();
  const [tone, setTone] = useState<Tone>(
    f.kind === "rejection" ? "warm" : "direct",
  );
  const [channel, setChannel] = useState<Channel>(
    f.kind === "keep-warm" ? "linkedin" : "email",
  );
  // Nothing is generated until the recruiter asks: drafts cost a model call.
  const [run, setRun] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [body, setBody] = useState("");

  const draft = draftFollowUp(f, tone, channel);
  const canSend = !drafting && body.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    markSent(f.id);
    selectFollowUp(null);
    notify(
      remaining > 1
        ? `Sent to ${f.firstName}. ${remaining - 1} to go.`
        : `Sent to ${f.firstName}. Nobody's waiting on you.`,
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        send();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const draftWithAmara = () => {
    setDrafting(true);
    setRun((n) => n + 1);
  };

  return (
    <section
      id="composer"
      className="flex min-w-0 scroll-mt-14 flex-col bg-ink"
      aria-label={`Update for ${f.name}`}
    >
      <header className="flex flex-wrap items-start gap-4 border-b border-line px-6 py-5">
        <Avatar name={f.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-[21px] leading-tight tracking-[-0.02em]">
            {f.name}
          </h2>
          <p className="mt-1 text-[13px] text-fg-muted">
            {f.role}
            {f.client !== "—" && <> · {f.client}</>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] text-fg-muted">
          <Clock
            className={cx(
              "size-3",
              f.daysWaiting >= 3 ? "text-warm" : "text-fg-faint",
            )}
          />
          Waiting {f.daysWaiting} days
        </div>
      </header>

      <div className="grid flex-1 gap-0 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 px-6 py-5">
          <div
            data-tour="fu-controls"
            className="mb-4 flex flex-wrap items-center gap-2"
          >
            <Segmented
              label="Tone"
              options={TONES}
              value={tone}
              onChange={setTone}
            />
            <Segmented
              label="Channel"
              options={CHANNELS}
              value={channel}
              onChange={setChannel}
            />
            <AmaraButton
              onClick={draftWithAmara}
              disabled={drafting}
              className="ml-auto"
            >
              {run === 0 ? (
                "Draft with Amara"
              ) : (
                <>
                  <RotateCcw className="size-3.5" /> Redraft
                </>
              )}
            </AmaraButton>
          </div>

          <div
            data-tour="fu-draft"
            className={cx(
              "rounded-xl bg-surface",
              run > 0 ? "amara-edge" : "border border-line",
            )}
          >
            <div className="flex min-h-10 items-center justify-between border-b border-line px-4 py-2.5">
              {run > 0 ? (
                <AmaraByline>
                  {drafting ? "Drafting" : "Amara's draft · edit freely"}
                </AmaraByline>
              ) : (
                <span className="text-[12px] text-fg-faint">Your message</span>
              )}
              {channel === "sms" && (
                <span className="font-mono text-[10px] text-fg-faint num">
                  {body.length} chars
                </span>
              )}
            </div>
            {channel === "email" && (
              <div className="border-b border-line px-4 py-2.5 text-[13px]">
                <span className="text-fg-faint">Subject </span>
                <span className="text-fg">{subjectFor(f)}</span>
              </div>
            )}
            <div className="min-h-[240px] px-4 py-4 text-[14px] leading-[1.7]">
              {drafting ? (
                <StreamText
                  key={run}
                  text={draft}
                  className="text-fg"
                  delay={500}
                  onDone={() => {
                    setBody(draft);
                    setDrafting(false);
                  }}
                />
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  aria-label="Message"
                  placeholder={`Write to ${f.firstName}, or pick a tone and let Amara draft it from your notes.`}
                  className="block min-h-[220px] w-full resize-none bg-transparent text-fg outline-none [field-sizing:content] placeholder:text-fg-faint"
                />
              )}
            </div>
          </div>

          <div
            data-tour="fu-send"
            className="mt-4 flex flex-wrap items-center gap-3"
          >
            <Button variant="primary" onClick={send} disabled={!canSend}>
              <Send className="size-3.5" /> Send{" "}
              {CHANNELS.find((c) => c.id === channel)?.label}
            </Button>
            <span className="hidden items-center gap-1 text-[11px] text-fg-faint sm:inline-flex">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
            </span>
            <span className="ml-auto text-[11px] text-fg-faint">
              Amara drafts. You send. Nothing goes out without you.
            </span>
          </div>
        </div>

        <aside
          data-tour="fu-context"
          className="border-t border-line px-6 py-5 xl:border-t-0 xl:border-l"
        >
          <h3 className="mb-3 text-[11px] tracking-[0.08em] text-fg-faint uppercase">
            What Amara used
          </h3>
          <p className="mb-3 text-[13px] leading-relaxed text-fg-muted">
            {f.detail}
          </p>
          <ul className="space-y-2">
            {f.context.map((c) => (
              <li
                key={c}
                className="flex gap-2 text-[12px] leading-relaxed text-fg-muted"
              >
                <Check className="mt-[3px] size-3 shrink-0 text-amara-soft/80" />
                {c}
              </li>
            ))}
          </ul>
          {f.dealId && (
            <button
              onClick={() => openDeal(f.dealId!)}
              className="mt-5 inline-flex items-center gap-1 text-[12px] text-fg-faint transition-colors hover:text-fg"
            >
              Open the deal <ArrowRight className="size-3" />
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-line bg-surface p-0.5"
      role="radiogroup"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => value !== o.id && onChange(o.id)}
          className={cx(
            "h-7 rounded-md px-2.5 text-[12px] transition-colors",
            value === o.id
              ? "bg-raised text-fg shadow-[0_0_0_1px_rgb(255_255_255/0.06)]"
              : "text-fg-faint hover:text-fg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Cleared({ sent }: { sent: number }) {
  return (
    <div className="grid animate-rise place-items-center rounded-2xl border border-line bg-ink-sunken px-6 py-24 text-center">
      <div className="amara-orb mb-8 size-3 rounded-full" aria-hidden="true" />
      <h2 className="font-serif text-[32px] leading-tight">
        Nobody is waiting on you.
      </h2>
      <p className="mt-3 max-w-[40ch] text-[14px] text-fg-muted">
        {sent} honest updates sent today. That&apos;s {sent} people who&apos;ll
        take your call next time.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
      >
        Back to Today <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
