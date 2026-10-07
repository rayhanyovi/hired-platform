import { STAGES } from "./data";
/**
 * Page tours. Each step points at an element marked with `data-tour="<target>"`.
 * Steps without a target (or whose target isn't on screen) show as a centred card.
 */
export type TourStep = { target?: string; title: string; body: string };
export type Tour = { name: string; steps: TourStep[] };

const TOURS: Record<string, Tour> = {
  "/": {
    name: "Today",
    steps: [
      { target: "page-header", title: "Your morning in one screen", body: "Today shows what needs you right now: fees that are cooling and people waiting to hear back." },
      { target: "brief", title: "Amara's morning brief", body: "Amara reads your whole desk and tells you the one or two things that matter today. Anything in violet was written by Amara." },
      { target: "going-cold", title: "Time kills deals", body: "Deals sorted by what's at risk: fee × how close to an offer × how long since anyone touched it. Click a row to open the deal and its next move." },
      { target: "waiting", title: "Nobody gets ghosted", body: "Candidates waiting for an update. Each one already has a draft in Follow-ups." },
      { target: "month", title: "How the month is tracking", body: "Placed fees against target, weighted pipeline, and where your money sits by stage. An amber dot means a stage has cooling deals." },
      { target: "ask-amara", title: "Ask Amara anything", body: "Press ⌘K from any page to ask about your desk: what's going cold, who's waiting, how the month looks." },
    ],
  },
  "/clients": {
    name: "Clients",
    steps: [
      { target: "page-header", title: "Everyone you hire for", body: "Active clients and the prospects you're pitching, with every role they're hiring for." },
      { target: "client-stats", title: "The agency at a glance", body: "How many clients and prospects you have, open roles, and the fees currently in play." },
      { target: "client-filters", title: "Filter and search", body: "Switch between active clients and prospects, or search by company or role." },
      { target: "client-cards", title: "One card per company", body: "Each card shows their roles, who you have for each one, and whether their Terms of Business are signed. Click a company or a role to drill in." },
      { target: "page-actions", title: "Add a client", body: "Add a new client or prospect. You can post roles for them straight away." },
    ],
  },
  "/clients/[id]": {
    name: "Client",
    steps: [
      { target: "client-header", title: "The client", body: "Status, TOB standing and actions: post a new role, log a document they sent you, or mark a prospect as active." },
      { target: "client-roles", title: "Every role they're hiring for", body: "Each role lists everyone attached to it: applicants still to screen, shortlisted people, deals in the pipeline, and placements." },
      { target: "funnel", title: "The funnel per role", body: "To review → Shortlisted → In pipeline → Placed. A quick read on where each role is stuck." },
      { target: "client-aside", title: "Contact, terms and history", body: "Who to call, your agreed fee, their documents, and recent activity across all their roles." },
    ],
  },
  "/applicants": {
    name: "Applicants",
    steps: [
      { target: "page-header", title: "Every application, screened", body: "Applications from your job ads and inbox land here. Amara reads each CV against the brief before you do." },
      { target: "page-actions", title: "Sync", body: "Pulls new applications from Seek, LinkedIn and email. In this demo, three new people arrive." },
      { target: "applicant-list", title: "The pile", body: "New arrivals are marked with a dot. The list is sorted by fit, strongest first. Use J and K to move through it." },
      { target: "screening", title: "Amara's screening", body: "What matches the brief, what's missing, and a one-line verdict. It's a recommendation, not a decision." },
      { target: "applicant-decide", title: "You decide", body: "Shortlist (S) sends them to your candidate pool. Decline (D) queues an honest update in Follow-ups, so nobody is left hanging." },
    ],
  },
  "/candidates": {
    name: "Candidates",
    steps: [
      { target: "page-header", title: "Your shortlist", body: "Everyone who passed screening, plus people you've sourced yourself, across every client." },
      { target: "candidate-filters", title: "Narrow it down", body: "Filter by status or by role, or search by name, title or location." },
      { target: "candidate-list", title: "Work the list", body: "Click a name for Amara's notes. Reach out logs your outreach. Add to pipeline turns them into a deal for that role." },
    ],
  },
  "/pipeline": {
    name: "Pipeline",
    steps: [
      { target: "page-header", title: "Every live deal", body: "One card per candidate per role, from sourced to placed." },
      { target: "pipeline-filters", title: "Focus", body: "Show only deals that need attention, or one client at a time." },
      { target: "board", title: "Heat, not just stage", body: "The bar under each deal drains while nobody touches it, and drains faster near an offer. Drag a card to change its stage. Click to open it." },
      ...STAGES.map((st, i) => ({
        target: `stage-${st.id}`,
        title: `${i + 1}. ${st.label}`,
        body: st.description,
      })),
      { target: "page-actions", title: "Weighted value and new deals", body: "Fees weighted by how likely each stage is to close. New deal takes you to your candidate pool to pick someone." },
    ],
  },
  "/deals/[id]": {
    name: "Deal",
    steps: [
      { target: "stepper", title: "Where the deal is", body: "Click any stage to move the deal. Every move is logged." },
      { target: "deal-main", title: "Amara's read and next move", body: "Why this deal matters right now, and the one thing Amara would do next. Hit the button and it drafts the call notes or message for you." },
      { target: "discussion", title: "Discussion", body: "Notes for the team, @mentions, and approval requests. A recruiter asking for a fee below the floor goes to the Owner here." },
      { target: "deal-aside", title: "Details, documents, activity", body: "Fee and owner, documents for this deal (generate or log one), and the deal's full history from the audit log." },
    ],
  },
  "/follow-ups": {
    name: "Follow-ups",
    steps: [
      { target: "page-header", title: "Nobody gets ghosted", body: "Everyone waiting to hear from you, including people you've turned down." },
      { target: "fu-list", title: "Who's waiting", body: "Sorted by how long they've waited. Three days or more is overdue." },
      { target: "fu-controls", title: "Tone and channel", body: "Direct, warm or brief, by SMS, email or LinkedIn. Amara rewrites the draft to match." },
      { target: "fu-draft", title: "The draft", body: "Amara writes it from your notes. Once it's finished you can edit anything." },
      { target: "fu-context", title: "What Amara used", body: "The facts behind the draft, so you can check it's right before it goes." },
      { target: "fu-send", title: "You send", body: "Nothing goes out without you. ⌘↵ sends and moves you to the next person." },
    ],
  },
  "/documents": {
    name: "Documents",
    steps: [
      { target: "page-header", title: "One register", body: "Everything you send clients and everything they send you, in one place." },
      { target: "doc-tabs", title: "Register and generator", body: "Generate fills a TOB, submission, offer recap or invoice from deal data, with a live preview. Invoices from recruiters wait for the Owner." },
      { target: "doc-register", title: "The register", body: "Click a document to preview it. Move a draft to sent, or a TOB to signed, right from the status column." },
      { target: "page-actions", title: "Log what clients send", body: "Offer letters, contracts and signed TOBs. Attach them to a deal or a client. Each one is logged." },
    ],
  },
  "/sum": {
    name: "The Sum",
    steps: [
      { target: "page-header", title: "Billed vs kept", body: "The sum most recruiters have never done: what they generate for an agency against what they take home." },
      { target: "sum-inputs", title: "Your numbers", body: "Drag the sliders or click a number to type it. Typed values can go past the slider's range." },
      { target: "sum-result", title: "The split", body: "What you kept, what the agency kept, and what each extra $100k of billings is worth to you." },
      { target: "sum-own", title: "Same desk, your own name", body: "An illustration based on your assumptions: how many clients follow you, and what it costs to run the desk." },
    ],
  },
  "/team": {
    name: "Team",
    steps: [
      { target: "team-members", title: "Members and roles", body: "Owner, Recruiter and Resourcer. In this demo, View as switches who you're signed in as so you can see each role." },
      { target: "team-approvals", title: "Waiting for approval", body: "Requests from the team. Only the Owner can approve or reject. The decision is logged." },
      { target: "team-rules", title: "Approval rules", body: "The fee floor and invoice sign-off decide what needs the Owner. Only the Owner can change them." },
      { target: "team-permissions", title: "Who can do what", body: "The full permissions matrix. 'Approval' means allowed, but routed to the Owner first." },
    ],
  },
  "/audit": {
    name: "Audit log",
    steps: [
      { target: "page-header", title: "Everything, on the record", body: "Every action on the desk, from people, Amara and the system. Events can't be edited or deleted." },
      { target: "audit-filters", title: "Filter", body: "By category, by person, or by text. Exports include exactly what you've filtered." },
      { target: "audit-table", title: "The log", body: "Time, who, the machine-readable action, and what happened. Deal events link back to the deal." },
      { target: "page-actions", title: "Export", body: "CSV or JSON, Owner only. The export itself is recorded too." },
    ],
  },
  "/learnings": {
    name: "Learnings",
    steps: [
      { target: "page-header", title: "Learn from people who've done it", body: "Videos, readings and quick check-ins from mentors in the network." },
      { target: "continue", title: "Pick up where you left off", body: "Your next unfinished lesson." },
      { target: "lesson-filters", title: "Filter by format", body: "Only videos, only readings, or only quizzes." },
      { target: "tracks", title: "Tracks", body: "Lessons grouped into tracks, with your progress for each." },
    ],
  },
  "/learnings/[id]": {
    name: "Lesson",
    steps: [
      { target: "lesson-content", title: "The lesson", body: "A video, a reading or a quiz. Quizzes need 3 of 5 to pass." },
      { target: "lesson-track", title: "The rest of the track", body: "Every lesson in this track, with what you've finished." },
      { target: "lesson-footer", title: "Finish and move on", body: "Mark it complete, then go to the next lesson." },
    ],
  },
};

export function tourFor(pathname: string): Tour | null {
  if (TOURS[pathname]) return TOURS[pathname];
  const dynamic = pathname.replace(/^\/(clients|deals|learnings)\/[^/]+$/, "/$1/[id]");
  return TOURS[dynamic] ?? null;
}
