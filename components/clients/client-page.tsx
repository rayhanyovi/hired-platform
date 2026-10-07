"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, FileText, Mail, Plus, Upload } from "lucide-react";
import { rolesFor, type RolePeople } from "@/lib/clients";
import { STAGES } from "@/lib/data";
import { fee, money } from "@/lib/deal";
import { DOC_KIND_LABEL, DOC_STATUS_LABEL } from "@/lib/documents";
import { memberName, useDesk } from "@/lib/store";
import { ago, formatDate } from "@/lib/time";
import type { Client } from "@/lib/types";
import { EVENT_ICON } from "../deals/activity";
import { LogDocumentDialog } from "../documents/log-dialog";
import { FitPill } from "../sourcing/parts";
import { Page } from "../ui/page-header";
import { Avatar, Button, Heat, SectionTitle, cx } from "../ui/primitives";
import { channelsLabel, ClientLogo, ClientStatus, Funnel, PostRoleDialog, TobChip } from "./parts";

export function ClientPage({ id }: { id: string }) {
  const { clients } = useDesk();
  const client = clients.find((c) => c.id === id);
  if (!client) {
    return (
      <Page>
        <div className="grid place-items-center rounded-2xl border border-line bg-ink-sunken px-6 py-24 text-center">
          <h1 className="font-serif text-[28px]">No client by that name.</h1>
          <Link href="/clients" className="mt-6 text-[13px] text-fg-muted underline-offset-4 hover:text-fg hover:underline">
            Back to Clients
          </Link>
        </div>
      </Page>
    );
  }
  return <ClientDetail client={client} />;
}

function ClientDetail({ client }: { client: Client }) {
  const { jobs, applicants, candidates, deals, documents, events, isOwner, setClientStatus, notify } = useDesk();
  const [posting, setPosting] = useState(false);
  const [logging, setLogging] = useState(false);

  const roles = rolesFor(client.name, { jobs, applicants, candidates, deals });
  const dealIds = new Set(deals.filter((d) => d.role.client === client.name).map((d) => d.id));
  const docs = documents.filter((d) => d.client === client.name).sort((a, b) => b.at - a.at);
  const activity = events.filter((e) => (e.dealId && dealIds.has(e.dealId)) || e.summary.includes(client.name)).slice(0, 8);

  return (
    <Page wide>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[12px] text-fg-faint">
        <Link href="/clients" className="transition-colors hover:text-fg">
          Clients
        </Link>
        <ChevronRight className="size-3" />
        <span className="truncate">{client.name}</span>
      </nav>

      <header data-tour="client-header" className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-rise">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <ClientStatus status={client.status} />
            <TobChip clientName={client.name} />
          </div>
          <div className="flex items-center gap-4">
            <ClientLogo client={client} size="lg" />
            <h1 className="font-serif text-[34px] leading-[1.05] tracking-[-0.01em] sm:text-[40px]">{client.name}</h1>
          </div>
          <p className="mt-2 text-[13px] text-fg-muted">
            {client.industry} · {client.location} · Working together since {formatDate(client.since)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {client.status === "prospect" && isOwner && (
            <Button
              onClick={() => {
                setClientStatus(client.id, "active");
                notify(`${client.name} is now an active client`);
              }}
            >
              Mark as active
            </Button>
          )}
          <Button onClick={() => setLogging(true)}>
            <Upload className="size-3.5" /> Log document
          </Button>
          <Button variant="primary" onClick={() => setPosting(true)}>
            <Plus className="size-3.5" /> New role
          </Button>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div data-tour="client-roles" className="min-w-0 space-y-6">
          <SectionTitle>
            Roles · {roles.filter((r) => r.job.status !== "filled").length} open
          </SectionTitle>
          {roles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
              <p className="text-[14px] text-fg-muted">No roles yet.</p>
              <Button variant="primary" className="mt-4" onClick={() => setPosting(true)}>
                <Plus className="size-3.5" /> Add their first role
              </Button>
            </div>
          )}
          {roles.map((r) => (
            <RoleCard key={r.job.id} role={r} />
          ))}
        </div>

        <aside data-tour="client-aside" className="space-y-8">
          <section>
            <SectionTitle>Contact</SectionTitle>
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <Avatar name={client.contact.name} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] text-fg">{client.contact.name}</div>
                  <div className="truncate text-[12px] text-fg-faint">{client.contact.title}</div>
                </div>
              </div>
              {client.contact.email && (
                <a
                  href={`mailto:${client.contact.email}`}
                  className="mt-3 flex items-center gap-2 truncate text-[12px] text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                >
                  <Mail className="size-3.5 shrink-0" /> {client.contact.email}
                </a>
              )}
            </div>
          </section>

          <section>
            <SectionTitle>Terms</SectionTitle>
            <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface text-[13px]">
              <div className="flex justify-between px-4 py-3">
                <dt className="text-fg-faint">Standard fee</dt>
                <dd className="text-fg num">{Math.round(client.feePct * 100)}%</dd>
              </div>
              <div className="flex justify-between px-4 py-3">
                <dt className="text-fg-faint">Terms of Business</dt>
                <dd>
                  <TobChip clientName={client.name} />
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <SectionTitle
              aside={
                <Link href="/documents" className="text-[12px] text-fg-faint hover:text-fg">
                  Register
                </Link>
              }
            >
              Documents
            </SectionTitle>
            {docs.length === 0 ? (
              <p className="text-[13px] text-fg-faint">Nothing logged yet.</p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {docs.slice(0, 6).map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <FileText className="size-4 shrink-0 text-fg-faint" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-fg">{DOC_KIND_LABEL[d.kind]}</div>
                      <div className="truncate text-[11px] text-fg-faint">{d.title.split(" — ")[1] ?? d.client}</div>
                    </div>
                    <span className="shrink-0 text-[11px] text-fg-faint">{DOC_STATUS_LABEL[d.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionTitle>Activity</SectionTitle>
            {activity.length === 0 ? (
              <p className="text-[13px] text-fg-faint">No activity yet.</p>
            ) : (
              <ol className="space-y-3.5">
                {activity.map((e) => {
                  const Icon = EVENT_ICON[e.kind];
                  return (
                    <li key={e.id} className="flex gap-3">
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-fg-faint" />
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug text-fg-muted">{e.summary}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-fg-faint">
                          {memberName(e.actorId)} · {ago(e.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </aside>
      </div>

      {posting && <PostRoleDialog client={client} onClose={() => setPosting(false)} />}
      {logging && <LogDocumentDialog clientName={client.name} onClose={() => setLogging(false)} />}
    </Page>
  );
}

function RoleCard({ role: r }: { role: RolePeople }) {
  const { openDeal, selectApplicant, selectCandidate, setJobFilter } = useDesk();
  const filled = r.job.status === "filled";
  const nobody = r.applicants.length + r.pool.length + r.live.length + r.placed.length === 0;

  return (
    <article id={r.job.id} className={cx("scroll-mt-8 overflow-hidden rounded-2xl border border-line bg-surface", filled && "opacity-70")}>
      <header className="flex flex-wrap items-start gap-4 px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-medium text-fg">{r.job.title}</h3>
          <p className="mt-1 text-[12px] text-fg-faint">
            {money(r.job.salary)} · {r.job.location} · {channelsLabel(r.job.channels)} · opened {ago(r.job.postedAt)}
          </p>
        </div>
        {filled && <span className="rounded-full border border-good/30 px-2 py-0.5 text-[11px] text-good">Filled</span>}
      </header>

      {!filled && (
        <div data-tour="funnel" className="px-5 pb-4">
          <Funnel role={r} />
        </div>
      )}

      {nobody ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 text-[13px] text-fg-faint">
          No candidates yet.
          {r.job.channels.length > 0 && (
            <Link
              href="/applicants"
              onClick={() => setJobFilter(r.job.id)}
              className="inline-flex items-center gap-1 text-fg-muted underline-offset-4 hover:text-fg hover:underline"
            >
              Check for applications <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      ) : (
        <ul className="@container divide-y divide-line border-t border-line">
          {[...r.live, ...r.placed].map((d) => (
            <PersonRow
              key={d.id}
              name={d.candidate.name}
              sub={`${d.candidate.title} · ${d.candidate.currentCompany}`}
              status={
                <span className="flex items-center gap-3">
                  <span className="text-fg">{STAGES.find((s) => s.id === d.stage)?.label}</span>
                  {d.stage !== "placed" && <Heat deal={d} />}
                </span>
              }
              meta={`${money(fee(d), { compact: true })} fee · ${memberName(d.ownerId).split(" ")[0]}`}
              action={
                <>
                  <button onClick={() => openDeal(d.id)} className="text-[12px] text-fg-faint hover:text-fg">
                    Quick view
                  </button>
                  <Link href={`/deals/${d.id}`} className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg">
                    Open <ArrowRight className="size-3" />
                  </Link>
                </>
              }
            />
          ))}
          {r.pool.map((c) => (
            <PersonRow
              key={c.id}
              name={c.name}
              sub={c.headline}
              status={<span className="text-fg-muted">{c.status === "contacted" ? "Contacted" : "Shortlisted"}</span>}
              meta={c.fit ? <FitPill fit={c.fit} /> : c.source}
              action={
                <Link
                  href="/candidates"
                  onClick={() => {
                    setJobFilter("all");
                    selectCandidate(c.id);
                  }}
                  className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg"
                >
                  View <ArrowRight className="size-3" />
                </Link>
              }
            />
          ))}
          {r.applicants.map((a) => (
            <PersonRow
              key={a.id}
              name={a.name}
              sub={a.headline}
              status={<span className="text-fg-faint">Applied · to review</span>}
              meta={<FitPill fit={a.fit} />}
              action={
                <Link
                  href="/applicants"
                  onClick={() => {
                    setJobFilter("all");
                    selectApplicant(a.id);
                  }}
                  className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg"
                >
                  Screen <ArrowRight className="size-3" />
                </Link>
              }
            />
          ))}
        </ul>
      )}
    </article>
  );
}

function PersonRow({ name, sub, status, meta, action }: { name: string; sub: string; status: React.ReactNode; meta: React.ReactNode; action: React.ReactNode }) {
  return (
    <li className="grid items-center gap-x-4 gap-y-1.5 px-5 py-3 text-[12px] @xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-[13px] text-fg">{name}</div>
          <div className="truncate text-fg-faint">{sub}</div>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pl-9 @xl:pl-0">
        {status}
        <span className="text-fg-faint">{meta}</span>
      </div>
      <div className="flex items-center gap-3 pl-9 @xl:justify-end @xl:pl-0">{action}</div>
    </li>
  );
}
