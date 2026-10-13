"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowRightLeft,
  Briefcase,
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileSignature,
  FileText,
  ListPlus,
  Mail,
  MessageCircle,
  MessageSquareText,
  PanelTopOpen,
  Phone,
  Send,
  SmilePlus,
  Smartphone,
  Trash2,
} from "lucide-react";
import { TEMPLATE_LABEL, type TemplateKind } from "@/lib/communication";
import { profileKey, type PersonRow } from "@/lib/people";
import { PROSPECT_STAGES } from "@/lib/prospects";
import { useDesk } from "@/lib/store";
import type { Client, Contact, MessageChannel, Subject, Thread } from "@/lib/types";
import type { MenuEntry } from "../ui/context-menu";
import { Modal } from "../ui/modal";
import { Button, cx } from "../ui/primitives";
import { useOpenSubject } from "./tasks";

const SEP: MenuEntry = { separator: true };

/** The emoji a recruiter can pin to a record. Their markers, not our decoration. */
const EMOJI = ["🔥", "⭐", "👀", "✅", "⚠️", "💰", "🎯", "🤝", "📞", "⏳", "🧊", "🚀", "❤️", "👍", "🏆", "❓"];

/** The emoji pinned to a record, shown next to its name. */
export function Mark({ id, className }: { id: string | string[]; className?: string }) {
  const { marks } = useDesk();
  const emoji = (Array.isArray(id) ? id : [id]).map((x) => marks[x]).find(Boolean);
  if (!emoji) return null;
  return (
    <span className={cx("shrink-0 text-[13px] leading-none", className)} role="img" aria-label={`Marked ${emoji}`}>
      {emoji}
    </span>
  );
}

function EmojiPicker({ current, onPick }: { current?: string; onPick: (e: string | null) => void }) {
  return (
    <div className="w-[232px] p-1">
      <div
        className="grid grid-cols-8 gap-0.5"
        onKeyDown={(e) => {
          const all = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
          const i = all.indexOf(document.activeElement as HTMLButtonElement);
          const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 }[e.key];
          if (step === undefined || i < 0) return;
          e.preventDefault();
          e.stopPropagation();
          all[Math.max(0, Math.min(all.length - 1, i + step))]?.focus();
        }}
      >
        {EMOJI.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            aria-label={`Mark with ${e}`}
            aria-pressed={current === e}
            className={cx("grid size-7 place-items-center rounded-md text-[15px] outline-none hover:bg-raised focus-visible:bg-raised", current === e && "bg-raised ring-1 ring-line-strong")}
          >
            {e}
          </button>
        ))}
      </div>
      {current && (
        <button type="button" onClick={() => onPick(null)} className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-[12px] text-fg-muted hover:bg-raised hover:text-fg">
          Remove mark
        </button>
      )}
    </div>
  );
}

type Confirm = { title: string; body: string; cta: string; run: () => void };

/**
 * Right-click menus for every kind of record, so a candidate, prospect, client
 * or conversation offers the same actions wherever it appears. Render `dialog`.
 */
export function useRecordMenus(opts: { open?: (id: string, side?: "tasks" | "notes") => void; postRole?: (c: Client) => void } = {}) {
  const d = useDesk();
  const router = useRouter();
  const openSubject = useOpenSubject();
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  /** Opens the conversation if there is one on this channel, otherwise a prefilled message. */
  const compose = (channel: MessageChannel, contact: Thread["contact"]) => {
    const existing = d.threads.find((t) => t.channel === channel && t.contact.name === contact.name && t.contact.subject?.id === contact.subject?.id);
    if (existing) d.selectThread(existing.id);
    else d.requestCompose({ channel, contact });
    router.push("/communication");
  };

  const reach = (contact: Thread["contact"], phone?: string, email = true): MenuEntry[] => [
    {
      label: "Call",
      icon: Phone,
      disabled: phone ? undefined : "No phone number on file",
      onSelect: () => {
        d.logCall({ contact: { name: contact.name, subject: contact.subject }, direction: "outgoing", outcome: "connected", seconds: 0 });
        d.notify(`Calling ${contact.name.split(" ")[0]}. Logged in Communication.`);
      },
    },
    ...(email ? [{ label: "Email", icon: Mail, onSelect: () => compose("email", contact) }] : []),
    { label: "Text", icon: Smartphone, disabled: phone ? undefined : "No mobile number on file", onSelect: () => compose("sms", contact) },
    { label: "WhatsApp", icon: MessageCircle, disabled: phone ? undefined : "No mobile number on file", onSelect: () => compose("whatsapp", contact) },
  ];

  const send = (kind: TemplateKind, contact: Thread["contact"]) => {
    d.sendTemplate(kind, contact);
    d.notify(`${TEMPLATE_LABEL[kind]} sent to ${contact.name.split(" ")[0]}`);
  };

  const emoji = (s: Subject): MenuEntry => ({
    label: "Emoji",
    icon: SmilePlus,
    hint: d.marks[s.id],
    panel: (close) => (
      <EmojiPicker
        current={d.marks[s.id]}
        onPick={(e) => {
          d.setMark(s, e);
          close();
        }}
      />
    ),
  });

  const archive = (s: Subject, where: string): MenuEntry => {
    const isArchived = d.archived.includes(s.id);
    return {
      label: isArchived ? "Restore" : "Archive",
      icon: isArchived ? ArchiveRestore : Archive,
      onSelect: () => {
        d.toggleArchive(s);
        d.notify(isArchived ? `${s.name} is back` : `Archived ${s.name}. Find them under Archived on ${where}.`);
      },
    };
  };

  const companyContacts = (c: Client) => [c.contact, ...(c.contacts ?? [])];
  const contactOf = (c: Client, p: Contact): Thread["contact"] => ({ name: p.name, detail: `${p.title} · ${c.name}`, subject: { kind: c.status === "active" ? "client" : "prospect", id: c.id, name: c.name } });
  const liveDeals = (c: Client) => d.deals.filter((x) => x.role.client === c.name && x.stage !== "placed").length;

  /** Email the main contact, or pick one when there are several. */
  const emailCompany = (c: Client): MenuEntry => {
    const people = companyContacts(c);
    return people.length > 1
      ? { label: "Email", icon: Mail, submenu: people.map((p) => ({ label: p.name, hint: p.title.split(" ")[0], onSelect: () => compose("email", contactOf(c, p)) })) }
      : { label: "Email", icon: Mail, onSelect: () => compose("email", contactOf(c, c.contact)) };
  };

  const deleteCompany = (c: Client): MenuEntry => ({
    label: "Delete",
    icon: Trash2,
    danger: true,
    disabled: !d.isOwner ? "Only the owner can delete companies" : liveDeals(c) ? `${liveDeals(c)} live deals. Close them first` : undefined,
    onSelect: () =>
      setConfirm({
        title: `Delete ${c.name}?`,
        body: "Removes the company, its roles, tasks, notes and calendar events. Documents and the audit trail keep their history.",
        cta: "Delete company",
        run: () => {
          d.deleteClient(c.id);
          d.notify(`Deleted ${c.name}`);
        },
      }),
  });

  const person = (r: PersonRow): MenuEntry[] => {
    const subject: Subject = { kind: "candidate", id: r.key, name: r.name };
    const contact = { name: r.name, detail: `Candidate · ${r.roleTitle ?? r.headline}`, subject };
    return [
      { label: "Open", icon: PanelTopOpen, onSelect: () => opts.open?.(r.key) },
      ...reach(contact, r.phone),
      SEP,
      { label: "Start another placement", icon: ArrowRightLeft, onSelect: () => { d.setNewPlacementCandidate(profileKey(r)); d.setCreatingPlacements(true); } },
      { label: "Add task", icon: ListPlus, onSelect: () => opts.open?.(r.key, "tasks") },
      { label: "Send pre-call pack", icon: FileText, onSelect: () => send("pre-call", contact) },
      {
        label: "Request",
        icon: ClipboardCheck,
        submenu: [
          { label: TEMPLATE_LABEL.consent, icon: FileSignature, onSelect: () => send("consent", contact) },
          { label: TEMPLATE_LABEL.workstyle, icon: ClipboardCheck, onSelect: () => send("workstyle", contact) },
        ],
      },
      { label: "Send", icon: Send, submenu: [{ label: TEMPLATE_LABEL.booking, icon: Send, onSelect: () => send("booking", contact) }] },
      ...(r.followUp
        ? [
            {
              label: "Write their update",
              icon: MessageSquareText,
              onSelect: () => {
                d.selectFollowUp(r.followUp!.id);
                router.push("/communication");
              },
            },
          ]
        : []),
      ...(r.deal ? [{ label: "Open deal page", icon: ExternalLink, onSelect: () => router.push(`/deals/${r.deal!.id}`) }] : []),
      emoji(subject),
      SEP,
      archive(subject, "Candidates"),
      {
        label: "Delete",
        icon: Trash2,
        danger: true,
        disabled: r.deal && d.me.role === "resourcer" ? "Resourcers can't delete deals" : undefined,
        onSelect: () =>
          setConfirm({
            title: `Delete ${r.name}?`,
            body: r.deal
              ? `Removes ${r.firstName}, their ${r.deal.role.title} deal at ${r.deal.role.client}, and their tasks, notes and events. The audit trail keeps the history.`
              : `Removes ${r.firstName} and their tasks, notes and events. The audit trail keeps the history.`,
            cta: "Delete candidate",
            run: () => {
              d.deletePerson(r);
              d.notify(`Deleted ${r.name}`);
            },
          }),
      },
    ];
  };

  const prospect = (c: Client): MenuEntry[] => {
    const subject: Subject = { kind: "prospect", id: c.id, name: c.name };
    const main = contactOf(c, c.contact);
    const signed = c.stage === "terms-signed";
    return [
      { label: "Open", icon: PanelTopOpen, onSelect: () => opts.open?.(c.id) },
      ...reach(main, c.contact.phone, false).slice(0, 1),
      emailCompany(c),
      ...reach(main, c.contact.phone, false).slice(1),
      SEP,
      { label: "Deep research", amara: true, onSelect: () => d.ask(`Deep research on ${c.name}`) },
      {
        label: "Move to",
        icon: ArrowRightLeft,
        hint: PROSPECT_STAGES.find((s) => s.id === (c.stage ?? "new"))?.label,
        submenu: PROSPECT_STAGES.map((s) => ({
          label: s.label,
          checked: (c.stage ?? "new") === s.id,
          onSelect: () => {
            d.setProspectStage(c.id, s.id);
            d.notify(`${c.name} moved to ${s.label}`);
          },
        })),
      },
      {
        label: "Send terms",
        icon: FileSignature,
        disabled: c.stage === "terms-sent" ? "Terms are already with them" : signed ? "Already signed" : undefined,
        onSelect: () => {
          d.sendTerms(c.id);
          d.notify(`Terms of Business sent to ${c.name}. Moved to Terms sent.`);
        },
      },
      { label: "Send pre-call pack", icon: FileText, onSelect: () => send("pre-call", main) },
      { label: "Request", icon: ClipboardCheck, submenu: [{ label: TEMPLATE_LABEL.workstyle, icon: ClipboardCheck, onSelect: () => send("workstyle", main) }] },
      { label: "Send", icon: Send, submenu: [{ label: TEMPLATE_LABEL.booking, icon: Send, onSelect: () => send("booking", main) }] },
      { label: "Add task", icon: ListPlus, onSelect: () => opts.open?.(c.id, "tasks") },
      ...(signed
        ? [
            {
              label: "Make them a client",
              icon: Building2,
              disabled: d.isOwner ? undefined : "Only the owner can add clients",
              onSelect: () => {
                d.setClientStatus(c.id, "active");
                d.notify(`${c.name} is now a client`);
                router.push(`/clients/${c.id}`);
              },
            },
          ]
        : []),
      emoji(subject),
      SEP,
      archive(subject, "Prospects"),
      deleteCompany(c),
    ];
  };

  const client = (c: Client): MenuEntry[] => {
    const subject: Subject = { kind: "client", id: c.id, name: c.name };
    const main = contactOf(c, c.contact);
    const signed = d.documents.some((x) => x.client === c.name && (x.kind === "signed-tob" || (x.kind === "tob" && x.status === "signed")));
    return [
      { label: "Open", icon: PanelTopOpen, onSelect: () => router.push(`/clients/${c.id}`) },
      ...reach(main, c.contact.phone, false).slice(0, 2),
      emailCompany(c),
      SEP,
      { label: "Deep research", amara: true, onSelect: () => d.ask(`Deep research on ${c.name}`) },
      {
        label: "Send terms",
        icon: FileSignature,
        disabled: signed ? "Terms already signed" : undefined,
        onSelect: () => {
          d.sendTerms(c.id);
          d.notify(`Terms of Business sent to ${c.name}`);
        },
      },
      { label: "Request", icon: ClipboardCheck, submenu: [{ label: TEMPLATE_LABEL.workstyle, icon: ClipboardCheck, onSelect: () => send("workstyle", main) }] },
      { label: "Send", icon: Send, submenu: [{ label: TEMPLATE_LABEL.booking, icon: Send, onSelect: () => send("booking", main) }] },
      ...(opts.postRole ? [{ label: "New role", icon: Briefcase, onSelect: () => opts.postRole!(c) }] : []),
      { label: "Add task", icon: ListPlus, onSelect: () => openSubject(subject) },
      emoji(subject),
      SEP,
      archive(subject, "Clients"),
      deleteCompany(c),
    ];
  };

  const dialog = confirm && (
    <Modal
      title={confirm.title}
      description={confirm.body}
      onClose={() => setConfirm(null)}
      footer={
        <>
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <button
            onClick={() => {
              confirm.run();
              setConfirm(null);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-bad px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <Trash2 className="size-3.5" /> {confirm.cta}
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-fg-muted">This is a demo, so a reload brings everything back.</p>
    </Modal>
  );

  return { person, prospect, client, dialog };
}
