/**
 * Global search across the desk. Plain matching for names and titles, plus
 * "lenses": phrases Amara understands (e.g. "going cold", "unsigned") that
 * return the records they describe even when no name matches.
 */
import { rolesFor } from "./clients";
import { FOLLOW_UP_LABEL, STAGES } from "./data";
import { money, needsAttention, riskValue } from "./deal";
import { DOC_KIND_LABEL, tobStatus } from "./documents";
import { LESSONS } from "./learnings";
import type { DeskState } from "./store";

export type ResultKind = "page" | "deal" | "client" | "role" | "candidate" | "applicant" | "followup" | "document" | "lesson" | "member";

export type Result = {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  href: string;
  /** Extra words that should match, but aren't shown. */
  keywords?: string;
  /** Runs before navigating, e.g. selecting the record on its list page. */
  select?: (d: DeskState) => void;
};

export const KIND_LABEL: Record<ResultKind, string> = {
  page: "Pages",
  deal: "Deals",
  client: "Clients",
  role: "Roles",
  candidate: "Candidates",
  applicant: "Applicants",
  followup: "Follow-ups",
  document: "Documents",
  lesson: "Learnings",
  member: "Team",
};

const PAGES: [string, string, string][] = [
  ["Home", "/", "overview analytics metrics tasks invoices leaderboard"],
  ["Chat", "/chat", "amara conversation ask"],
  ["Clients", "/clients", "companies prospects"],
  ["Applicants", "/applicants", "applications screening sync"],
  ["Candidates", "/candidates", "shortlist pool"],
  ["Pipeline", "/pipeline", "deals board stages"],
  ["Follow-ups", "/follow-ups", "updates ghosting rejections"],
  ["Documents", "/documents", "terms tob invoices contracts offer letters"],
  ["Team", "/team", "members roles approvals permissions"],
  ["Audit log", "/audit", "events history export"],
  ["Learnings", "/learnings", "lessons courses quizzes"],
];

export function buildIndex(d: DeskState): Result[] {
  const stageLabel = (s: string) => STAGES.find((x) => x.id === s)?.label ?? s;
  return [
    ...PAGES.map(([title, href, keywords]): Result => ({ id: `page:${href}`, kind: "page", title, subtitle: "Page", href, keywords })),
    ...d.deals.map(
      (x): Result => ({
        id: `deal:${x.id}`,
        kind: "deal",
        title: x.candidate.name,
        subtitle: `${x.role.title} · ${x.role.client} · ${stageLabel(x.stage)}`,
        href: `/deals/${x.id}`,
        keywords: `${x.candidate.title} ${x.candidate.currentCompany} ${x.candidate.location}`,
      }),
    ),
    ...d.clients.map(
      (c): Result => ({
        id: `client:${c.id}`,
        kind: "client",
        title: c.name,
        subtitle: `${c.status === "active" ? "Active client" : "Prospect"} · ${c.industry} · ${c.location}`,
        href: `/clients/${c.id}`,
        keywords: `${c.contact.name} ${c.contact.title}`,
      }),
    ),
    ...d.jobs.map(
      (j): Result => ({
        id: `role:${j.id}`,
        kind: "role",
        title: j.title,
        subtitle: `${j.client} · ${money(j.salary, { compact: true })} · ${j.status === "filled" ? "Filled" : "Open"}`,
        href: `/clients/${d.clients.find((c) => c.name === j.client)?.id ?? ""}#${j.id}`,
        keywords: j.location,
      }),
    ),
    ...d.candidates.map(
      (c): Result => ({
        id: `candidate:${c.id}`,
        kind: "candidate",
        title: c.name,
        subtitle: `${c.headline} · ${c.status === "pipeline" ? "In pipeline" : c.status === "contacted" ? "Contacted" : "Shortlisted"}`,
        href: "/candidates",
        keywords: c.location,
        select: (s) => {
          s.setJobFilter("all");
          s.selectCandidate(c.id);
        },
      }),
    ),
    ...d.applicants.map(
      (a): Result => ({
        id: `applicant:${a.id}`,
        kind: "applicant",
        title: a.name,
        subtitle: `${a.headline} · applied for ${d.jobs.find((j) => j.id === a.jobId)?.title ?? "a role"}`,
        href: "/applicants",
        keywords: `${a.location} ${a.source}`,
        select: (s) => {
          s.setJobFilter("all");
          s.selectApplicant(a.id);
        },
      }),
    ),
    ...d.followUps.map(
      (f): Result => ({
        id: `followup:${f.id}`,
        kind: "followup",
        title: f.name,
        subtitle: `${FOLLOW_UP_LABEL[f.kind]} · waiting ${f.daysWaiting}d`,
        href: "/follow-ups",
        keywords: `${f.role} ${f.client}`,
        select: (s) => s.selectFollowUp(f.id),
      }),
    ),
    ...d.documents.map(
      (x): Result => ({
        id: `document:${x.id}`,
        kind: "document",
        title: x.title,
        subtitle: `${DOC_KIND_LABEL[x.kind]} · ${x.client}`,
        href: "/documents",
        keywords: x.fileName,
      }),
    ),
    ...LESSONS.map((l): Result => ({ id: `lesson:${l.id}`, kind: "lesson", title: l.title, subtitle: `Lesson · ${l.minutes} min`, href: `/learnings/${l.id}` })),
    ...d.members.map((m): Result => ({ id: `member:${m.id}`, kind: "member", title: m.name, subtitle: `${m.role} · ${m.email}`, href: "/team" })),
  ];
}

/** Rank by how well the query matches: whole title, title start, word start, anywhere. */
export function search(index: Result[], query: string, perKind = 5): Result[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = index
    .map((r) => {
      const title = r.title.toLowerCase();
      const rest = `${r.subtitle} ${r.keywords ?? ""}`.toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (title.split(/[\s·—-]+/).some((w) => w.startsWith(q))) score = 60;
      else if (title.includes(q)) score = 40;
      else if (rest.split(/[\s·—-]+/).some((w) => w.startsWith(q))) score = 25;
      else if (rest.includes(q)) score = 15;
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const counts = new Map<ResultKind, number>();
  return scored
    .filter(({ r }) => {
      const n = counts.get(r.kind) ?? 0;
      counts.set(r.kind, n + 1);
      return n < perKind;
    })
    .map((x) => x.r);
}

export type Lens = { label: string; results: Result[] };

/** Phrases Amara understands, so "deals going cold" finds deals rather than the words. */
export function lens(query: string, d: DeskState, index: Result[]): Lens | null {
  const q = query.toLowerCase();
  const pick = (ids: string[]) => ids.map((id) => index.find((r) => r.id === id)).filter((r): r is Result => !!r);

  if (/(cold|cooling|at risk|stale|stuck)/.test(q)) {
    const deals = d.deals.filter(needsAttention).sort((a, b) => riskValue(b) - riskValue(a));
    return { label: "Deals going cold", results: pick(deals.map((x) => `deal:${x.id}`)) };
  }
  if (/(overdue|waiting|ghost|no update)/.test(q)) {
    return { label: "People waiting on you", results: pick([...d.followUps].sort((a, b) => b.daysWaiting - a.daysWaiting).map((f) => `followup:${f.id}`)) };
  }
  if (/(strong fit|best applicant|top applicant|to review)/.test(q)) {
    return { label: "Strong applicants to review", results: pick(d.applicants.filter((a) => a.status === "new" && a.fit === "strong").map((a) => `applicant:${a.id}`)) };
  }
  if (/(unsigned|not signed|no tob|without terms)/.test(q)) {
    return { label: "Clients without signed terms", results: pick(d.clients.filter((c) => tobStatus(c.name, d.documents) !== "signed").map((c) => `client:${c.id}`)) };
  }
  if (/(approval|approve|pending)/.test(q)) {
    return { label: "Waiting for approval", results: pick(d.approvals.filter((a) => a.status === "pending").map((a) => `deal:${a.dealId}`)) };
  }
  if (/(no candidates|empty role|nobody)/.test(q)) {
    const empty = d.clients.flatMap((c) =>
      rolesFor(c.name, d)
        .filter((r) => r.job.status === "open" && r.live.length + r.pool.length + r.applicants.length === 0)
        .map((r) => `role:${r.job.id}`),
    );
    return { label: "Open roles with no candidates", results: pick(empty) };
  }
  const offer = q.match(/(offer|final|interview|submitted|sourced|placed)/)?.[1];
  if (offer && /(deal|stage|at|in)/.test(q)) {
    const stage = { offer: "offer", final: "final", interview: "interview", submitted: "submitted", sourced: "sourced", placed: "placed" }[offer];
    return { label: `Deals at ${STAGES.find((s) => s.id === stage)?.label}`, results: pick(d.deals.filter((x) => x.stage === stage).map((x) => `deal:${x.id}`)) };
  }
  return null;
}

/** Questions go to Amara first; names go to the results first. */
export const looksLikeQuestion = (q: string) => /\?$|^(who|what|which|how|why|when|where|should|can|is|are|do|does|draft|write|summari[sz]e|prep|explain)\b/i.test(q.trim());
