"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { STAGES } from "@/lib/data";
import { fee, money, needsAttention, STAGE_ODDS } from "@/lib/deal";
import { useDesk } from "@/lib/store";
import type { Deal, Stage } from "@/lib/types";
import { AmaraTag, Avatar, Heat, cx } from "../ui/primitives";
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
          <div className="flex items-center gap-4">
            <div className="border-r border-line pr-4 text-right">
              <div className="text-[10px] font-medium tracking-[0.06em] text-fg-muted uppercase">Weighted fees</div>
              <div className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] num">{money(Math.round(weighted), { compact: true })}</div>
              <div className="mt-1 text-[10px] text-fg-faint">In the current view</div>
            </div>
            <Link
              href="/candidates"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Plus className="size-3.5" /> New deal
            </Link>
          </div>
        }
      >
        The bar under each deal drains as it sits untouched. It drains faster the closer a deal is to an offer.
      </PageHeader>

      <div data-tour="pipeline-filters" className="mb-5 flex flex-wrap items-center gap-2 border-b border-line pb-4">
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
                  overStage === stage.id ? "border-line-strong bg-surface" : "border-line bg-ink-sunken/60",
                )}
              >
                <header className="mb-3 border-b border-line px-2 pt-2 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="cursor-help text-[13px] font-semibold text-fg" title={stage.description}>
                      {stage.label}
                    </h2>
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-raised font-mono text-[10px] text-fg-muted num" aria-label={`${cards.length} ${cards.length === 1 ? "deal" : "deals"}`}>{cards.length}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-fg-faint">
                    <span className="font-mono text-[11px] text-fg-muted num">{total ? money(total, { compact: true }) : "—"}</span>
                    <span>in fees</span>
                  </div>
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
        "group relative w-full cursor-grab overflow-hidden rounded-lg border bg-surface p-3 text-left transition-[border-color,background-color,opacity,transform] duration-150 hover:border-line-strong hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amara-soft active:cursor-grabbing",
        attention ? "border-warm/30" : "border-line",
        dragging && "scale-[0.98] opacity-40",
      )}
    >
      {attention && <span className="absolute inset-y-0 left-0 w-0.5 bg-warm/80" aria-hidden="true" />}
      <div className="flex items-start gap-2.5">
        <Avatar name={deal.candidate.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[14px] font-semibold leading-tight text-fg">{deal.candidate.name}</div>
          <div className="mt-1 truncate text-[11px] text-fg-muted">{deal.role.client}</div>
        </div>
      </div>
      <div className="mt-3 line-clamp-2 min-h-[32px] text-[12px] leading-4 text-fg-muted">{deal.role.title}</div>
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2.5">
        <Heat deal={deal} />
        <span className="text-[13px] font-medium text-fg num">{money(fee(deal), { compact: true })}</span>
      </div>
      {attention && (
        <div className="mt-3">
          <div className="mb-1.5 text-[9px] font-medium tracking-[0.05em] text-warm uppercase">Needs attention</div>
          <AmaraTag wrap>
            <span className="line-clamp-3">{deal.next.label}</span>
          </AmaraTag>
        </div>
      )}
    </button>
  );
}
