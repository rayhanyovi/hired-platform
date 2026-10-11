"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Download, History, Search } from "lucide-react";
import { memberName, useDesk } from "@/lib/store";
import { AUDIT_MODULES, auditValue, fieldLabel, moduleForAction } from "@/lib/audit";
import type { AuditRecord } from "@/lib/types";
import { ActorAvatar } from "../ui/member";
import { compactSelectClass, inputClass } from "../ui/modal";
import { Page, PageHeader } from "../ui/page-header";
import { Button, cx } from "../ui/primitives";

const date = (ms: number) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" }).format(ms);
const clock = (ms: number) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(ms);

export function AuditPage() {
  const { events, deals, members, isOwner, exportedAudit, notify } = useDesk();
  const [module, setModule] = useState("all");
  const [actor, setActor] = useState("all");
  const [operation, setOperation] = useState("all");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = events
    .filter(e => module === "all" || (e.module ?? moduleForAction(e.action)) === module || e.records?.some(r => r.module === module))
    .filter(e => actor === "all" || e.actorId === actor)
    .filter(e => operation === "all" || (operation === "activity" ? !e.records?.length : e.records?.some(r => r.operation === operation)))
    .filter(e => period === "all" || e.records !== undefined)
    .filter(e => !query || `${e.summary} ${e.action} ${memberName(e.actorId)} ${e.module ?? moduleForAction(e.action)} ${JSON.stringify(e.records ?? [])}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.at - a.at);

  const download = (format: "csv" | "json") => {
    const records = rows.map(e => ({ id: e.id, timestamp: new Date(e.at).toISOString(), actor_id: e.actorId, actor: memberName(e.actorId), module: e.module ?? moduleForAction(e.action), action: e.action, summary: e.summary, reason: e.reason ?? "", deal_id: e.dealId ?? "", records: e.records ?? [] }));
    const columns = ["id", "timestamp", "actor_id", "actor", "module", "action", "summary", "reason", "deal_id", "records"];
    const body = format === "json" ? JSON.stringify(records, null, 2) : [columns.join(","), ...records.map(r => Object.values(r).map(v => csvCell(typeof v === "string" ? v : JSON.stringify(v))).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `amara-audit-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    exportedAudit(format, records.length);
    notify(`Exported ${records.length} events with change details.`);
  };

  return (
    <Page wide>
      <PageHeader eyebrow="Audit trail" title="Every change has a story." actions={<>
        <Button disabled={!isOwner || !rows.length} onClick={() => download("csv")} title={isOwner ? undefined : "Only the Owner can export"}><Download className="size-3.5" /> CSV</Button>
        <Button disabled={!isOwner || !rows.length} onClick={() => download("json")} title={isOwner ? undefined : "Only the Owner can export"}><Download className="size-3.5" /> JSON</Button>
      </>}>
        See who changed a record, which module it came from, and the exact before and after values.
      </PageHeader>

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        {[
          { label: "Recorded events", value: events.length },
          { label: "Field changes", value: events.reduce((n, e) => n + (e.records?.reduce((s, r) => s + r.fields.length, 0) ?? 0), 0) },
          { label: "Actors", value: new Set(events.map(e => e.actorId)).size },
          { label: "Modules", value: new Set(events.flatMap(e => [e.module ?? moduleForAction(e.action), ...(e.records?.map(r => r.module) ?? [])])).size },
        ].map(s => <div key={s.label} className="bg-surface px-4 py-4"><dt className="text-[12px] text-fg-muted">{s.label}</dt><dd className="mt-2 text-[24px] font-semibold num">{s.value}</dd></div>)}
      </dl>

      <div data-tour="audit-filters" className="mb-4 flex flex-wrap items-center gap-2">
        <select value={module} onChange={e => setModule(e.target.value)} aria-label="Module" className={compactSelectClass}><option value="all">All modules</option>{AUDIT_MODULES.map(m => <option key={m}>{m}</option>)}</select>
        <select value={actor} onChange={e => setActor(e.target.value)} aria-label="Actor" className={compactSelectClass}><option value="all">All actors</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}<option value="amara">Amara</option><option value="system">System</option></select>
        <select value={operation} onChange={e => setOperation(e.target.value)} aria-label="Change type" className={compactSelectClass}><option value="all">All change types</option><option value="created">Created</option><option value="updated">Updated</option><option value="removed">Removed</option><option value="activity">Activity</option></select>
        <select value={period} onChange={e => setPeriod(e.target.value)} aria-label="Period" className={compactSelectClass}><option value="all">All history</option><option value="session">This session</option></select>
        <div className="relative ml-auto w-full sm:w-72"><Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search records, fields or actions" aria-label="Search audit trail" className={cx(inputClass, "h-8 pl-8 text-[12px]")} /></div>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-faint">
        <span>{rows.length} of {events.length} events · newest first · times in WIB (UTC+7)</span>
        <span>Demo history is session-only and resets on reload.</span>
      </div>
      <div data-tour="audit-table" className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[1050px] text-left text-[13px]">
          <thead className="bg-ink-sunken text-[10px] tracking-[0.06em] text-fg-muted uppercase"><tr>{["Time", "Actor", "Module", "Record / action", "Changes"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line bg-surface">{rows.map(e => {
            const open = expanded === e.id;
            const count = e.records?.reduce((n, r) => n + r.fields.length, 0) ?? 0;
            const deal = deals.find(d => d.id === e.dealId);
            return <Fragment key={e.id}>
              <tr className={cx("align-top hover:bg-raised/50", open && "bg-raised/40")}>
                <td className="w-36 px-4 py-4 whitespace-nowrap"><time dateTime={new Date(e.at).toISOString()} className="font-mono text-[12px] text-fg num">{clock(e.at)}</time><div className="mt-1 text-[10px] text-fg-faint">{date(e.at)}</div></td>
                <td className="w-44 px-4 py-4"><div className="flex items-center gap-2"><ActorAvatar id={e.actorId} size="xs" /><div><div className="text-[12px] font-medium">{memberName(e.actorId)}</div><div className="mt-0.5 text-[10px] text-fg-faint">{e.actorId === "system" ? "Automation" : e.actorId === "amara" ? "AI assistant" : members.find(m => m.id === e.actorId)?.role ?? "Member"}</div></div></div></td>
                <td className="w-32 px-4 py-4"><span className="inline-flex rounded-md border border-line bg-ink-sunken px-2 py-1 text-[11px] text-fg-muted">{e.module ?? moduleForAction(e.action)}</span></td>
                <td className="px-4 py-4"><div className="font-medium">{e.records?.[0]?.entityName ?? deal?.candidate.name ?? e.summary}</div><div className="mt-1 max-w-lg text-[12px] leading-relaxed text-fg-muted">{e.summary}</div><code className="mt-1.5 block text-[10px] text-fg-faint">{e.action}</code></td>
                <td className="w-40 px-4 py-4"><button onClick={() => setExpanded(open ? null : e.id)} aria-expanded={open} aria-controls={`audit-${e.id}`} className="inline-flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-fg-muted hover:border-line-strong hover:text-fg">{count ? `${count} ${count === 1 ? "field" : "fields"}` : "View details"}<ChevronDown className={cx("size-3.5 transition-transform", open && "rotate-180")} /></button><div className="mt-1.5 text-[10px] text-fg-faint">{e.records?.length ? [...new Set(e.records.map(r => r.operation))].join(" · ") : e.records ? "Activity" : "Historical fixture"}</div></td>
              </tr>
              {open && <tr id={`audit-${e.id}`}><td colSpan={5} className="bg-ink-sunken/50 px-5 py-5"><div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-fg-faint"><span className="font-mono">Event {e.id}</span><span>{new Date(e.at).toISOString()}</span>{deal && <Link href={`/deals/${deal.id}`} className="inline-flex items-center gap-1 text-fg-muted hover:text-fg">Open deal<ArrowRight className="size-3" /></Link>}</div>{e.reason && <p className="mb-4 text-[12px] text-fg-muted"><span className="font-medium text-fg">Reason:</span> {e.reason}</p>}{e.records?.length ? <div className="space-y-4">{e.records.map((r, i) => <RecordDiff key={`${r.entityId}-${i}`} record={r} />)}</div> : <p className="text-[12px] text-fg-muted">{e.records ? "This activity did not change record fields." : "This historical demo event has no stored before/after values."}</p>}</td></tr>}
            </Fragment>;
          })}</tbody>
        </table>
        {!rows.length && <div className="bg-surface px-4 py-12 text-center"><History className="mx-auto mb-3 size-6 text-fg-faint" /><p className="text-[13px] text-fg-muted">No events match these filters.</p><button onClick={() => { setModule("all"); setActor("all"); setOperation("all"); setPeriod("all"); setQuery(""); }} className="mt-3 text-[12px] text-fg underline underline-offset-4">Clear filters</button></div>}
      </div>
    </Page>
  );
}

function RecordDiff({ record: r }: { record: AuditRecord }) {
  return <section className="overflow-hidden rounded-lg border border-line bg-surface"><header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 text-[12px]"><span className="font-medium">{r.entityName}</span><span className="text-fg-faint">{r.module} · {r.entityType} · {r.operation}</span><code className="ml-auto text-[10px] text-fg-faint">{r.entityId}</code></header><table className="w-full table-fixed text-[12px]"><thead className="text-[10px] text-fg-faint"><tr><th className="w-1/4 px-3 py-2 text-left font-medium">Field</th><th className="px-3 py-2 text-left font-medium">Before</th><th className="px-3 py-2 text-left font-medium">After</th></tr></thead><tbody className="divide-y divide-line">{r.fields.map(f => <tr key={f.field} className="align-top"><td className="px-3 py-2 text-fg-muted">{fieldLabel(f.field)}</td><td className="px-3 py-2 break-words whitespace-pre-wrap text-fg-faint">{auditValue(f.field, f.before)}</td><td className="px-3 py-2 break-words whitespace-pre-wrap text-fg">{auditValue(f.field, f.after)}</td></tr>)}</tbody></table></section>;
}

function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
