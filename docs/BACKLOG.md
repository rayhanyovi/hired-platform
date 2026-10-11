# Backlog: Amara Desk

**Last updated:** 11 Oct 2026, 14:30 WIB · Challenge received 11 Oct ~10:40 WIB, due within 48h (~13 Oct 10:40 WIB)

**Status:** ✅ done · 🟡 waiting on a decision · ⬜ to do
**Priority:** P0 before submission · P1 strengthens the demo · P2 product roadmap
**Dates** are WIB, from [BUILD_LOG](BUILD_LOG.md). S1 = Wed 8 Oct, S2 = Sat 11 Oct. A session without a time means the exact moment wasn't recorded; `~` means approximate.

---

## Open

### P0: Submission

| ID | Item | Status | Notes |
|---|---|---|---|
| B-001 | Short explanation for the CTO | ⬜ | Problem, the drawer vs centred chat decision (PRD §6), AI-on-request stance, what's mocked |
| B-002 | Deploy the demo | ⬜ | Vercel. **Ask Rayhan first**, the URL becomes public |
| B-003 | Share source code | ⬜ | Repo access or zip; mention the hidden `/sum` |
| B-004 | Click-through QA at 1440px and 375px | ⬜ | Home Day 1 / Day 30, drawer from each page, ⌘K, Follow-ups draft, Applicants original, Team leaderboard, client invoices |
| B-005 | Rename Home Tasks companies to real desk clients/prospects | ⬜ | Still dummy (Eclipse Solutions, Citadel Group…); invoices were already fixed |
| B-008 | Close the centred-input Home submission gap | ⬜ | Provide a compliant Home variant, or record explicit clarification from Gabriel. `/chat` alone does not satisfy PRD DC-1 |
| B-029 | Discovery acceptance and evidence review | ⬜ | PRD §16.1 / TECH_PLAN §5.3: first step, priorities, information inventory, context-to-chat/return, editable drafts, simulation disclosure. Record actual observations |

### P1: Demo polish

| ID | Item | Status | Notes |
|---|---|---|---|
| B-006 | Tasks → Follow-ups | 🟡 | No separate Tasks page. Follow-ups gets a Clients filter for quiet clients; Home Tasks rows link there; "See all" → Follow-ups. Waiting on Rayhan |
| B-007 | Clients list: outstanding invoices column | ⬜ | |
| B-009 | Persist demo state to `localStorage` | ⬜ | Reload resets everything today |
| B-010 | Follow-ups: editable subject line | ⬜ | |
| B-011 | Applicants: highlight the CV lines behind each match / gap | ⬜ | |
| B-012 | Leaderboard range filter (week / month / all) | ⬜ | |
| B-013 | Tour copy review after S2 changes | ⬜ | New steps for team views, applicant views, client invoices |
| B-014 | Unit + E2E tests | ⬜ | Vitest for `lib/`, Playwright for the five core loops (TECH_PLAN §5.2) |
| B-015 | Real "Recent" conversations on `/chat` | ⬜ | Sidebar is a placeholder |
| B-030 | Context lifecycle and draft preservation | ⬜ | Proposed TECH_PLAN §10.2 contract: selected-record/range/scope context, removal, return, cancellation, stale-response handling and retry |
| B-031 | Explainable attention and scoped data definitions | ⬜ | Proposed TECH_PLAN §10.3–10.4: comparison denominator, reason/owner/next action, invoice status/due-date rules; label demo risk heuristics |

### P2: Roadmap

| ID | Item | Status | Notes |
|---|---|---|---|
| B-016 | Auth + Postgres + RLS per agency | ⬜ | TECH_PLAN §6.1 |
| B-017 | Server Actions replacing store actions (same names) | ⬜ | |
| B-018 | `/api/ask` and `/api/draft` streaming on Claude with read/draft-only tools | ⬜ | Keep the `Block` contract |
| B-019 | Email ingestion, then Seek / LinkedIn / Indeed | ⬜ | Replaces `syncApplicants` |
| B-020 | CV parsing + screening worker, cached per brief version | ⬜ | |
| B-021 | Sending via Gmail / Outlook / SMS / LinkedIn, logged | ⬜ | |
| B-022 | Invoices from placements, Xero sync, due dates and overdue | ⬜ | |
| B-023 | E-signature for TOBs and offers | ⬜ | |
| B-024 | AI usage dashboard for owners (drafts generated vs sent) | ⬜ | |
| B-025 | Cross-agency network leaderboard (opt-in) | ⬜ | |
| B-026 | Learnings CMS with real content | ⬜ | |
| B-027 | Bring The Sum back as onboarding or a lesson | ⬜ | |
| B-028 | Privacy: consent, retention, deletion for candidate data | ⬜ | |

---

## Done

### Discovery and setup (S1)

| ID | Item | Date |
|---|---|---|
| D-001 | Interview strategy and company research (heyamara.com, founders on LinkedIn) | S1 00:08 |
| D-002 | Design thinking framework: who the recruiter is, where deals die, where AI helps | S1 00:27 |
| D-003 | Next.js 16 + React 19 + Tailwind v4 scaffold in `hired_platform` | S1 00:39 |
| D-004 | Plan: tools only, no landing page, HeyAmara visual language, everything mocked | S1 00:41 |
| D-005 | Fixed demo clock (Fri 9 Oct 2026, 08:40 Sydney) so relative times never drift | S1 00:41 |

### Shell and navigation

| ID | Item | Date |
|---|---|---|
| D-010 | Rail sidebar with groups (Recruit, Business, Agency), counts and attention dots, tooltips, expand | S1 00:41 |
| D-011 | Top bar: page title, notifications ("Waiting on you"), account menu with **View as** (demo roles) | S1 01:25 |
| D-012 | Mobile header + bottom nav (Chat added to it in S2) | S1 |
| D-013 | Toasts for every confirmed action | S1 |
| D-014 | Command palette (⌘K) v1 | S1 |
| D-015 | Fix: focus outline on the ⌘K input; base styles moved to `@layer base` | S1 01:09 |
| D-016 | Help button + per-page guided **Tours** (`?`), spotlight and step cards | S1 02:06 |
| D-017 | Pipeline tour explains every stage (Sourced → Placed) | S1 02:12 |
| D-018 | Nav reorganised: Home, Chat on top; Dashboard removed | S2 ~12:10 |
| D-019 | **The Sum hidden** from menu and search; route kept | S2 14:10 |

### Home and the CTO challenge (S2)

| ID | Item | Date |
|---|---|---|
| D-020 | Design system aligned with HeyAmara's real dashboard and chat (surfaces, metric colours, pink primary, gradient = AI, invoice rows) | S2 10:42 |
| D-021 | Home v1: chat-first with centred composer, Day 1 / Day 30 states, transition into conversation | S2 ~11:00 |
| D-022 | Shared Composer: rotating placeholders, attach menu, mode menu (Chat / Search / Draft) | S2 ~11:00 |
| D-023 | Thread with rich blocks: candidates, drafts, invoices, metrics, steps, linked lists | S2 ~11:00 |
| D-024 | Mock Amara replies with ~21 intents and follow-up chips (`amaraReply`) | S2 ~11:00 |
| D-025 | Dedicated **/chat** page: empty "Olá" state, composer animates from centre to bottom, Recent sidebar | S2 11:41 |
| D-026 | Dashboard page (tried, then removed in D-030) | S2 11:41 |
| D-027 | Home without chat: greeting, streamed "Today" line, Demo toggle, dashboard | S2 12:04 |
| D-028 | **Ask HeyAmara drawer**: navbar button, ⌘J, context chip, page suggestions, streamed answers, Esc, pushes page aside ≥1280px | S2 12:04 |
| D-029 | Page contexts and handlers for 14 surfaces (`lib/ask.ts`); Home questions routed to the owning page | S2 12:04 |
| D-030 | Overview / Analytics tabs on Home (conversion, fees by month, "Explain"); Dashboard page deleted | S2 ~12:10 |
| D-031 | **Expanded Search ⌘K**: 10 record kinds, ranked, grouped; Amara lenses; questions → drawer; selects record on its page | S2 ~12:10 |
| D-032 | Unified AI style: `AmaraButton` (sm/md/lg) and `AmaraTag`; Chase, Draft all, Explain, Ask, Next move | S2 12:21 |
| D-033 | Metric format "514 ▲144%" with hover Ask | S2 12:23 |
| D-034 | Tasks: hover "Draft" on quiet-client rows, matching First steps' "Start" | S2 12:26 |
| D-035 | Pipeline card next move in AI tag style | S2 12:36 |
| D-036 | Metric card hierarchy redesign (label row → 32px value → quiet trend) | S2 13:37 |
| D-037 | Invoices panel: draft / outstanding / overdue totals, status rows, compact millions, hide-numbers | S2 ~11:00 |
| D-038 | Leaderboard panel: Team / Network; Day 1 shows "You · not ranked yet" | S2 ~11:00 |
| D-039 | Home invoice clients renamed to real desk clients; rows link to `/clients/{id}#invoices` | S2 ~14:00 |
| D-040 | Home leaderboard "See all" → Team → Leaderboard | S2 ~14:00 |

### Clients

| ID | Item | Date |
|---|---|---|
| D-050 | Clients list: stats, Active / Prospects filter, search, cards with roles and people stacks, TOB chip | S1 01:32 |
| D-051 | Client detail: roles with funnel and people per role, contact, terms, documents, activity | S1 01:32 |
| D-052 | Add client dialog; mark prospect active (Owner); post new role | S1 01:32 |
| D-053 | Company logos from `/public/company-logo` | S1 01:53 |
| D-054 | **Cards / List toggle**; list as a table (client, status, terms, open roles, people, in pipeline, fees in play) | S2 13:44 |
| D-055 | **Client Invoices section**: paid / outstanding / draft totals, rows, "Chase N" → Amara reminder draft to the contact | S2 ~14:00 |

### Applicants and candidates

| ID | Item | Date |
|---|---|---|
| D-060 | Applicants: To review / Shortlisted / Declined, job filter, Sync (3 new, screened by Amara) | S1 01:25 |
| D-061 | Amara screening card: fit, verdict, matches, gaps, experience | S1 01:25 |
| D-062 | Shortlist (S) / Decline (D) / move (J / K); decline queues an honest update in Follow-ups | S1 01:25 |
| D-063 | Candidates pool: reach out, add to pipeline (creates a deal), resourcer hand-off | S1 01:25 |
| D-064 | **Original application** tab: email (headers, body, attachments), job board (contact, employer questions, cover letter, files), LinkedIn Easy Apply, referral note | S2 13:44 |
| D-065 | CV file preview rendered as a page; provenance line "Read from…" linking to the original | S2 13:44 |
| D-066 | View choice sticks across applicants | S2 13:44 |

### Pipeline and deals

| ID | Item | Date |
|---|---|---|
| D-070 | Kanban board, drag to change stage, filters (attention, client), weighted fees | S1 00:41 |
| D-071 | Heat bar with stage-specific decay; ranking by fee × odds × coldness | S1 00:41 |
| D-072 | Deal quick-view drawer | S1 00:41 |
| D-073 | Full deal page `/deals/[id]`: stage stepper, details, Amara's read + signals, next move with streamed draft and "Sent, log it" | S1 01:25 |
| D-074 | Discussion: notes, @mentions, fee change with approval below floor, approval cards | S1 01:25 |
| D-075 | Deal documents and activity from the shared event stream | S1 01:25 |

### Follow-ups

| ID | Item | Date |
|---|---|---|
| D-080 | Inbox: overdue / recent, five kinds (rejection, no news, progress, on hold, keep warm) | S1 00:41 |
| D-081 | Composer: tone (Direct / Warm / Brief), channel (SMS / Email / LinkedIn), edit, send, ⌘↵ | S1 00:41 |
| D-082 | "What Amara used" panel; honest rejection drafts with reason and a genuine positive | S1 00:41 |
| D-083 | **Starts blank; Draft with Amara / Redraft** on request (AI cost) | S2 13:44 |

### Documents

| ID | Item | Date |
|---|---|---|
| D-090 | Generate TOB, submission, offer recap, invoice from deal data (paper preview) | S1 01:25 |
| D-091 | Log received documents (offer letter, contract, signed TOB, reference, other) | S1 01:25 |
| D-092 | Register with statuses and inline advance; preview dialog; invoice approval for non-Owners | S1 01:25 |

### Team, audit, learnings

| ID | Item | Date |
|---|---|---|
| D-100 | Team: Owner / Recruiter / Resourcer, approval rules (fee floor, invoice sign-off), permission matrix, pending approvals | S1 01:25 |
| D-101 | Audit log: single event stream, filters (category, member, text), CSV / JSON export (Owner), export logged | S1 01:25 |
| D-102 | Learnings: 3 tracks, 13 placeholder lessons (video, reading, quiz), progress, continue | S1 01:14 |
| D-103 | **Team Leaderboard tab**: team / network, five metrics, sub → interview %, billed, Amara insight, "Explain the gaps" | S2 ~14:00 |
| D-104 | Ask drawer: team leaderboard and client invoice answers | S2 ~14:00 |

### The Sum (now hidden)

| ID | Item | Date |
|---|---|---|
| D-110 | Calculator: billings vs take-home; same desk under your own name; difference per year and over three years | S1 00:41 |
| D-111 | Slider values typeable by hand | S1 01:57 |
| D-112 | Removed "Turn your sum into a post" | S1 01:58 |

### Fixes

| ID | Item | Date |
|---|---|---|
| D-120 | Brief text in paragraph font instead of serif | S1 01:09 |
| D-121 | `AmaraMark` blank on mobile (duplicate SVG ids) → `useId` | S1–S2 |
| D-122 | Duplicate React keys in palette links | S1–S2 |
| D-123 | `params` outside Suspense broke the instant shell | S1–S2 |
| D-124 | `.amara-edge` beating `lg:absolute` → positioned wrapper | S2 12:26 |
| D-125 | "Oldest invoices" not sorted by date | S2 |
| D-126 | Follow-up chips falling through to generic answers → specific intents | S2 |
| D-127 | Metric row overflow at 1280px; mobile value wrapping | S2 13:37 |
| D-128 | Client table status chips wrapping on narrow screens | S2 ~14:00 |
| D-129 | Mock letters: "role" wording, acronym casing, remote location, relocation question for remote roles | S2 ~14:00 |

### Docs

| ID | Item | Date |
|---|---|---|
| D-130 | README reframed around Harvey's three insights | S1 07:31 |
| D-131 | README updated for Home / Ask / Chat / Search | S2 |
| D-132 | PRD, Tech plan, Backlog, Design direction, Build log, Agents handoff | S2 14:10 |
| D-133 | PRD and Tech plan expanded; Backlog lists all done work | S2 14:30 |
| D-134 | Standalone editable HTML design thinking board; evidence, personas, problems, HMW, features, prototype, validation | 11 Oct 2026 |
| D-135 | English PRD and Tech Plan reconciled with discovery board; evidence limits, acceptance mapping, proposed context/data contracts and validation gates | 11 Oct 2026 |
| D-136 | English 15-slide design thinking PPTX with editable text/diagrams and supplied reference screenshots | 11 Oct 2026 |
| D-137 | Retired the alternative design concept; removed stale shell/context dependencies and aligned PRD, Tech Plan and handoff with one product direction | 11 Oct 2026 |
| D-138 | First Home visit automatically starts the tour using a localStorage marker; Home walkthrough highlights the page-specific help button on desktop and mobile | 11 Oct 2026 |
| D-139 | Standard invoice surface, white primary controls with dark text, and shared AI controls with a plum fill, lavender border and Amara mark | 11 Oct 2026 |
| D-140 | Home entrance after reload: centred orb, typed welcome, stage-specific message, hero docking, ordered dashboard reveal and delayed first-visit tour | 11 Oct 2026 |
| D-141 | Partial greeting stays aligned beside the orb; position-only docking prevents text and orb distortion | 11 Oct 2026 |
| D-142 | Slower synchronised 1.35s docking; dashboard stagger runs only after reload and skips tab switches and internal navigation | 11 Oct 2026 |
| D-143 | Clients overview has four coloured icon tiles using the shared Home metric styling | 11 Oct 2026 |
| D-144 | Pipeline hierarchy: stronger stage and candidate headings, secondary fee summaries, clearer filters and amber attention indicators | 11 Oct 2026 |
| D-145 | Audit Trail with real timestamps, actor roles, modules, record IDs, before/after field diffs, related writes, filters and enriched owner exports; tracked collection mutations, Home tasks and lessons | 11 Oct 2026 |
| D-146 | Home Plan my day AI action with prioritised current-desk guidance and new-member steps; shared toolbar select chevrons inset with reserved right padding | 11 Oct 2026 |
