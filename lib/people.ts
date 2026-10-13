/**
 * Candidates, simplified: applicants, the shortlist, the pipeline and the
 * people waiting on an update are one list of people, each with one status.
 * The underlying records (applicant → candidate → deal) stay as they are, so
 * deal pages, approvals and documents keep working; this is the view over them.
 */
import { applicationFor } from "./application";
import { NOW_MS } from "./time";
import type { Applicant, AuditEvent, Candidate, Deal, Fit, FollowUp, Job, Source, Stage, Task } from "./types";

export type PersonStatus = "applied" | "shortlisted" | "contacted" | "screening" | Exclude<Stage, "sourced"> | "on-hold" | "declined" | "not-interested" | "offer-sent" | "interested" | "fell-off";

export type StatusGroup = "review" | "sourcing" | "process" | "placed" | "closed";

export const PERSON_STATUSES: { id: PersonStatus; label: string; group: StatusGroup; dot: string; color: string; description: string }[] = [
  { id: "applied", label: "No Status", group: "review", dot: "bg-fg-faint", color: "#909090", description: "Not yet categorized." },
  { id: "shortlisted", label: "Active", group: "sourcing", dot: "bg-good", color: "#5bcf9c", description: "Actively working with this candidate." },
  { id: "not-interested", label: "Not Interested", group: "closed", dot: "bg-bad", color: "#ec6c6c", description: "Candidate is not interested." },
  { id: "screening", label: "Screening", group: "process", dot: "bg-teal-400", color: "#2dd4bf", description: "Schedule a screening call." },
  { id: "submitted", label: "Submitted", group: "process", dot: "bg-submittals", color: "#f1913d", description: "Configure a client submission." },
  { id: "contacted", label: "LVM", group: "sourcing", dot: "bg-yellow-400", color: "#e3c857", description: "Left a voicemail." },
  { id: "interview", label: "Interviewing", group: "process", dot: "bg-interviews", color: "#b684f4", description: "Schedule an interview." },
  { id: "final", label: "Follow Up", group: "process", dot: "bg-fuchsia-400", color: "#d879e7", description: "Schedule a follow-up." },
  { id: "offer", label: "Offer Expected", group: "process", dot: "bg-pink-400", color: "#ed80bd", description: "Record an expected offer." },
  { id: "offer-sent", label: "Offer Sent", group: "process", dot: "bg-indigo-400", color: "#9184f4", description: "Record an offer document." },
  { id: "interested", label: "Interested", group: "sourcing", dot: "bg-offers", color: "#6ea1f0", description: "Record roles the candidate is interested in." },
  { id: "placed", label: "Placed", group: "placed", dot: "bg-placements", color: "#5bcf9c", description: "Confirm role, start date and optional fee." },
  { id: "fell-off", label: "Fell Off", group: "closed", dot: "bg-rose-500", color: "#dc5679", description: "Record why the candidate fell off." },
  { id: "declined", label: "Not Qualified", group: "closed", dot: "bg-fg-faint", color: "#909090", description: "Not qualified for this role." },
];

export const personStatus = (id: PersonStatus) => PERSON_STATUSES.find((s) => s.id === (id === "on-hold" ? "not-interested" : id))!;

/** Deal stages map one-to-one, except "sourced", which reads as screening. */
export const STATUS_STAGE: Partial<Record<PersonStatus, Stage>> = {
  screening: "sourced",
  submitted: "submitted",
  interview: "interview",
  final: "final",
  offer: "offer",
  placed: "placed",
};
const STAGE_STATUS: Record<Stage, PersonStatus> = { sourced: "screening", submitted: "submitted", interview: "interview", final: "interview", offer: "offer", placed: "placed" };

export type PersonRow = {
  candidateId?: string;
  placementId?: string;
  /** Stable row id: the deal, candidate, applicant or follow-up id. */
  key: string;
  /** Every id this person has had, so tasks, notes and history follow them through the funnel. */
  ids: string[];
  name: string;
  firstName: string;
  headline: string;
  location: string;
  status: PersonStatus;
  job?: Job;
  roleTitle?: string;
  client?: string;
  source?: Source;
  addedAt: number;
  lastTouch: number;
  fit?: Fit;
  matches: string[];
  gaps: string[];
  summary?: string;
  ownerId: string;
  email: string;
  phone: string;
  applicant?: Applicant;
  candidate?: Candidate;
  deal?: Deal;
  followUp?: FollowUp;
};

/** Mock contact details, stable per name. */
function contactFor(name: string) {
  const [first, ...rest] = name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").split(" ");
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const digits = String(h % 100_000_000).padStart(8, "0");
  return { email: `${first}.${rest.join("") || "mail"}@gmail.com`, phone: `04${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}` };
}

type Data = { deals: Deal[]; candidates: Candidate[]; applicants: Applicant[]; jobs: Job[]; followUps: FollowUp[]; candidateProfiles?: Record<string, CandidateProfile>; candidateStatuses?: Record<string, PersonStatus> };

export function peopleRows({ deals, candidates, applicants, jobs, followUps, candidateProfiles, candidateStatuses }: Data): PersonRow[] {
  const rows: PersonRow[] = [];
  const appFor = (c?: Candidate) => (c ? applicants.find((a) => `c-${a.id}` === c.id) : undefined);
  const base = (name: string) => ({ name, firstName: name.split(" ")[0], ...contactFor(name) });

  for (const d of deals) {
    const c = candidates.find((x) => x.dealId === d.id);
    const a = appFor(c);
    const job = jobs.find((j) => j.client === d.role.client && j.title === d.role.title);
    const oldest = Math.max(d.hoursIdle, ...d.timeline.map((t) => t.hoursAgo));
    rows.push({
      ...base(d.candidate.name),
      key: d.id,
      ids: [d.id, c?.id, a?.id].filter(Boolean) as string[],
      headline: `${d.candidate.title} · ${d.candidate.currentCompany}`,
      location: d.candidate.location,
      status: STAGE_STATUS[d.stage],
      job,
      roleTitle: d.role.title,
      client: d.role.client,
      source: c?.source ?? a?.source,
      addedAt: c?.at ?? NOW_MS - oldest * 3_600_000,
      lastTouch: NOW_MS - d.hoursIdle * 3_600_000,
      fit: c?.fit ?? a?.fit,
      matches: c?.matches ?? a?.matches ?? d.signals,
      gaps: c?.gaps ?? a?.gaps ?? [],
      summary: d.read,
      ownerId: d.ownerId,
      applicant: a,
      candidate: c,
      deal: d,
    });
  }

  for (const c of candidates) {
    if (c.status === "pipeline" && deals.some((d) => d.id === c.dealId)) continue;
    const a = appFor(c);
    const job = jobs.find((j) => j.id === c.jobId);
    rows.push({
      ...base(c.name),
      key: c.id,
      ids: [c.id, a?.id].filter(Boolean) as string[],
      headline: c.headline,
      location: c.location,
      status: c.status === "contacted" ? "contacted" : c.status === "declined" ? "declined" : "shortlisted",
      job,
      roleTitle: job?.title,
      client: job?.client,
      source: c.source,
      addedAt: c.at,
      lastTouch: c.at,
      fit: c.fit,
      matches: c.matches ?? [],
      gaps: c.gaps ?? [],
      summary: c.summary,
      ownerId: c.addedBy,
      applicant: a,
      candidate: c,
    });
  }

  for (const a of applicants) {
    if (a.status === "shortlisted" && candidates.some((c) => c.id === `c-${a.id}`)) continue;
    const job = jobs.find((j) => j.id === a.jobId);
    rows.push({
      ...base(a.name),
      key: a.id,
      ids: [a.id],
      headline: a.headline,
      location: a.location,
      status: a.status === "rejected" ? "declined" : a.status === "shortlisted" ? "shortlisted" : "applied",
      job,
      roleTitle: job?.title,
      client: job?.client,
      source: a.source,
      addedAt: a.at,
      lastTouch: a.at,
      fit: a.fit,
      matches: a.matches,
      gaps: a.gaps,
      summary: a.summary,
      ownerId: "mia",
      applicant: a,
    });
  }

  // People waiting on an update attach to their row; anyone else gets one.
  for (const f of followUps) {
    const row = rows.find((r) => r.ids.includes(f.id) || (f.dealId && r.ids.includes(f.dealId)) || r.name === f.name);
    if (row) {
      row.followUp = f;
      continue;
    }
    rows.push({
      ...base(f.name),
      key: `f-${f.id}`,
      ids: [f.id],
      headline: f.client === "—" ? `${f.role} candidate` : `${f.role} · ${f.client}`,
      location: "—",
      status: f.kind === "on-hold" ? "not-interested" : f.kind === "rejection" ? "declined" : "contacted",
      roleTitle: f.role,
      client: f.client === "—" ? undefined : f.client,
      addedAt: NOW_MS - (f.daysWaiting + 14) * 86_400_000,
      lastTouch: NOW_MS - f.daysWaiting * 86_400_000,
      matches: [],
      gaps: [],
      summary: f.detail,
      ownerId: "sam",
      followUp: f,
    });
  }

  return rows.map((row) => {
    const profile = candidateProfiles?.[profileKey(row)];
    return { ...row, ...(profile ? { roleTitle: profile.role, location: profile.location, email: profile.email, phone: profile.phone } : {}), status: candidateStatuses?.[profileKey(row)] ?? row.status };
  });
}

export const STATUS_ORDER = Object.fromEntries(PERSON_STATUSES.map((s, i) => [s.id, i])) as Record<PersonStatus, number>;

/** Which statuses a row can move to from here, and why not when it can't. */
export function canMoveTo(row: PersonRow, to: PersonStatus): true | string {
  if (row.status === to) return true;
  return true;
}

export const tasksFor = (row: Pick<PersonRow, "ids">, tasks: Task[]) => tasks.filter((t) => t.subject && row.ids.includes(t.subject.id));

export const historyFor = (row: Pick<PersonRow, "ids" | "name">, events: AuditEvent[]) =>
  events.filter((e) => (e.dealId && row.ids.includes(e.dealId)) || (e.subjectId && row.ids.includes(e.subjectId)) || e.records?.some((record) => row.ids.includes(record.entityId)) || (!e.dealId && !e.subjectId && !e.records?.length && e.summary.includes(row.name)));


export type CandidateProfile = {
  role: string; location: string; salary: string; currentSalary: string;
  email: string; phone: string; summary: string; experience: string[];
  education: string[]; certifications: string[]; skills: string[];
  languages: string[]; links: string[]; notice: string; workPreference: string;
  workRights: string; collections: string[];
};
export const profileKey = (row: PersonRow) => row.candidateId ?? row.ids.at(-1) ?? row.key;
export function profileFor(row: PersonRow): CandidateProfile {
  const application = row.applicant ? applicationFor(row.applicant, row.job) : undefined;
  const board = application?.kind === "board" ? application : undefined;
  const answer = (pattern: RegExp) => board?.questions.find((q) => pattern.test(q.q))?.a ?? "";
  return {
    role: row.roleTitle ?? "", location: row.location === "—" ? "" : row.location,
    salary: answer(/expected annual base salary/i), currentSalary: "", email: board?.email ?? row.email, phone: board?.phone ?? row.phone,
    summary: "", experience: row.applicant?.experience ?? (row.deal ? [`${row.deal.candidate.title} · ${row.deal.candidate.currentCompany} · Current role (dates not recorded)`] : []), education: [],
    certifications: [], skills: [], languages: [], links: [], notice: answer(/how much notice/i),
    workPreference: row.location.startsWith("Remote") ? "Remote" : "", workRights: answer(/right to work/i), collections: /engineer|developer|sre|data scientist/i.test(row.headline) ? ["Engineering"] : /director|head of|cfo|manager/i.test(row.headline) ? ["Leadership"] : ["Warm network"],
  };
}
