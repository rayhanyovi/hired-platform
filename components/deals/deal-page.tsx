"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronRight, FilePlus2, FileText, MapPin, Phone, Upload, Users } from "lucide-react";
import { STAGES } from "@/lib/data";
import { fee, money } from "@/lib/deal";
import { DOC_KIND_LABEL, DOC_STATUS_LABEL } from "@/lib/documents";
import { memberName, useDesk } from "@/lib/store";
import { ago } from "@/lib/time";
import type { Deal } from "@/lib/types";
import { LogDocumentDialog } from "../documents/log-dialog";
import { ActorAvatar } from "../ui/member";
import { Page } from "../ui/page-header";
import { Avatar, Button, Heat, SectionTitle, cx } from "../ui/primitives";
import { ActivityList } from "./activity";
import { AmaraRead } from "./amara-read";
import { Discussion } from "./discussion";

export function DealPage({ id }: { id: string }) {
  const { deals } = useDesk();
  const deal = deals.find((d) => d.id === id);
  if (!deal) {
    return (
      <Page>
        <div className="grid place-items-center rounded-2xl border border-line bg-ink-sunken px-6 py-24 text-center">
          <h1 className="font-serif text-[28px]">This deal isn&apos;t on your desk.</h1>
          <p className="mt-2 text-[14px] text-fg-muted">Deals added during a demo session reset when the page reloads.</p>
          <Link href="/pipeline" className="mt-6 text-[13px] text-fg-muted underline-offset-4 hover:text-fg hover:underline">
            Back to Pipeline
          </Link>
        </div>
      </Page>
    );
  }
  return <DealDetail deal={deal} />;
}

function DealDetail({ deal }: { deal: Deal }) {
  const { me, moveTo, logTouch, notify, documents, setDocDealId } = useDesk();
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const canRun = me.role !== "resourcer";
  const stageIndex = STAGES.findIndex((s) => s.id === deal.stage);
  const docs = documents.filter((d) => d.dealId === deal.id);

  return (
    <Page wide>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[12px] text-fg-faint">
        <Link href="/pipeline" className="transition-colors hover:text-fg">
          Pipeline
        </Link>
        <ChevronRight className="size-3" />
        <span className="truncate">{deal.candidate.name}</span>
      </nav>

      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex animate-rise items-start gap-4">
          <Avatar name={deal.candidate.name} size="lg" />
          <div className="min-w-0">
            <h1 className="font-serif text-[32px] leading-[1.05] tracking-[-0.01em] sm:text-[38px]">{deal.candidate.name}</h1>
            <p className="mt-2 text-[14px] text-fg-muted">
              {deal.role.title} at <span className="text-fg">{deal.role.client}</span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-[12px] text-fg-faint">
              Currently {deal.candidate.title}, {deal.candidate.currentCompany} · <MapPin className="size-3" /> {deal.candidate.location}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={!canRun}
            onClick={() => {
              logTouch(deal.id, { kind: "call", text: `Call with ${deal.candidate.name.split(" ")[0]}` });
              notify("Call logged");
            }}
          >
            <Phone className="size-3.5" /> Log call
          </Button>
          <Button
            disabled={!canRun}
            onClick={() => {
              logTouch(deal.id, { kind: "client", text: `Spoke to ${deal.role.client}` });
              notify("Client touch logged");
            }}
          >
            <Users className="size-3.5" /> Log client touch
          </Button>
        </div>
      </header>

      {/* Stage stepper */}
      <div data-tour="stepper" className="mb-10 overflow-x-auto">
        <ol className="grid min-w-[620px] grid-cols-6 gap-1.5" aria-label="Stage">
          {STAGES.map((s, i) => {
            const reached = i <= stageIndex;
            const current = i === stageIndex;
            return (
              <li key={s.id}>
                <button
                  disabled={!canRun || current}
                  onClick={() => {
                    moveTo(deal.id, s.id);
                    notify(`Moved to ${s.label}`);
                  }}
                  aria-current={current ? "step" : undefined}
                  title={canRun ? `Move to ${s.label}` : "Resourcers can't move deals"}
                  className="group w-full text-left disabled:cursor-default"
                >
                  <span
                    className={cx(
                      "block h-1 rounded-full transition-colors",
                      reached ? "bg-fg/80" : "bg-line-strong group-enabled:group-hover:bg-fg/30",
                    )}
                  />
                  <span className={cx("mt-2 block text-[12px]", current ? "text-fg" : reached ? "text-fg-muted" : "text-fg-faint")}>
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div data-tour="deal-main" className="min-w-0 space-y-10">
          <AmaraRead deal={deal} />
          <Discussion deal={deal} />
        </div>

        <aside data-tour="deal-aside" className="space-y-8">
          <section>
            <SectionTitle>Details</SectionTitle>
            <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface text-[13px]">
              <Row label="Heat">
                <Heat deal={deal} showLabel />
              </Row>
              <Row label="Base salary">{money(deal.role.salary)}</Row>
              <Row label="Fee">
                <span className="num">
                  {money(fee(deal))} <span className="text-fg-faint">· {Math.round(deal.feePct * 100)}%</span>
                </span>
              </Row>
              <Row label="Owner">
                <span className="inline-flex items-center gap-2">
                  <ActorAvatar id={deal.ownerId} size="xs" /> {memberName(deal.ownerId)}
                </span>
              </Row>
            </dl>
          </section>

          <section>
            <SectionTitle
              aside={
                <Link href="/documents" onClick={() => setDocDealId(deal.id)} className="text-[12px] text-fg-faint hover:text-fg">
                  All documents
                </Link>
              }
            >
              Documents
            </SectionTitle>
            {docs.length > 0 && (
              <ul className="mb-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <FileText className="size-4 shrink-0 text-fg-faint" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-fg">{DOC_KIND_LABEL[d.kind]}</div>
                      <div className="truncate text-[11px] text-fg-faint">
                        {d.direction === "received" ? "Received" : "Generated"} · {ago(d.at)}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-fg-faint">{DOC_STATUS_LABEL[d.status]}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                disabled={!canRun}
                onClick={() => {
                  setDocDealId(deal.id);
                  router.push("/documents");
                }}
              >
                <FilePlus2 className="size-3.5" /> Generate
              </Button>
              <Button size="sm" onClick={() => setLogOpen(true)}>
                <Upload className="size-3.5" /> Log received
              </Button>
            </div>
          </section>

          <section>
            <SectionTitle
              aside={
                <Link href="/audit" className="inline-flex items-center gap-1 text-[12px] text-fg-faint hover:text-fg">
                  Audit log <ArrowUpRight className="size-3" />
                </Link>
              }
            >
              Activity
            </SectionTitle>
            <ActivityList dealId={deal.id} limit={8} />
          </section>
        </aside>
      </div>

      {logOpen && <LogDocumentDialog dealId={deal.id} onClose={() => setLogOpen(false)} />}
    </Page>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-fg-faint">{label}</dt>
      <dd className="text-right text-fg">{children}</dd>
    </div>
  );
}
