"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  APPLICANTS,
  APPROVALS,
  CANDIDATES,
  CLIENTS,
  COMMENTS,
  DEFAULT_RULES,
  DOCUMENTS,
  INCOMING_APPLICANTS,
  JOBS,
  MEMBERS,
  seedEvents,
} from "./agency";
import { DEALS, FOLLOW_UPS, STAGES } from "./data";
import { money } from "./deal";
import { INITIAL_COMPLETED } from "./learnings";
import { liveNow } from "./time";
import type {
  AgencyDoc,
  Applicant,
  Approval,
  ApprovalRules,
  AuditEvent,
  Candidate,
  Client,
  Comment,
  Deal,
  Job,
  Member,
  Stage,
  TimelineEvent,
} from "./types";

type Toast = { id: number; text: string };
type NewEvent = Omit<AuditEvent, "id" | "at" | "actorId"> & { actorId?: string };

const DEAL_ACTION: Record<TimelineEvent["kind"], string> = {
  call: "deal.call_logged",
  email: "deal.email_logged",
  stage: "deal.stage_changed",
  client: "deal.client_update",
  note: "deal.note_added",
};

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

function useDeskState() {
  /* UI */
  const [toast, setToast] = useState<Toast | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [openDealId, openDeal] = useState<string | null>(null);
  const [selectedFollowUpId, selectFollowUp] = useState<string | null>(null);
  /** A request from elsewhere (e.g. a deal page) to open the generator for a deal. */
  const [docRequest, setDocRequest] = useState<{ dealId: string; n: number } | null>(null);
  const setDocDealId = useCallback((dealId: string) => setDocRequest((r) => ({ dealId, n: (r?.n ?? 0) + 1 })), []);
  const [selectedApplicantId, selectApplicant] = useState<string | null>(null);
  const [selectedCandidateId, selectCandidate] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* Data */
  const [currentUserId, setCurrentUser] = useState("sam");
  const [deals, setDeals] = useState(DEALS);
  const [followUps, setFollowUps] = useState(FOLLOW_UPS);
  const [sentCount, setSentCount] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(INITIAL_COMPLETED);
  const [events, setEvents] = useState<AuditEvent[]>(seedEvents);
  const [comments, setComments] = useState<Comment[]>(COMMENTS);
  const [approvals, setApprovals] = useState<Approval[]>(APPROVALS);
  const [documents, setDocuments] = useState<AgencyDoc[]>(DOCUMENTS);
  const [rules, setRules] = useState<ApprovalRules>(DEFAULT_RULES);
  const [jobs, setJobs] = useState<Job[]>(JOBS);
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [applicants, setApplicants] = useState<Applicant[]>(APPLICANTS);
  const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES);
  const [syncing, setSyncing] = useState(false);
  const synced = useRef(false);

  const me: Member = MEMBERS.find((m) => m.id === currentUserId) ?? MEMBERS[0];
  const isOwner = me.role === "owner";

  const notify = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /** The single write path for history. Every meaningful action goes through here. */
  const log = useCallback(
    (e: NewEvent) => {
      setEvents((prev) => [{ id: uid("ev"), at: liveNow(), actorId: e.actorId ?? currentUserId, ...e }, ...prev]);
    },
    [currentUserId],
  );

  const dealName = useCallback((id: string) => deals.find((d) => d.id === id)?.candidate.name ?? "a deal", [deals]);

  /* ── Deals ── */

  const logTouch = useCallback(
    (dealId: string, event: Omit<TimelineEvent, "hoursAgo">) => {
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, hoursIdle: 0 } : d)));
      log({ action: DEAL_ACTION[event.kind], summary: event.text, kind: event.kind, dealId });
    },
    [log],
  );

  const moveTo = useCallback(
    (dealId: string, stage: Stage) => {
      const label = STAGES.find((s) => s.id === stage)?.label ?? stage;
      setDeals((prev) => prev.map((d) => (d.id !== dealId || d.stage === stage ? d : { ...d, stage, hoursIdle: 0 })));
      log({ action: "deal.stage_changed", summary: `Moved ${dealName(dealId)} to ${label}`, kind: "stage", dealId });
    },
    [log, dealName],
  );

  const advance = useCallback(
    (dealId: string) => {
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return;
      const i = STAGES.findIndex((s) => s.id === deal.stage);
      moveTo(dealId, STAGES[Math.min(i + 1, STAGES.length - 1)].id);
    },
    [deals, moveTo],
  );

  /* ── Comments & approvals ── */

  const addComment = useCallback(
    (dealId: string, body: string, approvalId?: string) => {
      setComments((prev) => [...prev, { id: uid("c"), dealId, authorId: currentUserId, at: liveNow(), body, approvalId }]);
      if (!approvalId) log({ action: "comment.added", summary: `Commented on ${dealName(dealId)}`, kind: "comment", dealId });
    },
    [currentUserId, log, dealName],
  );

  const requestApproval = useCallback(
    (a: Omit<Approval, "id" | "at" | "requestedBy" | "status">, note: string) => {
      const id = uid("apr");
      setApprovals((prev) => [...prev, { ...a, id, at: liveNow(), requestedBy: currentUserId, status: "pending" }]);
      addComment(a.dealId, note, id);
      log({ action: "approval.requested", summary: `Requested approval: ${a.title} on ${dealName(a.dealId)}`, kind: "approval", dealId: a.dealId });
      return id;
    },
    [currentUserId, addComment, log, dealName],
  );

  /** Owners change fees directly; anyone else under the floor goes through approval. */
  const changeFee = useCallback(
    (dealId: string, pct: number, reason: string): "applied" | "requested" => {
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return "applied";
      if (rules.feeFloorEnabled && pct < rules.feeFloorPct && !isOwner) {
        requestApproval(
          {
            dealId,
            kind: "fee",
            title: `Change fee to ${Math.round(pct * 100)}%`,
            detail: reason || `Below the ${Math.round(rules.feeFloorPct * 100)}% floor.`,
            feePct: pct,
          },
          reason || `Requesting a ${Math.round(pct * 100)}% fee on this one.`,
        );
        return "requested";
      }
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, feePct: pct } : d)));
      log({
        action: "deal.fee_changed",
        summary: `Changed fee on ${deal.candidate.name} from ${Math.round(deal.feePct * 100)}% to ${Math.round(pct * 100)}%`,
        kind: "note",
        dealId,
      });
      return "applied";
    },
    [deals, rules, isOwner, requestApproval, log],
  );

  const decideApproval = useCallback(
    (id: string, approve: boolean) => {
      const a = approvals.find((x) => x.id === id);
      if (!a || a.status !== "pending" || !isOwner) return;
      setApprovals((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: approve ? "approved" : "rejected", decidedBy: currentUserId, decidedAt: liveNow() } : x)),
      );
      if (approve && a.kind === "fee" && a.feePct !== undefined) {
        setDeals((prev) => prev.map((d) => (d.id === a.dealId ? { ...d, feePct: a.feePct! } : d)));
      }
      if (a.kind === "invoice" && a.documentId) {
        setDocuments((prev) => prev.map((d) => (d.id === a.documentId ? { ...d, status: approve ? "approved" : "draft" } : d)));
      }
      log({
        action: approve ? "approval.approved" : "approval.rejected",
        summary: `${approve ? "Approved" : "Rejected"}: ${a.title} on ${dealName(a.dealId)}`,
        kind: "approval",
        dealId: a.dealId,
      });
    },
    [approvals, isOwner, currentUserId, log, dealName],
  );

  /* ── Documents ── */

  const addDocument = useCallback(
    (doc: Omit<AgencyDoc, "id" | "at" | "byId">) => {
      const id = uid("doc");
      const needsApproval = doc.kind === "invoice" && rules.invoiceApproval && !isOwner;
      const status = needsApproval ? "pending-approval" : doc.status;
      setDocuments((prev) => [{ ...doc, id, status, at: liveNow(), byId: currentUserId }, ...prev]);
      log({
        action: doc.direction === "generated" ? "document.generated" : "document.received",
        summary: doc.direction === "generated" ? `Generated ${doc.title}` : `Logged ${doc.title} from ${doc.client}`,
        kind: "document",
        dealId: doc.dealId,
      });
      if (needsApproval && doc.dealId) {
        requestApproval(
          { dealId: doc.dealId, kind: "invoice", title: `Send ${doc.title.split(" — ")[0]}`, detail: `${money(doc.amount ?? 0)} to ${doc.client}.`, documentId: id },
          `Invoice ready for ${doc.client}. Needs your sign-off before it goes out.`,
        );
      }
      return { id, status };
    },
    [rules.invoiceApproval, isOwner, currentUserId, log, requestApproval],
  );

  const setDocStatus = useCallback(
    (id: string, status: AgencyDoc["status"]) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
      log({ action: "document.status_changed", summary: `Marked ${doc.title} as ${status}`, kind: "document", dealId: doc.dealId });
    },
    [documents, log],
  );

  /* ── Team ── */

  const updateRules = useCallback(
    (next: Partial<ApprovalRules>, summary: string) => {
      if (!isOwner) return;
      setRules((prev) => ({ ...prev, ...next }));
      log({ action: "team.rules_changed", summary, kind: "team" });
    },
    [isOwner, log],
  );

  /* ── Follow-ups ── */

  const markSent = useCallback(
    (followUpId: string) => {
      const f = followUps.find((x) => x.id === followUpId);
      setFollowUps((prev) => prev.filter((x) => x.id !== followUpId));
      setSentCount((n) => n + 1);
      if (f) log({ action: "followup.sent", summary: `Sent an update to ${f.name} (${f.role})`, kind: "email", dealId: f.dealId });
    },
    [followUps, log],
  );

  /* ── Sourcing ── */

  const postJob = useCallback(
    (job: Omit<Job, "id" | "postedAt" | "status">) => {
      setJobs((prev) => [{ ...job, id: uid("job"), postedAt: liveNow(), status: "open" }, ...prev]);
      log({ action: "job.posted", summary: `Posted ${job.title} (${job.client}) to ${job.channels.join(", ")}`, kind: "sourcing" });
    },
    [log],
  );

  /** Simulates pulling new applications from job boards and the inbox. */
  const syncApplicants = useCallback(() => {
    if (syncing) return;
    setSyncing(true);
    if (synced.current) {
      setTimeout(() => {
        setSyncing(false);
        notify("Up to date. No new applications.");
      }, 1200);
      return;
    }
    synced.current = true;
    const batch = INCOMING_APPLICANTS.map((a) => ({ ...a, isNew: true }));
    batch.forEach((a, i) => {
      setTimeout(() => {
        setApplicants((prev) => [{ ...a, at: liveNow() }, ...prev]);
        if (i === batch.length - 1) {
          setSyncing(false);
          notify(`${batch.length} new applications. Amara has screened them.`);
          log({ action: "sourcing.synced", summary: `Synced ${batch.length} applications from Seek, LinkedIn and email`, kind: "sourcing", actorId: "system" });
          log({ action: "amara.screened", summary: `Screened ${batch.length} new applicants`, kind: "system", actorId: "amara" });
        }
      }, 1100 + i * 650);
    });
  }, [syncing, notify, log]);

  const decideApplicant = useCallback(
    (id: string, decision: "shortlist" | "reject") => {
      const a = applicants.find((x) => x.id === id);
      if (!a) return;
      const job = jobs.find((j) => j.id === a.jobId);
      setApplicants((prev) => prev.map((x) => (x.id === id ? { ...x, status: decision === "shortlist" ? "shortlisted" : "rejected", isNew: false } : x)));
      if (decision === "shortlist") {
        setCandidates((prev) => [
          {
            id: `c-${a.id}`,
            name: a.name,
            headline: a.headline,
            location: a.location,
            jobId: a.jobId,
            source: a.source,
            at: liveNow(),
            status: "pool",
            fit: a.fit,
            matches: a.matches,
            gaps: a.gaps,
            summary: a.summary,
            addedBy: currentUserId,
          },
          ...prev,
        ]);
        log({ action: "sourcing.shortlisted", summary: `Shortlisted ${a.name} for ${job?.title ?? "a job"}`, kind: "sourcing" });
      } else {
        setFollowUps((prev) => [
          ...prev,
          {
            id: `f-${a.id}`,
            name: a.name,
            firstName: a.firstName,
            role: job?.title ?? "the role",
            client: job?.client ?? "the client",
            kind: "rejection",
            daysWaiting: 0,
            detail: `Applied via ${a.source}. Not progressing: ${a.gaps[0]?.toLowerCase() ?? "not the right fit"}.`,
            context: [`Applied via ${a.source}`, ...a.gaps.map((g) => `Gap: ${g}`), ...a.matches.slice(0, 1).map((m) => `Strength: ${m}`)],
            reason: a.rejectReason,
            reasonShort: a.rejectReason.split(",")[0] + ".",
            positive: a.matches[0] ? `${a.matches[0]} stood out, and I'd like to keep you in mind for the next one.` : "",
          },
        ]);
        log({ action: "sourcing.rejected", summary: `Declined ${a.name} for ${job?.title ?? "a job"}. Update queued in Follow-ups`, kind: "sourcing" });
      }
    },
    [applicants, jobs, currentUserId, log],
  );

  const markContacted = useCallback(
    (candidateId: string) => {
      const c = candidates.find((x) => x.id === candidateId);
      setCandidates((prev) => prev.map((x) => (x.id === candidateId ? { ...x, status: "contacted" } : x)));
      if (c) log({ action: "sourcing.contacted", summary: `Reached out to ${c.name}`, kind: "sourcing" });
    },
    [candidates, log],
  );

  const addToPipeline = useCallback(
    (candidateId: string): string | null => {
      const c = candidates.find((x) => x.id === candidateId);
      const job = jobs.find((j) => j.id === c?.jobId);
      if (!c || !job) return null;
      const id = uid("deal");
      const [title, company = ""] = c.headline.split(" · ");
      const first = c.name.split(" ")[0];
      const owner = me.role === "resourcer" ? "sam" : currentUserId;
      const deal: Deal = {
        id,
        ownerId: owner,
        candidate: { name: c.name, title, currentCompany: company, location: c.location },
        role: { title: job.title, client: job.client, salary: job.salary },
        stage: "sourced",
        feePct: rules.feeFloorPct > 0.2 ? rules.feeFloorPct : 0.2,
        hoursIdle: 0,
        signals: ["Added from the candidate pool", ...(c.matches ?? []).slice(0, 2)],
        read: c.summary ?? `${first} has just been added. Book an intro call while they're warm.`,
        next: {
          label: `Book an intro call with ${first}`,
          kind: "message",
          output: `Hi ${first},\n\nThanks for your interest in the ${job.title} role at ${job.client}. I'd love to walk you through it. Would Monday 12:30 or Tuesday 5pm work for 20 minutes?\n\n${me.firstName}`,
        },
        timeline: [],
      };
      setDeals((prev) => [deal, ...prev]);
      setCandidates((prev) => prev.map((x) => (x.id === candidateId ? { ...x, status: "pipeline", dealId: id } : x)));
      log({ action: "deal.created", summary: `Added ${c.name} to the pipeline for ${job.title} at ${job.client}`, kind: "stage", dealId: id });
      return id;
    },
    [candidates, jobs, me, currentUserId, rules.feeFloorPct, log],
  );

  /* ── Clients ── */

  const addClient = useCallback(
    (c: Omit<Client, "id" | "since">) => {
      const id = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid("client");
      setClients((prev) => [...prev, { ...c, id, since: liveNow() }]);
      log({ action: "client.added", summary: `Added ${c.name} as a ${c.status === "active" ? "client" : "prospect"}`, kind: "client" });
      return id;
    },
    [log],
  );

  const setClientStatus = useCallback(
    (id: string, status: Client["status"]) => {
      const c = clients.find((x) => x.id === id);
      setClients((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      if (c) log({ action: "client.status_changed", summary: `Marked ${c.name} as ${status === "active" ? "an active client" : "a prospect"}`, kind: "client" });
    },
    [clients, log],
  );

  /* ── Learnings ── */

  const setLessonDone = useCallback((lessonId: string, done: boolean) => {
    setCompletedLessons((prev) => (done ? (prev.includes(lessonId) ? prev : [...prev, lessonId]) : prev.filter((id) => id !== lessonId)));
  }, []);

  const exportedAudit = useCallback(
    (format: string, count: number) => log({ action: "audit.exported", summary: `Exported ${count} audit events as ${format.toUpperCase()}`, kind: "system" }),
    [log],
  );

  return {
    // ui
    toast,
    notify,
    paletteOpen,
    setPaletteOpen,
    tourOpen,
    setTourOpen,
    openDealId,
    openDeal,
    selectedFollowUpId,
    selectFollowUp,
    docRequest,
    setDocDealId,
    selectedApplicantId,
    selectApplicant,
    selectedCandidateId,
    selectCandidate,
    jobFilter,
    setJobFilter,
    // team
    me,
    isOwner,
    currentUserId,
    setCurrentUser,
    members: MEMBERS,
    rules,
    updateRules,
    // deals
    deals,
    logTouch,
    moveTo,
    advance,
    changeFee,
    // history
    events,
    log,
    exportedAudit,
    comments,
    addComment,
    approvals,
    decideApproval,
    // documents
    documents,
    addDocument,
    setDocStatus,
    // follow-ups
    followUps,
    sentCount,
    markSent,
    // clients
    clients,
    addClient,
    setClientStatus,
    // sourcing
    jobs,
    postJob,
    applicants,
    syncing,
    syncApplicants,
    decideApplicant,
    candidates,
    markContacted,
    addToPipeline,
    // learnings
    completedLessons,
    setLessonDone,
  };
}

type DeskState = ReturnType<typeof useDeskState>;
const DeskContext = createContext<DeskState | null>(null);

export function DeskProvider({ children }: { children: React.ReactNode }) {
  // The provider only re-renders when its own state changes, so a fresh value
  // object each render is exactly when consumers need to update anyway.
  const state = useDeskState();
  return <DeskContext.Provider value={state}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk must be used inside <DeskProvider>");
  return ctx;
}

export function memberName(id: string) {
  if (id === "amara") return "Amara";
  if (id === "system") return "System";
  return MEMBERS.find((m) => m.id === id)?.name ?? id;
}
