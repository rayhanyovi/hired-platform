"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Lock, Search } from "lucide-react";
import { memberName, useDesk } from "@/lib/store";
import { formatStamp, isoStamp, NOW_MS } from "@/lib/time";
import type { AuditEvent } from "@/lib/types";
import { ActorAvatar } from "../ui/member";
import { compactSelectClass, inputClass } from "../ui/modal";
import { Page, PageHeader } from "../ui/page-header";
import { Button, cx } from "../ui/primitives";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "deals", label: "Deals" },
  { id: "documents", label: "Documents" },
  { id: "approvals", label: "Approvals" },
  { id: "sourcing", label: "Sourcing" },
  { id: "clients", label: "Clients" },
  { id: "team", label: "Team" },
  { id: "system", label: "System" },
] as const;
type Category = (typeof CATEGORIES)[number]["id"];

export function categoryOf(action: string): Exclude<Category, "all"> {
  const prefix = action.split(".")[0];
  if (prefix === "deal" || prefix === "comment" || prefix === "followup") return "deals";
  if (prefix === "document") return "documents";
  if (prefix === "approval") return "approvals";
  if (prefix === "sourcing" || prefix === "job") return "sourcing";
  if (prefix === "client") return "clients";
  if (prefix === "team") return "team";
  return "system";
}

export function AuditPage() {
  const { events, deals, members, isOwner, exportedAudit, notify } = useDesk();
  const [category, setCategory] = useState<Category>("all");
  const [actor, setActor] = useState("all");
  const [query, setQuery] = useState("");

  const rows = events
    .filter((e) => category === "all" || categoryOf(e.action) === category)
    .filter((e) => actor === "all" || e.actorId === actor)
    .filter((e) => !query || `${e.summary} ${e.action} ${memberName(e.actorId)}`.toLowerCase().includes(query.toLowerCase()));

  const download = (format: "csv" | "json") => {
    const records = rows.map((e) => ({
      id: e.id,
      timestamp: isoStamp(e.at),
      actor_id: e.actorId,
      actor: memberName(e.actorId),
      action: e.action,
      category: categoryOf(e.action),
      summary: e.summary,
      deal_id: e.dealId ?? "",
    }));
    const body =
      format === "json"
        ? JSON.stringify(records, null, 2)
        : [Object.keys(records[0] ?? { id: "" }).join(","), ...records.map((r) => Object.values(r).map(csvCell).join(","))].join("\n");
    const blob = new Blob([body], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amara-audit-${isoStamp(NOW_MS).slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    exportedAudit(format, records.length);
    notify(`Exported ${records.length} events. The export itself is logged too.`);
  };

  return (
    <Page wide>
      <PageHeader
        eyebrow="Audit log"
        title="Every action, on the record."
        actions={
          <>
            <Button disabled={!isOwner || rows.length === 0} onClick={() => download("csv")} title={isOwner ? undefined : "Only the Owner can export"}>
              <Download className="size-3.5" /> CSV
            </Button>
            <Button disabled={!isOwner || rows.length === 0} onClick={() => download("json")} title={isOwner ? undefined : "Only the Owner can export"}>
              <Download className="size-3.5" /> JSON
            </Button>
          </>
        }
      >
        Who did what, and when: deals, documents, approvals, sourcing and team changes. Events can&apos;t be edited or deleted. Exports include
        whatever you&apos;ve filtered.
      </PageHeader>

      <div data-tour="audit-filters" className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-lg border border-line bg-surface p-0.5" role="tablist" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cx("h-7 rounded-md px-2.5 text-[12px] transition-colors", category === c.id ? "bg-raised text-fg" : "text-fg-muted hover:text-fg")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Actor" className={compactSelectClass}>
          <option value="all">Everyone</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
          <option value="amara">Amara</option>
          <option value="system">System</option>
        </select>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events" aria-label="Search events" className={cx(inputClass, "h-8 pl-8 text-[12px]")} />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-[12px] text-fg-faint">
        <Lock className="size-3" />
        Showing <span className="text-fg-muted num">{rows.length}</span> of <span className="num">{events.length}</span> events · append-only
      </div>

      <div data-tour="audit-table" className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="sticky top-0 bg-ink-sunken text-[11px] tracking-[0.06em] text-fg-faint uppercase">
            <tr>
              <th className="w-32 px-4 py-2.5 font-medium">Time</th>
              <th className="w-44 px-4 py-2.5 font-medium">Actor</th>
              <th className="w-52 px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">What happened</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {rows.map((e) => (
              <Row key={e.id} event={e} dealExists={!!e.dealId && deals.some((d) => d.id === e.dealId)} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="bg-surface px-4 py-10 text-center text-[13px] text-fg-faint">No events match these filters.</p>}
      </div>
    </Page>
  );
}

function Row({ event: e, dealExists }: { event: AuditEvent; dealExists: boolean }) {
  return (
    <tr className={cx("align-top transition-colors hover:bg-raised", e.at > NOW_MS && "animate-rise")}>
      <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-fg-faint num">{formatStamp(e.at)}</td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2 text-fg-muted">
          <ActorAvatar id={e.actorId} size="xs" />
          <span className="truncate">{memberName(e.actorId)}</span>
        </span>
      </td>
      <td className="px-4 py-3">
        <code className="rounded bg-ink-sunken px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">{e.action}</code>
      </td>
      <td className="px-4 py-3 text-fg-muted">
        {e.summary}
        {dealExists && (
          <Link href={`/deals/${e.dealId}`} className="ml-2 text-[12px] text-fg-faint underline-offset-4 hover:text-fg hover:underline">
            Open deal
          </Link>
        )}
      </td>
    </tr>
  );
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
