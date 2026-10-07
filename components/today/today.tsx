"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { morningBrief } from "@/lib/ai";
import { FOLLOW_UP_LABEL, NOW_LABEL, RECRUITER, STAGES } from "@/lib/data";
import { fee, money, needsAttention, riskValue, STAGE_ODDS } from "@/lib/deal";
import { useDesk } from "@/lib/store";
import { AmaraByline, StreamText } from "../ai/stream";
import { ApprovalCard } from "../deals/discussion";
import { Page, PageHeader } from "../ui/page-header";
import { Avatar, Button, Heat, SectionTitle, cx } from "../ui/primitives";

export function Today() {
  const { deals, followUps, sentCount, openDeal, selectFollowUp, me, isOwner, approvals } = useDesk();
  const pendingApprovals = isOwner ? approvals.filter((a) => a.status === "pending") : [];
  const [briefRun, setBriefRun] = useState(1);

  const cooling = deals.filter(needsAttention).sort((a, b) => riskValue(b) - riskValue(a));
  const coolingFees = cooling.reduce((s, d) => s + fee(d), 0);
  const live = deals.filter((d) => d.stage !== "placed");
  const weighted = live.reduce((s, d) => s + fee(d) * STAGE_ODDS[d.stage], 0);
  const progress = RECRUITER.placedThisMonth / RECRUITER.monthlyTarget;

  return (
    <Page>
      <PageHeader eyebrow={NOW_LABEL} title={`Morning, ${me.firstName}.`}>
        {cooling.length > 0 ? (
          <>
            <span className="text-fg num">{money(coolingFees)}</span> in fees is cooling, and{" "}
            <span className="text-fg num">{followUps.length}</span> {followUps.length === 1 ? "person is" : "people are"} waiting to
            hear from you.
          </>
        ) : (
          <>Every deal is warm. {followUps.length ? `${followUps.length} people are still waiting on you.` : "Nobody is waiting on you."}</>
        )}
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          {/* Amara's morning brief */}
          <section data-tour="brief" className="amara-edge animate-rise rounded-2xl bg-[radial-gradient(120%_140%_at_0%_0%,rgb(139_92_246/0.10),transparent_55%)] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <AmaraByline>Morning brief</AmaraByline>
              <button
                onClick={() => setBriefRun((n) => n + 1)}
                className="grid size-7 place-items-center rounded-md text-fg-faint transition-colors hover:bg-hover hover:text-fg"
                aria-label="Rewrite brief"
                title="Rewrite brief"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
            <div className="mt-4 min-h-[96px] max-w-[68ch] text-[15px] leading-[1.7] text-fg/90 sm:text-[16px]">
              <StreamText key={briefRun} text={morningBrief(deals, followUps.length)} delay={700} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {cooling[0] && (
                <Button variant="amara" onClick={() => openDeal(cooling[0].id)}>
                  {cooling[0].next.kind === "call" ? "Prep the call" : "Open"} · {cooling[0].candidate.name}
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
              {followUps.length > 0 && (
                <Link
                  href="/follow-ups"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-raised px-3.5 text-[13px] font-medium text-fg transition-colors hover:bg-hover"
                >
                  Review {followUps.length} drafted updates
                </Link>
              )}
            </div>
          </section>

          {/* Approvals that need the Owner */}
          {pendingApprovals.length > 0 && (
            <section>
              <SectionTitle
                aside={
                  <Link href="/team" className="inline-flex items-center gap-1 text-[12px] text-fg-faint hover:text-fg">
                    Team <ArrowUpRight className="size-3" />
                  </Link>
                }
              >
                Needs your sign-off
              </SectionTitle>
              <div className="space-y-3">
                {pendingApprovals.map((a) => (
                  <ApprovalCard key={a.id} approval={a} showDeal />
                ))}
              </div>
            </section>
          )}

          {/* Going cold */}
          <section data-tour="going-cold">
            <SectionTitle
              aside={
                <Link href="/pipeline" className="inline-flex items-center gap-1 text-[12px] text-fg-faint hover:text-fg">
                  Pipeline <ArrowUpRight className="size-3" />
                </Link>
              }
            >
              Going cold · time kills deals
            </SectionTitle>
            {cooling.length === 0 ? (
              <EmptyRow>Nothing is cooling. Every live deal was touched inside its window.</EmptyRow>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {cooling.map((d, i) => (
                  <li key={d.id} className="animate-rise" style={{ animationDelay: `${80 + i * 40}ms` }}>
                    <button
                      onClick={() => openDeal(d.id)}
                      className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-raised sm:grid-cols-[auto_minmax(0,1fr)_88px_56px_minmax(0,240px)]"
                    >
                      <Avatar name={d.candidate.name} />
                      <div className="min-w-0">
                        <div className="truncate text-[14px] text-fg">{d.candidate.name}</div>
                        <div className="truncate text-[12px] text-fg-faint">
                          {d.role.title} · {d.role.client}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <Heat deal={d} />
                      </div>
                      <div className="text-right text-[13px] text-fg num">{money(fee(d), { compact: true })}</div>
                      <div className="col-span-3 flex items-center gap-2 text-[12px] text-fg-muted sm:col-span-1 sm:justify-end">
                        <span className="sm:hidden">
                          <Heat deal={d} />
                        </span>
                        <span className="truncate transition-colors group-hover:text-amara-soft">{d.next.label}</span>
                        <ArrowRight className="size-3.5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-amara-soft" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Waiting on you */}
          <section data-tour="waiting">
            <SectionTitle
              aside={
                <Link href="/follow-ups" className="inline-flex items-center gap-1 text-[12px] text-fg-faint hover:text-fg">
                  All follow-ups <ArrowUpRight className="size-3" />
                </Link>
              }
            >
              Waiting on you · no ghosting
            </SectionTitle>
            {followUps.length === 0 ? (
              <EmptyRow>Nobody is waiting on you. {sentCount} updates sent today.</EmptyRow>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {followUps.slice(0, 3).map((f) => (
                  <Link
                    key={f.id}
                    href="/follow-ups"
                    onClick={() => selectFollowUp(f.id)}
                    className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-raised"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-fg-faint">{FOLLOW_UP_LABEL[f.kind]}</span>
                      <span className={cx("font-mono text-[11px] num", f.daysWaiting >= 3 ? "text-warm" : "text-fg-faint")}>
                        {f.daysWaiting}d
                      </span>
                    </div>
                    <div className="mt-3 text-[14px] text-fg">{f.name}</div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">{f.detail}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-[11px] text-fg-faint transition-colors group-hover:text-amara-soft">
                      Draft ready <ArrowRight className="size-3" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside data-tour="month" className="space-y-8 lg:pt-1">
          <section>
            <SectionTitle>October</SectionTitle>
            <div className="text-[40px] font-medium leading-none tracking-[-0.03em] num">{money(RECRUITER.placedThisMonth, { compact: true })}</div>
            <div className="mt-2 text-[12px] text-fg-faint">
              placed of {money(RECRUITER.monthlyTarget, { compact: true })} target ·{" "}
              {money(RECRUITER.monthlyTarget - RECRUITER.placedThisMonth, { compact: true })} to go
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-line-strong">
              <div className="h-full rounded-full bg-fg/80" style={{ width: `${progress * 100}%` }} />
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <Stat label="Weighted pipeline" value={money(Math.round(weighted), { compact: true })} />
            <Stat label="Fees cooling" value={money(coolingFees, { compact: true })} tone={coolingFees ? "warm" : undefined} />
            <Stat label="Live deals" value={String(live.length)} />
            <Stat label="Updates sent" value={String(sentCount)} />
          </dl>

          <section>
            <SectionTitle>Pipeline by stage</SectionTitle>
            <ul className="space-y-2.5">
              {STAGES.map((s) => {
                const inStage = deals.filter((d) => d.stage === s.id);
                const value = inStage.reduce((sum, d) => sum + fee(d), 0);
                const max = Math.max(...STAGES.map((x) => deals.filter((d) => d.stage === x.id).reduce((sum, d) => sum + fee(d), 0)));
                const hasCold = inStage.some(needsAttention);
                return (
                  <li key={s.id} className="grid grid-cols-[92px_minmax(0,1fr)_48px] items-center gap-3 text-[12px]">
                    <span className="flex items-center gap-1.5 text-fg-muted">
                      {s.label}
                      {hasCold && <span className="size-1 rounded-full bg-warm" title="Has cooling deals" />}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-fg/45 transition-[width] duration-700"
                        style={{ width: `${max ? (value / max) * 100 : 0}%` }}
                      />
                    </span>
                    <span className="text-right font-mono text-[11px] text-fg-faint num">{money(value, { compact: true })}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </Page>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warm" }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <dt className="text-[11px] text-fg-faint">{label}</dt>
      <dd className={cx("mt-1.5 text-[18px] num", tone === "warm" ? "text-warm" : "text-fg")}>{value}</dd>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-fg-faint">{children}</div>;
}
