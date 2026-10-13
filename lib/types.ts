export type Stage = "sourced" | "submitted" | "interview" | "final" | "offer" | "placed";

export type Person = {
  name: string;
  title: string;
  currentCompany: string;
  location: string;
};

export type Role = {
  title: string;
  client: string;
  salary: number;
};

export type TimelineKind = "call" | "email" | "stage" | "client" | "note";

export type TimelineEvent = {
  kind: TimelineKind;
  hoursAgo: number;
  text: string;
};

export type NextMove = {
  label: string;
  kind: "call" | "message" | "nudge" | "close";
  /** What Amara produces when you hit the button: call notes or a message draft. */
  output: string;
};

export type Deal = {
  id: string;
  ownerId: string;
  candidate: Person;
  role: Role;
  stage: Stage;
  feePct: number;
  hoursIdle: number;
  /** Plain-language reasons Amara flagged this deal. */
  signals: string[];
  read: string;
  next: NextMove;
  timeline: TimelineEvent[];
};

export type FollowUpKind = "rejection" | "no-news" | "progress" | "on-hold" | "keep-warm";

export type FollowUp = {
  id: string;
  name: string;
  firstName: string;
  role: string;
  client: string;
  kind: FollowUpKind;
  daysWaiting: number;
  /** The facts Amara used to write the draft. Shown so the recruiter can trust it. */
  context: string[];
  detail: string;
  dealId?: string;
  /** For rejections: the honest reason, and what they did well. */
  reason?: string;
  reasonShort?: string;
  positive?: string;
};

export type Tone = "direct" | "warm" | "brief";
export type Channel = "sms" | "email" | "linkedin";

/* ── Agency: team, events, approvals, documents, sourcing ─────────────── */

export type MemberRole = "owner" | "recruiter" | "resourcer";

export type Member = {
  id: string;
  name: string;
  firstName: string;
  role: MemberRole;
  email: string;
};

/** One event stream feeds both a deal's Activity and the agency-wide audit log. */
export type AuditModule =
  | "Home"
  | "Pipeline"
  | "Clients"
  | "Prospects"
  | "Applicants"
  | "Candidates"
  | "Follow-ups"
  | "Communication"
  | "Calendar"
  | "Tasks"
  | "Documents"
  | "Approvals"
  | "Team"
  | "Learnings"
  | "System";
export type AuditRecord = {
  module: AuditModule;
  entityType: string;
  entityId: string;
  entityName: string;
  operation: "created" | "updated" | "removed";
  fields: { field: string; before: string | number | boolean | null; after: string | number | boolean | null }[];
};

export type AuditEvent = {
  id: string;
  /** Epoch ms. */
  at: number;
  /** Member id, or "amara" / "system". */
  actorId: string;
  /** Machine-readable, e.g. "deal.stage_changed". The prefix is the category. */
  action: string;
  summary: string;
  kind: TimelineKind | "comment" | "approval" | "document" | "sourcing" | "team" | "system";
  dealId?: string;
  /** The client, prospect or candidate this is about, so record histories can read it. */
  subjectId?: string;
  module?: AuditModule;
  records?: AuditRecord[];
  reason?: string;
};

export type Comment = {
  id: string;
  dealId: string;
  authorId: string;
  at: number;
  body: string;
  approvalId?: string;
};

export type ApprovalKind = "fee" | "invoice";

export type Approval = {
  id: string;
  dealId: string;
  kind: ApprovalKind;
  requestedBy: string;
  at: number;
  title: string;
  detail: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: string;
  decidedAt?: number;
  /** Fee approvals carry the proposed rate; invoice approvals the document. */
  feePct?: number;
  documentId?: string;
};

export type GeneratedDocKind = "tob" | "submission" | "offer-recap" | "invoice";
export type ReceivedDocKind = "offer-letter" | "contract" | "signed-tob" | "reference" | "other";
export type DocKind = GeneratedDocKind | ReceivedDocKind;

export type DocStatus = "draft" | "sent" | "signed" | "received" | "pending-approval" | "approved";

export type AgencyDoc = {
  candidateId?: string;
  placementId?: string;
  id: string;
  kind: DocKind;
  direction: "generated" | "received";
  title: string;
  dealId?: string;
  client: string;
  status: DocStatus;
  at: number;
  byId: string;
  fileName?: string;
  fileSize?: number;
  note?: string;
  amount?: number;
};

export type ApprovalRules = {
  feeFloorEnabled: boolean;
  feeFloorPct: number;
  invoiceApproval: boolean;
};

export type JobChannel = "Seek" | "LinkedIn" | "Indeed" | "Website";
export type Source = JobChannel | "Email" | "Referral";

export type Job = {
  /** Recruiter-recorded requirements; unknown briefs remain empty. */
  requirements?: string[];
  id: string;
  title: string;
  client: string;
  salary: number;
  location: string;
  postedAt: number;
  /** Empty means a headhunt: the role isn't advertised. */
  channels: JobChannel[];
  status: "open" | "paused" | "filled";
};

/** Where a prospect is in the sales conversation, from first touch to signed terms. */
export type ProspectStage = "new" | "interested" | "follow-up" | "meeting" | "negotiation" | "terms-sent" | "terms-signed";

export type Contact = { name: string; title: string; email: string; phone?: string };

export type Client = {
  id: string;
  name: string;
  industry: string;
  location: string;
  /** Prospects are companies you're pitching; active clients have work with you. */
  status: "active" | "prospect";
  contact: Contact;
  /** Everyone else you know there, beyond the main contact. */
  contacts?: Contact[];
  feePct: number;
  since: number;
  /** Path under /public. Clients added in-session fall back to initials. */
  logo?: string;
  /** Prospects only. */
  stage?: ProspectStage;
  size?: string;
  website?: string;
  ownerId?: string;
  lastContactedAt?: number;
};

/* ── Tasks, notes, calendar, communication ─────────────────────────── */

/** Anything a task, note or message can hang off. */
export type SubjectKind = "client" | "prospect" | "candidate";
export type Subject = { kind: SubjectKind; id: string; name: string };

export type Task = {
  id: string;
  title: string;
  /** Epoch ms. Undefined means no date. */
  due?: number;
  priority: 1 | 2 | 3;
  done: boolean;
  subject?: Subject;
  ownerId: string;
  createdAt: number;
};

export type Note = { id: string; subjectId: string; body: string; at: number; authorId: string };

export type CalendarKind = "interview" | "meeting" | "call" | "follow-up" | "placement" | "event";

export type CalendarEvent = {
  id: string;
  kind: CalendarKind;
  title: string;
  /** Epoch ms. */
  start: number;
  minutes: number;
  /** Start dates and reminders that belong to a day, not a time. */
  allDay?: boolean;
  subject?: Subject;
  dealId?: string;
  /** Who's in it, besides you. */
  with?: string[];
  where?: string;
  detail?: string;
  ownerId: string;
};

export type MessageChannel = "email" | "sms" | "linkedin" | "whatsapp";

export type Message = { id: string; from: "me" | "them"; body: string; at: number; byId?: string; amara?: boolean; /** Queued to go out then. Epoch ms. */ scheduledFor?: number };

export type Thread = {
  id: string;
  channel: MessageChannel;
  /** No subject means they aren't a candidate, client or prospect yet. Email and phone are what they wrote from. */
  contact: { name: string; detail: string; subject?: Subject; email?: string; phone?: string };
  subject?: string;
  messages: Message[];
  unread: boolean;
  starred?: boolean;
  important?: boolean;
  /** Hidden from the inbox until then. Epoch ms. */
  snoozedUntil?: number;
  archived?: boolean;
};

/** Per-person inbox state in Communication. */
export type ConversationFlags = { doneAt?: number; snoozedUntil?: number; pinned?: boolean; labels?: string[] };

/** Your own way of grouping conversations. Labels can nest under another label. */
export type LabelColor = "grey" | "red" | "orange" | "violet" | "blue" | "green";
export type Label = { id: string; name: string; color: LabelColor; parentId?: string };

/** A message waiting to be written in Communication, asked for from another page. */
export type ComposeRequest = { channel: MessageChannel; contact: Thread["contact"]; subject?: string; body?: string };

export type CallLog = {
  id: string;
  contact: { name: string; subject?: Subject };
  direction: "outgoing" | "incoming";
  outcome: "connected" | "no-answer" | "voicemail";
  seconds: number;
  at: number;
  byId: string;
  note?: string;
};

export type Fit = "strong" | "possible" | "unlikely";

export type Applicant = {
  id: string;
  jobId: string;
  name: string;
  firstName: string;
  headline: string;
  location: string;
  source: Source;
  at: number;
  fit: Fit;
  matches: string[];
  gaps: string[];
  summary: string;
  experience: string[];
  status: "new" | "shortlisted" | "rejected";
  /** Used for the honest rejection update if it comes to that. */
  rejectReason: string;
  isNew?: boolean;
};

export type Candidate = {
  id: string;
  name: string;
  headline: string;
  location: string;
  jobId?: string;
  source: Source;
  at: number;
  status: "pool" | "contacted" | "pipeline" | "declined";
  dealId?: string;
  fit?: Fit;
  matches?: string[];
  gaps?: string[];
  summary?: string;
  addedBy: string;
};
