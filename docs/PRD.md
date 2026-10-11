# PRD: Amara Desk

| | |
|---|---|
| **Product** | Amara Desk: the recruiter's home and daily workspace on HeyAmara |
| **Owner** | Rayhan |
| **Status** | Frontend prototype. All data and AI are mocked |
| **Trigger** | HeyAmara CTO frontend challenge, received Sat 11 Oct 2026 ~10:40 WIB, due within 48 hours |
| **Last updated** | 11 Oct 2026 |
| **Related** | [Tech plan](TECH_PLAN.md) · [Design direction](DESIGN_DIRECTION.md) · [Backlog](BACKLOG.md) · [Build log](BUILD_LOG.md) · [Design thinking board](../public/design-thinking-board.html) |

Documentation language: English. Requirements below describe intended behavior; they are not proof that every feature is implemented or verified. Board identifiers such as `U1` and `F1` refer to discovery notes, not the existing functional requirement IDs.

---

## 1. Summary

HeyAmara gives independent recruiters and small agencies one place to run their desk. Today they get a dashboard (numbers) and an AI chat (actions) as two separate entry points. Amara Desk merges them. Home shows what matters today, and every number, task, invoice and record can be handed to Amara with its context already attached. Amara drafts. The recruiter decides and sends.

The prototype goes beyond Home on purpose. A home screen is only as good as the pages it sends you to, so the surrounding desk (clients, applicants, pipeline, follow-ups, documents, team) is built well enough to make the "dashboard → act with AI" loop real.

## 2. The brief

> Combine our dashboard and AI chat entry point into one redesigned home experience. Add a chat input in the centre. This is the first screen people see when they join Amara. Build a working frontend prototype showing the natural transition into chat. Mock data is fine. We're assessing design judgment, product thinking and use of AI. Submit a demo, the source code and a short explanation within 48 hours.

| Brief asks for | How the prototype answers it |
|---|---|
| One home experience combining dashboard and chat | Home = greeting + Amara's one-line read + dashboard. Every dashboard element has an "Ask" that opens the Ask HeyAmara drawer with that element as context |
| Chat input in the centre | The documented implementation uses a drawer and a centred composer on `/chat`. This does not fulfil the literal centred-input Home requirement; retain it as an open submission gap. See §6 and DC-1 |
| First screen people see when they join | Day 1 (new member) state: welcome, first steps, empty states that teach, network leaderboard |
| Natural transition into chat | Ask from any element → drawer slides in, question already sent, page context chip shown, answer streams. On `/chat` the centred composer animates to the bottom when a conversation starts |
| Mock data | Deterministic seed data, pinned to Fri 9 Oct 2026 08:40 Sydney so relative times never drift |
| Design judgment, product thinking, AI use | Documented in [Design direction](DESIGN_DIRECTION.md), §6 and §9 below |

## 3. Problem

New and returning recruiters need to understand their desk and choose their next useful action. The supplied dashboard displays business information, while the supplied chat screen asks the user to begin a conversation. The design hypothesis is that connecting the two will reduce the effort of deciding what to do and explaining the context to Amara.

This is a product hypothesis, not a finding from user interviews or a claim about the existing product's backend capabilities.

### 3.1 Evidence and assumptions

| Evidence | Supported observation | Limits |
|---|---|---|
| Gabriel's brief, supplied by Rayhan | Combined home; central chat input; welcoming first impression; preserved dashboard information; natural transition to chat; demo, code and explanation within 48 hours | Explicit challenge requirements |
| Supplied dashboard screenshot | Five funnel metrics, tasks, invoices, leaderboard, period selector and Overview / Analytics access; several tasks display 28-day age labels and truncated descriptions | Does not establish why tasks are late or how growth percentages are calculated |
| Supplied chat screenshot | Personal greeting and large composer with a candidate-sourcing example | Does not prove sourcing is the only supported intent |
| [HeyAmara website](https://heyamara.com/) | Experienced-recruiter positioning, AI systems, processes, community and mentorship | Marketing positioning, not persona interviews |
| [Harvey's agency-ownership post](https://www.linkedin.com/posts/harvey-jutton-a840ab268_recruitment-recruitmentagency-activity-7480842636770222080-kzNC) | Founder perspective on running an agency alone and the value of support and processes | Qualitative perspective; not prevalence data |
| [Harvey's hiring-delay post](https://www.linkedin.com/posts/harvey-jutton-a840ab268_recruiter-sorry-but-the-candidate-accepted-activity-7493894220215185408-mQNZ) | An argument that slow hiring can lose candidates to faster offers | Not a validated inactivity threshold or causal model |

The phrase "Time kills deals" appears in another person's comment on the hiring-delay post examined. Other exact quotes from the earlier Claude summary remain unverified and must not be attributed to Harvey without their original source. Billing examples, stage odds and decay thresholds are illustrative, not measured user statistics. The existing calculator is preserved as a hidden route (§12), but is outside this discovery and home challenge scope.

## 4. Users

### 4.1 Personas

| Persona | Context | Jobs to be done | What success looks like |
|---|---|---|---|
| **New member, Day 1** (e.g. a recruiter who just left an agency to go independent) | No clients, no data, unsure what to do first | Set up the agency, win a first client, understand fees and terms | Knows the next 3 steps within a minute; asks Amara instead of searching docs |
| **Established recruiter, Day 30** (Sam Whitford, Whitford Talent, Sydney) | 21 live deals, 9 clients, invoices out, two teammates | Know what's urgent, keep deals warm, update everyone waiting, get paid | Spends the morning acting, not triaging |
| **Agency owner** | Runs 2–3 recruiters | Approve discounts and invoices, see who's performing, keep a record | Approvals cleared daily; audit export on request |
| **Resourcer** | Sources and screens, doesn't run deals | Work the applicant pile fast, build the pool | Clears "To review" with S / D / J / K |

### 4.2 Roles and permissions

| Action | Owner | Recruiter | Resourcer |
|---|---|---|---|
| Screen applicants, build the candidate pool | ✓ | ✓ | ✓ |
| Run deals, move pipeline stages | ✓ | ✓ | – |
| Log documents received from clients | ✓ | ✓ | ✓ |
| Generate TOBs, submissions, offer recaps | ✓ | ✓ | – |
| Set a fee below the agency floor (default 18%) | ✓ | Approval | – |
| Send placement invoices | ✓ | Approval | – |
| Approve requests | ✓ | – | – |
| Edit team and approval rules | ✓ | – | – |
| Export the audit log | ✓ | – | – |

The demo's "View as" switch (account menu) changes the signed-in member so each role can be seen. These are prototype permissions, not a verified production access policy.

### 4.3 Persona needs and feature mapping

All personas are provisional. Day 1 and Day 30 may describe the same person at different stages. Fixture names, team sizes and usage counts are fictional; time-to-action goals are hypotheses rather than observed results.

| Board persona | Likely problem | Need | Proposed response | Priority |
|---|---|---|---|---|
| U1: experienced recruiter becoming a founder | Unclear first step; unfamiliar agency operations; empty workspace | Guided start without requiring a good prompt | State-aware starter prompts, first steps and actionable empty states | Primary |
| U2: active solo recruiter | Unclear priorities; repeated context entry; activity without clear next steps | Quickly understand what needs attention and act with context | Attention digest, metric drill-down, contextual chat and editable follow-up drafts | Primary |
| U3: owner of a small team | Unclear ownership; personal/team scope ambiguity; ranking without coaching context | Accountability and understandable team performance | Assignees, explicit scope and performance detail | Secondary; avoid expanding the home deadline |
| U4: invoice/administration responsibility | Drafts need completion; payment states imply different actions | Status, amount, dates and an appropriate next step | Invoice details, missing-information guidance and reviewable reminders | Supporting role, possibly held by the founder |
| Existing resourcer role | Screening and sourcing workload | Efficient review and access to original material | Existing Applicants / Candidates requirements | Surrounding desk; not a new primary home persona |

Candidates and hiring managers are recipients of workflow outcomes, not confirmed users of this home. HeyAmara operators and mentors are ecosystem stakeholders; their admin tooling requires separate discovery. People with no recruitment experience are an unvalidated segment and must not replace the experienced Day 1 persona.

### 4.4 How might we

1. H1: Help a new member take a useful first step without knowing what to ask.
2. H2: Help a returning recruiter identify what needs attention today.
3. H3: Turn dashboard information into a relevant conversation with Amara.
4. H4: Preserve orientation and business visibility when entering chat.
5. H5: Make suggestions understandable, editable and easy to review.

## 5. Goals, non-goals, principles

### Goals
1. **Five-second clarity.** On landing, the recruiter knows the one or two things that matter today.
2. **Ask from anywhere, with context.** Any number, list or record can go to Amara without retyping what it is.
3. **AI drafts, humans send.** Nothing leaves the desk without an explicit click. Every draft is editable and shows its sources.
4. **AI on request.** Model calls happen when the user asks, not on page load, so cost tracks value.
5. **One desk.** Clients, roles, people, deals, documents and money link to each other; no dead ends.

### Non-goals (prototype)
- Real authentication, persistence, multi-tenant data.
- Real integrations: job boards, email, calendar, accounting, e-signature.
- A real model. Replies are intent-matched mock data with simulated streaming.
- Marketing site, sign-up and billing.
- Native mobile apps (the web app is responsive down to 375px).

### Product principles
- Colour is information; the pink → violet gradient means "Amara wrote this or will write this".
- Show the source next to the summary (screening ↔ original application; draft ↔ "What Amara used").
- Quiet by default: secondary actions appear on hover on desktop, always visible on touch.
- Every action is logged once and shows up in both the deal's activity and the audit log.

## 6. Key decision: where chat lives

**Options considered**

| Option | Pros | Cons |
|---|---|---|
| A. Chat input centred on Home with surrounding dashboard (literal brief) | Matches the brief; obvious AI entry; can share record context with the drawer | Requires careful information hierarchy and a clear home-to-conversation transition |
| B. Chat-only Home; dashboard on another page | Clean AI-first story | Hides the numbers people open the app for. Built and tried as "Dashboard" page; removed |
| **C. Global Ask HeyAmara drawer + dedicated `/chat` (chosen)** | Available on every page; knows what you're looking at; Home stays a clean dashboard; open-ended chat still has a home | Deviates from "chat input in the centre" |

**Documented implementation decision: C.** The contextual drawer supports asking about a deal, client or invoice from any page. Its benefit over a centred composer is a design hypothesis, not a validated finding. A centred composer can also use the same context contract; layout and grounding are separate decisions.

**What's kept from the brief:** the centred composer and the transition into chat live on `/chat` (empty welcoming state → conversation, composer animates from centre to bottom). The composer component is shared, so a centred-input Home variant is a layout change (backlog item).

**Submission gap:** `/chat` does not satisfy the explicit request for an input in the centre of Home. Provide a compliant Home variant for review or obtain clarification from Gabriel before presenting the drawer alternative as accepted. This documentation update does not change the application layout.

## 7. Experience overview

```
Rail (nav)            Top bar: page title · Ask HeyAmara (⌘J) · Notifications · Account (View as)
├─ Home               ┌──────────────────────────────────────────────┐ ┌──────────────┐
├─ Chat               │ page                                         │ │ Ask HeyAmara │
├─ Recruit            │                                              │ │ drawer       │
│  Clients            │                                              │ │ (context of  │
│  Applicants         │                                              │ │  this page)  │
│  Candidates         │                                              │ │              │
│  Pipeline           └──────────────────────────────────────────────┘ └──────────────┘
│  Follow-ups         ⌘K Search palette (overlay) · ? Tour (overlay) · Deal quick-view drawer
├─ Business: Documents
└─ Agency: Team · Audit log · Learnings
```

Mobile: header (search + compact Ask) and bottom nav (Home, Chat, Pipeline, Follow-ups, More).

### Core loops
1. **Morning triage:** Home → Amara's line → Tasks / metric "Ask" → drawer answers with links → act on the record page.
2. **Keep deals warm:** Pipeline (cold first) → deal → Amara's next move → "Draft it" → send → logged, heat resets.
3. **Nobody waits:** Follow-ups → pick person → write or "Draft with Amara" → edit → send (⌘↵) → next.
4. **Pile to pool:** Sync applications → Amara screens → check original if needed → shortlist (S) / decline (D, queues honest update) → Candidates → reach out → add to pipeline.
5. **Get paid:** Home invoices → client → Invoices section → "Chase" → Amara drafts reminder.

## 8. Functional requirements

Priority: **M** must (in prototype), **S** should (in prototype, could be cut), **C** could (backlog).

### 8.1 Home `/`

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| H-1 | Greeting with Amara orb; "Welcome, {name}" on Day 1, "Olá, {name}" on Day 30 (Playfair) | M | Name follows the signed-in member |
| H-2 | Amara's one-line "Today" read, streamed | M | Day 1: what Amara can help with. Day 30: "8 clients have gone quiet and one invoice is still a draft. Your calls are up 154% on last period." |
| H-3 | Demo toggle New member / Day 30 | M | Switches every panel and the drawer's Home context |
| H-4 | Overview / Analytics tabs | M | Overview: metrics + Tasks + Invoices + Leaderboard. Analytics: conversion + fees by month |
| H-5 | Five funnel metric cards (Calls, Submittals, Interviews, Offers, Placements) | M | Icon + label row, 32px value, "▲ x% vs last period" or "No activity yet"; hover reveals Ask (always visible on touch) |
| H-6 | Range filter (All time / This month / This week) and hide-numbers toggle | M | Hidden numbers show "•••" everywhere on Home |
| H-7 | Tasks panel | M | Day 1: First steps, each with "Start" (asks Amara). Day 30: quiet clients with days since last reply and priority; hover swaps age for "Draft"; header "Draft all N" |
| H-8 | Invoices panel | M | Draft / Outstanding / Overdue totals; rows coloured by status; client name links to that client's Invoices section; "Chase" asks Amara; "New invoice" → Documents |
| H-9 | Leaderboard panel | M | Team / Network toggle; Day 1 defaults to network with "You · not ranked yet"; "See all" opens Team → Leaderboard |
| H-10 | Analytics: conversion per stage and fees placed by month, each with "Explain" | S | Day 1 shows designed empty charts |

### 8.2 Ask HeyAmara drawer (global)

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| A-1 | Open from top-bar button, ⌘J, or any Ask/Explain/Chase/Draft action | M | ⌘J toggles; on `/chat` ⌘J focuses the page composer instead; Esc closes |
| A-2 | Context chip: "Looking at {page}" + one-line summary of that page's data | M | Context exists for Home, Follow-ups, Pipeline, Clients, Client detail, Applicants, Candidates, Documents, Team, Audit, Learnings, Deal pages; removable |
| A-3 | Page-specific suggestion chips | M | e.g. Client detail: "Summarise this client", "Who's in play for each role?", "Draft a check-in to {contact}" |
| A-4 | Answers stream with rich blocks: candidates, drafts, invoices, metrics, steps, linked lists | M | List rows link to the record; follow-up chips continue the thread |
| A-5 | Home questions route to the page that owns the data | S | "Who's waiting on me?" from Home answers with Follow-ups data |
| A-6 | Layout: ≥1280px pushes the page aside; below that overlays and closes on link click | M | No content hidden behind the drawer on wide screens |

### 8.3 Chat `/chat`
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| C-1 | Empty state with centred composer and suggestions | M | Composer animates (shared layout) to the bottom when the first message is sent |
| C-2 | Composer: rotating placeholders, attach menu (JD, CV, client brief), mode menu (Chat / Search / Draft) | S | Attached files show as removable chips |
| C-3 | Recent conversations sidebar | S | Empty: "Your conversations with Amara will show up here." |

### 8.4 Search ⌘K

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| S-1 | Search pages, deals, clients, roles, candidates, applicants, follow-ups, documents, lessons, team | M | Grouped by kind, max 5 per kind, ranked (exact > prefix > word start > contains > metadata) |
| S-2 | Amara lenses: "going cold", "waiting", "strong fit", "unsigned", "approval", "no candidates", "deals at {stage}" | M | Shown first as "Amara found · {lens}" |
| S-3 | Questions go to Amara | M | Queries that look like questions put "Ask HeyAmara: “q”" first; selecting it opens the drawer |
| S-4 | Keyboard: ↑ ↓ ↵ Esc; example queries when empty | M | Selecting a record also selects it on its list page |

### 8.5 Clients `/clients` and `/clients/[id]`

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| CL-1 | Stats: active clients, prospects, open roles, fees in play | M | |
| CL-2 | Filter All / Active / Prospects; search by company or role | M | |
| CL-3 | **Cards / List toggle** | M | Cards: logo, status, TOB chip, open roles with people stack. List: client, status, terms, open roles, people, in pipeline, fees in play; row opens client |
| CL-4 | Add client dialog | M | Logged; prospects can be marked active by the Owner |
| CL-5 | Client detail: roles with funnel (applicants → shortlisted → pipeline → placed) and people per role | M | Role anchors `#job-id` work from search |
| CL-6 | Client detail: contact, terms (fee, TOB), documents, activity | M | |
| CL-7 | **Client detail: Invoices** — paid / outstanding / draft totals and rows; "Chase N" asks Amara for a reminder to the contact | M | Reachable from Home invoice rows via `#invoices`; empty state for clients without invoices |
| CL-8 | Post a new role | S | Channels: Seek, LinkedIn, Indeed, Website, or headhunt |

### 8.6 Applicants `/applicants`

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| AP-1 | Tabs To review / Shortlisted / Declined with counts; filter by job | M | |
| AP-2 | Sync applications | M | Pulls 3 new applicants once ("Up to date" after); Amara screens them; logged as system + amara |
| AP-3 | **Amara's screening**: fit pill, one-line verdict, matches, gaps, experience | M | Provenance line: "Read from {sources}. See the original" |
| AP-4 | **Original application** tab, by source | M | Email: From / To / Date / Subject, body, attachments. Seek / Indeed / Website: contact, employer questions and answers, cover letter, files. LinkedIn Easy Apply: two questions + CV, no letter. Referral: referrer's note + CV |
| AP-5 | File preview | S | CV renders as a page (name, headline, contact, experience, highlights); other files show a placeholder |
| AP-6 | View choice sticks across applicants | S | A recruiter reading originals keeps reading originals |
| AP-7 | Decide: Shortlist (S) / Decline (D), move J / K | M | Shortlist → candidate pool. Decline → honest rejection queued in Follow-ups with the stored reason |

### 8.7 Candidates `/candidates`
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| CA-1 | Pool across clients: pool / contacted / in pipeline, filter by job | M | |
| CA-2 | Reach out, then add to pipeline | M | Creates a deal at Sourced (fee = max(floor, 20%)); a Resourcer hands it to the Owner |

### 8.8 Pipeline `/pipeline` and deals

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| P-1 | Kanban: Sourced → Submitted → Interviewing → Final round → Offer → Placed | M | Column tooltips explain each stage |
| P-2 | Heat bar per deal | M | Decay by stage (cooling / cold hours): Sourced 96/240, Submitted 48/120, Interview 48/96, Final 24/72, Offer 12/36, Placed never |
| P-3 | Filters: all / needs attention, by client; weighted fees in view | M | Weighted = Σ fee × stage odds (5%, 12%, 25%, 50%, 80%) |
| P-4 | Drag a card to change stage | M | Logged, toast confirms |
| P-5 | Card shows Amara's next move (AI tag) | M | |
| P-6 | Deal quick-view drawer and full deal page `/deals/[id]` | M | Stage stepper, details, Amara's read + signals, next move → streamed call notes / message → "Sent, log it" resets heat |
| P-7 | Discussion: notes with @mentions, fee change with approval below floor, approval cards | M | Owner approves/rejects inline; all logged |
| P-8 | Deal documents and activity | M | "Generate" jumps to Documents for this deal |

### 8.9 Follow-ups `/follow-ups`

| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| F-1 | Inbox grouped Overdue (≥3 days) / Recent, with kind (rejection, no news, progress, on hold, keep warm) | M | |
| F-2 | **Composer starts blank** | M | Placeholder invites writing or drafting; Send disabled while empty |
| F-3 | **Draft with Amara** | M | Generates only on click, in the chosen tone (Direct / Warm / Brief) and channel (SMS / Email / LinkedIn); becomes "Redraft"; changing tone/channel does not regenerate by itself |
| F-4 | Edit freely, send with button or ⌘↵ | M | Sent person leaves the inbox; toast counts down remaining; logged |
| F-5 | "What Amara used" panel | M | The facts behind the draft (e.g. reason for rejection, what they did well) |
| F-6 | Email shows subject; SMS shows character count | S | |

### 8.10 Documents `/documents`
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| D-1 | Generate TOB, submission, offer recap, invoice from a deal | M | Rendered as a paper preview; invoice by a non-Owner goes to approval when the rule is on |
| D-2 | Log received documents (offer letter, contract, signed TOB, reference, other) | M | From Documents, a deal or a client |
| D-3 | Register with status (draft, sent, signed, received, pending approval, approved) | M | Advance status inline; preview dialog |

### 8.11 Team `/team`
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| T-1 | **Members & rules** tab: members with live deal counts, View as, pending approvals, approval rules (fee floor on/off + %, invoice sign-off), permission matrix | M | Only the Owner edits rules |
| T-2 | **Leaderboard** tab: Your team / HeyAmara network | M | Rank, name, role or agency, score, five metrics, submittal → interview %, billed; "You" highlighted; Amara insight line; "Explain the gaps" |

### 8.12 Audit log, Learnings, Tours, Notifications
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| X-1 | Audit log: filter by category, member, text; export CSV / JSON (Owner only); export is logged | M | Events can't be edited |
| X-2 | Learnings: 3 tracks, 13 placeholder lessons (video / reading / quiz), progress, "continue where you left off" | S | Quiz pass marks lesson done |
| X-3 | Tours on every page via `?` or help button | M | 69 steps across 15 tours |
| X-4 | Notifications: "Waiting on you" | S | |

## 9. AI behaviour

| Surface | Trigger | Input context | Output | Human control |
|---|---|---|---|---|
| Home "Today" line | Page load (static text in prototype; cached daily summary in production) | Desk-wide signals | One sentence | — |
| Ask drawer / Chat | User asks | Page context + record + question | Text + blocks + follow-ups | Links only; nothing sent automatically |
| Follow-up draft | **Click "Draft with Amara"** | Follow-up facts, tone, channel | Message | Edit, then Send |
| Deal next move | Click | Deal signals and timeline | Call notes or message | "Sent, log it" |
| Applicant screening | On ingest (sync) | CV, letter, answers vs job brief | Fit, verdict, matches, gaps | Shortlist / decline is human |
| Search lenses | Typing | Desk data | Filtered records | — |
| Client invoice chase | Click "Chase" | Client's unpaid invoices + contact | Reminder draft | Send from drawer |

**Rules:** label AI content with the gradient; never send or change state on the user's behalf; always show sources where a draft uses facts; generate on intent.

## 10. Content and tone

- Plain, warm, specific. Numbers over adjectives ("8 clients have gone quiet").
- Honest about bad news (rejection drafts include the real reason and a genuine positive).
- Australian context: A$, Sydney / Melbourne, Seek, TOB, rebates.
- Empty states teach the next action rather than show zeros.
- Project documentation and new authored interface copy are written in English. Preserve intentional product greetings and quoted source material; do not silently translate existing UI in a documentation-only change.

## 11. Non-functional requirements

| Area | Requirement |
|---|---|
| Responsiveness | Works at 375px, 768px, 1280px, 1440px. Wide tables scroll inside their card |
| Accessibility | Keyboard reachable; roles on tabs / dialogs / listbox; `aria-current`, `aria-selected`, `aria-expanded`; focus-visible ring; reduced-motion respected |
| Performance | Static prerender for list pages; instant navigation (Activity keeps 3 routes alive) |
| Shortcuts | ⌘K search, ⌘J Ask, `?` tour, Esc close, S / D / J / K applicants, ⌘↵ send |
| Privacy (prototype) | No real personal data; all names and companies are fictional |
| Demo stability | Fixed "now"; reload resets state |

## 12. Hidden or parked

- **The Sum** (`/sum`): billings vs take-home calculator (billings, base, commission rate and threshold; own-desk billings kept and costs; difference per year and over three years). Hidden from the menu and search on 11 Oct; route, tour and drawer context still work.

## 13. Success metrics (if shipped)

| Metric | Target direction | Why |
|---|---|---|
| Time from login to first action | ↓ | Home should lead to work |
| Share of AI asks started from a page element vs blank chat | Observe by task and outcome | Shows context-entry usage; does not by itself validate the drawer layout |
| Median days a person waits for an update | ↓ | Test the communication hypothesis |
| Deals with missed promised updates or overdue feedback | ↓ | Measure observable commitments; elapsed time alone is not loss probability |
| Drafts generated : drafts sent | Observe alongside edits and usefulness | A ratio near 1 can suggest efficient use; a low sent/generated ratio may indicate unnecessary generation |
| Applicant review time per person | ↓ | Screening + original side by side |
| Days sales outstanding on invoices | ↓ | Chase from the client page |
| Day 1 → first client added (days) | ↓ | First-run experience |

## 14. Release plan

| Phase | Scope | Exit criteria |
|---|---|---|
| 0. Prototype (now) | Core home challenge in §16; existing §8 desk features are supporting extensions, all mocked | Discovery acceptance reviewed, DC-1 gap resolved or clarified; demo, source and explanation submitted |
| 1. Private beta | Real auth + DB, Ask drawer and follow-up drafts on a real model, Gmail send | 10 recruiters use it daily for 2 weeks |
| 2. Sourcing | Job board and inbox ingestion, CV parsing, screening | Applicants arrive without manual upload |
| 3. Money | Invoices from placements, Xero sync, e-signature for TOBs | DSO measured per agency |

## 15. Risks and open questions

| # | Risk / question | Mitigation / next step |
|---|---|---|
| 1 | Drawer-only Home does not meet the literal centred-input requirement | DC-1; compliant Home variant or explicit clarification before submission |
| 2 | Mock intents feel brittle with free typing | Suggestion chips steer; fallbacks stay on topic |
| 3 | Should Tasks be its own page? | Recommendation: no. Client follow-ups join Follow-ups; Home Tasks stays a digest. Waiting on Rayhan |
| 4 | How much of Amara's screening do clients see on submission? | Decide before Phase 2 |
| 5 | AI pricing: per-seat allowance vs pay-per-draft | Measure drafts generated vs sent in beta |
| 6 | Candidate data in CVs is personal information | Consent, retention and deletion policy before Phase 2 |

## 16. Discovery coverage and acceptance

This section reconciles the 42 board notes with the PRD and Tech Plan. **Core** is the minimum home challenge; **Support** strengthens that loop; **Later** belongs outside the 48-hour critical path. Existing surrounding-desk features remain documented; their presence does not make every new proposal implemented.

| Requirement | Board coverage | Acceptance / decision | Priority | Technical coverage |
|---|---|---|---|---|
| DC-1: combined home and chat entry | E1, E7, H3, F1, T1, Q5 | Centred Home composer or explicit reviewer clarification; contextual entry remains available. Record deviation honestly | Core | Tech Plan §10.1–10.2 |
| DC-2: preserve dashboard information | E2, E4, H4, F2, T3 | Calls, submittals, interviews, offers, placements, tasks, invoice totals/list, leaderboard/empty state, period selection and Overview/Analytics are reachable; range and scope are explicit | Core | §10.3 |
| DC-3: contextual chat and return | U2, P3, H3–H4, F4, T1, Q3 | Selected record, period and scope are visible; context can be removed; return preserves the originating selection and unsent work within the session | Core | §10.2 |
| DC-4: new-member guidance | E5, U1, P1, H1, F5, T4, Q1–Q2 | Experienced recruiter sees one useful next step, optional checklist and honest empty states; returning member sees active work rather than onboarding prompts | Support | §10.1 |
| DC-5: explain attention | E3, E6, U2, P2, P4, H2, F3 | Recommendation names the reason, relevant record, owner where known and next action. No claim of likely loss based only on inactivity | Support | §10.4 |
| DC-6: reviewable AI output | H5, F8, T2, Q4, Q6 | Generate on request; show supplied facts and missing information; edit/review before an explicit simulated action; label AI/data as mocked | Core demo loop | §10.2, §10.5 |
| DC-7: invoice actions | U4, P6, F6 | Draft → inspect missing facts; outstanding/overdue → review reminder; paid → inspect record. Status is not inferred from age or a zero amount | Support | §10.3, §10.5 |
| DC-8: team and stakeholder boundaries | U3, U5, P5, F7, Q1 | Distinguish my/team scope and assignee; validate coaching, mentorship and admin needs separately; no new persona or permission role assumed | Later | §10.3–10.4 |
| DC-9: scope and evidence | E5–E7, T5, Q1, Q5–Q6 | Sources and hypotheses remain distinguishable; calculator excluded from this scope; no backend, real model, live sending or deployment claimed | Core | §10.6 |
| DC-10: usability validation | Q2–Q4 | Run the tasks below and record observed outcomes; no invented interview findings or completed-test claims | Core review gate | §5.3, §10.6 |

### 16.1 Prototype review tasks

| Task | What to observe | Pass condition |
|---|---|---|
| Choose a first step on Day 1 | First action, hesitation, chosen prompt and reason | User finds a useful start without needing to invent a prompt |
| Identify today's priority on an active desk | Selected task and explanation | User can explain why it needs attention using visible facts |
| Find a metric and an invoice | Navigation, range and status interpretation | Required dashboard information is reachable and understandable |
| Open chat from a task and return | Context awareness, navigation and draft preservation | User identifies the attached record and returns without losing session work |
| Request and edit a follow-up draft | Source inspection, missing facts and action understanding | User distinguishes facts from suggestions and knows sending is simulated |

Record fixture, viewport, participant or evaluator, observation, outcome and follow-up decision. Browser functional checks do not substitute for user research. A failed task creates a concrete follow-up item rather than an unsupported success claim.
