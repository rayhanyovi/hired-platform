"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { STAGES } from "@/lib/data";
import { fee, money, needsAttention, STAGE_ODDS } from "@/lib/deal";
import { useDesk } from "@/lib/store";
import type { Deal, Stage } from "@/lib/types";
import { AmaraMark, Avatar, Heat, cx } from "../ui/primitives";
import { Page, PageHeader } from "../ui/page-header";

type Filter = "all" | "attention";

export function Board() {
  const { deals, moveTo, notify } = useDesk();
  const [filter, setFilter] = useState<Filter>("all");
  const [client, setClient] = useState<string>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);

  const clients = [...new Set(deals.map((d) => d.role.client))].sort();
  const visible = deals.filter(
    (d) => (filter === "all" || needsAttention(d)) && (client === "all" || d.role.client === client),
  );
  const attentionCount = deals.filter(needsAttention).length;
  const weighted = visible
    .filter((d) => d.stage !== "placed")
    .reduce((s, d) => s + fee(d) * STAGE_ODDS[d.stage], 0);

  const drop = (stage: Stage) => {
    const deal = deals.find((d) => d.id === dragId);
    if (deal && deal.stage !== stage) {
      moveTo(deal.id, stage);
      notify(`${deal.candidate.name} moved to ${STAGES.find((s) => s.id === stage)?.label}`);
    }
    setDragId(null);
    setOverStage(null);
  };

  return (
    <Page wide>
      <PageHeader
        eyebrow="Pipeline"
        title="Every deal, and how warm it is."
        actions={
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="text-[26px] font-medium leading-none tracking-[-0.02em] num">{money(Math.round(weighted), { compact: true })}</div>
              <div className="mt-1.5 text-[11px] text-fg-faint">weighted fees in view</div>
            </div>
            <Link
              href="/candidates"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-fg px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-white"
            >
              <Plus className="size-3.5" /> New deal
            </Link>
          </div>
        }
      >
        The bar under each deal drains as it sits untouched. It drains faster the closer a deal is to an offer.
      </PageHeader>

      <div data-tour="pipeline-filters" className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="tablist" aria-label="Filter deals">
          {(
            [
              ["all", "All deals", deals.length],
              ["attention", "Needs attention", attentionCount],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cx(
                "flex h-7 items-center gap-2 rounded-md px-3 text-[12px] transition-colors",
                filter === id ? "bg-raised text-fg shadow-[0_0_0_1px_rgb(255_255_255/0.06)]" : "text-fg-muted hover:text-fg",
              )}
            >
              {label}
              <span className={cx("font-mono text-[10px] num", id === "attention" && n ? "text-warm" : "text-fg-faint")}>{n}</span>
            </button>
          ))}
        </div>
        <select
          value={client}
          onChange={(e) => setClient(e.target.value)}
          aria-label="Filter by client"
          className="h-8 rounded-lg border border-line bg-surface px-2.5 text-[12px] text-fg-muted outline-none hover:border-line-strong focus-visible:border-amara-soft/60"
        >
          <option value="all">All clients</option>
          {clients.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="ml-auto hidden text-[11px] text-fg-faint lg:inline">Drag a card to change its stage</span>
      </div>

      <div data-tour="board" className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const cards = visible.filter((d) => d.stage === stage.id).sort((a, b) => b.hoursIdle - a.hoursIdle);
            const total = cards.reduce((s, d) => s + fee(d), 0);
            return (
              <section
                key={stage.id}
                aria-label={stage.label}
                data-tour={`stage-${stage.id}`}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverStage(stage.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null);
                }}
                onDrop={() => drop(stage.id)}
                className={cx(
                  "flex min-h-[420px] flex-col rounded-xl border p-2 transition-colors",
                  overStage === stage.id ? "border-line-strong bg-surface" : "border-transparent bg-ink-sunken",
                )}
              >
                <header className="flex items-baseline justify-between px-2 pt-1.5 pb-3">
                  <h2 className="cursor-help text-[12px] font-medium text-fg-muted" title={stage.description}>
                    {stage.label}
                    <span className="ml-1.5 font-mono text-[10px] text-fg-faint num">{cards.length}</span>
                  </h2>
                  <span className="font-mono text-[10px] text-fg-faint num">{total ? money(total, { compact: true }) : "—"}</span>
                </header>
                <ul className="flex flex-col gap-2">
                  {cards.map((d) => (
                    <li key={d.id}>
                      <DealCard deal={d} dragging={dragId === d.id} onDragStart={() => setDragId(d.id)} onDragEnd={() => setDragId(null)} />
                    </li>
                  ))}
                </ul>
                {cards.length === 0 && (
                  <div className="m-1 grid flex-1 place-items-center rounded-lg border border-dashed border-line text-[11px] text-fg-faint">
                    {dragId ? "Drop here" : "Empty"}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </Page>
  );
}

function DealCard({
  deal,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  deal: Deal;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { openDeal } = useDesk();
  const attention = needsAttention(deal);
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={() => openDeal(deal.id)}
      className={cx(
        "group w-full cursor-grab rounded-lg border bg-surface p-3 text-left transition-[border-color,background-color,opacity,transform] duration-150 hover:border-line-strong hover:bg-raised active:cursor-grabbing",
        attention ? "border-line-strong" : "border-line",
        dragging && "scale-[0.98] opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={deal.candidate.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] leading-tight text-fg">{deal.candidate.name}</div>
          <div className="mt-0.5 truncate text-[11px] text-fg-faint">{deal.role.client}</div>
        </div>
      </div>
      <div className="mt-2.5 truncate text-[12px] text-fg-muted">{deal.role.title}</div>
      <div className="mt-3 flex items-center justify-between">
        <Heat deal={deal} />
        <span className="text-[12px] text-fg num">{money(fee(deal), { compact: true })}</span>
      </div>
      {attention && (
        <div className="mt-3 flex items-start gap-1.5 border-t border-line pt-2.5 text-[11px] leading-snug text-amara-soft/90">
          <AmaraMark className="mt-[3px] h-2 w-2.5 shrink-0" />
          <span className="line-clamp-2">{deal.next.label}</span>
        </div>
      )}
    </button>
  );
}
