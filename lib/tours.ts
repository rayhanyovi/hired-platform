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
      { target: "ask-amara", title: "Ask HeyAmara, from anywhere", body: "Opens Amara in a drawer that already knows what page you're on. On Communication she sees who's waiting; on a deal she sees that deal. ⌘J works too." },
      { target: "search", title: "Search everything", body: "⌘K finds deals, clients, candidates, roles and documents. Amara understands phrases like 'going cold' or 'unsigned', and anything that reads like a question goes straight to her." },
      { target: "home-metrics", title: "Your funnel", body: "Calls through to placements, with change against the previous period. Click a metric to ask Amara why it moved." },
      { target: "home-tasks", title: "Tasks", body: "Every task on the desk, whether it's about a client, a prospect or a candidate. Click the chip to open the record, add one with +, or let Amara draft the follow-ups." },
      { target: "home-invoices", title: "Invoices", body: "Drafts, outstanding and overdue at a glance, coloured by status. Click a client to see all their invoices. Amara can tell you which to chase." },
      { target: "home-leaderboard", title: "Leaderboard", body: "Your team, or the whole HeyAmara network. A solo desk has no team yet, so the network shows where you stand." },
      { target: "home-tabs", title: "Overview, Analytics and Sales", body: "Analytics covers revenue, lead generation, conversion and growth. Sales tracks winning clients: dials, calls booked, show and close rates, and cash in against target." },
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
      { target: "page-header", title: "Everyone you hire for", body: "Active clients, with every role they're hiring for. Companies you're still pitching live in Prospects." },
      { target: "client-stats", title: "The agency at a glance", body: "Active clients, prospects, open roles, and the fees currently in play." },
      { target: "client-filters", title: "View and search", body: "A list (the default) or cards, or search by company or role." },
      { target: "client-cards", title: "One row per company", body: "Each company shows their roles, who you have for each one, and whether their Terms of Business are signed. Click a row to open it in place: roles, contacts, history, tasks and notes." },
      { target: "page-actions", title: "Add a client", body: "Add a company you're already hiring for. You can post roles for them straight away." },
    ],
  },
  "/clients/[id]": {
    name: "Client",
    steps: [
      { target: "client-header", title: "The client", body: "Status, TOB standing and actions: post a new role, log a document they sent you, or mark a prospect as active." },
      { target: "client-roles", title: "Every role they're hiring for", body: "Each role lists everyone attached to it: applicants still to screen, shortlisted people, deals in the pipeline, and placements." },
      { target: "funnel", title: "The funnel per role", body: "To review → Shortlisted → In pipeline → Placed. A quick read on where each role is stuck." },
      { target: "client-invoices", title: "Invoices", body: "Everything you've billed this client: paid, outstanding and drafts. Amara can draft the reminder for anything unpaid." },
      { target: "client-tasks", title: "Tasks and notes", body: "Tasks about this client show here and on Home. Notes are for the team: how they like to work, who decides." },
      { target: "client-aside", title: "Contact, terms and history", body: "Who to call, your agreed fee, their documents, and recent activity across all their roles." },
    ],
  },
  "/candidates": {
    name: "Candidates", steps: [
      { target: "page-header", title: "Your talent pool", body: "Save each person once. Experience, qualifications, preferences and documents belong to this shared profile." },
      { target: "people-filters", title: "Find people by their data", body: "Filter by collection or owner, and search by name, skill or location. Amara helps identify missing information." },
      { target: "people-table", title: "Expand a profile", body: "Click a row to open the profile, notes and full recorded history. Recruitment statuses live on Placements." },
      { target: "candidate-collections", title: "Collections", body: "Group a person into multiple talent pools without duplicating their profile." },
    ],
  },
  "/placements": {
    name: "Placements", steps: [
      { target: "page-header", title: "One process per company", body: "A saved candidate can have several independent placements. Closing one keeps the other processes and profile available." },
      { target: "placement-filters", title: "List and board", body: "List rows expand in place. Clicking a board card opens its next required form." },
      { target: "page-actions", title: "Start placements", body: "Select one saved candidate and multiple roles across companies. Amara can suggest title matches; you choose the processes." },
    ],
  },
  "/prospects": {
    name: "Prospects",
    steps: [
      { target: "page-header", title: "Companies you're pitching", body: "Every prospect from first email to signed terms. Once they sign, make them a client." },
      { target: "prospect-stats", title: "The sales pipeline", body: "How many prospects you have, how many are in conversation, terms out, and who needs chasing." },
      { target: "prospect-filters", title: "Table or board", body: "Work the table, or drag prospects between stages on the board." },
      { target: "prospect-table", title: "Click a row to open it", body: "Contacts (Amara can find more people there), history, tasks and notes. Change the stage from the pill." },
      { target: "page-actions", title: "Add a prospect", body: "It starts at New and appears in Sales on Home as it moves." },
    ],
  },
  "/tasks": {
    name: "Tasks",
    steps: [
      { target: "page-header", title: "Every task, one list", body: "Tasks from every client, prospect and candidate. Nothing is filtered out by default." },
      { target: "tasks-add", title: "Add one", body: "Type it, pick what it's about (or leave it General), a due date and a priority." },
      { target: "tasks-filters", title: "Narrow it down", body: "Filter by what the task is about, open or done, or only yours." },
      { target: "tasks-list", title: "Grouped by when", body: "Overdue first, then today, the next 7 days, later and no date. Click a chip to open the record." },
    ],
  },
  "/calendar": {
    name: "Calendar",
    steps: [
      { target: "calendar-filters", title: "What's on", body: "Interviews, meetings, calls, follow-ups and start dates, plus tasks on the day they're due. Turn types on or off." },
      { target: "calendar-grid", title: "Day, week or month", body: "Click an event for details and a link to the deal or record. Click an empty slot to book something." },
      { target: "calendar-upcoming", title: "Coming up", body: "Your next few things, and the tasks due today." },
    ],
  },
  "/communication": {
    name: "Communication",
    steps: [
      { target: "comm-stats", title: "What needs you", body: "Replies waiting on you, people owed an update, threads that went quiet, and calls this week. Click one to jump there." },
      { target: "comm-triage", title: "One conversation per person", body: "Email, SMS, WhatsApp, LinkedIn and calls with someone sit in one conversation. Needs you groups them by what to do, including new people who aren't on your desk yet; Done and Snoozed keep the rest out of the way." },
      { target: "comm-labels", title: "Your labels", body: "Group conversations your own way. Pick a label to filter, or use the filter button. Right-click a label to rename it, nest one under it, recolour or delete it. Add labels to a conversation from its right-click menu." },
      { target: "comm-list", title: "Work the list", body: "Each row says why it's here. Right-click for more, tick several to act on them together, or use J and K to move and E to mark done." },
      { target: "comm-thread", title: "Everything in order", body: "Messages on every channel and every call, by day. Start a call from the phone icon and it's timed and logged." },
      { target: "comm-reply", title: "Answer on any channel", body: "Pick the channel, insert a template, or ask Amara for a reply, a nudge or an honest update, then make it shorter, warmer or firmer. Send now or schedule it. Nothing goes out until you press Send." },
      { target: "comm-context", title: "Who they are", body: "Their status or company stage, labels, what we know, what's coming up, tasks and notes. Someone new can be added as a candidate, a contact at a company, or a new prospect. Amara can summarise the whole conversation when you ask." },
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
    name: "Audit trail",
    steps: [
      { target: "page-header", title: "Every change, on the record", body: "Changes from people, Amara and the system. This demo keeps history for the current session and resets on reload." },
      { target: "audit-filters", title: "Find a change", body: "Filter by module, actor, change type or session. Search record names and field values. Exports include your filtered results." },
      { target: "audit-table", title: "Before and after", body: "See exact timestamps, actors and modules. Expand a change to compare field values and view affected record IDs." },
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
