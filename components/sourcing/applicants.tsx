"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Minus, RefreshCw, UserCheck, UserX } from "lucide-react";
import { clientIdFor } from "@/lib/agency";
import { useDesk } from "@/lib/store";
import { ago } from "@/lib/time";
import type { Applicant } from "@/lib/types";
import { AmaraByline } from "../ai/stream";
import { Page, PageHeader } from "../ui/page-header";
import { Avatar, Button, Kbd, cx } from "../ui/primitives";
import { FIT_RANK, FitPill, JobSelect } from "./parts";

type Status = Applicant["status"];

const TABS: { id: Status; label: string }[] = [
  { id: "new", label: "To review" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "rejected", label: "Declined" },
];

export function ApplicantsPage() {
  const { applicants, jobs, jobFilter, setJobFilter, selectedApplicantId, selectApplicant, syncing, syncApplicants } = useDesk();
  const [tab, setTab] = useState<Status>("new");

  const list = applicants
    .filter((a) => a.status === tab && (jobFilter === "all" || a.jobId === jobFilter))
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || FIT_RANK[a.fit] - FIT_RANK[b.fit] || b.at - a.at);
  const selected = list.find((a) => a.id === selectedApplicantId) ?? list[0];
  const counts = Object.fromEntries(TABS.map((t) => [t.id, applicants.filter((a) => a.status === t.id && (jobFilter === "all" || a.jobId === jobFilter)).length]));

  return (
    <Page wide>
      <PageHeader
        eyebrow="Applicants"
        title="Every application, screened."
        actions={
          <Button variant="primary" onClick={syncApplicants} disabled={syncing}>
            {syncing ? <span className="amara-orb size-2.5 rounded-full" /> : <RefreshCw className="size-3.5" />}
            {syncing ? "Syncing Seek, LinkedIn, email…" : "Sync applications"}
          </Button>
        }
      >
        Applications from your job ads and inbox land here. Amara reads each CV against the brief. You decide who goes into your candidate pool,
        and anyone you decline gets an honest update.
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="tablist" aria-label="Status">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cx("flex h-7 items-center gap-2 rounded-md px-3 text-[12px] transition-colors", tab === t.id ? "bg-raised text-fg" : "text-fg-muted hover:text-fg")}
            >
              {t.label}
              <span className="font-mono text-[10px] text-fg-faint num">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <JobSelect value={jobFilter} onChange={setJobFilter} />
        {tab === "new" && list.length > 0 && (
          <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-fg-faint lg:inline-flex">
            <Kbd>S</Kbd> shortlist <Kbd>D</Kbd> decline <Kbd>J</Kbd>
            <Kbd>K</Kbd> move
          </span>
        )}
      </div>

      {!selected ? (
        <div className="grid place-items-center rounded-2xl border border-line bg-ink-sunken px-6 py-20 text-center">
          <h2 className="font-serif text-[26px]">{tab === "new" ? "You're through the pile." : "Nobody here yet."}</h2>
          <p className="mt-2 max-w-[44ch] text-[13px] text-fg-muted">
            {tab === "new" ? "Sync to pull in new applications, or check your candidate pool." : "Decisions you make on applicants show up here."}
          </p>
          <div className="mt-6 flex gap-2">
            {tab === "new" && (
              <Button onClick={syncApplicants} disabled={syncing}>
                <RefreshCw className="size-3.5" /> Sync now
              </Button>
            )}
            <Link href="/candidates" className="inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] text-fg-muted hover:bg-hover hover:text-fg">
              Candidate pool
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-2xl border border-line bg-ink-sunken lg:grid-cols-[340px_minmax(0,1fr)]">
          <ul data-tour="applicant-list" className="max-h-[70vh] overflow-y-auto border-b border-line p-2 lg:border-r lg:border-b-0" aria-label="Applicants">
            {list.map((a) => {
              const job = jobs.find((j) => j.id === a.jobId);
              const active = a.id === selected.id;
              return (
                <li key={a.id} className={cx(a.isNew && "animate-rise")}>
                  <button
                    onClick={() => selectApplicant(a.id)}
                    aria-current={active ? "true" : undefined}
                    className={cx("flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors", active ? "bg-raised" : "hover:bg-surface")}
                  >
                    <Avatar name={a.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={cx("flex items-center gap-1.5 truncate text-[13px]", active ? "text-fg" : "text-fg-muted")}>
                          {a.isNew && <span className="size-1.5 shrink-0 rounded-full bg-amara-soft" title="New" />}
                          {a.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-fg-faint">{ago(a.at)}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-fg-faint">
                        {job?.title} · {job?.client}
                      </div>
                      <FitPill fit={a.fit} className="mt-1.5" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <Detail key={selected.id} applicant={selected} list={list} />
        </div>
      )}
    </Page>
  );
}

function Detail({ applicant: a, list }: { applicant: Applicant; list: Applicant[] }) {
  const { jobs, decideApplicant, selectApplicant, notify, me } = useDesk();
  const job = jobs.find((j) => j.id === a.jobId);
  const index = list.findIndex((x) => x.id === a.id);
  const canDecide = a.status === "new";

  const decide = (decision: "shortlist" | "reject") => {
    if (!canDecide) return;
    const next = list[index + 1] ?? list[index - 1];
    decideApplicant(a.id, decision);
    selectApplicant(next && next.id !== a.id ? next.id : null);
    notify(decision === "shortlist" ? `${a.firstName} is in your candidate pool` : `Declined. An honest update for ${a.firstName} is waiting in Follow-ups`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey) return;
      const key = e.key.toLowerCase();
      if (key === "s") decide("shortlist");
      if (key === "d") decide("reject");
      if (key === "j" && list[index + 1]) selectApplicant(list[index + 1].id);
      if (key === "k" && list[index - 1]) selectApplicant(list[index - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className="min-w-0 bg-ink" aria-label={a.name}>
      <header className="flex flex-wrap items-start gap-4 border-b border-line px-6 py-5">
        <Avatar name={a.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[24px] leading-tight tracking-tight">{a.name}</h2>
          <p className="mt-1 text-[13px] text-fg-muted">{a.headline}</p>
          <p className="mt-1 text-[12px] text-fg-faint">
            {a.location} · Applied via {a.source} · {ago(a.at)}
          </p>
        </div>
        {job && (
          <Link
            href={`/clients/${clientIdFor(job.client)}`}
            className="rounded-lg border border-line px-3 py-2 text-right text-[12px] transition-colors hover:border-line-strong"
          >
            <div className="text-fg">{job.title}</div>
            <div className="text-fg-faint">{job.client}</div>
          </Link>
        )}
      </header>

      <div className="space-y-6 px-6 py-6">
        <div data-tour="screening" className="amara-edge rounded-xl bg-[linear-gradient(180deg,rgb(139_92_246/0.07),transparent_60%)] p-5">
          <div className="flex items-center justify-between gap-3">
            <AmaraByline>Screening</AmaraByline>
            <FitPill fit={a.fit} />
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-fg">{a.summary}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] tracking-[0.06em] text-fg-faint uppercase">Matches the brief</div>
              <ul className="space-y-1.5">
                {a.matches.map((m) => (
                  <li key={m} className="flex gap-2 text-[13px] text-fg-muted">
                    <Check className="mt-[3px] size-3.5 shrink-0 text-good" /> {m}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-[11px] tracking-[0.06em] text-fg-faint uppercase">Gaps</div>
              {a.gaps.length ? (
                <ul className="space-y-1.5">
                  {a.gaps.map((g) => (
                    <li key={g} className="flex gap-2 text-[13px] text-fg-muted">
                      <Minus className="mt-[3px] size-3.5 shrink-0 text-warm" /> {g}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-fg-faint">None against the brief.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-[11px] tracking-[0.08em] text-fg-faint uppercase">Experience</h3>
          <ul className="space-y-1.5">
            {a.experience.map((x) => (
              <li key={x} className="text-[13px] text-fg-muted">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer data-tour="applicant-decide" className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
        {canDecide ? (
          <>
            <Button variant="primary" onClick={() => decide("shortlist")}>
              <UserCheck className="size-3.5" /> Shortlist
            </Button>
            <Button onClick={() => decide("reject")}>
              <UserX className="size-3.5" /> Decline
            </Button>
            <span className="ml-auto text-[11px] text-fg-faint">Declining queues an honest update in Follow-ups. Logged as {me.firstName}.</span>
          </>
        ) : (
          <span className="text-[12px] text-fg-faint">
            {a.status === "shortlisted" ? (
              <>
                In your{" "}
                <Link href="/candidates" className="text-fg-muted underline underline-offset-4 hover:text-fg">
                  candidate pool
                </Link>
                .
              </>
            ) : (
              "Declined. Their update is in Follow-ups."
            )}
          </span>
        )}
      </footer>
    </section>
  );
}
