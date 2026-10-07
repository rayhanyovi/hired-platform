"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Minus, Search, Send } from "lucide-react";
import { clientIdFor } from "@/lib/agency";
import { memberName, useDesk } from "@/lib/store";
import { ago } from "@/lib/time";
import type { Candidate } from "@/lib/types";
import { inputClass } from "../ui/modal";
import { Page, PageHeader } from "../ui/page-header";
import { Avatar, Button, cx } from "../ui/primitives";
import { FitPill, JobSelect } from "./parts";

type Tab = "all" | Candidate["status"];

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pool", label: "Shortlisted" },
  { id: "contacted", label: "Contacted" },
  { id: "pipeline", label: "In pipeline" },
];

const STATUS_LABEL: Record<Candidate["status"], string> = {
  pool: "Shortlisted",
  contacted: "Contacted",
  pipeline: "In pipeline",
};

export function CandidatesPage() {
  const { candidates, jobFilter, setJobFilter } = useDesk();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const scoped = candidates.filter((c) => jobFilter === "all" || c.jobId === jobFilter);
  const rows = scoped
    .filter((c) => tab === "all" || c.status === tab)
    .filter((c) => !query || `${c.name} ${c.headline} ${c.location}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.at - a.at);

  return (
    <Page wide>
      <PageHeader
        eyebrow="Candidates"
        title="Your shortlist, across every client."
        actions={
          <Link
            href="/applicants"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-raised px-3.5 text-[13px] font-medium text-fg transition-colors hover:bg-hover"
          >
            Review applicants <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        Everyone who made it through screening, plus people you&apos;ve sourced yourself. Reach out, then add the right ones to the pipeline.
      </PageHeader>

      <div data-tour="candidate-filters" className="mb-4 flex flex-wrap items-center gap-2">
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
              <span className="font-mono text-[10px] text-fg-faint num">{t.id === "all" ? scoped.length : scoped.filter((c) => c.status === t.id).length}</span>
            </button>
          ))}
        </div>
        <JobSelect value={jobFilter} onChange={setJobFilter} />
        <div className="relative ml-auto w-full sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search candidates" aria-label="Search candidates" className={cx(inputClass, "h-8 pl-8 text-[12px]")} />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-[13px] text-fg-faint">No candidates match.</p>
      ) : (
        <ul data-tour="candidate-list" className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {rows.map((c) => (
            <CandidateRow key={c.id} candidate={c} />
          ))}
        </ul>
      )}
    </Page>
  );
}

function CandidateRow({ candidate: c }: { candidate: Candidate }) {
  const { jobs, me, markContacted, addToPipeline, notify, selectedCandidateId, selectCandidate } = useDesk();
  const router = useRouter();
  const job = jobs.find((j) => j.id === c.jobId);
  const open = selectedCandidateId === c.id;
  const handOff = me.role === "resourcer";

  return (
    <li className={cx(open && "bg-raised/60")}>
      <div className="grid items-center gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_130px_230px]">
        <button onClick={() => selectCandidate(open ? null : c.id)} aria-expanded={open} className="flex min-w-0 items-center gap-3 text-left">
          <Avatar name={c.name} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[14px] text-fg">
              <span className="truncate">{c.name}</span>
              <ChevronDown className={cx("size-3.5 shrink-0 text-fg-faint transition-transform", open && "rotate-180")} />
            </span>
            <span className="block truncate text-[12px] text-fg-faint">{c.headline}</span>
          </span>
        </button>

        <div className="min-w-0 text-[12px]">
          {job ? (
            <Link href={`/clients/${clientIdFor(job.client)}`} className="block truncate text-fg-muted hover:text-fg">
              {job.title} <span className="text-fg-faint">· {job.client}</span>
            </Link>
          ) : (
            <span className="text-fg-faint">No role yet</span>
          )}
          <div className="mt-1 flex items-center gap-2">{c.fit && <FitPill fit={c.fit} />}</div>
        </div>

        <div className="text-[12px]">
          <div className={cx(c.status === "pipeline" ? "text-fg" : "text-fg-muted")}>{STATUS_LABEL[c.status]}</div>
          <div className="text-fg-faint">
            {c.source} · {ago(c.at)}
          </div>
        </div>

        <div className="flex gap-2 md:justify-end">
          {c.status === "pool" && (
            <Button
              size="sm"
              onClick={() => {
                markContacted(c.id);
                notify(`Logged outreach to ${c.name}`);
              }}
            >
              <Send className="size-3.5" /> Reach out
            </Button>
          )}
          {c.status !== "pipeline" ? (
            <Button
              size="sm"
              variant="primary"
              disabled={!job}
              onClick={() => {
                const id = addToPipeline(c.id);
                if (id) {
                  notify(handOff ? `${c.name} handed to Sam in the pipeline` : `${c.name} added to the pipeline`);
                  router.push(`/deals/${id}`);
                }
              }}
            >
              {handOff ? "Hand off to pipeline" : "Add to pipeline"}
            </Button>
          ) : (
            c.dealId && (
              <Link
                href={`/deals/${c.dealId}`}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-line-strong bg-raised px-2.5 text-xs font-medium text-fg transition-colors hover:bg-hover"
              >
                Open deal <ArrowRight className="size-3.5" />
              </Link>
            )
          )}
        </div>
      </div>

      {open && (
        <div className="grid animate-rise gap-5 border-t border-line px-4 py-4 pl-[60px] text-[13px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <p className="leading-relaxed text-fg-muted">{c.summary ?? "No notes yet."}</p>
            <p className="mt-2 text-[11px] text-fg-faint">
              {c.location} · Added by {memberName(c.addedBy)}
            </p>
          </div>
          <ul className="space-y-1.5">
            {(c.matches ?? []).map((m) => (
              <li key={m} className="flex gap-2 text-fg-muted">
                <Check className="mt-[3px] size-3.5 shrink-0 text-good" /> {m}
              </li>
            ))}
            {(c.gaps ?? []).map((g) => (
              <li key={g} className="flex gap-2 text-fg-muted">
                <Minus className="mt-[3px] size-3.5 shrink-0 text-warm" /> {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
