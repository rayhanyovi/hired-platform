"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  FileSignature,
  LayoutGrid,
  Mail,
  MapPin,
  Percent,
  Plus,
  Search,
  Table2,
  UserRound,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";
import { liveFees, peopleCount, rolesFor } from "@/lib/clients";
import { money } from "@/lib/deal";
import { useDesk } from "@/lib/store";
import { formatDate } from "@/lib/time";
import type { Client, Subject } from "@/lib/types";
import { History, InfoRow, Notes, RecordTabs } from "../records/record";
import { TaskList } from "../records/tasks";
import { inputClass } from "../ui/modal";
import { Segmented } from "../ui/menu";
import { Swap } from "../ui/swap";
import { MetricIconTile } from "../ui/metrics";
import { GridTableHeader } from "../ui/table-header";
import { TableWorkspace } from "../ui/table-workspace";
import { Page, PageHeader } from "../ui/page-header";
import { Avatar, Button, cx } from "../ui/primitives";
import {
  AddClientDialog,
  channelsLabel,
  ClientLogo,
  ClientStatus,
  PeopleStack,
  PostRoleDialog,
  roleNames,
  TobChip,
} from "./parts";
import { Mark, useRecordMenus } from "../records/menus";
import { useContextMenu } from "../ui/context-menu";

export function ClientsList() {
  const { clients, jobs, applicants, candidates, deals, archived } = useDesk();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"cards" | "list">("list");
  /** The row open in the list, expanded in place. */
  const [openId, setOpenId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [posting, setPosting] = useState<Client | null>(null);
  const { bind, menu } = useContextMenu();
  const menus = useRecordMenus({ postRole: setPosting });
  const rowMenu = (c: Client) => bind(c.name, () => menus.client(c));

  const data = { jobs, applicants, candidates, deals };
  // Prospects have their own page; this one is who you're already hiring for.
  const all = clients.filter((c) => c.status === "active").map((c) => ({
    client: c,
    roles: rolesFor(c.name, data),
  }));
  const open = all
    .flatMap((x) => x.roles)
    .filter((r) => r.job.status !== "filled");
  const archivedCount = all.filter((x) => archived.includes(x.client.id)).length;
  const visible = all
    .filter((x) => archived.includes(x.client.id) === (showArchived && archivedCount > 0))
    .filter(
      (x) =>
        !query ||
        `${x.client.name} ${x.client.industry} ${x.roles.map((r) => r.job.title).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => liveFees(b.roles) - liveFees(a.roles));

  return (
    <Page wide>
      <PageHeader
        eyebrow="Clients"
        title="Who you're hiring for."
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Add client
          </Button>
        }
      >
        Every company you&apos;re hiring for, the roles they have open, and who
        you have for each one. Companies you&apos;re pitching live in{" "}
        <Link href="/prospects" className="text-fg underline-offset-4 hover:underline">
          Prospects
        </Link>
        .
      </PageHeader>

      <dl
        data-tour="client-stats"
        className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4"
      >
        <Stat
          label="Active clients"
          icon={Building2}
          tile="bg-placements-tile"
          value={clients.filter((c) => c.status === "active").length}
        />
        <Stat
          label="Prospects"
          icon={UserRoundSearch}
          tile="bg-interviews-tile"
          value={clients.filter((c) => c.status === "prospect").length}
          href="/prospects"
        />
        <Stat label="Open roles" icon={BriefcaseBusiness} tile="bg-offers-tile" value={open.length} />
        <Stat
          label="Fees in play"
          icon={Banknote}
          tile="bg-submittals-tile"
          value={money(liveFees(open), { compact: true })}
        />
      </dl>

      <TableWorkspace title="Clients">
      <div
        data-tour="client-filters"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { id: "list", label: "List", icon: Table2 },
            { id: "cards", label: "Cards", icon: LayoutGrid },
          ]}
        />
        {(archivedCount > 0 || showArchived) && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            aria-pressed={showArchived}
            className={cx("h-8 rounded-lg border px-3 text-[12px] transition-colors", showArchived ? "border-line-strong bg-raised text-fg" : "border-line text-fg-muted hover:text-fg")}
          >
            Archived <span className="font-mono text-[10px] text-fg-faint num">{archivedCount}</span>
          </button>
        )}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients or roles"
            aria-label="Search clients or roles"
            className={cx(inputClass, "h-8 pl-8 text-[12px]")}
          />
        </div>
      </div>

      {view === "list" && visible.length > 0 && <ClientTable rows={visible} rowMenu={rowMenu} openId={openId} setOpenId={setOpenId} onPostRole={setPosting} />}

      <div
        data-tour={view === "cards" ? "client-cards" : undefined}
        className={cx("grid gap-4 xl:grid-cols-2", view === "list" && "hidden")}
      >
        {visible.map(({ client, roles }) => {
          const openRoles = roles.filter((r) => r.job.status !== "filled");
          return (
            <article
              key={client.id}
              {...rowMenu(client)}
              className="group/card flex flex-col rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong"
            >
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-5 pt-5 pb-4"
              >
                <ClientLogo client={client} />
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-2 font-semibold text-[19px] leading-tight tracking-[-0.02em]">
                    <span className="truncate">{client.name}</span>
                    <Mark id={client.id} className="text-[16px]" />
                  </h2>
                  <p className="mt-1 text-[12px] text-fg-faint">
                    {client.industry} · {client.location}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <ClientStatus status={client.status} />
                  <TobChip clientName={client.name} />
                </div>
              </Link>

              <ul className="flex-1 divide-y divide-line border-t border-line">
                {openRoles.length === 0 && (
                  <li className="px-5 py-4 text-[13px] text-fg-faint">
                    No open roles.
                  </li>
                )}
                {openRoles.map((r) => (
                  <li key={r.job.id}>
                    <Link
                      href={`/clients/${client.id}#${r.job.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-raised sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13px] text-fg">
                          {r.job.title}
                        </div>
                        <div className="truncate text-[11px] text-fg-faint">
                          {money(r.job.salary, { compact: true })} ·{" "}
                          {channelsLabel(r.job.channels)}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <PeopleStack names={roleNames(r)} />
                      </div>
                      <div className="text-right font-mono text-[11px] text-fg-faint num">
                        {r.live.length > 0 && (
                          <span className="text-fg">
                            {r.live.length} in pipeline
                          </span>
                        )}
                        {r.live.length === 0 &&
                          (peopleCount(r) ? `${peopleCount(r)} people` : "—")}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href={`/clients/${client.id}`}
                className="flex items-center justify-between border-t border-line px-5 py-3 text-[12px] text-fg-faint transition-colors group-hover/card:text-fg-muted"
              >
                <span className="num">
                  {openRoles.length} open{" "}
                  {openRoles.length === 1 ? "role" : "roles"} ·{" "}
                  {money(liveFees(roles), { compact: true })} in play
                </span>
                <ArrowRight className="size-3.5 transition-transform group-hover/card:translate-x-0.5" />
              </Link>
            </article>
          );
        })}
      </div>
      {visible.length === 0 && (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-[13px] text-fg-faint">
          No clients match.
        </p>
      )}

      </TableWorkspace>
      {menu}
      {menus.dialog}
      {posting && <PostRoleDialog client={posting} onClose={() => setPosting(null)} />}
      {adding && (
        <AddClientDialog
          kind="active"
          onClose={() => setAdding(false)}
          onAdded={(id) => {
            setAdding(false);
            router.push(`/clients/${id}`);
          }}
        />
      )}
    </Page>
  );
}

const COLS = "md:grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1.5fr)_110px_84px_96px_20px]";

/** Active clients as rows. Click one to open it in place: roles, contacts, history, tasks and notes. */
function ClientTable({
  rows,
  rowMenu,
  openId,
  setOpenId,
  onPostRole,
}: {
  rows: { client: Client; roles: ReturnType<typeof rolesFor> }[];
  rowMenu: (c: Client) => ReturnType<ReturnType<typeof useContextMenu>["bind"]>;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onPostRole: (c: Client) => void;
}) {
  return (
    <div data-tour="client-cards" className="overflow-hidden rounded-xl border border-line bg-surface">
      <GridTableHeader layout={COLS} columns={[{ label: "Client" }, { label: "Terms" }, { label: "Open roles" }, { label: "People" }, { label: "In pipeline", align: "right" }, { label: "Fees in play", align: "right" }, { label: "" }]} />
      <ul className="divide-y divide-line">
        {rows.map(({ client, roles }) => {
          const open = openId === client.id;
          const openRoles = roles.filter((r) => r.job.status !== "filled");
          const live = openRoles.reduce((n, r) => n + r.live.length, 0);
          const names = [...new Set(openRoles.flatMap(roleNames))];
          const toggle = () => setOpenId(open ? null : client.id);
          return (
            <li key={client.id} id={`client-${client.id}`} className={cx("scroll-mt-20", open && "bg-raised/40")}>
              <div {...rowMenu(client)} onClick={toggle} className={cx("grid cursor-pointer items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-raised/40", COLS)}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                  }}
                  aria-expanded={open}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <ClientLogo client={client} size="sm" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[14px] text-fg">
                      <span className="truncate">{client.name}</span>
                      <Mark id={client.id} />
                    </span>
                    <span className="block truncate text-[12px] text-fg-faint">
                      {client.industry} · {client.location}
                    </span>
                  </span>
                </button>
                <div className="whitespace-nowrap">
                  <TobChip clientName={client.name} />
                </div>
                <div className="min-w-0 text-[12px]">
                  <span className="text-fg num">{openRoles.length}</span>
                  <span className="block truncate text-fg-faint">{openRoles.map((r) => r.job.title).join(", ") || "None"}</span>
                </div>
                <div className="hidden md:block">
                  <PeopleStack names={names} />
                </div>
                <div className={cx("font-mono text-[12px] num md:text-right", live ? "text-fg" : "text-fg-faint")}>{live ? <>{live}<span className="md:hidden"> in pipeline</span></> : "—"}</div>
                <div className="font-mono text-[12px] text-fg num md:text-right">{money(liveFees(roles), { compact: true })}</div>
                <ChevronDown className={cx("hidden size-4 text-fg-faint transition-transform md:block", open && "rotate-180")} />
              </div>
              {open && <ClientDetail client={client} roles={roles} onPostRole={() => onPostRole(client)} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Expanded row ─────────────────────────────────────────────────── */

function ClientDetail({ client, roles, onPostRole }: { client: Client; roles: ReturnType<typeof rolesFor>; onPostRole: () => void }) {
  const { events, tasks, requestCompose } = useDesk();
  const router = useRouter();
  const [tab, setTab] = useState<"roles" | "contacts" | "history">("roles");
  const [side, setSide] = useState<"tasks" | "notes">("tasks");
  const subject: Subject = { kind: "client", id: client.id, name: client.name };
  const openRoles = roles.filter((r) => r.job.status !== "filled");
  const contacts = [client.contact, ...(client.contacts ?? [])];
  const history = events.filter((e) => e.subjectId === client.id || e.summary.includes(client.name));
  const mine = tasks.filter((t) => t.subject?.id === client.id);
  const email = (name: string, title: string) => {
    requestCompose({ channel: "email", contact: { name, detail: `${title} · ${client.name}`, subject } });
    router.push("/communication");
  };

  return (
    <div className="animate-rise border-t border-line bg-ink-sunken/70">
      <div className="grid lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        <aside className="border-b border-line p-5 lg:border-r lg:border-b-0">
          <div className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Client</div>
          <div className="mt-3 flex items-center gap-3">
            <ClientLogo client={client} />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-medium">{client.name}</div>
              <div className="truncate text-[12px] text-fg-faint">{client.industry}</div>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-2">
            <InfoRow icon={MapPin} label="Location">
              {client.location}
            </InfoRow>
            <InfoRow icon={Percent} label="Fee">
              <span className="num">{Math.round(client.feePct * 100)}%</span>
            </InfoRow>
            <InfoRow icon={FileSignature} label="Terms">
              <TobChip clientName={client.name} />
            </InfoRow>
            <InfoRow icon={UserRound} label="Main contact">
              {client.contact.name}
            </InfoRow>
            <InfoRow icon={CalendarDays} label="Since">
              {formatDate(client.since)}
            </InfoRow>
          </div>
        </aside>

        <section className="min-w-0 border-b border-line p-5 lg:border-b-0">
          <RecordTabs
            label="Client view"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "roles", label: "Open roles", count: openRoles.length },
              { id: "contacts", label: "Contacts", count: contacts.length },
              { id: "history", label: "History", count: history.length },
            ]}
          />
          <Swap id={tab} className="pt-4">
            {tab === "roles" ? (
              openRoles.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-fg-faint">No open roles. Post one when they brief you.</p>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                  {openRoles.map((r) => (
                    <li key={r.job.id}>
                      <Link href={`/clients/${client.id}#${r.job.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3.5 py-2.5 transition-colors hover:bg-raised sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] text-fg">{r.job.title}</div>
                          <div className="truncate text-[11px] text-fg-faint">
                            {money(r.job.salary, { compact: true })} · {channelsLabel(r.job.channels)}
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <PeopleStack names={roleNames(r)} />
                        </div>
                        <div className="text-right font-mono text-[11px] text-fg-faint num">
                          {r.live.length > 0 ? <span className="text-fg">{r.live.length} in pipeline</span> : peopleCount(r) ? `${peopleCount(r)} people` : "—"}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : tab === "contacts" ? (
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
                    <button onClick={() => email(c.name, c.title)} aria-label={`Email ${c.name}`} title="Email" className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg">
                      <Mail className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <History events={history} />
            )}
          </Swap>
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
          <Swap id={side} className="pt-3">
            {side === "tasks" ? <TaskList tasks={mine} subject={subject} /> : <Notes subject={subject} />}
          </Swap>
        </aside>
      </div>
      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">
        <Button size="sm" variant="primary" onClick={onPostRole}>
          <Plus className="size-3.5" /> Post a role
        </Button>
        <Button size="sm" onClick={() => email(client.contact.name, client.contact.title)}>
          <Mail className="size-3.5" /> Email {client.contact.name.split(" ")[0]}
        </Button>
        <Link href={`/clients/${client.id}`} className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs text-fg-muted transition-colors hover:bg-hover hover:text-fg">
          Roles, documents and invoices <ArrowRight className="size-3.5" />
        </Link>
        <span className="ml-auto text-[11px] text-fg-faint num">
          {openRoles.length} open {openRoles.length === 1 ? "role" : "roles"} · {money(liveFees(roles), { compact: true })} in play
        </span>
      </footer>
    </div>
  );
}

function Stat({ label, value, icon, tile, href }: { label: string; value: React.ReactNode; icon: LucideIcon; tile: string; href?: string }) {
  return (
    <div className={cx("relative flex items-center gap-3.5 bg-surface px-5 py-4", href && "transition-colors hover:bg-raised/60")}>
      <MetricIconTile icon={icon} label={label} tile={tile} className="size-10 rounded-xl" />
      <div className="min-w-0 flex-1">
        <dt className="truncate text-[12px] text-fg-muted">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0">
              {label}
            </Link>
          ) : (
            label
          )}
        </dt>
        <dd className="mt-0.5 text-[24px] leading-tight font-semibold tracking-[-0.02em] text-fg num">{value}</dd>
      </div>
      {href && <ArrowRight className="size-3.5 text-fg-faint" />}
    </div>
  );
}
