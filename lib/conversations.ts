/**
 * Conversations: everything you've said to one person, on any channel, as one
 * timeline. Threads stay per channel underneath (that's how they arrive);
 * this is the view over them, plus calls and the update they're owed.
 */
import { CHANNEL_LABEL, SIGNATURES } from "./communication";
import { NOW_MS } from "./time";
import type { CalendarEvent, CallLog, Client, FollowUp, MessageChannel, Subject, Thread } from "./types";

export type ConvState = "owed" | "reply" | "quiet" | "waiting" | "logged";

export type TimelineItem =
  | { kind: "message"; id: string; at: number; thread: Thread; from: "me" | "them"; body: string; byId?: string; amara?: boolean; scheduledFor?: number }
  | { kind: "call"; id: string; at: number; call: CallLog };

export type Conversation = {
  key: string;
  name: string;
  detail: string;
  subject?: Subject;
  threads: Thread[];
  calls: CallLog[];
  followUp?: FollowUp;
  items: TimelineItem[];
  /** Last thing that happened, sent or received. */
  last: number;
  lastItem?: TimelineItem;
  unread: boolean;
  state: ConvState;
  /** Days since you last wrote, when they haven't answered. */
  quietDays: number;
  /** When the last message (either way) was sent. */
  lastMessageAt: number;
  channels: MessageChannel[];
  /** Not a candidate, client or prospect yet: someone new wrote in. */
  unknown: boolean;
  /** What they wrote from, when we don't have a record to look it up on. */
  email?: string;
  phone?: string;
};

const DAY = 86_400_000;

/** One key per person: candidates by name, company contacts by company and name, strangers by what they wrote from. */
export function personKey(name: string, subject?: Subject) {
  if (!subject) return `u:${name}`;
  if (subject.kind === "candidate") return `p:${name}`;
  return `c:${subject.id}:${name}`;
}

/** "Priya", or "them" when all we have is a number or an address. */
export const firstName = (name: string) => (/^[+\d]|@/.test(name) ? "them" : name.split(" ")[0]);

export function buildConversations({ threads, calls, followUps }: { threads: Thread[]; calls: CallLog[]; followUps: FollowUp[] }): Conversation[] {
  const map = new Map<string, Conversation>();
  const get = (name: string, detail: string, subject?: Subject) => {
    const key = personKey(name, subject);
    let c = map.get(key);
    if (!c) {
      c = { key, name, detail, subject, threads: [], calls: [], items: [], last: 0, unread: false, state: "logged", quietDays: 0, lastMessageAt: 0, channels: [], unknown: false };
      map.set(key, c);
    }
    if (!c.subject && subject) c.subject = subject;
    return c;
  };

  for (const t of threads) {
    const c = get(t.contact.name, t.contact.detail, t.contact.subject);
    c.threads.push(t);
    c.detail = t.contact.detail;
    c.email ??= t.contact.email;
    c.phone ??= t.contact.phone;
    if (t.unread) c.unread = true;
    if (!c.channels.includes(t.channel)) c.channels.push(t.channel);
    for (const m of t.messages) c.items.push({ kind: "message", id: m.id, at: m.at, thread: t, from: m.from, body: m.body, byId: m.byId, amara: m.amara, scheduledFor: m.scheduledFor });
  }
  for (const call of calls) {
    const c = get(call.contact.name, call.contact.subject ? `${call.contact.subject.kind === "candidate" ? "Candidate" : call.contact.subject.name}` : "Call", call.contact.subject);
    c.calls.push(call);
    c.items.push({ kind: "call", id: call.id, at: call.at, call });
  }
  for (const f of followUps) {
    const subject: Subject = { kind: "candidate", id: f.dealId ?? `f-${f.id}`, name: f.name };
    const c = map.get(personKey(f.name, subject)) ?? get(f.name, f.client === "—" ? `Candidate · ${f.role}` : `Candidate · ${f.role}, ${f.client}`, subject);
    c.followUp = f;
  }

  for (const c of map.values()) {
    c.items.sort((a, b) => a.at - b.at);
    const sent = c.items.filter((i) => i.kind === "message" && !i.scheduledFor);
    c.lastItem = c.items.at(-1);
    c.last = Math.max(c.lastItem?.at ?? 0, c.followUp ? NOW_MS - c.followUp.daysWaiting * DAY : 0);
    const lastMsg = sent.at(-1);
    c.lastMessageAt = lastMsg?.at ?? 0;
    const lastTouch = c.items.filter((i) => i.kind === "call" || !i.scheduledFor).at(-1);
    if (c.followUp) c.state = "owed";
    else if (lastMsg?.kind === "message" && lastMsg.from === "them" && !(lastTouch?.kind === "call" && lastTouch.at > lastMsg.at)) c.state = "reply";
    else if (lastMsg?.kind === "message" && lastMsg.from === "me") {
      c.quietDays = Math.floor((NOW_MS - lastMsg.at) / DAY);
      c.state = c.quietDays >= 3 ? "quiet" : "waiting";
    } else c.state = "logged";
    if (!c.detail) c.detail = c.subject?.name ?? "";
    c.unknown = !c.subject;
  }
  return [...map.values()];
}

export const STATE_LABEL: Record<ConvState, string> = {
  owed: "Owed an update",
  reply: "Replied to you",
  quiet: "Gone quiet",
  waiting: "Waiting on them",
  logged: "Calls only",
};

/** The one-line reason a conversation sits where it does. */
export function reasonFor(c: Conversation) {
  if (c.unknown) return `New · wrote ${relative(c.lastMessageAt || c.last)}`;
  if (c.state === "owed") return `Owed an update · ${c.followUp!.daysWaiting}d`;
  if (c.state === "reply") return `Replied ${relative(c.lastMessageAt)}`;
  if (c.state === "quiet") return `No reply · ${c.quietDays}d. Follow up?`;
  if (c.state === "waiting") return `You wrote ${relative(c.lastMessageAt)}`;
  return `Last call ${relative(c.last)}`;
}

export function relative(ms: number) {
  const h = (NOW_MS - ms) / 3_600_000;
  if (h < 0) return "just now";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

/** Which channels you can reach them on, and the one to answer on. */
export function channelsFor(c: Conversation, contact: { email?: string; phone?: string }): MessageChannel[] {
  const out = new Set<MessageChannel>(c.channels);
  if (contact.email) out.add("email");
  if (contact.phone) {
    out.add("sms");
    out.add("whatsapp");
  }
  if (c.subject?.kind === "candidate") out.add("linkedin");
  return (["email", "sms", "whatsapp", "linkedin"] as MessageChannel[]).filter((x) => out.has(x));
}

export function replyChannel(c: Conversation): MessageChannel {
  const inbound = [...c.items].reverse().find((i) => i.kind === "message" && i.from === "them");
  if (inbound?.kind === "message") return inbound.thread.channel;
  const any = [...c.items].reverse().find((i) => i.kind === "message");
  return any?.kind === "message" ? any.thread.channel : "email";
}

/** What their signature or message says about someone new, to prefill adding them. */
export function signatureFor(c: Conversation) {
  const t = c.threads.find((x) => SIGNATURES[x.id]);
  return t ? SIGNATURES[t.id] : undefined;
}

/** A client or prospect whose people write from the same domain. */
export function companyByDomain(email: string | undefined, clients: Client[]) {
  const domain = email?.split("@")[1]?.toLowerCase();
  if (!domain) return undefined;
  return clients.find((c) => [c.contact, ...(c.contacts ?? [])].some((p) => p.email?.toLowerCase().endsWith(`@${domain}`)));
}

export const eventsFor = (c: Conversation, events: CalendarEvent[]) =>
  events
    .filter((e) => (c.subject && e.subject?.id === c.subject.id) || e.with?.some((w) => w.startsWith(c.name)) || e.title.includes(c.name))
    .sort((a, b) => a.start - b.start);

/* ── Mocked Amara ─────────────────────────────────────────────────── */

const snippet = (text: string, n = 90) => {
  const flat = text.replace(/\s+/g, " ").replace(/^(hi|hey|hello)\s+\w+,?\s*/i, "").trim();
  return flat.length > n ? `${flat.slice(0, n).trimEnd()}…` : flat;
};

/** Amara's read of a conversation. Replace with a model call that cites the messages it used. */
export function summarize(c: Conversation) {
  const first = firstName(c.name);
  const msgs = c.items.filter((i): i is Extract<TimelineItem, { kind: "message" }> => i.kind === "message" && !i.scheduledFor);
  const theirs = msgs.filter((m) => m.from === "them");
  const lastTheirs = theirs.at(-1);
  const channels = [...new Set(msgs.map((m) => CHANNEL_LABEL[m.thread.channel]))];
  const parts: string[] = [];
  parts.push(
    msgs.length
      ? `${msgs.length} ${msgs.length === 1 ? "message" : "messages"} over ${channels.join(" and ")}${c.calls.length ? `, plus ${c.calls.length} ${c.calls.length === 1 ? "call" : "calls"}` : ""}.`
      : `${c.calls.length} ${c.calls.length === 1 ? "call" : "calls"} logged, no messages yet.`,
  );
  if (lastTheirs) parts.push(`${first === "them" ? "They" : first} last wrote ${relative(lastTheirs.at)}: "${snippet(lastTheirs.body)}"`);
  const note = [...c.calls].sort((a, b) => b.at - a.at).find((x) => x.note)?.note;
  if (note) parts.push(`From the last call: ${note.replace(/\.$/, "")}.`);
  if (c.unknown) {
    const sig = signatureFor(c);
    parts.push(
      sig
        ? `They aren't on your desk yet. ${sig.name} signs off as ${sig.title}${sig.company ? ` at ${sig.company}` : ""}, so add them as ${sig.as === "candidate" ? "a candidate" : sig.as === "prospect" ? "a prospect" : `a contact at ${sig.company}`} before you reply. Tasks and notes need a record to live on.`
        : "They aren't on your desk yet. Add them before you reply so tasks and notes have a record to live on.",
    );
  } else if (c.state === "owed") parts.push(`${first} is owed an update: ${c.followUp!.detail.replace(/\.$/, "")}. Tell them before anything else.`);
  else if (c.state === "reply") parts.push(`The ball is with you. Answer what they asked before adding anything new.`);
  else if (c.state === "quiet") parts.push(`You've waited ${c.quietDays} days. A one-line nudge, ideally on a different channel, usually gets an answer.`);
  else if (c.state === "waiting") parts.push(`Nothing to do yet. Give them until ${c.quietDays >= 1 ? "tomorrow" : "Monday"} before nudging.`);
  return { text: parts.join(" "), sources: `Read from ${msgs.length} ${msgs.length === 1 ? "message" : "messages"}${c.calls.length ? ` and ${c.calls.length} call ${c.calls.length === 1 ? "note" : "notes"}` : ""}.` };
}

/** Amara's quick edits to a draft. Mocked: real ones would rewrite with the model. */
export function rewrite(text: string, how: "shorter" | "warmer" | "firmer") {
  const lines = text.trim().split("\n");
  const multi = lines.length > 1;
  const greeting = multi && /^(hi|hey|hello)\b/i.test(lines[0]) ? lines[0] : "";
  const sign = multi && lines.at(-1)!.trim().split(" ").length <= 2 ? lines.at(-1)!.trim() : "";
  const body = lines
    .slice(greeting ? 1 : 0, sign ? -1 : undefined)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = body.match(/[^.!?]+[.!?]+/g) ?? [body];
  const next =
    how === "shorter"
      ? sentences.slice(0, 2).join(" ").trim()
      : how === "warmer"
        ? `Hope your week's going well. ${body}`
        : `${sentences.slice(0, 2).join(" ").trim()} Could you let me know by Monday?`;
  return [greeting, next, sign].filter(Boolean).join("\n\n");
}
