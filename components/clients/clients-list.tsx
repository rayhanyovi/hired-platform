"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, BriefcaseBusiness, Building2, LayoutGrid, List, Plus, Search, UserRoundSearch, type LucideIcon } from "lucide-react";
import { liveFees, peopleCount, rolesFor } from "@/lib/clients";
import { money } from "@/lib/deal";
import { useDesk } from "@/lib/store";
import type { Client } from "@/lib/types";
import { inputClass } from "../ui/modal";
import { MetricIconTile } from "../ui/metrics";
import { Page, PageHeader } from "../ui/page-header";
import { Button, cx } from "../ui/primitives";
import {
  AddClientDialog,
  channelsLabel,
  ClientLogo,
  ClientStatus,
  PeopleStack,
  roleNames,
  TobChip,
} from "./parts";

type Filter = "all" | Client["status"];

export function ClientsList() {
  const { clients, jobs, applicants, candidates, deals } = useDesk();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"cards" | "list">("cards");

  const data = { jobs, applicants, candidates, deals };
  const all = clients.map((c) => ({
    client: c,
    roles: rolesFor(c.name, data),
  }));
  const open = all
    .flatMap((x) => x.roles)
    .filter((r) => r.job.status !== "filled");
  const visible = all
    .filter((x) => filter === "all" || x.client.status === filter)
    .filter(
      (x) =>
        !query ||
        `${x.client.name} ${x.client.industry} ${x.roles.map((r) => r.job.title).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(a.client.status === "prospect") -
          Number(b.client.status === "prospect") ||
        liveFees(b.roles) - liveFees(a.roles),
    );

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
        Every company you work with or are pitching, the roles they&apos;re
        hiring for, and who you have for each one.
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
        />
        <Stat label="Open roles" icon={BriefcaseBusiness} tile="bg-offers-tile" value={open.length} />
        <Stat
          label="Fees in play"
          icon={Banknote}
          tile="bg-submittals-tile"
          value={money(liveFees(open), { compact: true })}
        />
      </dl>

      <div
        data-tour="client-filters"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <div
          className="inline-flex rounded-lg border border-line bg-surface p-0.5"
          role="tablist"
          aria-label="Status"
        >
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["prospect", "Prospects"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cx(
                "h-7 rounded-md px-3 text-[12px] transition-colors",
                filter === id
                  ? "bg-raised text-fg"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="inline-flex rounded-lg border border-line bg-surface p-0.5"
          role="tablist"
          aria-label="View"
        >
          {(
            [
              ["cards", "Cards", LayoutGrid],
              ["list", "List", List],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              aria-label={`${label} view`}
              title={`${label} view`}
              onClick={() => setView(id)}
              className={cx(
                "grid h-7 w-8 place-items-center rounded-md transition-colors",
                view === id
                  ? "bg-raised text-fg"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
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

      {view === "list" && visible.length > 0 && <ClientTable rows={visible} />}

      <div
        data-tour={view === "cards" ? "client-cards" : undefined}
        className={cx("grid gap-4 xl:grid-cols-2", view === "list" && "hidden")}
      >
        {visible.map(({ client, roles }) => {
          const openRoles = roles.filter((r) => r.job.status !== "filled");
          return (
            <article
              key={client.id}
              className="group/card flex flex-col rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong"
            >
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-5 pt-5 pb-4"
              >
                <ClientLogo client={client} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-[19px] leading-tight tracking-[-0.02em]">
                    {client.name}
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

      {adding && (
        <AddClientDialog
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

function ClientTable({
  rows,
}: {
  rows: { client: Client; roles: ReturnType<typeof rolesFor> }[];
}) {
  return (
    <div
      data-tour="client-cards"
      className="overflow-x-auto rounded-2xl border border-line bg-surface"
    >
      <table className="w-full min-w-[860px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-line text-[11px] tracking-[0.06em] text-fg-faint uppercase">
            <th className="px-5 py-3 font-normal">Client</th>
            <th className="px-3 py-3 font-normal">Status</th>
            <th className="px-3 py-3 font-normal">Terms</th>
            <th className="px-3 py-3 font-normal">Open roles</th>
            <th className="px-3 py-3 font-normal">People</th>
            <th className="px-3 py-3 text-right font-normal">In pipeline</th>
            <th className="px-3 py-3 text-right font-normal">Fees in play</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ client, roles }) => {
            const openRoles = roles.filter((r) => r.job.status !== "filled");
            const live = openRoles.reduce((n, r) => n + r.live.length, 0);
            const names = [...new Set(openRoles.flatMap(roleNames))];
            return (
              <tr
                key={client.id}
                className="group/row relative transition-colors hover:bg-raised"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex items-center gap-3 after:absolute after:inset-0"
                  >
                    <ClientLogo client={client} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[14px] text-fg">
                        {client.name}
                      </span>
                      <span className="block truncate text-[12px] text-fg-faint">
                        {client.industry} · {client.location}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <ClientStatus status={client.status} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <TobChip clientName={client.name} />
                </td>
                <td className="max-w-[240px] px-3 py-3">
                  <span className="block text-fg num">{openRoles.length}</span>
                  <span className="block truncate text-[12px] text-fg-faint">
                    {openRoles.map((r) => r.job.title).join(", ") || "None"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <PeopleStack names={names} />
                </td>
                <td
                  className={cx(
                    "px-3 py-3 text-right font-mono text-[12px] num",
                    live ? "text-fg" : "text-fg-faint",
                  )}
                >
                  {live || "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono text-[12px] text-fg num">
                  {money(liveFees(roles), { compact: true })}
                </td>
                <td className="pr-4">
                  <ArrowRight className="size-3.5 text-fg-faint transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-fg-muted" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, icon, tile }: { label: string; value: React.ReactNode; icon: LucideIcon; tile: string }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <dt className="flex items-center gap-2 text-[11px] text-fg-faint">
        <MetricIconTile icon={icon} label={label} tile={tile} size="sm" className="size-6 rounded-md" />
        {label}
      </dt>
      <dd className="mt-1.5 text-[20px] font-medium tracking-[-0.02em] text-fg num">
        {value}
      </dd>
    </div>
  );
}
