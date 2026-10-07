"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Maximize2, MapPin, Phone, Users, X } from "lucide-react";
import { STAGES } from "@/lib/data";
import { fee, money } from "@/lib/deal";
import { useDesk } from "@/lib/store";
import type { Deal } from "@/lib/types";
import { ActivityList } from "../deals/activity";
import { AmaraRead } from "../deals/amara-read";
import { Avatar, Button, Heat } from "../ui/primitives";

/** Quick view of a deal from anywhere. The full page lives at /deals/[id]. */
export function DealDrawer() {
  const { deals, openDealId, openDeal } = useDesk();
  const deal = deals.find((d) => d.id === openDealId);
  if (!deal) return null;
  return <Drawer key={deal.id} deal={deal} onClose={() => openDeal(null)} />;
}

function Drawer({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const { logTouch, advance, notify, me } = useDesk();
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageIndex = STAGES.findIndex((s) => s.id === deal.stage);
  const nextStage = STAGES[stageIndex + 1];
  const canRun = me.role !== "resourcer";

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={`${deal.candidate.name} deal`}>
      <button aria-label="Close" className="absolute inset-0 animate-fade bg-black/50" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[520px] animate-drawer flex-col border-l border-line-strong bg-ink shadow-[-30px_0_80px_-30px_rgb(0_0_0/0.9)]">
        <header className="flex items-center gap-2 border-b border-line px-5 py-3 text-[12px] text-fg-faint">
          <span className="font-mono">{STAGES[stageIndex].label}</span>
          <span>·</span>
          <Heat deal={deal} showLabel />
          <Link
            href={`/deals/${deal.id}`}
            onClick={onClose}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] text-fg-muted transition-colors hover:bg-hover hover:text-fg"
          >
            <Maximize2 className="size-3.5" /> Open full page
          </Link>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="px-6 pt-6 pb-5">
            <div className="flex items-start gap-4">
              <Avatar name={deal.candidate.name} size="lg" />
              <div className="min-w-0">
                <h2 className="font-serif text-[26px] leading-tight tracking-tight">{deal.candidate.name}</h2>
                <p className="mt-1 text-[13px] text-fg-muted">
                  {deal.candidate.title} at {deal.candidate.currentCompany}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[12px] text-fg-faint">
                  <MapPin className="size-3" /> {deal.candidate.location}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-3 overflow-hidden rounded-xl border border-line text-[12px]">
              <div className="col-span-3 border-b border-line px-4 py-3 sm:col-span-1 sm:border-r sm:border-b-0">
                <dt className="text-fg-faint">Role</dt>
                <dd className="mt-1 truncate text-fg">{deal.role.title}</dd>
              </div>
              <div className="col-span-2 border-r border-line px-4 py-3 sm:col-span-1">
                <dt className="text-fg-faint">Client</dt>
                <dd className="mt-1 truncate text-fg">{deal.role.client}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-fg-faint">Fee</dt>
                <dd className="mt-1 text-fg num">
                  {money(fee(deal))}
                  <span className="ml-1 text-fg-faint">{Math.round(deal.feePct * 100)}%</span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="px-6 pb-6">
            <AmaraRead deal={deal} />
          </section>

          <section className="px-6 pb-8">
            <h3 className="mb-4 text-[11px] tracking-[0.08em] text-fg-faint uppercase">Activity</h3>
            <ActivityList dealId={deal.id} limit={6} />
          </section>
        </div>

        <footer className="flex gap-2 border-t border-line px-5 py-3">
          <Button
            size="sm"
            disabled={!canRun}
            onClick={() => {
              logTouch(deal.id, { kind: "call", text: `Call with ${deal.candidate.name.split(" ")[0]}` });
              notify("Call logged");
            }}
          >
            <Phone className="size-3.5" /> Log call
          </Button>
          <Button
            size="sm"
            disabled={!canRun}
            onClick={() => {
              logTouch(deal.id, { kind: "client", text: `Spoke to ${deal.role.client}` });
              notify("Client touch logged");
            }}
          >
            <Users className="size-3.5" /> Log client touch
          </Button>
          {nextStage && (
            <Button
              size="sm"
              variant="primary"
              className="ml-auto"
              disabled={!canRun}
              onClick={() => {
                advance(deal.id);
                notify(`${deal.candidate.name} moved to ${nextStage.label}`);
              }}
            >
              Move to {nextStage.label} <ArrowRight className="size-3.5" />
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}
