"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronDown,
  Columns3,
  FileSignature,
  Globe,
  Handshake,
  Mail,
  MapPin,
  Percent,
  Phone,
  Plus,
  Search,
  Table2,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import { isOverdue } from "@/lib/calendar";
import { PROSPECT_STAGES, prospectStage, suggestedContacts } from "@/lib/prospects";
import { memberName, useDesk } from "@/lib/store";
import { ago, formatDate } from "@/lib/time";
import type { Client, Contact, ProspectStage, Subject } from "@/lib/types";
import { AmaraByline } from "../ai/stream";
import { AddClientDialog, ClientLogo, TobChip } from "../clients/parts";
import { History, InfoRow, Notes, RecordTabs } from "../records/record";
import { Mark, useRecordMenus } from "../records/menus";
import { TaskList } from "../records/tasks";
import { useContextMenu } from "../ui/context-menu";
import { Swap } from "../ui/swap";
import { compactSelectClass, inputClass } from "../ui/modal";
import { ActorAvatar } from "../ui/member";
import { Segmented, StatusMenu } from "../ui/menu";
import { MetricIconTile } from "../ui/metrics";
import { TableWorkspace } from "../ui/table-workspace";
import { Page, PageHeader } from "../ui/page-header";
import { AmaraButton, Avatar, Button, cx } from "../ui/primitives";

type View = "table" | "board";
const STAGE_INDEX = Object.fromEntries(PROSPECT_STAGES.map((s, i) => [s.id, i])) as Record<ProspectStage, number>;

const scrollToRow = (id: string) => requestAnimationFrame(() => document.getElementById(`prospect-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));

/** Prospects: companies you're pitching, from first touch to signed terms. */
export function ProspectsPage() {
  const { clients, tasks, focusProspect, setFocusProspect, archived } = useDesk();
  const everyone = clients.filter((c) => c.status === "prospect");
  const prospects = everyone.filter((c) => !archived.includes(c.id));
  const [view, setView] = useState<View>("table");
  const [stage, setStage] = useState<ProspectStage | "all" | "archived">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  /** "Add task" from the right-click menu opens the row with the task box ready. */
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const open = (id: string, side?: "tasks" | "notes") => {
    setView("table");
    setStage(archived.includes(id) ? "archived" : "all");
    setOpenId(id);
    setAddingFor(side === "tasks" ? id : null);
    scrollToRow(id);
  };
  const { bind, menu } = useContextMenu();
  const menus = useRecordMenus({ open });
  const rowMenu = (p: Client) => bind(p.name, () => menus.prospect(p));

  const [seenFocus, setSeenFocus] = useState<string | null>(null);
  if (focusProspect && focusProspect !== seenFocus) {
    setSeenFocus(focusProspect);
    setView("table");
    setStage("all");
    setQuery("");
    setOpenId(focusProspect);
  }
  useEffect(() => {
    if (!focusProspect) return;
    scrollToRow(focusProspect);
    setFocusProspect(null);
  }, [focusProspect, setFocusProspect]);

  const visible = (stage === "archived" ? everyone.filter((p) => archived.includes(p.id)) : prospects)
    .filter((p) => stage === "all" || stage === "archived" || (p.stage ?? "new") === stage)
    .filter((p) => !query || `${p.name} ${p.industry} ${p.location} ${p.contact.name}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => STAGE_INDEX[b.stage ?? "new"] - STAGE_INDEX[a.stage ?? "new"] || (b.lastContactedAt ?? 0) - (a.lastContactedAt ?? 0));

  const count = (ids: ProspectStage[]) => prospects.filter((p) => ids.includes(p.stage ?? "new")).length;
  const chase = prospects.filter((p) => tasks.some((t) => !t.done && t.subject?.id === p.id && isOverdue(t.due)) || p.stage === "follow-up").length;

  return (
    <Page wide>
      <PageHeader
        eyebrow="Prospects"
        title="Companies you're pitching."
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Add prospect
          </Button>
        }
      >
        Every company you want to work with, from first email to signed terms. Once they sign, make them a client and their roles go live.
      </PageHeader>

      <dl data-tour="prospect-stats" className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <Stat label="Prospects" icon={Target} tile="bg-interviews-tile" value={prospects.length} />
        <Stat label="In conversation" icon={Handshake} tile="bg-offers-tile" value={count(["interested", "follow-up", "meeting", "negotiation"])} />
        <Stat label="Terms out" icon={FileSignature} tile="bg-submittals-tile" value={count(["terms-sent"])} />
        <Stat label="To chase" icon={CalendarDays} tile="bg-calls-tile" value={chase} warm />
      </dl>

      <TableWorkspace title="Prospects">
      <div data-tour="prospect-filters" className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { id: "table", label: "List", icon: Table2 },
            { id: "board", label: "Board", icon: Columns3 },
          ]}
        />
        {view === "table" && (
          <select value={stage} onChange={(e) => setStage(e.target.value as ProspectStage | "all" | "archived")} aria-label="Stage" className={compactSelectClass}>
            <option value="all">All stages</option>
            {PROSPECT_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({count([s.id])})
              </option>
            ))}
            {(stage === "archived" || everyone.some((p) => archived.includes(p.id))) && (
              <option value="archived">Archived ({everyone.filter((p) => archived.includes(p.id)).length})</option>
            )}
          </select>
        )}
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prospects" aria-label="Search prospects" className={cx(inputClass, "h-8 pl-8 text-[12px]")} />
        </div>
      </div>

      <Swap id={view}>
      {view === "table" ? (
        <ProspectTable
          rows={visible}
          openId={openId}
          setOpenId={(id) => {
            setOpenId(id);
            setAddingFor(null);
          }}
          addingFor={addingFor}
          rowMenu={rowMenu}
        />
      ) : (
        <ProspectBoard
          rows={prospects.filter((p) => !query || `${p.name} ${p.industry} ${p.location} ${p.contact.name}`.toLowerCase().includes(query.toLowerCase()))}
          onOpen={(p) => open(p.id)}
          rowMenu={rowMenu}
        />
      )}
      </Swap>
      </TableWorkspace>
      {menu}
      {menus.dialog}

      {adding && (
        <AddClientDialog
          onClose={() => setAdding(false)}
          onAdded={(id) => {
            setAdding(false);
            setOpenId(id);
            scrollToRow(id);
          }}
        />
      )}
    </Page>
  );
}

function Stat({ label, icon, tile, value, warm }: { label: string; icon: typeof Target; tile: string; value: number; warm?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 bg-surface px-5 py-4">
      <MetricIconTile icon={icon} label={label} tile={tile} className="size-10 rounded-xl" />
      <span className="min-w-0">
        <dt className="truncate text-[12px] text-fg-muted">{label}</dt>
        <dd className={cx("mt-0.5 text-[24px] leading-tight font-semibold tracking-[-0.02em] num", warm && value > 0 && "text-warm")}>{value}</dd>
      </span>
    </div>
  );
}

const lastTouch = (p: Client) => (p.lastContactedAt ? ago(p.lastContactedAt) : "Not yet");

/* ── Table ────────────────────────────────────────────────────────── */

const COLS = "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_150px_92px_64px_28px_20px]";

type RowMenu = (p: Client) => ReturnType<ReturnType<typeof useContextMenu>["bind"]>;

function ProspectTable({
  rows,
  openId,
  setOpenId,
  addingFor,
  rowMenu,
}: {
  rows: Client[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  addingFor: string | null;
  rowMenu: RowMenu;
}) {
  const { tasks } = useDesk();
  if (!rows.length) return <p className="rounded-xl border border-dashed border-line-strong px-4 py-12 text-center text-[13px] text-fg-faint">No prospects match.</p>;
  return (
    <div data-tour="prospect-table" className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className={cx("hidden items-center gap-x-4 border-b border-line bg-ink-sunken/60 px-5 py-2 text-[11px] text-fg-faint md:grid", COLS)}>
        <span>Company</span>
        <span>Contact</span>
        <span>Location</span>
        <span>Stage</span>
        <span>Last contact</span>
        <span>Tasks</span>
        <span className="sr-only">Owner</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {rows.map((p) => {
          const open = openId === p.id;
          const mine = tasks.filter((t) => !t.done && t.subject?.id === p.id);
          const late = mine.filter((t) => isOverdue(t.due)).length;
          return (
            <li key={p.id} id={`prospect-${p.id}`} className={cx("scroll-mt-20", open && "bg-raised/40")}>
              <div {...rowMenu(p)} onClick={() => setOpenId(open ? null : p.id)} className={cx("grid cursor-pointer items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-raised/40", COLS)}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenId(open ? null : p.id);
                  }}
                  aria-expanded={open}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <ClientLogo client={p} size="sm" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[14px] text-fg">
                      <span className="truncate">{p.name}</span>
                      <Mark id={p.id} />
                    </span>
                    <span className="block truncate text-[12px] text-fg-faint">
                      {p.industry}
                      {p.size ? ` · ${p.size}` : ""}
                    </span>
                  </span>
                </button>
                <div className="min-w-0 text-[12px]">
                  <div className="truncate text-fg-muted">{p.contact.name}</div>
                  <div className="truncate text-fg-faint">{p.contact.title}</div>
                </div>
                <div className="truncate text-[12px] text-fg-muted">{p.location}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ProspectStageMenu prospect={p} />
                </div>
                <div className={cx("font-mono text-[11px]", p.stage === "follow-up" ? "text-warm" : "text-fg-faint")}>{lastTouch(p)}</div>
                <div className="text-[12px] num">
                  {mine.length ? <span className={late ? "text-bad" : "text-fg-muted"}>{mine.length}{late ? <span className="text-[10px]"> · {late} late</span> : null}</span> : <span className="text-fg-faint">—</span>}
                </div>
                <span className="hidden md:block" title={`Owner: ${memberName(p.ownerId ?? "sam")}`}>
                  <ActorAvatar id={p.ownerId ?? "sam"} size="xs" />
                </span>
                <ChevronDown className={cx("hidden size-4 text-fg-faint transition-transform md:block", open && "rotate-180")} />
              </div>
              {open && <ProspectDetail key={addingFor === p.id ? "adding" : "open"} prospect={p} adding={addingFor === p.id} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProspectStageMenu({ prospect: p, compact }: { prospect: Client; compact?: boolean }) {
  const { setProspectStage, notify } = useDesk();
  return (
    <StatusMenu
      label={`Stage for ${p.name}`}
      value={p.stage ?? "new"}
      compact={compact}
      onChange={(s) => {
        setProspectStage(p.id, s);
        notify(s === "terms-signed" ? `${p.name} signed. Make them a client when you're ready.` : `${p.name} moved to ${prospectStage(s).label}`);
      }}
      options={PROSPECT_STAGES.map((s) => ({ id: s.id, label: s.label, dot: s.dot, hint: s.description }))}
    />
  );
}

/* ── Expanded row ─────────────────────────────────────────────────── */

function ProspectDetail({ prospect: p, adding = false }: { prospect: Client; adding?: boolean }) {
  const { events, tasks } = useDesk();
  const [tab, setTab] = useState<"contacts" | "history">("contacts");
  const [side, setSide] = useState<"tasks" | "notes">("tasks");
  const subject: Subject = { kind: "prospect", id: p.id, name: p.name };
  const history = events.filter((e) => e.subjectId === p.id || e.summary.includes(p.name));
  const mine = tasks.filter((t) => t.subject?.id === p.id);
  const contacts = [p.contact, ...(p.contacts ?? [])];

  return (
    <div className="animate-rise border-t border-line bg-ink-sunken/70">
      <div className="grid lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        <aside className="border-b border-line p-5 lg:border-r lg:border-b-0">
          <div className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Prospect</div>
          <div className="mt-3 flex items-center gap-3">
            <ClientLogo client={p} />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-medium">{p.name}</div>
              <div className="truncate text-[12px] text-fg-faint">{p.industry}</div>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-2">
            {p.website && (
              <InfoRow icon={Globe} label="Website">
                <span className="block truncate">{p.website}</span>
              </InfoRow>
            )}
            <InfoRow icon={MapPin} label="Location">
              {p.location}
            </InfoRow>
            {p.size && (
              <InfoRow icon={UsersRound} label="Size">
                {p.size} people
              </InfoRow>
            )}
            <InfoRow icon={Percent} label="Fee">
              <span className="num">{Math.round(p.feePct * 100)}%</span>
            </InfoRow>
            <InfoRow icon={FileSignature} label="Terms">
              <TobChip clientName={p.name} />
            </InfoRow>
            <InfoRow icon={UserRound} label="Owner">
              {memberName(p.ownerId ?? "sam")}
            </InfoRow>
            <InfoRow icon={CalendarDays} label="Added">
              {formatDate(p.since)}
            </InfoRow>
          </div>
        </aside>

        <section className="min-w-0 border-b border-line p-5 lg:border-b-0">
          <RecordTabs
            label="Prospect view"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "contacts", label: "Contacts", count: contacts.length },
              { id: "history", label: "History", count: history.length },
            ]}
          />
          <Swap id={tab} className="pt-4">{tab === "contacts" ? <Contacts prospect={p} contacts={contacts} /> : <History events={history} />}</Swap>
        </section>

        <aside className="p-5 lg:border-l lg:border-line">
          <RecordTabs
            label="Tasks and notes"
            value={side}
            onChange={setSide}
            tabs={[
              { id: "tasks", label: "Tasks", count: mine.filter((t) => !t.done).length },
              { id: "notes", label: "Notes" },
            ]}
          />
          <Swap id={side} className="pt-3">{side === "tasks" ? <TaskList tasks={mine} subject={subject} defaultAdding={adding} /> : <Notes subject={subject} />}</Swap>
        </aside>
      </div>
      <Actions prospect={p} />
    </div>
  );
}

function Contacts({ prospect: p, contacts }: { prospect: Client; contacts: Contact[] }) {
  const { addContact, startThread, selectThread, threads, logCall, notify } = useDesk();
  const router = useRouter();
  // Amara's search is on request, and its results are suggestions until you add them.
  const [finding, setFinding] = useState<"idle" | "running" | "done">("idle");
  const subject: Subject = { kind: "prospect", id: p.id, name: p.name };
  const suggestions = suggestedContacts(p.name, p.website).filter((s) => !contacts.some((c) => c.email === s.email));

  const message = (c: Contact) => {
    const existing = threads.find((t) => t.contact.subject?.id === p.id && t.contact.name === c.name);
    const id = existing?.id ?? startThread({ channel: "email", contact: { name: c.name, detail: `${c.title} · ${p.name}`, subject }, subject: `Hiring at ${p.name}`, body: `Hi ${c.name.split(" ")[0]},\n\n` });
    selectThread(id);
    router.push("/communication");
  };

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {contacts.map((c, i) => (
          <li key={c.email || c.name} className="flex items-center gap-3 px-3.5 py-2.5">
            <Avatar name={c.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate text-[13px] text-fg">
                {c.name}
                {i === 0 && <span className="rounded border border-line-strong px-1 text-[10px] text-fg-faint">Main</span>}
              </div>
              <div className="truncate text-[11px] text-fg-faint">
                {c.title}
                {c.email && ` · ${c.email}`}
              </div>
            </div>
            <button onClick={() => message(c)} aria-label={`Email ${c.name}`} title="Email" className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
              <Mail className="size-3.5" />
            </button>
            <button
              onClick={() => {
                logCall({ contact: { name: c.name, subject }, direction: "outgoing", outcome: "connected", seconds: 0 });
                notify(`Calling ${c.name.split(" ")[0]}. Logged in Communication.`);
              }}
              aria-label={`Call ${c.name}`}
              title="Call"
              className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
            >
              <Phone className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {finding === "idle" && (
        <AmaraButton
          size="sm"
          onClick={() => {
            setFinding("running");
            setTimeout(() => setFinding("done"), 1300);
          }}
        >
          Find people at {p.name}
        </AmaraButton>
      )}
      {finding === "running" && (
        <div className="flex items-center gap-2.5 text-[12px] text-fg-muted">
          <span className="amara-orb size-2.5 rounded-full" /> Looking at LinkedIn and {p.website ?? "their site"}…
        </div>
      )}
      {finding === "done" && (
        <div className="amara-edge rounded-xl bg-[linear-gradient(180deg,rgb(139_92_246/0.07),transparent_60%)] p-4">
          <AmaraByline>Found by Amara · from LinkedIn and {p.website ?? "their site"}</AmaraByline>
          {suggestions.length === 0 ? (
            <p className="mt-2 text-[12px] text-fg-faint">Everyone I found is already in your contacts.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {suggestions.map((s) => (
                <li key={s.email} className="flex items-center gap-3">
                  <Avatar name={s.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-fg">{s.name}</div>
                    <div className="truncate text-[11px] text-fg-faint">{s.title}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      addContact(p.id, s, true);
                      notify(`${s.name} added to ${p.name}`);
                    }}
                  >
                    <Plus className="size-3.5" /> Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Actions({ prospect: p }: { prospect: Client }) {
  const { setProspectStage, setClientStatus, notify, isOwner } = useDesk();
  const router = useRouter();
  const i = STAGE_INDEX[p.stage ?? "new"];
  const next = PROSPECT_STAGES[i + 1];
  return (
    <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">
      {next && (
        <Button
          size="sm"
          variant={next.id === "terms-signed" ? "secondary" : "primary"}
          onClick={() => {
            setProspectStage(p.id, next.id);
            notify(`${p.name} moved to ${next.label}`);
          }}
        >
          Move to {next.label} <ArrowRight className="size-3.5" />
        </Button>
      )}
      {(p.stage === "negotiation" || p.stage === "meeting") && (
        <Link href="/documents" className="inline-flex h-7 items-center gap-1 rounded-lg border border-line-strong bg-raised px-2.5 text-xs font-medium text-fg transition-colors hover:bg-hover">
          <FileSignature className="size-3.5" /> Send Terms of Business
        </Link>
      )}
      {p.stage === "terms-signed" && (
        <Button
          size="sm"
          variant="primary"
          disabled={!isOwner}
          title={isOwner ? undefined : "Only the owner can add clients"}
          onClick={() => {
            setClientStatus(p.id, "active");
            notify(`${p.name} is now a client`);
            router.push(`/clients/${p.id}`);
          }}
        >
          <Building2 className="size-3.5" /> Make them a client
        </Button>
      )}
      <Link href={`/clients/${p.id}`} className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs text-fg-muted transition-colors hover:bg-hover hover:text-fg">
        Roles, documents and invoices <ArrowRight className="size-3.5" />
      </Link>
      <span className="ml-auto text-[11px] text-fg-faint">{prospectStage(p.stage).description}</span>
    </footer>
  );
}

/* ── Board ────────────────────────────────────────────────────────── */

function ProspectBoard({ rows, onOpen, rowMenu }: { rows: Client[]; onOpen: (p: Client) => void; rowMenu: RowMenu }) {
  const { tasks, setProspectStage, notify } = useDesk();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<ProspectStage | null>(null);

  const drop = (to: ProspectStage) => {
    const p = rows.find((x) => x.id === dragId);
    setDragId(null);
    setOver(null);
    if (!p || (p.stage ?? "new") === to) return;
    setProspectStage(p.id, to);
    notify(`${p.name} moved to ${prospectStage(to).label}`);
  };

  return (
    <div data-tour="prospect-board" className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
      <div className="flex gap-3" style={{ minWidth: PROSPECT_STAGES.length * 252 }}>
        {PROSPECT_STAGES.map((s) => {
          const cards = rows.filter((p) => (p.stage ?? "new") === s.id);
          return (
            <section
              key={s.id}
              aria-label={s.label}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOver(s.id);
              }}
              onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOver(null)}
              onDrop={() => drop(s.id)}
              className={cx("flex min-h-[460px] w-[240px] shrink-0 flex-col rounded-xl border p-2 transition-colors", over === s.id ? "border-line-strong bg-surface" : "border-line bg-ink-sunken/60")}
            >
              <header className="mb-2 flex items-center gap-2 px-2 pt-1.5 pb-2" title={s.description}>
                <span className={cx("h-3.5 w-1 rounded-full", s.dot)} />
                <h2 className="text-[13px] font-semibold">{s.label}</h2>
                <span className="ml-auto font-mono text-[11px] text-fg-faint num">{cards.length}</span>
              </header>
              <ul className="flex flex-col gap-2">
                {cards.map((p) => {
                  const late = tasks.filter((t) => !t.done && t.subject?.id === p.id && isOverdue(t.due));
                  return (
                    <li key={p.id}>
                      <button
                        {...rowMenu(p)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(p.id);
                        }}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => onOpen(p)}
                        className={cx(
                          "w-full cursor-grab rounded-lg border border-line bg-surface p-3 text-left transition-[border-color,background-color,opacity] hover:border-line-strong hover:bg-raised active:cursor-grabbing",
                          dragId === p.id && "opacity-40",
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <ClientLogo client={p} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-[13px] font-semibold">
                              <span className="truncate">{p.name}</span>
                              <Mark id={p.id} />
                            </div>
                            <div className="truncate text-[11px] text-fg-muted">{p.contact.name}</div>
                          </div>
                        </div>
                        {late.length > 0 && (
                          <div className="mt-2 rounded-md border border-bad/25 bg-bad/[0.07] px-2 py-1.5 text-[11px]">
                            <span className="font-medium text-bad">{late.length} overdue</span>
                            <span className="mt-0.5 block truncate text-fg-muted">{late[0].title}</span>
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2 text-[11px] text-fg-faint">
                          <span className="truncate">{p.location}</span>
                          <span className={cx("shrink-0 font-mono", s.id === "follow-up" && "text-warm")}>{p.lastContactedAt ? ago(p.lastContactedAt).replace(" ago", "") : "New"}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {cards.length === 0 && <div className="m-1 grid flex-1 place-items-center rounded-lg border border-dashed border-line text-[11px] text-fg-faint">{dragId ? "Drop here" : "Empty"}</div>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
