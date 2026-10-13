"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BellOff,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  MessageSquareText,
  PanelRight,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Pin,
  Send,
  Tag,
  UserPlus,
  Voicemail,
  X,
} from "lucide-react";
import { draftFollowUp, subjectFor } from "@/lib/ai";
import { sydney } from "@/lib/calendar";
import { callLength, CHANNEL_LABEL, draftNudge, draftReply, TEMPLATE_LABEL, templateFor, type TemplateKind } from "@/lib/communication";
import { channelsFor, firstName, replyChannel, rewrite, type Conversation, type TimelineItem } from "@/lib/conversations";
import { memberName, useDesk } from "@/lib/store";
import { formatStamp, NOW_MS } from "@/lib/time";
import type { CallLog, MessageChannel, Tone } from "@/lib/types";
import { AmaraByline, StreamText } from "../ai/stream";
import { Mark } from "../records/menus";
import { SubjectChip } from "../records/tasks";
import { useContextMenu, type MenuEntry } from "../ui/context-menu";
import { ActorAvatar } from "../ui/member";
import { AmaraButton, AmaraTag, Avatar, Button, Kbd, cx } from "../ui/primitives";
import { CHANNEL_ICON } from "./channel";
import { LabelPicker } from "./labels";
import { ADD_AS, NewPersonAvatar, suggestFor, type AddAs } from "./recognize";

const DAY = 86_400_000;
const TONES: { id: Tone; label: string }[] = [
  { id: "direct", label: "Direct" },
  { id: "warm", label: "Warm" },
  { id: "brief", label: "Brief" },
];

/** "Today", "Yesterday", "Mon 5 Oct": the separators between days in a conversation. */
function dayHeading(ms: number) {
  const day = (x: number) => Math.floor((x + 11 * 3_600_000) / DAY);
  const diff = day(NOW_MS) - day(ms);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short" }).format(ms);
}
const time = (ms: number) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", hour: "numeric", minute: "2-digit" }).format(ms).toLowerCase();

export type ContactInfo = { email?: string; phone?: string };

/**
 * One person's conversation: every channel and call in one timeline, what's
 * expected of you on top, and a composer that can answer on any channel.
 */
export function ConversationView({
  conv,
  contact,
  pinned,
  onDone,
  onBack,
  contextOpen,
  onToggleContext,
  onAddToDesk,
}: {
  conv: Conversation;
  contact: ContactInfo;
  pinned: boolean;
  onDone: () => void;
  onBack: () => void;
  contextOpen: boolean;
  onToggleContext: () => void;
  onAddToDesk: (as?: AddAs) => void;
}) {
  const { flagConversation, notify, conversationFlags } = useDesk();
  const labelled = (conversationFlags[conv.key]?.labels?.length ?? 0) > 0;
  const { show, menu } = useContextMenu();
  const [calling, setCalling] = useState<number | null>(null);
  const [logging, setLogging] = useState<{ seconds: number } | null>(null);
  const [focusUpdate, setFocusUpdate] = useState(0);
  const first = firstName(conv.name);

  const snooze = (until: number, label: string) => ({
    label,
    onSelect: () => {
      flagConversation(conv.key, { snoozedUntil: until });
      notify(`Snoozed ${first} until ${label.toLowerCase()}`);
      onBack();
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-6">
        <button onClick={onBack} aria-label="Back to conversations" className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg lg:hidden">
          <ArrowLeft className="size-4" />
        </button>
        {conv.unknown ? <NewPersonAvatar /> : <Avatar name={conv.name} />}
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-[15px] font-medium">
            <span className="truncate">{conv.name}</span>
            {conv.subject && <Mark id={conv.subject.id} />}
          </h2>
          <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[12px] text-fg-faint">
            <span className="truncate">{conv.detail}</span>
            {conv.subject && (
              <span className="hidden min-w-0 sm:inline">
                <SubjectChip subject={conv.subject} />
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton label={contact.phone ? `Call ${first}` : "No phone number"} onClick={() => setCalling(performance.now())} disabled={!contact.phone || calling !== null}>
            <Phone className="size-4" />
          </IconButton>
          <IconButton className="hidden sm:grid" label={pinned ? "Unpin" : "Pin to top"} pressed={pinned} onClick={() => flagConversation(conv.key, { pinned: !pinned })}>
            <Pin className={cx("size-4", pinned && "fill-fg text-fg")} />
          </IconButton>
          <IconButton className="hidden sm:grid" label="Label" pressed={labelled} onClick={(e) => show(e, "Label as", () => <LabelPicker convKey={conv.key} name={conv.name} />)}>
            <Tag className="size-4" />
          </IconButton>
          <IconButton
            className="hidden sm:grid"
            label="Snooze"
            onClick={(e) => show(e, "Snooze until", [snooze(sydney(0, 17), "Later today"), snooze(sydney(1, 9), "Tomorrow morning"), snooze(sydney(3, 9), "Monday morning"), snooze(sydney(7, 9), "Next week")])}
          >
            <BellOff className="size-4" />
          </IconButton>
          <IconButton label="Mark done (E)" onClick={onDone}>
            <Check className="size-4" />
          </IconButton>
          <IconButton label="Details" pressed={contextOpen} onClick={onToggleContext}>
            <PanelRight className="size-4" />
          </IconButton>
        </div>
      </header>

      {calling !== null && (
        <CallBar
          name={conv.name}
          phone={contact.phone}
          started={calling}
          onEnd={(seconds) => {
            setCalling(null);
            setLogging({ seconds });
          }}
        />
      )}

      <Banner conv={conv} onUpdate={() => setFocusUpdate((n) => n + 1)} onAddToDesk={onAddToDesk} />
      <Timeline conv={conv} />

      {logging ? (
        <CallLogger conv={conv} seconds={logging.seconds} onClose={() => setLogging(null)} />
      ) : (
        <ConversationComposer key={conv.key} conv={conv} contact={contact} focusUpdate={focusUpdate} onLogCall={() => setLogging({ seconds: 0 })} />
      )}
      {menu}
    </div>
  );
}

function IconButton({ label, onClick, children, pressed, disabled, className }: { label: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode; pressed?: boolean; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={cx("grid size-8 place-items-center rounded-md transition-colors disabled:opacity-40", pressed ? "bg-raised text-fg" : "text-fg-muted hover:bg-hover hover:text-fg", className)}
    >
      {children}
    </button>
  );
}

/** What's expected of you in this conversation, if anything. */
function Banner({ conv, onUpdate, onAddToDesk }: { conv: Conversation; onUpdate: () => void; onAddToDesk: (as?: AddAs) => void }) {
  const { clients } = useDesk();
  const { show, menu } = useContextMenu();
  const first = firstName(conv.name);
  if (conv.unknown) {
    const { sig, company, as } = suggestFor(conv, clients);
    const best = ADD_AS.find((a) => a.id === as)!;
    return (
      <div data-tour="comm-banner" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-raised/40 px-4 py-3 text-[12px] sm:px-6">
        <UserPlus className="size-4 shrink-0 text-fg-muted" />
        <p className="min-w-0 flex-1 basis-60 text-fg-muted">
          <span className="text-fg">{sig?.name ?? conv.name} isn&apos;t on your desk yet.</span>{" "}
          {company ? `Same email domain as ${company.name}.` : sig ? `Their message says ${sig.title}${sig.company ? ` at ${sig.company}` : ""}.` : "Add them so tasks, notes and history have a home."}
        </p>
        <span className="flex items-center">
          <Button size="sm" onClick={() => onAddToDesk(as)} className="rounded-r-none">
            <best.icon className="size-3.5" /> {as === "contact" && company ? `Add to ${company.name}` : `Add as ${best.short.toLowerCase()}`}
          </Button>
          <Button
            size="sm"
            aria-label="Add as something else"
            className="-ml-px rounded-l-none px-1.5"
            onClick={(e) => show(e, "Add to your desk as", ADD_AS.map((a) => ({ label: a.label, icon: a.icon, onSelect: () => onAddToDesk(a.id) })))}
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </span>
        {menu}
      </div>
    );
  }
  if (conv.state === "owed") {
    return (
      <div data-tour="comm-banner" className="flex flex-wrap items-center gap-3 border-b border-warm/20 bg-warm/[0.06] px-4 py-3 text-[12px] sm:px-6">
        <MessageSquareText className="size-4 shrink-0 text-warm" />
        <p className="min-w-0 flex-1 text-fg-muted">
          <span className="text-fg">
            {first} has been waiting {conv.followUp!.daysWaiting} days for an update.
          </span>{" "}
          {conv.followUp!.detail}
        </p>
        <Button size="sm" onClick={onUpdate}>
          Write the update
        </Button>
      </div>
    );
  }
  if (conv.state === "quiet") {
    return (
      <div data-tour="comm-banner" className="flex items-center gap-3 border-b border-warm/20 bg-warm/[0.06] px-4 py-3 text-[12px] sm:px-6">
        <Clock className="size-4 shrink-0 text-warm" />
        <p className="text-fg-muted">
          You wrote {conv.quietDays} days ago and {first} hasn&apos;t replied. <span className="text-fg">Follow up?</span>
        </p>
      </div>
    );
  }
  return null;
}

/* ── Timeline ─────────────────────────────────────────────────────── */

const SHOWN = 8;

function Timeline({ conv }: { conv: Conversation }) {
  const [all, setAll] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const items = all ? conv.items : conv.items.slice(-SHOWN);
  const hidden = conv.items.length - items.length;

  // Open at the latest message, and follow new ones as they're sent. Scroll
  // only this pane, never the page around it.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv.key, conv.items.length]);

  return (
    <div ref={scroller} data-tour="comm-thread" className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      {hidden > 0 && (
        <div className="mb-4 flex justify-center">
          <button onClick={() => setAll(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-[12px] text-fg-muted hover:bg-raised hover:text-fg">
            <ChevronUp className="size-3.5" /> Show {hidden} earlier
          </button>
        </div>
      )}
      {conv.items.length === 0 && (
        <p className="py-16 text-center text-[13px] text-fg-faint">
          Nothing sent yet. {conv.followUp ? "They're owed an update; write it below." : "Start the conversation below."}
        </p>
      )}
      <ol className="space-y-4">
        {items.map((item, i) => {
          const prev = items[i - 1];
          const newDay = !prev || dayHeading(prev.at) !== dayHeading(item.at);
          return (
            <li key={item.id}>
              {newDay && (
                <div className="my-6 flex items-center gap-3 text-[11px] text-fg-faint" aria-hidden={false}>
                  <span className="h-px flex-1 bg-line" />
                  {dayHeading(item.at)}
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
              {item.kind === "call" ? <CallItem call={item.call} name={conv.name} /> : <MessageItem item={item} conv={conv} showSubject={item.thread.subject !== undefined && (!prev || prev.kind !== "message" || prev.thread.id !== item.thread.id)} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MessageItem({ item, conv, showSubject }: { item: Extract<TimelineItem, { kind: "message" }>; conv: Conversation; showSubject: boolean }) {
  const { cancelScheduled, notify } = useDesk();
  const Icon = CHANNEL_ICON[item.thread.channel];
  const mine = item.from === "me";
  const email = item.thread.channel === "email";
  const who = mine ? memberName(item.byId ?? "sam") : conv.name;
  const meta = (
    <span className="flex items-center gap-1.5 text-[11px] text-fg-faint">
      <Icon className="size-3" strokeWidth={1.75} aria-label={CHANNEL_LABEL[item.thread.channel]} />
      <span className="text-fg-muted">{who}</span>
      <span className="font-mono">{time(item.at)}</span>
      {item.amara && <AmaraTag className="ml-1">Drafted with Amara</AmaraTag>}
    </span>
  );
  const scheduled = item.scheduledFor && (
    <div className="mt-2 flex items-center gap-2 border-t border-dashed border-line-strong pt-2 text-[11px] text-fg-muted">
      <Clock className="size-3" /> Scheduled for {formatStamp(item.scheduledFor)}
      <button
        onClick={() => {
          cancelScheduled(item.thread.id, item.id);
          notify("Scheduled message cancelled");
        }}
        className="ml-auto rounded px-1.5 py-0.5 text-fg-faint hover:bg-hover hover:text-fg"
      >
        Cancel
      </button>
    </div>
  );

  if (email) {
    return (
      <article className={cx("max-w-[680px] rounded-xl border px-4 py-3", mine ? "ml-auto border-line-strong bg-raised/50" : "border-line bg-surface", !!item.scheduledFor && "border-dashed")}>
        <div className="mb-1.5 flex items-center gap-2">
          {mine ? <ActorAvatar id={item.byId ?? "sam"} size="xs" /> : <Avatar name={conv.name} size="sm" />}
          {meta}
        </div>
        {showSubject && <div className="mb-1 text-[13px] font-medium text-fg">{item.thread.subject}</div>}
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-fg">{item.body}</p>
        {scheduled}
      </article>
    );
  }
  return (
    <div className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cx("max-w-[78%] sm:max-w-[520px]")}>
        <div className={cx("rounded-2xl border px-3.5 py-2.5", mine ? "rounded-br-md border-line-strong bg-raised" : "rounded-bl-md border-line bg-surface", !!item.scheduledFor && "border-dashed")}>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-fg">{item.body}</p>
          {scheduled}
        </div>
        <div className={cx("mt-1 flex px-1", mine && "justify-end")}>{meta}</div>
      </div>
    </div>
  );
}

const OUTCOME: Record<CallLog["outcome"], { label: string; icon: typeof Phone; className: string }> = {
  connected: { label: "Connected", icon: PhoneCall, className: "text-fg-muted" },
  "no-answer": { label: "No answer", icon: PhoneMissed, className: "text-warm" },
  voicemail: { label: "Left a voicemail", icon: Voicemail, className: "text-fg-muted" },
};

function CallItem({ call, name }: { call: CallLog; name: string }) {
  const o = OUTCOME[call.outcome];
  const Dir = call.direction === "outgoing" ? PhoneOutgoing : PhoneIncoming;
  return (
    <div className="mx-auto max-w-[560px] rounded-xl border border-line bg-ink-sunken/60 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        <Dir className="size-3.5 text-fg-muted" />
        <span className="text-fg">
          {call.direction === "outgoing" ? `${memberName(call.byId)} called ${name.split(" ")[0]}` : `${name.split(" ")[0]} called ${memberName(call.byId).split(" ")[0]}`}
        </span>
        <span className={cx("inline-flex items-center gap-1", o.className)}>
          <o.icon className="size-3" /> {o.label}
        </span>
        {call.seconds > 0 && <span className="font-mono text-[11px] text-fg-faint num">{callLength(call.seconds)}</span>}
        <span className="ml-auto font-mono text-[11px] text-fg-faint">{time(call.at)}</span>
      </div>
      {call.note && <p className="mt-1.5 border-l-2 border-line-strong pl-2.5 text-[12px] leading-relaxed text-fg-muted">{call.note}</p>}
    </div>
  );
}

/* ── Calls ────────────────────────────────────────────────────────── */

/** A live call in progress. The demo doesn't dial; it times the call and logs it. */
function CallBar({ name, phone, started, onEnd }: { name: string; phone?: string; started: number; onEnd: (seconds: number) => void }) {
  const [now, setNow] = useState(started);
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.round((now - started) / 1000));
  return (
    <div className="flex items-center gap-3 border-b border-line bg-placements/[0.07] px-4 py-3 text-[12px] sm:px-6" role="status">
      <span className="relative grid size-7 place-items-center rounded-full bg-placements-tile text-white">
        <Phone className="size-3.5" />
        <span className="absolute inset-0 animate-ping rounded-full bg-placements/30" aria-hidden="true" />
      </span>
      <span className="text-fg">On a call with {name.split(" ")[0]}</span>
      <span className="font-mono text-fg-faint num">{phone}</span>
      <span className="font-mono text-fg num">
        {String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}
      </span>
      <button onClick={() => onEnd(s)} className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-lg bg-bad px-2.5 text-[12px] font-medium text-white hover:opacity-90">
        <PhoneOff className="size-3.5" /> End call
      </button>
    </div>
  );
}

function CallLogger({ conv, seconds, onClose }: { conv: Conversation; seconds: number; onClose: () => void }) {
  const { logCall, notify } = useDesk();
  const [outcome, setOutcome] = useState<CallLog["outcome"]>("connected");
  const [minutes, setMinutes] = useState(seconds ? Math.max(1, Math.round(seconds / 60)) : 5);
  const [note, setNote] = useState("");
  const save = () => {
    logCall({ contact: { name: conv.name, subject: conv.subject }, direction: "outgoing", outcome, seconds: outcome === "connected" ? (seconds || minutes * 60) : 0, note: note.trim() || undefined });
    notify(`Call with ${firstName(conv.name)} logged`);
    onClose();
  };
  return (
    <div className="border-t border-line px-4 py-5 sm:px-6">
      <div className="rounded-xl border border-line-strong bg-surface p-3">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-medium">
          <PhoneCall className="size-4 text-fg-muted" /> Log a call with {firstName(conv.name)}
          <button onClick={onClose} aria-label="Cancel" className="ml-auto grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-line bg-ink-sunken p-0.5" role="radiogroup" aria-label="Outcome">
            {(Object.keys(OUTCOME) as CallLog["outcome"][]).map((k) => (
              <button
                key={k}
                role="radio"
                aria-checked={outcome === k}
                onClick={() => setOutcome(k)}
                className={cx("inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] transition-colors", outcome === k ? "bg-raised text-fg" : "text-fg-muted hover:text-fg")}
              >
                {(() => {
                  const I = OUTCOME[k].icon;
                  return <I className="size-3.5" />;
                })()}
                {OUTCOME[k].label}
              </button>
            ))}
          </div>
          {outcome === "connected" && !seconds && (
            <label className="flex items-center gap-2 text-[12px] text-fg-muted">
              <input type="number" min={1} max={180} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="h-8 w-16 rounded-lg border border-line-strong bg-ink-sunken px-2 text-fg outline-none" />
              minutes
            </label>
          )}
          {seconds > 0 && <span className="font-mono text-[12px] text-fg-faint num">{callLength(seconds)}</span>}
        </div>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What was said, and what happens next?"
          aria-label="Call note"
          className="mt-3 block w-full resize-none rounded-lg border border-line-strong bg-ink-sunken px-3 py-2 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-fg/30"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={save}>
            Save call
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Composer ─────────────────────────────────────────────────────── */

function ConversationComposer({ conv, contact, focusUpdate, onLogCall }: { conv: Conversation; contact: ContactInfo; focusUpdate: number; onLogCall: () => void }) {
  const { sendMessage, startThread, markSent, notify, me } = useDesk();
  const { show, menu } = useContextMenu();
  const channels = channelsFor(conv, contact);
  const [channel, setChannel] = useState<MessageChannel>(() => (channels.includes(replyChannel(conv)) ? replyChannel(conv) : channels[0] ?? "email"));
  const [tone, setTone] = useState<Tone>(conv.followUp?.kind === "rejection" ? "warm" : "direct");
  const [body, setBody] = useState("");
  const [subjectLine, setSubjectLine] = useState(conv.followUp ? subjectFor(conv.followUp) : "");
  // Drafts are on request: nothing streams until you ask.
  const [draft, setDraft] = useState<{ text: string; run: number } | null>(null);
  const [usedAmara, setUsedAmara] = useState(false);
  const [showFacts, setShowFacts] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const first = firstName(conv.name);
  const update = conv.followUp;
  const thread = conv.threads.find((t) => t.channel === channel);
  const needsSubject = channel === "email" && !thread;
  const short = channel !== "email";

  // "Write the update" in the banner brings you here.
  useEffect(() => {
    if (focusUpdate) box.current?.focus();
  }, [focusUpdate]);

  const target = { name: conv.name, detail: conv.detail, subject: conv.subject };
  const thatThread = thread ?? conv.threads[0];

  const ai = (() => {
    if (update) return { label: "Draft the update", text: () => draftFollowUp(update, tone, channel === "whatsapp" ? "sms" : channel) };
    if (conv.state === "reply" && thatThread) return { label: "Draft reply", text: () => draftReply(thatThread, me.firstName) };
    if (conv.state === "quiet" && thatThread) return { label: "Draft a nudge", text: () => draftNudge(thatThread, me.firstName) };
    return {
      label: "Draft with Amara",
      text: () => (short ? `Hi ${first}, quick check-in from me. Anything I can help with this week?` : `Hi ${first},\n\nJust checking in. Is there anything I can help with this week?\n\n${me.firstName}`),
    };
  })();

  const run = (text: string) => {
    setUsedAmara(true);
    setDraft((d) => ({ text, run: (d?.run ?? 0) + 1 }));
  };

  const send = (scheduledFor?: number) => {
    if (!body.trim() || draft) return;
    if (thread) sendMessage(thread.id, body, usedAmara, scheduledFor);
    else startThread({ channel, contact: target, subject: needsSubject ? subjectLine.trim() || undefined : undefined, body, amara: usedAmara, scheduledFor });
    if (update) markSent(update.id);
    notify(scheduledFor ? `Scheduled for ${formatStamp(scheduledFor)}` : update ? `Update sent to ${first}. That's one less person waiting.` : `Sent to ${first} by ${CHANNEL_LABEL[channel]}`);
    setBody("");
    setUsedAmara(false);
  };

  const templates: MenuEntry[] = (["pre-call", "booking", "consent", "workstyle"] as TemplateKind[]).map((k) => ({
    label: TEMPLATE_LABEL[k],
    icon: FileText,
    onSelect: () => {
      const t = templateFor(k, target, me.firstName);
      setBody(t.body);
      if (needsSubject && !subjectLine) setSubjectLine(t.subject);
      setUsedAmara(false);
      requestAnimationFrame(() => document.getElementById("comm-composer")?.focus());
    },
  }));
  const later = (until: number, label: string): MenuEntry => ({ label, hint: formatStamp(until).split(", ")[1], onSelect: () => send(until) });

  return (
    <div data-tour="comm-reply" className="border-t border-line px-3 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
      <div className={cx("rounded-xl bg-surface transition-shadow", draft || usedAmara ? "amara-edge" : "border border-line focus-within:border-line-strong")}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
          <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Send on">
            {channels.map((c) => {
              const Icon = CHANNEL_ICON[c];
              return (
                <button
                  key={c}
                  role="radio"
                  aria-checked={channel === c}
                  onClick={() => setChannel(c)}
                  title={`Send by ${CHANNEL_LABEL[c]}`}
                  className={cx("inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors", channel === c ? "bg-raised text-fg" : "text-fg-faint hover:text-fg")}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                  <span className={channel === c ? "" : "hidden md:inline"}>{CHANNEL_LABEL[c]}</span>
                </button>
              );
            })}
          </div>
          {update && (
            <div className="inline-flex rounded-md border border-line p-0.5" role="radiogroup" aria-label="Tone">
              {TONES.map((t) => (
                <button key={t.id} role="radio" aria-checked={tone === t.id} onClick={() => setTone(t.id)} className={cx("h-6 rounded px-2 text-[11px] transition-colors", tone === t.id ? "bg-raised text-fg" : "text-fg-faint hover:text-fg")}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {draft ? (
              <AmaraByline>Drafting</AmaraByline>
            ) : usedAmara && body ? (
              <>
                {(["shorter", "warmer", "firmer"] as const).map((how) => (
                  <AmaraButton key={how} size="sm" onClick={() => run(rewrite(body, how))} className="capitalize">
                    {how}
                  </AmaraButton>
                ))}
              </>
            ) : (
              <AmaraButton size="sm" onClick={() => run(ai.text())}>
                {ai.label}
              </AmaraButton>
            )}
          </div>
        </div>

        {needsSubject && (
          <div className="flex items-center gap-2 border-b border-line px-3.5 py-2 text-[13px]">
            <span className="text-fg-faint">Subject</span>
            <input value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} placeholder={`To ${first}`} aria-label="Subject" className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-faint" />
          </div>
        )}

        <div className="px-3.5 py-3 text-[13px] leading-relaxed">
          {draft ? (
            <StreamText
              key={draft.run}
              text={draft.text}
              className="text-fg"
              delay={350}
              onDone={() => {
                setBody(draft.text);
                setDraft(null);
              }}
            />
          ) : (
            <textarea
              id="comm-composer"
              ref={box}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (!e.target.value) setUsedAmara(false);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
                if (e.key === "Escape") e.currentTarget.blur();
              }}
              rows={short ? 2 : 3}
              aria-label={`Message to ${conv.name}`}
              placeholder={
                update
                  ? `Tell ${first} where things stand, or let Amara draft an honest update.`
                  : conv.state === "reply"
                    ? `Reply to ${first}, or let Amara draft it.`
                    : `Write to ${first}…`
              }
              className="block max-h-56 w-full resize-none bg-transparent text-fg outline-none [field-sizing:content] placeholder:text-fg-faint"
            />
          )}
        </div>

        {update && (
          <div className="border-t border-line px-3.5 py-2">
            <button onClick={() => setShowFacts(!showFacts)} aria-expanded={showFacts} className="flex items-center gap-1.5 text-[11px] text-fg-faint hover:text-fg">
              {showFacts ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />} What Amara uses for this update
            </button>
            {showFacts && (
              <ul className="mt-2 space-y-1">
                {update.context.map((c) => (
                  <li key={c} className="flex gap-2 text-[12px] text-fg-muted">
                    <Check className="mt-[3px] size-3 shrink-0 text-amara-soft/80" /> {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-2.5 py-2">
          <Button size="sm" variant="ghost" onClick={(e) => show(e, "Insert a template", templates)}>
            <FileText className="size-3.5" /> Templates
          </Button>
          <Button size="sm" variant="ghost" onClick={onLogCall}>
            <PhoneCall className="size-3.5" /> Log a call
          </Button>
          {short && body && <span className="font-mono text-[10px] text-fg-faint num">{body.length} chars</span>}
          <span className="ml-auto hidden items-center gap-1 text-[11px] text-fg-faint sm:inline-flex">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </span>
          <div className="flex">
            <Button size="sm" variant="primary" onClick={() => send()} disabled={!body.trim() || !!draft} className="rounded-r-none">
              <Send className="size-3.5" /> {update ? "Send update" : `Send ${CHANNEL_LABEL[channel]}`}
            </Button>
            <Button
              size="sm"
              variant="primary"
              aria-label="Send later"
              title="Send later"
              disabled={!body.trim() || !!draft}
              onClick={(e) => show(e, "Send later", [later(sydney(0, 17), "Later today"), later(sydney(1, 9), "Tomorrow morning"), later(sydney(3, 9), "Monday morning")])}
              className="rounded-l-none border-l border-primary-foreground/15 px-1.5"
            >
              <Clock className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-2.5 px-1 text-[11px] text-fg-faint">Amara drafts. You send. Nothing goes out without you.</p>
      {menu}
    </div>
  );
}
