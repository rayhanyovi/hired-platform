"use client";

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  BellOff,
  Check,
  CheckCheck,
  Clock,
  Inbox,
  ListFilter,
  MailOpen,
  MessageSquareReply,
  MessageSquareText,
  PanelTopOpen,
  Phone,
  Pin,
  Radio,
  Search,
  SquarePen,
  Tag,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { sydney } from "@/lib/calendar";
import { CHANNEL_LABEL } from "@/lib/communication";
import { buildConversations, firstName, personKey, reasonFor, relative, type Conversation, type ConvState } from "@/lib/conversations";
import { LABEL_COLORS, labelPath, labelTree, withChildren } from "@/lib/labels";
import { useDesk } from "@/lib/store";
import { liveNow, NOW_MS } from "@/lib/time";
import type { ComposeRequest, Label, MessageChannel, SubjectKind } from "@/lib/types";
import { Mark } from "../records/menus";
import { useOpenSubject } from "../records/tasks";
import { useContextMenu, type MenuEntry } from "../ui/context-menu";
import { inputClass } from "../ui/modal";
import { StatCard, StatRow } from "../ui/metrics";
import { Avatar, Button, Kbd, cx } from "../ui/primitives";
import { Swap, TAB_SPRING } from "../ui/swap";
import { CHANNEL_ICON } from "./channel";
import { ComposeDialog } from "./compose-dialog";
import { ContextPanel } from "./context-panel";
import { ConversationView, type ContactInfo } from "./conversation";
import { LabelBar, LabelChip, LabelPicker } from "./labels";
import { ADD_AS, AddToDeskDialog, NewPersonAvatar, type AddAs } from "./recognize";

type Tab = "needs" | "waiting" | "all" | "snoozed" | "done";
type Who = "all" | SubjectKind | "new";
type Via = "all" | MessageChannel | "calls";
/** Where a conversation sits in "Needs you": its state, or "new" for someone not on your desk. */
type Group = ConvState | "new";

const groupOf = (c: Conversation): Group => (c.unknown ? "new" : c.state);

/** The ways a conversation needs you, in the order to work them. Tiles match the cards above. */
const NEEDS: { id: Group; label: string; icon: LucideIcon; tile: string; hint: string }[] = [
  { id: "reply", label: "Replied to you", icon: MessageSquareReply, tile: "bg-offers-tile text-white", hint: "They wrote last" },
  { id: "owed", label: "Owed an update", icon: MessageSquareText, tile: "bg-calls-tile text-white", hint: "Waiting on news from you" },
  { id: "new", label: "New people", icon: UserPlus, tile: "bg-hover text-fg ring-1 ring-inset ring-line-strong", hint: "Not on your desk yet" },
  { id: "quiet", label: "Gone quiet", icon: Clock, tile: "bg-submittals-tile text-white", hint: "No reply in 3+ days" },
];

/** The reason pill on a row: blue when they replied, amber when it's on you, plain otherwise. */
const TONE: Record<Group, { pill: string; dot: string }> = {
  reply: { pill: "bg-offers/10 text-offers", dot: "bg-offers" },
  owed: { pill: "bg-warm/10 text-warm", dot: "bg-warm" },
  quiet: { pill: "bg-warm/10 text-warm", dot: "bg-warm" },
  new: { pill: "bg-fg/10 text-fg", dot: "bg-fg" },
  waiting: { pill: "bg-fg/[0.06] text-fg-muted", dot: "bg-fg-faint" },
  logged: { pill: "bg-fg/[0.06] text-fg-muted", dot: "bg-fg-faint" },
};

const TABS: { id: Tab; label: string }[] = [
  { id: "needs", label: "Needs you" },
  { id: "waiting", label: "Waiting" },
  { id: "all", label: "All" },
  { id: "snoozed", label: "Snoozed" },
  { id: "done", label: "Done" },
];

const WHO: { id: Who; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "candidate", label: "Candidates" },
  { id: "client", label: "Clients" },
  { id: "prospect", label: "Prospects" },
  { id: "new", label: "New people" },
];
const VIA: { id: Via; label: string }[] = [{ id: "all", label: "Every channel" }, ...(Object.keys(CHANNEL_LABEL) as MessageChannel[]).map((c) => ({ id: c, label: CHANNEL_LABEL[c] })), { id: "calls", label: "Calls" }];

// The list and the conversation sit side by side from 1024px; below that they take turns.
const WIDE = "(min-width: 1024px)";
const subscribeWide = (cb: () => void) => {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true);

/**
 * Communication: one conversation per person, across email, SMS, WhatsApp,
 * LinkedIn and calls. "Needs you" puts replies, owed updates, new people and
 * quiet threads first; labels are your own grouping on top; the composer
 * answers on any channel; the side panel shows who they are and what's next.
 */
export function CommunicationPage() {
  const {
    threads,
    calls,
    followUps,
    clients,
    conversationFlags: flags,
    flagConversation,
    markThreadRead,
    updateThread,
    selectedThreadId,
    selectedFollowUpId,
    composeRequest,
    clearComposeRequest,
    notify,
    talent,
    labels,
    toggleLabel,
  } = useDesk();

  const conversations = useMemo(() => buildConversations({ threads, calls, followUps }), [threads, calls, followUps]);
  const people = talent;
  const wide = useWide();
  const [tab, setTab] = useState<Tab>("needs");
  const [who, setWho] = useState<Who>("all");
  const [via, setVia] = useState<Via>("all");
  const [label, setLabel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selKey, setSelKey] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  /** On phones the list and the conversation take turns. */
  const [reading, setReading] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  /** Below 1280px the details open as a sheet over the conversation instead of a column. */
  const [sheet, setSheet] = useState(false);
  const [composing, setComposing] = useState<ComposeRequest | true | null>(null);
  const [adding, setAdding] = useState<{ key: string; as?: AddAs } | null>(null);
  const { bind, show, menu } = useContextMenu();
  const openSubject = useOpenSubject();

  // Owed updates can't be marked done: the only way out is to send it.
  const isDone = (c: Conversation) => c.state !== "owed" && (flags[c.key]?.doneAt ?? -1) >= c.last;
  const isSnoozed = (c: Conversation) => (flags[c.key]?.snoozedUntil ?? 0) > NOW_MS;
  const isPinned = (c: Conversation) => !!flags[c.key]?.pinned;
  const labelsOf = (c: Conversation) => labels.filter((l) => flags[c.key]?.labels?.includes(l.id));
  const hasLabel = (c: Conversation, ids: string[]) => !!flags[c.key]?.labels?.some((x) => ids.includes(x));
  const active = conversations.filter((c) => !isDone(c) && !isSnoozed(c));
  // Someone new stays in "Needs you" until they're on your desk or you mark them done.
  const needs = active.filter((c) => c.unknown || c.state === "reply" || c.state === "owed" || c.state === "quiet");

  const contactFor = (c: Conversation): ContactInfo => {
    if (c.unknown) return { email: c.email, phone: c.phone };
    if (c.subject && c.subject.kind !== "candidate") {
      const co = clients.find((x) => x.id === c.subject!.id);
      const p = co && [co.contact, ...(co.contacts ?? [])].find((x) => x.name === c.name);
      return { email: p?.email, phone: p?.phone };
    }
    const r = people.find((x) => x.name === c.name);
    return { email: r?.email, phone: r?.phone };
  };

  // Who, channel and search narrow every tab; the label narrows on top of that.
  const narrowed = (list: Conversation[]) =>
    list
      .filter((c) => who === "all" || (who === "new" ? c.unknown : !c.unknown && (c.subject?.kind ?? "candidate") === who))
      .filter((c) => via === "all" || (via === "calls" ? c.calls.length > 0 : c.channels.includes(via)))
      .filter((c) => {
        if (!query) return true;
        const text = c.items.map((i) => (i.kind === "message" ? `${i.thread.subject ?? ""} ${i.body}` : (i.call.note ?? ""))).join(" ");
        return `${c.name} ${c.detail} ${c.email ?? ""} ${text}`.toLowerCase().includes(query.toLowerCase());
      });
  const labelIds = label ? withChildren(labels, label) : null;
  // Pinned first, then newest. Not unread first: reading a row shouldn't make it jump.
  const filtered = (list: Conversation[]) => narrowed(list).filter((c) => !labelIds || hasLabel(c, labelIds)).sort((a, b) => Number(isPinned(b)) - Number(isPinned(a)) || b.last - a.last);

  const sources: Record<Tab, Conversation[]> = {
    needs,
    waiting: active.filter((c) => !c.unknown && c.state === "waiting"),
    all: active,
    snoozed: conversations.filter((c) => isSnoozed(c) && !isDone(c)),
    done: conversations.filter(isDone),
  };
  const lists: Record<Tab, Conversation[]> = { needs: filtered(sources.needs), waiting: filtered(sources.waiting), all: filtered(sources.all), snoozed: filtered(sources.snoozed), done: filtered(sources.done) };
  // Label counts follow the tab you're on, so the number is what you'll see when you pick it.
  const inTab = narrowed(sources[tab]);
  const labelCounts = Object.fromEntries(labels.map((l) => [l.id, inTab.filter((c) => hasLabel(c, withChildren(labels, l.id))).length]));
  // "Needs you" is worked in groups: replies, owed updates, new people, then quiet threads.
  const visible = tab === "needs" ? NEEDS.flatMap((n) => lists.needs.filter((c) => groupOf(c) === n.id)) : lists[tab];
  // Side by side, the top conversation opens by default; "__none__" means you stepped away on purpose.
  const selected = selKey === "__none__" ? undefined : (conversations.find((c) => c.key === selKey) ?? (wide && !reading ? visible[0] : undefined));

  // Another page asked for a thread or an owed update: open that person.
  const [seen, setSeen] = useState({ thread: selectedThreadId, update: selectedFollowUpId });
  if (selectedThreadId !== seen.thread || selectedFollowUpId !== seen.update) {
    setSeen({ thread: selectedThreadId, update: selectedFollowUpId });
    const target =
      selectedThreadId && selectedThreadId !== seen.thread
        ? conversations.find((c) => c.threads.some((t) => t.id === selectedThreadId))
        : selectedFollowUpId && selectedFollowUpId !== seen.update
          ? conversations.find((c) => c.followUp?.id === selectedFollowUpId)
          : undefined;
    if (target) {
      setSelKey(target.key);
      setTab(isDone(target) ? "done" : isSnoozed(target) ? "snoozed" : "all");
      setWho("all");
      setVia("all");
      setLabel(null);
      setQuery("");
      setReading(true);
    }
  }

  // A message asked for elsewhere (e.g. Email from a right-click menu) opens once, prefilled.
  const [seenCompose, setSeenCompose] = useState(0);
  if (composeRequest && composeRequest.n !== seenCompose) {
    setSeenCompose(composeRequest.n);
    setComposing(composeRequest);
  }
  useEffect(() => {
    if (composeRequest) clearComposeRequest();
  }, [composeRequest, clearComposeRequest]);

  // Reading a conversation marks it read, wherever it was opened from. Only when it's on screen.
  const unreadIds = (wide || reading) && selected ? selected.threads.filter((t) => t.unread).map((t) => t.id).join(",") : "";
  useEffect(() => {
    // The first render assumes a wide screen; on a phone nothing is on screen until you open it.
    if (!unreadIds || (!reading && !window.matchMedia(WIDE).matches)) return;
    unreadIds.split(",").forEach(markThreadRead);
  }, [unreadIds, reading, markThreadRead]);

  const open = (c: Conversation) => {
    setSelKey(c.key);
    setReading(true);
  };

  const done = (c: Conversation, quiet = false) => {
    if (c.state === "owed") {
      if (!quiet) notify(`${firstName(c.name)} is still owed an update. Send it and they'll clear.`);
      return;
    }
    const i = visible.findIndex((x) => x.key === c.key);
    flagConversation(c.key, { doneAt: liveNow(), snoozedUntil: undefined });
    const next = visible[i + 1] ?? visible[i - 1];
    setSelKey(next && next.key !== c.key ? next.key : null);
    if (!quiet) notify(`Done with ${firstName(c.name)}`);
  };
  const markUnread = (c: Conversation) => {
    const t = [...c.threads].sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))[0];
    if (!t) return;
    // Step away first, so reading doesn't mark it read again.
    setSelKey("__none__");
    setReading(false);
    updateThread(t.id, { unread: true });
  };
  const snooze = (c: Conversation, until: number, label: string) => {
    flagConversation(c.key, { snoozedUntil: until });
    notify(`Snoozed ${firstName(c.name)} until ${label.toLowerCase()}`);
    if (selected?.key === c.key) setSelKey(null);
  };
  const togglePick = (key: string) => setPicked((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  const clearFilters = () => {
    setWho("all");
    setVia("all");
    setLabel(null);
  };

  // J/K or arrows to move, E done, P pin, U unread, R reply. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sheet) return setSheet(false);
      if (e.metaKey || e.ctrlKey || e.altKey || composing || sheet || adding) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable], [role='menu'], [role='dialog']")) return;
      const i = visible.findIndex((c) => c.key === selected?.key);
      const k = e.key.toLowerCase();
      const go = (n?: Conversation) => {
        if (!n) return;
        e.preventDefault();
        open(n);
        requestAnimationFrame(() => document.getElementById(`conv-${n.key}`)?.scrollIntoView({ block: "nearest" }));
      };
      if (k === "j" || k === "arrowdown") go(visible[Math.min(visible.length - 1, i + 1)]);
      else if (k === "k" || k === "arrowup") go(visible[Math.max(0, i - 1)]);
      else if (k === "e" && selected) done(selected);
      else if (k === "p" && selected) flagConversation(selected.key, { pinned: !isPinned(selected) });
      else if (k === "u" && selected) markUnread(selected);
      else if (k === "r" && selected) {
        e.preventDefault();
        document.getElementById("comm-composer")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const rowMenu = (c: Conversation): MenuEntry[] => [
    { label: "Open", icon: PanelTopOpen, onSelect: () => open(c) },
    c.unread
      ? { label: "Mark as read", icon: MailOpen, onSelect: () => c.threads.forEach((t) => markThreadRead(t.id)) }
      : { label: "Mark as unread", icon: MailOpen, hint: "U", onSelect: () => markUnread(c) },
    { label: isPinned(c) ? "Unpin" : "Pin to top", icon: Pin, hint: "P", onSelect: () => flagConversation(c.key, { pinned: !isPinned(c) }) },
    isSnoozed(c)
      ? { label: "Unsnooze", icon: BellOff, onSelect: () => flagConversation(c.key, { snoozedUntil: undefined }) }
      : {
          label: "Snooze",
          icon: BellOff,
          submenu: [
            { label: "Later today", onSelect: () => snooze(c, sydney(0, 17), "Later today") },
            { label: "Tomorrow morning", onSelect: () => snooze(c, sydney(1, 9), "Tomorrow morning") },
            { label: "Monday morning", onSelect: () => snooze(c, sydney(3, 9), "Monday morning") },
            { label: "Next week", onSelect: () => snooze(c, sydney(7, 9), "Next week") },
          ],
        },
    { label: "Label as", icon: Tag, hint: labelsOf(c).length ? String(labelsOf(c).length) : undefined, panel: () => <LabelPicker convKey={c.key} name={c.name} /> },
    ...(c.unknown
      ? [{ separator: true } as MenuEntry, { label: "Add to your desk", icon: UserPlus, submenu: ADD_AS.map((a) => ({ label: a.label, icon: a.icon, onSelect: () => setAdding({ key: c.key, as: a.id }) })) }]
      : c.subject
        ? [{ separator: true } as MenuEntry, { label: `Open ${c.subject.kind === "candidate" ? "their record" : c.subject.name}`, icon: PanelTopOpen, onSelect: () => openSubject(c.subject!) }]
        : []),
    { separator: true },
    isDone(c)
      ? { label: "Move back to inbox", icon: Inbox, onSelect: () => flagConversation(c.key, { doneAt: undefined }) }
      : { label: "Mark done", icon: Check, hint: "E", disabled: c.state === "owed" ? "Send their update first" : undefined, onSelect: () => done(c) },
  ];

  const counts = {
    reply: needs.filter((c) => groupOf(c) === "reply").length,
    owed: needs.filter((c) => groupOf(c) === "owed").length,
    quiet: needs.filter((c) => groupOf(c) === "quiet").length,
    calls: calls.filter((c) => NOW_MS - c.at < 7 * 86_400_000).length,
  };

  const bulk = (fn: (c: Conversation) => void, text: string) => {
    const chosen = conversations.filter((c) => picked.includes(c.key));
    chosen.forEach(fn);
    notify(`${text} ${chosen.length} ${chosen.length === 1 ? "conversation" : "conversations"}`);
    setPicked([]);
  };

  const filterMenu = (): MenuEntry[] => [
    { label: "Who", icon: Users, hint: who === "all" ? undefined : WHO.find((w) => w.id === who)?.label, submenu: WHO.map((w) => ({ label: w.label, checked: who === w.id, onSelect: () => setWho(w.id) })) },
    { label: "Channel", icon: Radio, hint: via === "all" ? undefined : VIA.find((v) => v.id === via)?.label, submenu: VIA.map((v) => ({ label: v.label, checked: via === v.id, onSelect: () => setVia(v.id) })) },
    {
      label: "Label",
      icon: Tag,
      hint: label ? labels.find((l) => l.id === label)?.name : undefined,
      disabled: labels.length ? undefined : "No labels yet",
      submenu: [{ label: "Any label", checked: !label, onSelect: () => setLabel(null) }, ...labelTree(labels).map(({ label: l }) => ({ label: labelPath(labels, l.id), swatch: LABEL_COLORS[l.color].dot, checked: label === l.id, onSelect: () => setLabel(l.id) }))],
    },
    { separator: true },
    { label: "Clear filters", icon: X, disabled: who === "all" && via === "all" && !label ? "No filters on" : undefined, onSelect: clearFilters },
  ];
  // The label shows in the bar under the tabs; it still counts as a filter here.
  const filtersOn = (who !== "all" ? 1 : 0) + (via !== "all" ? 1 : 0) + (label ? 1 : 0);

  const rowProps = (c: Conversation) => ({
    c,
    labels: labelsOf(c),
    active: selected?.key === c.key,
    pinned: isPinned(c),
    picked: picked.includes(c.key),
    picking: picked.length > 0,
    onPick: () => togglePick(c.key),
    onOpen: () => open(c),
    menuProps: bind(c.name, () => rowMenu(c)),
  });

  const addingConv = adding ? conversations.find((c) => c.key === adding.key) : undefined;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col px-4 pt-6 pb-16 sm:px-8 sm:pt-8 lg:h-[calc(100dvh-64px)] lg:pb-6">
      <StatRow cols={4} dense className={cx("mb-6 shrink-0", reading && "hidden lg:grid")} dataTour="comm-stats">
        {(
          [
            ["reply", MessageSquareReply, "bg-offers-tile", "Replied to you", counts.reply, "The ball is with you"],
            ["owed", MessageSquareText, "bg-calls-tile", "Owed an update", counts.owed, "Candidates waiting on news"],
            ["quiet", Clock, "bg-submittals-tile", "Gone quiet", counts.quiet, "No reply in 3+ days"],
            ["calls", Phone, "bg-placements-tile", "Calls this week", counts.calls, "Logged by the team"],
          ] as const
        ).map(([id, icon, tile, label, value, sub]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id === "calls" ? "all" : "needs");
              setVia(id === "calls" ? "calls" : "all");
              setWho("all");
              setLabel(null);
              setReading(false);
            }}
            className="text-left"
          >
            <StatCard icon={icon} tile={tile} label={label} value={value} sub={sub} warm={(id === "owed" || id === "quiet") && value > 0} />
          </button>
        ))}
      </StatRow>

      <div
        className={cx(
          "grid min-h-[620px] flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-line bg-ink-sunken lg:min-h-0 lg:grid-cols-[392px_minmax(0,1fr)]",
          contextOpen && selected && "xl:grid-cols-[392px_minmax(0,1fr)_320px]",
        )}
      >
        {/* Conversations */}
        <section aria-label="Conversations" className={cx("flex min-h-0 flex-col border-line lg:border-r", reading && "hidden lg:flex")}>
          <div className="border-b border-line bg-ink">
            <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people and messages" aria-label="Search conversations" className={cx(inputClass, "h-8 pl-8 text-[12px]")} />
              </div>
              <button
                onClick={(e) => show(e, "Filter conversations", filterMenu())}
                aria-label={filtersOn ? `Filters (${filtersOn} on)` : "Filters"}
                title="Filter by who, channel and label"
                className={cx("relative grid size-8 shrink-0 place-items-center rounded-lg border transition-colors", filtersOn ? "border-fg/25 bg-raised text-fg" : "border-line-strong text-fg-muted hover:bg-hover hover:text-fg")}
              >
                <ListFilter className="size-3.5" />
                {filtersOn > 0 && <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-fg font-mono text-[9px] text-ink">{filtersOn}</span>}
              </button>
              <Button size="sm" variant="primary" onClick={() => setComposing(true)} className="h-8">
                <SquarePen className="size-3.5" /> New
              </Button>
            </div>
            <Views
              tab={tab}
              counts={{ needs: lists.needs.length, waiting: lists.waiting.length, snoozed: lists.snoozed.length }}
              onChange={(t) => {
                setTab(t);
                setPicked([]);
              }}
            />
          </div>

          <div data-tour="comm-labels" className="border-b border-line">
            <LabelBar active={label} onChange={setLabel} counts={labelCounts} />
          </div>

          {(who !== "all" || via !== "all") && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-2.5 text-[11px]">
              <span className="text-fg-faint">Showing</span>
              {who !== "all" && <FilterChip onClear={() => setWho("all")}>{WHO.find((w) => w.id === who)?.label}</FilterChip>}
              {via !== "all" && <FilterChip onClear={() => setVia("all")}>{VIA.find((v) => v.id === via)?.label}</FilterChip>}
            </div>
          )}

          {picked.length > 0 && (
            <div className="flex animate-pop items-center gap-0.5 border-b border-line bg-raised/60 px-4 py-2 text-[12px]">
              <span className="mr-1.5 text-fg">{picked.length} selected</span>
              <Button size="sm" variant="ghost" onClick={() => bulk((c) => done(c, true), "Marked done:")}>
                <Check className="size-3.5" /> Done
              </Button>
              <Button size="sm" variant="ghost" onClick={() => bulk((c) => c.threads.forEach((t) => markThreadRead(t.id)), "Marked read:")}>
                <MailOpen className="size-3.5" /> Read
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) =>
                  show(
                    e,
                    "Label selected",
                    labelTree(labels).map(({ label: l }) => ({
                      label: labelPath(labels, l.id),
                      swatch: LABEL_COLORS[l.color].dot,
                      onSelect: () =>
                        bulk((c) => {
                          if (!flags[c.key]?.labels?.includes(l.id)) toggleLabel(c.key, c.name, l.id);
                        }, `Labelled ${l.name}:`),
                    })),
                  )
                }
              >
                <Tag className="size-3.5" /> Label
              </Button>
              <Button size="sm" variant="ghost" onClick={() => bulk((c) => flagConversation(c.key, { snoozedUntil: sydney(1, 9) }), "Snoozed until tomorrow:")}>
                <BellOff className="size-3.5" /> Snooze
              </Button>
              <button onClick={() => setPicked([])} aria-label="Clear selection" className="ml-auto grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <div data-tour="comm-list" className="min-h-0 flex-1 overflow-y-auto pb-2">
            <Swap id={`${tab}-${who}-${via}-${label}`}>
              {visible.length === 0 ? (
                <Cleared
                  tab={tab}
                  filtered={who !== "all" || via !== "all" || !!label || !!query}
                  onClear={() => {
                    clearFilters();
                    setQuery("");
                  }}
                />
              ) : tab === "needs" ? (
                NEEDS.map((n, i) => {
                  const rows = visible.filter((c) => groupOf(c) === n.id);
                  if (!rows.length) return null;
                  return (
                    <section key={n.id} aria-label={n.label} className={cx(i > 0 && "border-t border-line")}>
                      <h3 className="sticky top-0 z-10 flex items-center gap-2.5 bg-ink-sunken px-5 pt-5 pb-3" title={n.hint}>
                        <span className={cx("grid size-5 shrink-0 place-items-center rounded-md", n.tile)}>
                          <n.icon className="size-3" strokeWidth={2} />
                        </span>
                        <span className="text-[12px] font-semibold text-fg">{n.label}</span>
                        <span className="rounded-full bg-raised px-1.5 py-px font-mono text-[10px] text-fg-muted num">{rows.length}</span>
                        <span className="ml-auto truncate text-[11px] text-fg-faint">{n.hint}</span>
                      </h3>
                      <ul className="space-y-1 px-3 pb-4">
                        {rows.map((c) => (
                          <Row key={c.key} {...rowProps(c)} />
                        ))}
                      </ul>
                    </section>
                  );
                })
              ) : (
                <ul className="space-y-1 p-3">
                  {visible.map((c) => (
                    <Row key={c.key} {...rowProps(c)} />
                  ))}
                </ul>
              )}
            </Swap>
          </div>
          <div className="hidden flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-5 py-2.5 text-[11px] text-fg-faint lg:flex">
            <span className="inline-flex items-center gap-1">
              <Kbd>J</Kbd>
              <Kbd>K</Kbd> move
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>R</Kbd> reply
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>E</Kbd> done
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>P</Kbd> pin
            </span>
          </div>
        </section>

        {/* The conversation */}
        <section aria-label="Conversation" className={cx("flex min-h-[560px] min-w-0 flex-col bg-ink lg:min-h-0", !reading && "hidden lg:flex")}>
          {selected ? (
            <Swap id={selected.key} className="flex min-h-0 flex-1 flex-col">
              <ConversationView
                conv={selected}
                contact={contactFor(selected)}
                pinned={isPinned(selected)}
                onDone={() => done(selected)}
                onBack={() => setReading(false)}
                contextOpen={contextOpen}
                onToggleContext={() => (window.matchMedia("(min-width: 1280px)").matches ? setContextOpen(!contextOpen) : setSheet(true))}
                onAddToDesk={(as) => setAdding({ key: selected.key, as })}
              />
            </Swap>
          ) : (
            <Empty />
          )}
        </section>

        {/* Who they are */}
        {contextOpen && selected && (
          <aside aria-label={`About ${selected.name}`} className="hidden min-h-0 overflow-y-auto border-l border-line bg-ink-sunken xl:block">
            <Swap id={selected.key}>
              <ContextPanel conv={selected} contact={contactFor(selected)} onAddToDesk={(as) => setAdding({ key: selected.key, as })} />
            </Swap>
          </aside>
        )}
      </div>

      {sheet && selected && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label={`About ${selected.name}`}>
          <button aria-label="Close details" className="absolute inset-0 animate-fade bg-black/60" onClick={() => setSheet(false)} />
          <aside className="absolute inset-y-0 right-0 w-full max-w-[360px] animate-drawer overflow-y-auto border-l border-line-strong bg-ink-sunken">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[13px] font-medium">Details</span>
              <button onClick={() => setSheet(false)} aria-label="Close" className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
                <X className="size-4" />
              </button>
            </div>
            <ContextPanel
              conv={selected}
              contact={contactFor(selected)}
              onAddToDesk={(as) => {
                setSheet(false);
                setAdding({ key: selected.key, as });
              }}
            />
          </aside>
        </div>
      )}
      {menu}
      {composing && (
        <ComposeDialog
          initial={composing === true ? undefined : composing}
          onClose={() => setComposing(null)}
          onSent={() => {
            const r = composing === true ? null : composing;
            setComposing(null);
            setTab("all");
            if (r) setSelKey(personKey(r.contact.name, r.contact.subject));
            setReading(true);
          }}
        />
      )}
      {addingConv && (
        <AddToDeskDialog
          conv={addingConv}
          initialAs={adding?.as}
          onClose={() => setAdding(null)}
          onAdded={(key) => {
            setSelKey(key);
            setReading(true);
          }}
        />
      )}
    </main>
  );
}

/** Underlined views across the top of the list. "Needs you" carries the loudest count. */
function Views({ tab, counts, onChange }: { tab: Tab; counts: Partial<Record<Tab, number>>; onChange: (t: Tab) => void }) {
  const underline = useId();
  return (
    <div data-tour="comm-triage" role="tablist" aria-label="Conversations" className="flex gap-1 overflow-x-auto px-3 [scrollbar-width:none]!">
      {TABS.map((t) => {
        const on = tab === t.id;
        const n = counts[t.id];
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cx("relative flex h-10 shrink-0 items-center gap-1.5 px-2 text-[12.5px] transition-colors", on ? "font-medium text-fg" : "text-fg-muted hover:text-fg")}
          >
            {t.label}
            {!!n && (
              <span
                className={cx(
                  "min-w-[18px] rounded-full px-1.5 py-px text-center font-mono text-[10px] leading-4 num",
                  t.id === "needs" ? "bg-fg font-semibold text-ink" : on ? "bg-raised text-fg" : "bg-raised text-fg-faint",
                )}
              >
                {n}
              </span>
            )}
            {on && <motion.span layoutId={underline} transition={TAB_SPRING} className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-fg" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

function FilterChip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md border border-fg/20 bg-raised pr-0.5 pl-2 text-fg">
      {children}
      <button onClick={onClear} aria-label="Remove filter" className="grid size-5 place-items-center rounded text-fg-muted hover:bg-hover hover:text-fg">
        <X className="size-3" />
      </button>
    </span>
  );
}

function Row({
  c,
  labels,
  active,
  pinned,
  picked,
  picking,
  onPick,
  onOpen,
  menuProps,
}: {
  c: Conversation;
  labels: Label[];
  active: boolean;
  pinned: boolean;
  picked: boolean;
  picking: boolean;
  onPick: () => void;
  onOpen: () => void;
  menuProps: ReturnType<ReturnType<typeof useContextMenu>["bind"]>;
}) {
  const last = c.lastItem;
  const preview =
    last?.kind === "message"
      ? `${last.scheduledFor ? "Scheduled: " : last.from === "me" ? "You: " : ""}${last.body.replace(/\s+/g, " ")}`
      : last?.kind === "call"
        ? `Call · ${last.call.outcome === "connected" ? "connected" : last.call.outcome === "voicemail" ? "voicemail" : "no answer"}${last.call.note ? ` · ${last.call.note}` : ""}`
        : (c.followUp?.detail ?? "");
  const LastIcon = last?.kind === "message" ? CHANNEL_ICON[last.thread.channel] : c.followUp && !last ? MessageSquareText : Phone;
  const tone = TONE[groupOf(c)];

  return (
    <li id={`conv-${c.key}`} className="group relative">
      <button
        {...menuProps}
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={cx(
          "relative flex w-full gap-3.5 rounded-xl border px-3.5 py-3 text-left transition-colors",
          active ? "border-line-strong bg-raised shadow-[0_10px_24px_-14px_rgb(0_0_0/0.9)]" : picked ? "border-transparent bg-raised/60" : "border-transparent hover:bg-surface",
        )}
      >
        {active && <span className="absolute inset-y-3 -left-px w-[3px] rounded-r-full bg-fg" aria-hidden="true" />}
        <span className={cx("mt-0.5 shrink-0 transition-opacity", (picking || picked) && "opacity-0", "group-hover:opacity-0")}>
          {c.unknown ? <NewPersonAvatar /> : <Avatar name={c.name} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {c.unread && <span className="size-2 shrink-0 rounded-full bg-fg" aria-label="Unread" />}
            <span className={cx("truncate text-[13.5px] leading-5 text-fg", c.unread ? "font-semibold" : "font-medium")}>{c.name}</span>
            {c.subject && <Mark id={c.subject.id} />}
            {pinned && <Pin className="size-3 shrink-0 fill-fg-muted text-fg-muted" aria-label="Pinned" />}
            <span className={cx("ml-auto shrink-0 pl-2 font-mono text-[10.5px] num", c.unread ? "text-fg" : "text-fg-faint")}>{relative(c.last).replace(" ago", "")}</span>
          </span>
          <span className="block truncate text-[12px] leading-5 text-fg-muted">{c.detail}</span>
          <span className={cx("mt-1 flex items-center gap-1.5 text-[12px] leading-5", c.unread ? "text-fg/85" : "text-fg-faint")}>
            <LastIcon className="size-3 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{preview}</span>
          </span>
          <span className="mt-2.5 flex min-w-0 items-center gap-1.5">
            <span className={cx("inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-[11px] font-medium", tone.pill)}>
              <span className={cx("size-1.5 rounded-full", tone.dot)} aria-hidden="true" />
              {reasonFor(c)}
            </span>
            {labels[0] && <LabelChip label={labels[0]} />}
            {labels.length > 1 && (
              <span className="shrink-0 text-[11px] text-fg-faint" title={labels.slice(1).map((l) => l.name).join(", ")}>
                +{labels.length - 1}
              </span>
            )}
            <span className="ml-auto flex shrink-0 items-center gap-1 pl-1 text-fg-faint">
              {c.channels.map((ch) => {
                const I = CHANNEL_ICON[ch];
                return <I key={ch} className="size-3" strokeWidth={1.75} aria-label={CHANNEL_LABEL[ch]} />;
              })}
              {c.calls.length > 0 && <Phone className="size-3" strokeWidth={1.75} aria-label="Calls" />}
            </span>
          </span>
        </span>
      </button>
      {/* Selection sits on the avatar: it shows on hover, and stays once you're selecting. */}
      <label className={cx("absolute top-3.5 left-3.5 grid size-8 cursor-pointer place-items-center transition-opacity", picking || picked ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}>
        <input type="checkbox" checked={picked} onChange={onPick} aria-label={`Select ${c.name}`} className="size-4 accent-[var(--color-fg)]" />
      </label>
    </li>
  );
}

function Cleared({ tab, filtered, onClear }: { tab: Tab; filtered: boolean; onClear: () => void }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div>
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl border border-line-strong bg-raised">
          {tab === "needs" && !filtered ? <CheckCheck className="size-5 text-placements" strokeWidth={1.75} /> : <Inbox className="size-5 text-fg-muted" strokeWidth={1.75} />}
        </span>
        <p className="text-[13px] text-fg">{filtered ? "Nothing matches these filters." : tab === "needs" ? "Nobody is waiting on you." : tab === "done" ? "Nothing marked done yet." : "Nothing here."}</p>
        {tab === "needs" && !filtered && <p className="mt-1 text-[12px] text-fg-faint">Replies, owed updates, new people and quiet threads land here.</p>}
        {filtered && (
          <Button size="sm" variant="ghost" onClick={onClear} className="mt-2">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="grid flex-1 place-items-center px-6 py-16 text-center">
      <div>
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl border border-line-strong bg-raised">
          <MessageSquareText className="size-5 text-fg-muted" strokeWidth={1.75} />
        </span>
        <p className="text-[13px] text-fg-muted">Pick a conversation to read it here.</p>
        <p className="mt-1 text-[12px] text-fg-faint">Every channel and call with that person, in one place.</p>
      </div>
    </div>
  );
}
