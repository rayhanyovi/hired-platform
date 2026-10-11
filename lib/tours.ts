import { STAGES } from "./data";
/**
 * Page tours. Each step points at an element marked with `data-tour="<target>"`.
 * Steps without a target (or whose target isn't on screen) show as a centred card.
 */
export type TourStep = { target?: string; title: string; body: string };
export type Tour = { name: string; steps: TourStep[] };

const TOURS: Record<string, Tour> = {
  "/": {
    name: "Home",
    steps: [
      { target: "home-hero", title: "Your first screen", body: "A welcome and one line from Amara about what matters today. A new member gets first steps; an established desk gets what needs attention." },
      { target: "page-tour", title: "A guide for every page", body: "Use this question-mark button to tour the page you're on. Each page has its own walkthrough explaining its features and actions. You can replay a tour whenever you need help, or press ? when you're not typing." },
      { target: "ask-amara", title: "Ask HeyAmara, from anywhere", body: "Opens Amara in a drawer that already knows what page you're on. On Follow-ups she sees your queue; on a deal she sees that deal. ⌘J works too." },
      { target: "search", title: "Search everything", body: "⌘K finds deals, clients, candidates, roles and documents. Amara understands phrases like 'going cold' or 'unsigned', and anything that reads like a question goes straight to her." },
      { target: "home-metrics", title: "Your funnel", body: "Calls through to placements, with change against the previous period. Click a metric to ask Amara why it moved." },
      { target: "home-tasks", title: "Tasks", body: "Clients who've gone quiet. Tick them off, or let Amara draft every follow-up at once." },
      { target: "home-invoices", title: "Invoices", body: "Drafts, outstanding and overdue at a glance, coloured by status. Click a client to see all their invoices. Amara can tell you which to chase." },
      { target: "home-leaderboard", title: "Leaderboard", body: "Your team, or the whole HeyAmara network. A solo desk has no team yet, so the network shows where you stand." },
      { target: "home-tabs", title: "Overview and Analytics", body: "Analytics shows how each stage converts into the next and the fees you've placed each month." },
      { target: "home-stage", title: "Demo: day 1 vs day 30", body: "Switch between a member who just joined and an established desk to see how Home adapts." },
    ],
  },
  "/chat": {
    name: "Chat",
    steps: [
      { target: "chat-composer", title: "Just Amara", body: "A clean page for talking to Amara. Ask in your own words or start from a suggestion. The input moves to the bottom once the conversation starts." },
      { target: "chat-history", title: "Your conversations", body: "Every chat you start is kept here. Start a fresh one any time with New chat or ⌘⇧O." },
    ],
  },
  "/clients": {
    name: "Clients",
    steps: [
      { target: "page-header", title: "Everyone you hire for", body: "Active clients and the prospects you're pitching, with every role they're hiring for." },
      { target: "client-stats", title: "The agency at a glance", body: "How many clients and prospects you have, open roles, and the fees currently in play." },
      { target: "client-filters", title: "Filter and search", body: "Switch between active clients and prospects, cards or a compact list, or search by company or role." },
      { target: "client-cards", title: "One row per company", body: "Each company shows their roles, who you have for each one, and whether their Terms of Business are signed. Click a company or a role to drill in." },
      { target: "page-actions", title: "Add a client", body: "Add a new client or prospect. You can post roles for them straight away." },
    ],
  },
  "/clients/[id]": {
    name: "Client",
    steps: [
      { target: "client-header", title: "The client", body: "Status, TOB standing and actions: post a new role, log a document they sent you, or mark a prospect as active." },
      { target: "client-roles", title: "Every role they're hiring for", body: "Each role lists everyone attached to it: applicants still to screen, shortlisted people, deals in the pipeline, and placements." },
      { target: "funnel", title: "The funnel per role", body: "To review → Shortlisted → In pipeline → Placed. A quick read on where each role is stuck." },
      { target: "client-invoices", title: "Invoices", body: "Everything you've billed this client: paid, outstanding and drafts. Amara can draft the reminder for anything unpaid." },
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
      { target: "applicant-views", title: "The original application", body: "Check Amara's read against the source: the email and its attachments, or the job board's screening answers, cover letter and CV." },
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
      { target: "fu-controls", title: "Tone and channel", body: "Pick direct, warm or brief, and SMS, email or LinkedIn. Amara only drafts when you press Draft with Amara, so you never pay for drafts you don't use." },
      { target: "fu-draft", title: "The draft", body: "Starts blank. Write it yourself, or let Amara draft it from your notes, then edit anything." },
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
      { target: "team-views", title: "Members or leaderboard", body: "Switch between who's on the team and how everyone's tracking this month, against your team or the whole HeyAmara network." },
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
