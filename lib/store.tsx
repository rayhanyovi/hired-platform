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
import { EVENTS } from "./calendar";
import { CALLS, templateFor, THREADS, type TemplateKind } from "./communication";
import { personKey } from "./conversations";
import { LABELS, labelPath, SEED_LABELS, withChildren } from "./labels";
import { DEALS, FOLLOW_UPS, STAGES } from "./data";
import { personStatus, STATUS_STAGE, profileFor, profileKey, type CandidateProfile, type PersonRow, type PersonStatus } from "./people";
import { FORM_STATUSES, validatePipeline, scheduledInstant, pipelinePayload, type PipelineDetails } from "./candidate-pipeline";
import { talentRows, seedPlacements, placementRows, planPlacementCreation, type Placement } from "./placements";
import { useBrowserState } from "./use-browser-state";
import { prospectStage } from "./prospects";
import { NOTES_SEED, TASKS_SEED } from "./tasks";
import { money } from "./deal";
import { INITIAL_COMPLETED } from "./learnings";
import { liveNow } from "./time";
import { changedFields, moduleForAction } from "./audit";
import { useTrackedData } from "./use-tracked-data";
import type {
  AgencyDoc,
  Applicant,
  Approval,
  ApprovalRules,
  AuditEvent,
  AuditRecord,
  CalendarEvent,
  CallLog,
  Candidate,
  Client,
  Comment,
  ComposeRequest,
  ConversationFlags,
  Contact,
  Deal,
  Job,
  Label,
  Member,
  MessageChannel,
  Note,
  ProspectStage,
  Stage,
  Subject,
  Task,
  Thread,
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

/** Audit action prefix for each kind of record a right-click action touches. */
const MODULE_PREFIX = { candidate: "candidate", prospect: "prospect", client: "client" } as const;

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** An applicant who made the cut, as a candidate in the pool. */
const candidateFrom = (a: Applicant, addedBy: string, status: Candidate["status"] = "pool"): Candidate => ({
  id: `c-${a.id}`,
  name: a.name,
  headline: a.headline,
  location: a.location,
  jobId: a.jobId,
  source: a.source,
  at: liveNow(),
  status,
  fit: a.fit,
  matches: a.matches,
  gaps: a.gaps,
  summary: a.summary,
  addedBy,
});

function useDeskState() {
  const [pendingCandidateTransition, setPendingCandidateTransition] = useState<{ row: PersonRow; to: PersonStatus } | null>(null);
  const [candidateProfiles, setCandidateProfiles] = useBrowserState<Record<string, CandidateProfile>>("amara:talent-profiles:v2", {});
  const [manualTalent, setManualTalent] = useBrowserState<PersonRow[]>("amara:talent-manual:v2", []);
  const [placements, setPlacements] = useBrowserState<Placement[]>("amara:placements:v2", seedPlacements(talentRows({ deals: DEALS, candidates: CANDIDATES, applicants: APPLICANTS, jobs: JOBS, followUps: FOLLOW_UPS }), CLIENTS));
  const [newPlacementCandidate, setNewPlacementCandidate] = useState<string | null>(null);
  const [creatingPlacements, setCreatingPlacements] = useState(false);
  const [candidateCollections, setCandidateCollections] = useBrowserState<string[]>("amara:talent-collections:v2", ["Engineering", "Leadership", "Warm network"]);
  /* UI */
  const [toast, setToast] = useState<Toast | null>(null);
  /**
   * The Ask HeyAmara drawer, and a question a button handed to it. The drawer
   * opens with that question and related ones as options; nothing is sent until you pick or press Send.
   */
  const [askOpen, setAskOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingAsk, setPendingAsk] = useState<{ text: string; options?: string[]; n: number } | null>(null);
  const ask = useCallback((text: string, options?: string[]) => {
    setAskOpen(true);
    setPendingAsk((p) => ({ text, options, n: (p?.n ?? 0) + 1 }));
  }, [setAskOpen, setPendingAsk]);
  /** Home's demo state: a member who just joined, or an established desk. */
  const [homeStage, setHomeStage] = useState<"day1" | "day30">("day30");
  const [tourOpen, setTourOpen] = useState(false);
  /** Session fallback for Home when browser storage is unavailable; the daily gate lives in Home. */
  const [homeEntranceReady, setHomeEntranceReady] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [openDealId, openDeal] = useState<string | null>(null);
  const [selectedFollowUpId, selectFollowUp] = useState<string | null>(null);
  /** A request from elsewhere (e.g. a deal page) to open the generator for a deal. */
  const [docRequest, setDocRequest] = useState<{ dealId: string; n: number } | null>(null);
  const setDocDealId = useCallback((dealId: string) => setDocRequest((r) => ({ dealId, n: (r?.n ?? 0) + 1 })), []);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [teamView, setTeamView] = useState<"members" | "leaderboard">("members");
  /** A row another page asked Candidates or Prospects to open. */
  const [focusPerson, setFocusPerson] = useState<string | null>(null);
  const [focusProspect, setFocusProspect] = useState<string | null>(null);
  const [selectedThreadId, selectThread] = useState<string | null>(null);
  /** A message another page asked Communication to open, prefilled. Nothing is sent until Send. */
  const [composeRequest, setComposeRequest] = useState<(ComposeRequest & { n: number }) | null>(null);
  const requestCompose = useCallback((r: ComposeRequest) => setComposeRequest((p) => ({ ...r, n: (p?.n ?? 0) + 1 })), []);
  const clearComposeRequest = useCallback(() => setComposeRequest(null), []);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* Data */
  const [currentUserId, setCurrentUser] = useState("sam");
  const pendingAudit = useRef<AuditRecord[]>([]);
  const [deals, setDeals] = useTrackedData(DEALS, "Pipeline", "Deal", pendingAudit, "amara:deals:v2");
  const [followUps, setFollowUps] = useTrackedData(FOLLOW_UPS, "Follow-ups", "Follow-up", pendingAudit, "amara:followups:v2");
  const [sentCount, setSentCount] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(INITIAL_COMPLETED);
  const [completedHomeTasks, setCompletedHomeTasks] = useState<string[]>([]);
  const [events, setEvents] = useBrowserState<AuditEvent[]>("amara:history:v2", seedEvents());
  const [comments, setComments] = useTrackedData<Comment>(COMMENTS, "Pipeline", "Comment", pendingAudit);
  const [approvals, setApprovals] = useTrackedData<Approval>(APPROVALS, "Approvals", "Approval", pendingAudit);
  const [documents, setDocuments] = useTrackedData<AgencyDoc>(DOCUMENTS, "Documents", "Document", pendingAudit, "amara:documents:v2");
  const [rules, setRules] = useState<ApprovalRules>(DEFAULT_RULES);
  const [jobs, setJobs] = useTrackedData<Job>(JOBS, "Clients", "Job", pendingAudit, "amara:jobs:v2");
  const [clients, setClients] = useTrackedData<Client>(CLIENTS, "Clients", "Client", pendingAudit, "amara:clients:v2");
  const [applicants, setApplicants] = useTrackedData<Applicant>(APPLICANTS, "Applicants", "Applicant", pendingAudit, "amara:applicants:v2");
  const [candidates, setCandidates] = useTrackedData<Candidate>(CANDIDATES, "Candidates", "Candidate", pendingAudit, "amara:candidate-sources:v2");
  const [tasks, setTasks] = useTrackedData<Task>(TASKS_SEED, "Tasks", "Task", pendingAudit);
  const [notes, setNotes] = useTrackedData<Note>(NOTES_SEED, "Tasks", "Note", pendingAudit, "amara:notes:v2");
  const [calendar, setCalendar] = useTrackedData<CalendarEvent>(EVENTS, "Calendar", "Event", pendingAudit, "amara:calendar:v2");
  const [threads, setThreads] = useTrackedData<Thread>(THREADS, "Communication", "Thread", pendingAudit);
  const [calls, setCalls] = useTrackedData<CallLog>(CALLS, "Communication", "Call", pendingAudit);
  /** Emoji someone pinned to a record from its right-click menu, by record id. */
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [archived, setArchived] = useBrowserState<string[]>("amara:archived:v2", []);
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
      const records = pendingAudit.current.splice(0);
      const event: AuditEvent = { ...e, id: uid("ev"), at: Date.now(), actorId: e.actorId ?? currentUserId, module: e.module ?? moduleForAction(e.action), records: [...records, ...(e.records ?? [])] };
      setEvents((prev) => [event, ...prev]);
    },
    [currentUserId, setEvents],
  );

  const talent = talentRows({ deals, candidates, applicants, jobs, followUps }, manualTalent, placements);
  const placementPeople = placementRows(placements, talent, clients, jobs, deals);
  const getCandidateProfile = (row: PersonRow) => candidateProfiles[profileKey(row)] ?? profileFor(talent.find((r) => r.key === profileKey(row)) ?? row);
  const addTalent = (name: string, headline: string, profile: CandidateProfile) => {
    const id = uid("talent");
    const row: PersonRow = { key: id, candidateId: id, ids: [id], name: name.trim(), firstName: name.trim().split(" ")[0], headline: headline.trim(), location: profile.location, status: "applied", addedAt: liveNow(), lastTouch: liveNow(), matches: [], gaps: [], ownerId: currentUserId, email: profile.email, phone: profile.phone };
    setManualTalent((prev) => [row, ...prev]);
    setCandidateProfiles((prev) => ({ ...prev, [id]: profile }));
    log({ action: "candidate.created", module: "Candidates", summary: `Added ${row.name} to the talent pool`, kind: "sourcing", subjectId: id, records: [{ module: "Candidates", entityType: "Candidate", entityId: id, entityName: row.name, operation: "created", fields: changedFields({}, { name: row.name, headline: row.headline, ...profile }) }] });
    return id;
  };
  const createPlacements = (candidateId: string, jobIds: string[]) => {
    if (me.role === "resourcer") { notify("A recruiter must start placements."); return false; }
    const person = talent.find((r) => r.key === candidateId);
    if (!person) { notify("Choose a saved candidate."); return false; }
    try {
      const selected = planPlacementCreation(placements, candidateId, jobIds, jobs, clients);
      const at = liveNow();
      const created: Placement[] = selected.map(({ job, client }) => ({ id: uid("placement"), candidateId, clientId: client.id, jobId: job.id, status: "shortlisted", ownerId: currentUserId, createdAt: at, updatedAt: at, forms: [] }));
      setPlacements((prev) => [...created, ...prev]);
      created.forEach((placement, i) => log({ action: "placement.created", module: "Pipeline", summary: `Started a placement for ${person.name} · ${selected[i].job.title} at ${selected[i].client.name}`, kind: "stage", subjectId: placement.id, records: [{ module: "Pipeline", entityType: "Placement", entityId: placement.id, entityName: person.name, operation: "created", fields: changedFields({}, placement) }] }));
      return true;
    } catch (error) { notify(error instanceof Error ? error.message : "Cannot start this placement."); return false; }
  };
  const saveCandidateProfile = (row: PersonRow, profile: CandidateProfile) => {
    const clean = { ...profile };
    for (const key of ["experience", "education", "certifications", "skills", "languages", "links", "collections"] as const) clean[key] = [...new Set(profile[key].map((v) => v.trim()).filter(Boolean))];
    const fields = changedFields(getCandidateProfile(row), clean);
    if (!fields.length) return;
    setCandidateProfiles((prev) => ({ ...prev, [profileKey(row)]: clean }));
    log({ action: "candidate.profile_updated", module: "Candidates", summary: `Updated profile for ${row.name}`, kind: "note", subjectId: row.key, records: [{ module: "Candidates", entityType: "Candidate profile", entityId: profileKey(row), entityName: row.name, operation: "updated", fields }] });
  };
  const addCandidateCollection = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setCandidateCollections((prev) => prev.includes(clean) ? prev : [...prev, clean]);
    log({ action: "candidate.collection_created", module: "Candidates", summary: `Created candidate collection: ${clean}`, kind: "note" });
  };
  const dealName = useCallback((id: string) => deals.find((d) => d.id === id)?.candidate.name ?? "a deal", [deals]);

  /* ── Deals ── */

  const logTouch = useCallback(
    (dealId: string, event: Omit<TimelineEvent, "hoursAgo">) => {
      if (!deals.some(d => d.id === dealId)) return;
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, hoursIdle: 0 } : d)));
      log({ action: DEAL_ACTION[event.kind], summary: event.text, kind: event.kind, dealId });
    },
    [log, deals, setDeals],
  );

  const applyDealStage = useCallback(
    (dealId: string, stage: Stage) => {
      const deal = deals.find(d => d.id === dealId);
      if (!deal || deal.stage === stage) return;
      const label = STAGES.find((s) => s.id === stage)?.label ?? stage;
      setDeals((prev) => prev.map((d) => (d.id !== dealId || d.stage === stage ? d : { ...d, stage, hoursIdle: 0 })));
      log({ action: "deal.stage_changed", summary: `Moved ${dealName(dealId)} to ${label}`, kind: "stage", dealId });
    },
    [log, dealName, deals, setDeals],
  );

  const moveTo = (dealId: string, stage: Stage) => {
    const row = placementPeople.find((r) => r.deal?.id === dealId);
    if (!row) { notify("Open the placement from Placements first."); return; }
    const to: PersonStatus = stage === "sourced" ? "screening" : stage === "interview" || stage === "final" ? "interview" : stage === "offer" ? "offer" : stage;
    if (me.role === "resourcer") { notify("A recruiter must confirm this pipeline change."); return; }
    setPendingCandidateTransition({ row, to });
  };

  const advance = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const i = STAGES.findIndex((stage) => stage.id === deal.stage);
    moveTo(dealId, STAGES[Math.min(i + 1, STAGES.length - 1)].id);
  };

  const addComment = useCallback(
    (dealId: string, body: string, approvalId?: string) => {
      setComments((prev) => [...prev, { id: uid("c"), dealId, authorId: currentUserId, at: liveNow(), body, approvalId }]);
      if (!approvalId) log({ action: "comment.added", summary: `Commented on ${dealName(dealId)}`, kind: "comment", dealId });
    },
    [currentUserId, log, dealName, setComments],
  );

  const requestApproval = useCallback(
    (a: Omit<Approval, "id" | "at" | "requestedBy" | "status">, note: string) => {
      const id = uid("apr");
      setApprovals((prev) => [...prev, { ...a, id, at: liveNow(), requestedBy: currentUserId, status: "pending" }]);
      addComment(a.dealId, note, id);
      log({ action: "approval.requested", summary: `Requested approval: ${a.title} on ${dealName(a.dealId)}`, kind: "approval", dealId: a.dealId });
      return id;
    },
    [currentUserId, addComment, log, dealName, setApprovals],
  );

  /** Owners change fees directly; anyone else under the floor goes through approval. */
  const changeFee = useCallback(
    (dealId: string, pct: number, reason: string): "applied" | "requested" => {
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return "applied";
      if (deal.feePct === pct) return "applied";
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
        reason,
        summary: `Changed fee on ${deal.candidate.name} from ${Math.round(deal.feePct * 100)}% to ${Math.round(pct * 100)}%`,
        kind: "note",
        dealId,
      });
      return "applied";
    },
    [deals, rules, isOwner, requestApproval, log, setDeals],
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
    [approvals, isOwner, currentUserId, log, dealName, setApprovals, setDeals, setDocuments],
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
    [rules.invoiceApproval, isOwner, currentUserId, log, requestApproval, setDocuments],
  );

  const setDocStatus = useCallback(
    (id: string, status: AgencyDoc["status"]) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc || doc.status === status) return;
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
      log({ action: "document.status_changed", summary: `Marked ${doc.title} as ${status}`, kind: "document", dealId: doc.dealId });
    },
    [documents, log, setDocuments],
  );

  /* ── Team ── */

  const updateRules = useCallback(
    (next: Partial<ApprovalRules>, summary: string) => {
      if (!isOwner) return;
      const fields = changedFields(rules, { ...rules, ...next });
      if (!fields.length) return;
      pendingAudit.current.push({ module: "Team", entityType: "Approval rules", entityId: "agency-rules", entityName: "Agency approval rules", operation: "updated", fields });
      setRules((prev) => ({ ...prev, ...next }));
      log({ action: "team.rules_changed", summary, kind: "team" });
    },
    [isOwner, log, rules, setRules],
  );

  /* ── Follow-ups ── */

  const markSent = useCallback(
    (followUpId: string) => {
      const f = followUps.find((x) => x.id === followUpId);
      if (!f) return;
      setFollowUps((prev) => prev.filter((x) => x.id !== followUpId));
      setSentCount((n) => n + 1);
      if (f) log({ action: "followup.sent", summary: `Sent an update to ${f.name} (${f.role})`, kind: "email", dealId: f.dealId });
    },
    [followUps, log, setFollowUps, setSentCount],
  );

  /* ── Sourcing ── */

  const postJob = useCallback(
    (job: Omit<Job, "id" | "postedAt" | "status">) => {
      setJobs((prev) => [{ ...job, id: uid("job"), postedAt: liveNow(), status: "open" }, ...prev]);
      log({ action: "job.posted", summary: `Posted ${job.title} (${job.client}) to ${job.channels.join(", ")}`, kind: "sourcing" });
    },
    [log, setJobs],
  );

  const saveJobRequirements = useCallback((jobId: string, requirements: string[]) => {
    setJobs((prev) => prev.map((job) => job.id === jobId ? { ...job, requirements: requirements.map((r) => r.trim()).filter(Boolean) } : job));
    log({ action: "job.requirements_updated", module: "Clients", summary: "Updated the role requirements", subjectId: jobId, kind: "note" });
  }, [setJobs, log]);

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
        log({ action: "sourcing.application_received", summary: `Received ${a.name}'s application`, kind: "sourcing", actorId: "system" });
        if (i === batch.length - 1) {
          setSyncing(false);
          notify(`${batch.length} new applications. Amara has screened them.`);
          log({ action: "sourcing.synced", summary: `Synced ${batch.length} applications from Seek, LinkedIn and email`, kind: "sourcing", actorId: "system" });
          log({ action: "amara.screened", summary: `Screened ${batch.length} new applicants`, kind: "system", actorId: "amara" });
        }
      }, 1100 + i * 650);
    });
  }, [syncing, notify, log, setApplicants, setSyncing]);

  const decideApplicant = useCallback(
    (id: string, decision: "shortlist" | "reject") => {
      const a = applicants.find((x) => x.id === id);
      if (!a || a.status === "shortlisted" || a.status === "rejected") return;
      const job = jobs.find((j) => j.id === a.jobId);
      setApplicants((prev) => prev.map((x) => (x.id === id ? { ...x, status: decision === "shortlist" ? "shortlisted" : "rejected", isNew: false } : x)));
      if (decision === "shortlist") {
        setCandidates((prev) => [candidateFrom(a, currentUserId), ...prev]);
        log({ action: "sourcing.shortlisted", summary: `Shortlisted ${a.name} for ${job?.title ?? "a job"}`, kind: "sourcing", subjectId: a.id });
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
        log({ action: "sourcing.rejected", summary: `Declined ${a.name} for ${job?.title ?? "a job"}. Update queued in Communication`, kind: "sourcing", subjectId: a.id });
      }
    },
    [applicants, jobs, currentUserId, log, setApplicants, setCandidates, setFollowUps],
  );

  const markContacted = useCallback(
    (candidateId: string) => {
      const c = candidates.find((x) => x.id === candidateId);
      if (!c || c.status === "contacted" || c.status === "pipeline") return;
      setCandidates((prev) => prev.map((x) => (x.id === candidateId ? { ...x, status: "contacted" } : x)));
      if (c) log({ action: "sourcing.contacted", summary: `Reached out to ${c.name}`, kind: "sourcing", subjectId: c.id });
    },
    [candidates, log, setCandidates],
  );

  /** A new deal for a candidate and a role, starting at `stage`. */
  const makeDeal = useCallback(
    (c: Candidate, job: Job, stage: Stage): Deal => {
      const [title, company = ""] = c.headline.split(" · ");
      const first = c.name.split(" ")[0];
      return {
        id: uid("deal"),
        ownerId: me.role === "resourcer" ? "sam" : currentUserId,
        candidate: { name: c.name, title, currentCompany: company, location: c.location },
        role: { title: job.title, client: job.client, salary: job.salary },
        stage,
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
    },
    [me, currentUserId, rules.feeFloorPct],
  );

  const addToPipeline = useCallback(
    (candidateId: string): string | null => {
      const c = candidates.find((x) => x.id === candidateId);
      const job = jobs.find((j) => j.id === c?.jobId);
      if (!c || !job) return null;
      if (c.status === "pipeline") return c.dealId ?? null;
      const deal = makeDeal(c, job, "sourced");
      const id = deal.id;
      setDeals((prev) => [deal, ...prev]);
      setCandidates((prev) => prev.map((x) => (x.id === candidateId ? { ...x, status: "pipeline", dealId: id } : x)));
      log({ action: "deal.created", module: "Candidates", summary: `Added ${c.name} to the pipeline for ${job.title} at ${job.client}`, kind: "stage", dealId: id });
      return id;
    },
    [candidates, jobs, makeDeal, log, setCandidates, setDeals],
  );

  /**
   * One status for everyone on the Candidates page. Moves through whichever
   * records the person needs: shortlisting an applicant, reaching out, or
   * opening a deal at the right stage.
   */
  const setPersonStatus = (row: PersonRow, to: PersonStatus, details?: PipelineDetails): boolean => {
    const placement = placements.find((p) => p.id === row.placementId);
    if (!placement) { notify("Candidate profiles have no pipeline status. Open a placement to progress it."); return false; }
    if (me.role === "resourcer") { notify("A recruiter must confirm this placement change."); return false; }
    if (placement.status === to && !details && !FORM_STATUSES.includes(to)) return false;
    if (FORM_STATUSES.includes(to) && !details) { setPendingCandidateTransition({ row, to }); return false; }
    const error = details ? validatePipeline(to, details) : null;
    if (error) { notify(error); return false; }
    const client = clients.find((c) => c.id === placement.clientId);
    const job = jobs.find((j) => j.id === details?.role);
    if (details && ["interview", "offer", "offer-sent", "placed"].includes(to) && (!client || details.client !== client.id || !job || job.client !== client.name || (placement.jobId && placement.jobId !== job.id))) { notify("Use the client and role attached to this placement. Start a separate placement for another company."); return false; }
    if (details && to === "submitted" && (!Array.isArray(details.clients) || details.clients.length !== 1 || details.clients[0] !== placement.clientId)) { notify("This submission must belong to this placement's client."); return false; }
    if (details && to === "interested" && (!Array.isArray(details.roles) || details.roles.some((id) => !jobs.some((j) => j.id === id && j.client === client?.name)))) { notify("Choose roles at this placement's client."); return false; }
    if (details && to === "interview" && details.attendees === "Candidate + Client") {
      const allowed = client ? [client.contact, ...(client.contacts ?? [])].map((c) => c.email) : [];
      if (!Array.isArray(details.contacts) || details.contacts.some((email) => !allowed.includes(email))) { notify("Choose contacts from the selected client."); return false; }
    }
    if (details && ["screening", "interview", "final"].includes(to)) {
      try {
        const start = scheduledInstant(String(details.date), String(details.start), String(details.timezone));
        const end = scheduledInstant(String(details.date), String(details.end), String(details.timezone));
        if (end <= start) { notify("End time must be after start time."); return false; }
        setCalendar((prev) => [...prev, { id: uid("event"), kind: to === "interview" ? "interview" : to === "final" ? "follow-up" : "call", title: `${personStatus(to).label} · ${row.name} · ${client?.name}`, start, minutes: (end - start) / 60000, subject: { kind: "candidate", id: placement.candidateId, name: row.name }, ownerId: String(details.assignee || currentUserId), detail: String(details.description || details.invite || ""), where: String(details.location || details.interviewType || ""), with: [row.name] }]);
      } catch (err) { notify(err instanceof Error ? err.message : "Invalid schedule."); return false; }
    }
    const at = liveNow();
    const payload = details ? pipelinePayload(to, details) : undefined;
    const form = payload ? { id: uid("form"), status: to, details: payload, at, actorId: currentUserId } : undefined;
    setPlacements((prev) => prev.map((p) => p.id === placement.id ? { ...p, status: to, updatedAt: at, jobId: p.jobId ?? job?.id, forms: form ? [...p.forms, form] : p.forms } : p));
    const stage = to === "final" ? undefined : to === "interview" && details?.stage === "Final Round" ? "final" : to === "offer-sent" ? "offer" : STATUS_STAGE[to];
    if (placement.legacyDealId && stage) applyDealStage(placement.legacyDealId, stage);
    if (to === "offer-sent" && details) setDocuments((prev) => [...prev, { id: uid("doc"), kind: details.documentType === "Employment Contract" ? "contract" : "offer-letter", direction: "received", title: `${row.name} · ${details.documentType}`, dealId: placement.legacyDealId, candidateId: placement.candidateId, placementId: placement.id, client: client?.name ?? "", status: "received", at, byId: currentUserId, fileName: String(details.file), note: `Manually reviewed · ${details.offerSalary} · Start ${details.offerStart}. ${details.offerTerms || ""}` }]);
    log({ action: "placement.status_changed", module: "Pipeline", summary: `${row.name} at ${client?.name}: ${personStatus(placement.status).label} → ${personStatus(to).label}`, kind: "stage", subjectId: placement.id, dealId: placement.legacyDealId, records: [{ module: "Pipeline", entityType: "Placement", entityId: placement.id, entityName: `${row.name} · ${client?.name}`, operation: "updated", fields: [{ field: "status", before: personStatus(placement.status).label, after: personStatus(to).label }, ...(payload ? changedFields({}, payload) : [])] }] });
    setPendingCandidateTransition(null);
    return true;
  };

  /* ── Clients ── */

  const addClient = useCallback(
    (c: Omit<Client, "id" | "since">) => {
      const id = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid("client");
      const prospect = c.status === "prospect" ? { stage: c.stage ?? ("new" as const), ownerId: c.ownerId ?? currentUserId } : {};
      setClients((prev) => [...prev, { ...c, ...prospect, id, since: liveNow() }]);
      log({ action: c.status === "active" ? "client.added" : "prospect.added", summary: `Added ${c.name} as a ${c.status === "active" ? "client" : "prospect"}`, kind: "client", subjectId: id });
      return id;
    },
    [log, setClients, currentUserId],
  );

  const setClientStatus = useCallback(
    (id: string, status: Client["status"]) => {
      const c = clients.find((x) => x.id === id);
      if (!c || c.status === status) return;
      setClients((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      if (c) log({ action: "client.status_changed", summary: `Marked ${c.name} as ${status === "active" ? "an active client" : "a prospect"}`, kind: "client", subjectId: id });
    },
    [clients, log, setClients],
  );

  /* ── Prospects ── */

  const setProspectStage = useCallback(
    (id: string, stage: ProspectStage) => {
      const c = clients.find((x) => x.id === id);
      if (!c || c.stage === stage) return;
      setClients((prev) => prev.map((x) => (x.id === id ? { ...x, stage, lastContactedAt: liveNow() } : x)));
      log({ action: "prospect.stage_changed", summary: `Moved ${c.name} to ${prospectStage(stage).label}`, kind: "client", subjectId: id });
    },
    [clients, log, setClients],
  );

  const addContact = useCallback(
    (id: string, contact: Contact, byAmara = false) => {
      const c = clients.find((x) => x.id === id);
      if (!c) return;
      setClients((prev) => prev.map((x) => (x.id === id ? { ...x, contacts: [...(x.contacts ?? []), contact] } : x)));
      log({ action: "prospect.contact_added", summary: `Added ${contact.name} (${contact.title}) at ${c.name}${byAmara ? ", found by Amara" : ""}`, kind: "client", subjectId: id });
    },
    [clients, log, setClients],
  );

  /* ── Tasks & notes ── */

  const addTask = useCallback(
    (t: { title: string; due?: number; priority: Task["priority"]; subject?: Subject }) => {
      const id = uid("task");
      setTasks((prev) => [{ ...t, id, done: false, ownerId: currentUserId, createdAt: liveNow() }, ...prev]);
      log({ action: "task.added", summary: `Added a task${t.subject ? ` on ${t.subject.name}` : ""}: ${t.title}`, kind: "note", subjectId: t.subject?.id });
      return id;
    },
    [currentUserId, log, setTasks],
  );

  const toggleTask = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
      log({ action: t.done ? "task.reopened" : "task.completed", summary: `${t.done ? "Reopened" : "Completed"}: ${t.title}${t.subject ? ` (${t.subject.name})` : ""}`, kind: "note", subjectId: t.subject?.id });
    },
    [tasks, log, setTasks],
  );

  const removeTask = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      setTasks((prev) => prev.filter((x) => x.id !== id));
      log({ action: "task.removed", summary: `Removed task: ${t.title}`, kind: "note", subjectId: t.subject?.id });
    },
    [tasks, log, setTasks],
  );

  const addNote = useCallback(
    (subject: Subject, body: string) => {
      setNotes((prev) => [{ id: uid("note"), subjectId: subject.id, body, at: liveNow(), authorId: currentUserId }, ...prev]);
      log({ action: "note.added", summary: `Added a note on ${subject.name}`, kind: "note", subjectId: subject.id });
    },
    [currentUserId, log, setNotes],
  );

  /* ── Calendar ── */

  const addCalendarEvent = useCallback(
    (e: Omit<CalendarEvent, "id" | "ownerId">) => {
      setCalendar((prev) => [...prev, { ...e, id: uid("cal"), ownerId: currentUserId }]);
      log({ action: "calendar.event_added", summary: `Scheduled ${e.title}`, kind: "note", dealId: e.dealId, subjectId: e.subject?.id });
    },
    [currentUserId, log, setCalendar],
  );

  /* ── Communication ── */

  /** `scheduledFor` queues it instead of sending now; it shows in the conversation until then. */
  const sendMessage = useCallback(
    (threadId: string, body: string, amara = false, scheduledFor?: number) => {
      const t = threads.find((x) => x.id === threadId);
      if (!t || !body.trim()) return;
      setThreads((prev) =>
        prev.map((x) => (x.id === threadId ? { ...x, unread: false, messages: [...x.messages, { id: uid("m"), from: "me", body: body.trim(), at: liveNow(), byId: currentUserId, amara, scheduledFor }] } : x)),
      );
      const what = t.channel === "email" ? "an email" : `a ${t.channel === "sms" ? "text" : `${t.channel} message`}`;
      log({ action: scheduledFor ? "message.scheduled" : "message.sent", summary: `${scheduledFor ? "Scheduled" : "Sent"} ${what} to ${t.contact.name}`, kind: "email", subjectId: t.contact.subject?.id });
    },
    [threads, currentUserId, log, setThreads],
  );

  const startThread = useCallback(
    (t: { channel: MessageChannel; contact: Thread["contact"]; subject?: string; body: string; amara?: boolean; scheduledFor?: number }) => {
      const id = uid("th");
      setThreads((prev) => [
        { id, channel: t.channel, contact: t.contact, subject: t.subject, unread: false, messages: [{ id: uid("m"), from: "me", body: t.body.trim(), at: liveNow(), byId: currentUserId, amara: t.amara, scheduledFor: t.scheduledFor }] },
        ...prev,
      ]);
      log({ action: t.scheduledFor ? "message.scheduled" : "message.sent", summary: `${t.scheduledFor ? "Scheduled a message to" : "Wrote to"} ${t.contact.name}${t.subject ? `: ${t.subject}` : ""}`, kind: "email", subjectId: t.contact.subject?.id });
      return id;
    },
    [currentUserId, log, setThreads],
  );

  const cancelScheduled = useCallback(
    (threadId: string, messageId: string) => {
      const t = threads.find((x) => x.id === threadId);
      if (!t) return;
      const rest = t.messages.filter((m) => m.id !== messageId);
      setThreads((prev) => (rest.length ? prev.map((x) => (x.id === threadId ? { ...x, messages: rest } : x)) : prev.filter((x) => x.id !== threadId)));
      log({ action: "message.unscheduled", summary: `Cancelled a scheduled message to ${t.contact.name}`, kind: "email", subjectId: t.contact.subject?.id });
    },
    [threads, log, setThreads],
  );

  /** Inbox state per person in Communication: done, snoozed, pinned, labels. */
  const [conversationFlags, setConversationFlags] = useState<Record<string, ConversationFlags>>(() =>
    Object.fromEntries(Object.entries(SEED_LABELS).map(([key, labels]) => [key, { labels }])),
  );
  const flagConversation = useCallback(
    (key: string, patch: Partial<ConversationFlags>) => setConversationFlags((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } })),
    [],
  );

  /* ── Labels ── */

  const [labels, setLabels] = useState<Label[]>(LABELS);
  const addLabel = useCallback(
    (l: Omit<Label, "id">) => {
      const id = uid("lb");
      setLabels((prev) => [...prev, { ...l, id }]);
      const parent = l.parentId ? labels.find((x) => x.id === l.parentId) : undefined;
      log({ action: "message.label_created", summary: `Created the label ${parent ? `${parent.name} / ` : ""}${l.name}`, kind: "note" });
      return id;
    },
    [labels, log],
  );
  const updateLabel = useCallback(
    (id: string, patch: Partial<Omit<Label, "id">>) => {
      const l = labels.find((x) => x.id === id);
      if (!l) return;
      setLabels((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      if (patch.name && patch.name !== l.name) log({ action: "message.label_renamed", summary: `Renamed the label ${l.name} to ${patch.name}`, kind: "note" });
    },
    [labels, log],
  );
  /** Deletes the label and everything nested under it, and takes it off every conversation. */
  const deleteLabel = useCallback(
    (id: string) => {
      const l = labels.find((x) => x.id === id);
      if (!l) return;
      const gone = withChildren(labels, id);
      setLabels((prev) => prev.filter((x) => !gone.includes(x.id)));
      setConversationFlags((prev) => Object.fromEntries(Object.entries(prev).map(([k, f]) => [k, f.labels ? { ...f, labels: f.labels.filter((x) => !gone.includes(x)) } : f])));
      log({ action: "message.label_deleted", summary: `Deleted the label ${labelPath(labels, id)}${gone.length > 1 ? ` and ${gone.length - 1} nested under it` : ""}`, kind: "note" });
    },
    [labels, log],
  );
  const toggleLabel = useCallback(
    (key: string, name: string, labelId: string) => {
      const on = conversationFlags[key]?.labels?.includes(labelId);
      setConversationFlags((prev) => {
        const current = prev[key]?.labels ?? [];
        return { ...prev, [key]: { ...prev[key], labels: on ? current.filter((x) => x !== labelId) : [...current, labelId] } };
      });
      log({ action: on ? "message.unlabelled" : "message.labelled", summary: `${on ? "Took" : "Put"} ${name} ${on ? "off" : "under"} ${labelPath(labels, labelId)}`, kind: "note" });
    },
    [conversationFlags, labels, log],
  );

  const markThreadRead = useCallback((id: string) => setThreads((prev) => (prev.some((x) => x.id === id && x.unread) ? prev.map((x) => (x.id === id ? { ...x, unread: false } : x)) : prev)), [setThreads]);
  const toggleStar = useCallback((id: string) => setThreads((prev) => prev.map((x) => (x.id === id ? { ...x, starred: !x.starred } : x))), [setThreads]);

  const logCall = useCallback(
    (c: Omit<CallLog, "id" | "at" | "byId">) => {
      setCalls((prev) => [{ ...c, id: uid("call"), at: liveNow(), byId: currentUserId }, ...prev]);
      log({ action: "call.logged", summary: `Called ${c.contact.name}${c.note ? `: ${c.note}` : ""}`, kind: "call", subjectId: c.contact.subject?.id });
    },
    [currentUserId, log, setCalls],
  );

  /**
   * Someone new wrote in: make them a candidate, a contact at a client or
   * prospect, or a new prospect, and move their conversation onto that record.
   * Returns the conversation's new key.
   */
  const recognizeContact = (r: {
    key: string;
    as: "candidate" | "contact" | "prospect";
    name: string;
    title: string;
    email?: string;
    phone?: string;
    location?: string;
    /** For a contact at a company you already have. */
    clientId?: string;
    /** For a new prospect. */
    company?: string;
  }) => {
    const name = r.name.trim();
    const title = r.title.trim();
    const contact: Contact = { name, title, email: r.email ?? "", phone: r.phone };
    let subject: Subject;
    let detail: string;
    if (r.as === "candidate") {
      const base: PersonRow = { key: "new", ids: [], name, firstName: name.split(" ")[0], headline: title, location: r.location ?? "", email: r.email ?? "", phone: r.phone ?? "", status: "applied", addedAt: 0, lastTouch: 0, matches: [], gaps: [], ownerId: "" };
      const id = addTalent(name, title, { ...profileFor(base), role: title.split(" · ")[0], location: r.location ?? "", email: r.email ?? "", phone: r.phone ?? "", collections: [] });
      subject = { kind: "candidate", id, name };
      detail = `Candidate · ${title}`;
    } else if (r.as === "contact") {
      const c = clients.find((x) => x.id === r.clientId);
      if (!c) return null;
      addContact(c.id, contact);
      subject = { kind: c.status === "active" ? "client" : "prospect", id: c.id, name: c.name };
      detail = `${title} · ${c.name}`;
    } else {
      const company = r.company?.trim() || name;
      const id = addClient({ name: company, industry: "To confirm", location: r.location ?? "Sydney", status: "prospect", contact, feePct: 20, stage: "interested", ownerId: currentUserId, lastContactedAt: liveNow() });
      subject = { kind: "prospect", id, name: company };
      detail = `${title} · ${company}`;
    }
    const mine = (x: { contact: { name: string; subject?: Subject } }) => !x.contact.subject && personKey(x.contact.name) === r.key;
    setThreads((prev) => prev.map((t) => (mine(t) ? { ...t, contact: { ...t.contact, name, detail, subject } } : t)));
    setCalls((prev) => prev.map((c) => (mine(c) ? { ...c, contact: { ...c.contact, name, subject } } : c)));
    const next = personKey(name, subject);
    // Pins, labels and snoozes follow them onto their new key.
    setConversationFlags((prev) => {
      const { [r.key]: old, ...rest } = prev;
      return old ? { ...rest, [next]: { ...old, ...rest[next], labels: [...new Set([...(old.labels ?? []), ...(rest[next]?.labels ?? [])])] } } : prev;
    });
    log({ action: "message.contact_recognised", summary: `Added ${name} to the desk from Communication, as ${r.as === "candidate" ? "a candidate" : r.as === "prospect" ? `a new prospect, ${subject.name}` : `a contact at ${subject.name}`}`, kind: "note", subjectId: subject.id });
    return next;
  };

  /* ── Right-click actions ── */

  const setMark = useCallback(
    (s: Subject, emoji: string | null) => {
      setMarks((prev) => {
        const next = { ...prev };
        if (emoji) next[s.id] = emoji;
        else delete next[s.id];
        return next;
      });
      log({ action: `${MODULE_PREFIX[s.kind]}.marked`, summary: emoji ? `Marked ${s.name} with ${emoji}` : `Cleared the mark on ${s.name}`, kind: "note", subjectId: s.id });
    },
    [log, setMarks],
  );

  const toggleArchive = useCallback(
    (s: Subject) => {
      const was = archived.includes(s.id);
      setArchived((prev) => (was ? prev.filter((x) => x !== s.id) : [...prev, s.id]));
      log({ action: `${MODULE_PREFIX[s.kind]}.${was ? "unarchived" : "archived"}`, summary: `${was ? "Restored" : "Archived"} ${s.name}`, kind: "note", subjectId: s.id });
    },
    [archived, log, setArchived],
  );

  /** Removes a person and everything hanging off them. Their history stays in the audit log. */
  const deletePerson = useCallback(
    (row: PersonRow) => {
      const ids = new Set(row.ids);
      setApplicants((prev) => prev.filter((x) => !ids.has(x.id)));
      setCandidates((prev) => prev.filter((x) => !ids.has(x.id)));
      setDeals((prev) => prev.filter((x) => !ids.has(x.id)));
      setFollowUps((prev) => prev.filter((f) => !ids.has(f.id) && !(f.dealId && ids.has(f.dealId)) && f.name !== row.name));
      setTasks((prev) => prev.filter((t) => !t.subject || !ids.has(t.subject.id)));
      setNotes((prev) => prev.filter((n) => !ids.has(n.subjectId)));
      setCalendar((prev) => prev.filter((e) => !(e.subject && ids.has(e.subject.id)) && !(e.dealId && ids.has(e.dealId))));
      log({ action: "candidate.deleted", summary: `Deleted ${row.name}${row.deal ? ` and their ${row.deal.role.title} deal` : ""}`, kind: "sourcing", subjectId: row.key });
    },
    [log, setApplicants, setCandidates, setDeals, setFollowUps, setTasks, setNotes, setCalendar],
  );

  /** Only for companies with no live deals; the UI says why otherwise. */
  const deleteClient = useCallback(
    (id: string) => {
      const c = clients.find((x) => x.id === id);
      if (!c || deals.some((d) => d.role.client === c.name && d.stage !== "placed")) return;
      setClients((prev) => prev.filter((x) => x.id !== id));
      setJobs((prev) => prev.filter((j) => j.client !== c.name));
      setTasks((prev) => prev.filter((t) => t.subject?.id !== id));
      setNotes((prev) => prev.filter((n) => n.subjectId !== id));
      setCalendar((prev) => prev.filter((e) => e.subject?.id !== id));
      log({ action: c.status === "active" ? "client.deleted" : "prospect.deleted", summary: `Deleted ${c.name}`, kind: "client", subjectId: id });
    },
    [clients, deals, log, setClients, setJobs, setTasks, setNotes, setCalendar],
  );

  /** Generates their Terms of Business, marks it sent, and moves a prospect to Terms sent. */
  const sendTerms = useCallback(
    (id: string) => {
      const c = clients.find((x) => x.id === id);
      if (!c) return;
      addDocument({ kind: "tob", direction: "generated", title: `Terms of Business — ${c.name}`, client: c.name, status: "sent" });
      const order = ["new", "interested", "follow-up", "meeting", "negotiation", "terms-sent", "terms-signed"];
      if (c.status === "prospect" && order.indexOf(c.stage ?? "new") < order.indexOf("terms-sent")) setProspectStage(id, "terms-sent");
    },
    [clients, addDocument, setProspectStage],
  );

  /** A standard request or link (consent form, workstyle profile, booking link, pre-call pack) sent by email. */
  const sendTemplate = useCallback(
    (kind: TemplateKind, contact: Thread["contact"]) => {
      const t = templateFor(kind, contact, me.firstName);
      return startThread({ channel: "email", contact, subject: t.subject, body: t.body });
    },
    [me.firstName, startThread],
  );

  const updateThread = useCallback(
    (id: string, patch: Partial<Pick<Thread, "unread" | "starred" | "important" | "snoozedUntil" | "archived">>) =>
      setThreads((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [setThreads],
  );

  const deleteThread = useCallback(
    (id: string) => {
      const t = threads.find((x) => x.id === id);
      if (!t) return;
      setThreads((prev) => prev.filter((x) => x.id !== id));
      log({ action: "message.deleted", summary: `Moved the conversation with ${t.contact.name} to the trash`, kind: "email", subjectId: t.contact.subject?.id });
    },
    [threads, log, setThreads],
  );

  /* ── Learnings ── */

  const setLessonDone = useCallback((lessonId: string, done: boolean) => {
    const before = completedLessons.includes(lessonId);
    if (before === done) return;
    setCompletedLessons((prev) => (done ? (prev.includes(lessonId) ? prev : [...prev, lessonId]) : prev.filter((id) => id !== lessonId)));
    log({ action: "learning.progress_changed", summary: `${done ? "Completed" : "Reopened"} lesson ${lessonId}`, kind: "system", records: [{ module: "Learnings", entityType: "Lesson", entityId: lessonId, entityName: lessonId, operation: "updated", fields: [{ field: "completed", before, after: done }] }] });
  }, [completedLessons, log, setCompletedLessons]);

  const exportedAudit = useCallback(
    (format: string, count: number) => log({ action: "audit.exported", summary: `Exported ${count} audit events as ${format.toUpperCase()}`, kind: "system" }),
    [log],
  );

  const setHomeTaskDone = useCallback((id: string, name: string, done: boolean) => {
    const before = completedHomeTasks.includes(id);
    if (before === done) return;
    setCompletedHomeTasks(prev => done ? [...prev, id] : prev.filter(x => x !== id));
    log({ action: "task.completion_changed", module: "Home", summary: `${done ? "Completed" : "Reopened"} ${name}`, kind: "note", records: [{ module: "Home", entityType: "Task", entityId: id, entityName: name, operation: "updated", fields: [{ field: "completed", before, after: done }] }] });
  }, [completedHomeTasks, log, setCompletedHomeTasks]);

  return {
    talent, placements, placementPeople, createPlacements, addTalent, creatingPlacements, setCreatingPlacements, newPlacementCandidate, setNewPlacementCandidate,
    pendingCandidateTransition, setPendingCandidateTransition,
    candidateProfiles, candidateCollections, getCandidateProfile, saveCandidateProfile, addCandidateCollection,
    // ui
    toast,
    notify,
    askOpen,
    setAskOpen,
    searchOpen,
    setSearchOpen,
    pendingAsk,
    ask,
    homeStage,
    setHomeStage,
    tourOpen,
    setTourOpen,
    homeEntranceReady,
    setHomeEntranceReady,
    railOpen,
    setRailOpen,
    openDealId,
    openDeal,
    selectedFollowUpId,
    selectFollowUp,
    docRequest,
    setDocDealId,
    jobFilter,
    setJobFilter,
    teamView,
    setTeamView,
    focusPerson,
    setFocusPerson,
    focusProspect,
    setFocusProspect,
    selectedThreadId,
    selectThread,
    composeRequest,
    requestCompose,
    clearComposeRequest,
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
    saveJobRequirements,
    applicants,
    syncing,
    syncApplicants,
    decideApplicant,
    candidates,
    markContacted,
    addToPipeline,
    setPersonStatus,
    // prospects
    setProspectStage,
    addContact,
    // tasks, notes, calendar
    tasks,
    addTask,
    toggleTask,
    removeTask,
    notes,
    addNote,
    calendar,
    addCalendarEvent,
    // communication
    threads,
    sendMessage,
    cancelScheduled,
    conversationFlags,
    flagConversation,
    labels,
    addLabel,
    updateLabel,
    deleteLabel,
    toggleLabel,
    recognizeContact,
    startThread,
    markThreadRead,
    toggleStar,
    calls,
    logCall,
    // right-click actions
    marks,
    setMark,
    archived,
    toggleArchive,
    deletePerson,
    deleteClient,
    sendTerms,
    sendTemplate,
    updateThread,
    deleteThread,
    // learnings
    completedLessons,
    setLessonDone,
    completedHomeTasks,
    setHomeTaskDone,
  };
}

export type DeskState = ReturnType<typeof useDeskState>;
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
