# Build Log: Amara Desk

Times are WIB (UTC+7) and taken from the request timestamps in the working sessions with Claude Code. Each entry is when that part was asked for; the work landed within the same session block. Git has only two commits (`88b68ee` Create Next App, 8 Oct 00:39 · `5ff1fb6` init, 8 Oct 02:19), so this log is the finer-grained history.

## Session 1: Wed 8 Oct 2026 (interview prep → concept build)

| Time | Part | What was built or changed |
|---|---|---|
| 00:08 | Research | Interview strategy for the HeyAmara Frontend Engineer role; company and founder research via heyamara.com and LinkedIn. No code |
| 00:27 | Design thinking | Framework for the product before any brief: who the recruiter is, where deals die, where AI helps |
| 00:39 | Scaffold | `create-next-app` (Next 16, React 19, Tailwind v4) in `hired_platform` |
| 00:41 | **v1 app** | Tools only, no landing page, HeyAmara visual language, everything mocked: Today, Pipeline (heat bars, deal ranking by fee × odds × coldness), Follow-ups (honest updates incl. rejections), The Sum (billings vs take-home), deal drawer, command palette, toasts |
| 01:09 | Type fix | Brief text switched from the serif to the paragraph font |
| 01:09 | Focus fix | Ugly outline on the ⌘K input; base styles moved into `@layer base` |
| 01:14 | Learnings | `/learnings` + lesson pages: lorem-ipsum videos, readings, quizzes |
| 01:20 | Scope review | Reviewed five ideas: documents, team roles, deal page with comments, audit trail, adding deals / email sync |
| 01:25 | Agency features | **Documents** (generate TOB / submission / offer recap / invoice from deal data; log client documents) · **Team** (Owner / Recruiter / Resourcer, approval rules, permissions, view-as) · **Deal page** `/deals/[id]` (stepper, discussion with @mentions and approvals) · **Audit log** with CSV / JSON export · **Applicants** with sync and curation into **Candidates** |
| 01:32 | Clients | `/clients` and `/clients/[id]`: companies, roles they're hiring for, everyone attached to each role |
| 01:53 | Client logos | Logo-ipsum images from `/public/company-logo` |
| 01:57 | The Sum | Slider values typeable by hand |
| 01:58 | The Sum | Removed "Turn your sum into a post" |
| 01:59 | Docs | README updated |
| 02:06 | Tours | Help button + per-page guided tours (`lib/tours.ts`, `data-tour` targets) |
| 02:12 | Pipeline tour | Each stage explained (Sourced, Submitted, Interview, Final, Offer, Placed) |
| 07:31 | Positioning | README reframed around problems Harvey writes about: "Time kills deals", "You didn't ghost me", "I've never done that sum" |
| 09:06 | Follow-up | Post-interview email to Gabriel (tech). No code |
| 15:13 | Side task | Two-minute intro video script. No code |

## Session 2: Sat 11 Oct 2026 (CTO frontend challenge)

| Time | Part | What was built or changed |
|---|---|---|
| 10:42 | **Challenge received** | "Combine dashboard and AI chat entry point into one redesigned home." First step: align the design system with HeyAmara's real dashboard and chat (surfaces, metric colours, pink primary, gradient = AI, invoice row colours) |
| ~11:00 | **Home v1** | Chat-first Home with centred composer, Day 1 (new member) and Day 30 (established desk) states, transition into a conversation |
| 11:41 | Split surfaces | Separate `/chat` page (chat only, recent history) and a Dashboard page; combined Home kept |
| 12:04 | **Ask HeyAmara** | Removed chat from Home. "Ask HeyAmara" in the navbar opens a right drawer that reads the current page's context (`lib/ask.ts`). ⌘J shortcut. Every ask on Home opens the drawer |
| ~12:10 | Dashboard → Analytics | Dashboard page deleted; Home gets Overview / Analytics tabs |
| ~12:10 | **Search** | ⌘K search across every record type with Amara lenses ("going cold", "unsigned", "strong fit"); questions go to the drawer |
| 12:21 | AI style | All AI actions unified into `AmaraButton` / `AmaraTag` (Chase, Draft all, Explain, Ask…) |
| 12:23 | Metric format | "514 ▲144%" format; Ask button appears on hover |
| 12:26 | Tasks | Draft tasks get a hover "Draft" action like First steps' "Start" |
| 12:36 | Pipeline cards | Next-move line on cards switched to the AI tag style |
| 13:37 | Metric cards | Visual hierarchy redesign: icon + label row, 32px value, quiet trend line |
| 13:44 | Clients | Cards / List toggle with a full table view |
| 13:44 | Applicants | "Amara's screening" next to the original application: email body + attachments, or job-board screening answers, cover letter and CV preview (`lib/application.ts`) |
| 13:44 | Follow-ups | Composer starts blank; "Draft with Amara" / "Redraft" generates on request (AI cost) |
| ~14:00 | Team leaderboard | Team page tabs: Members & rules / Leaderboard (team or network); Home leaderboard "See all" |
| ~14:00 | Invoices → Clients | Invoice clients now match real desk clients; client page Invoices section (paid / outstanding / draft) with Amara chase draft |
| ~14:00 | Tasks (decision) | Recommendation: no Tasks page; client follow-ups join Follow-ups, Home Tasks stays a digest. Pending Rayhan's go-ahead |
| 14:10 | The Sum | Hidden from menu and search; route kept |
| 14:10 | Docs | PRD, Tech Plan, Backlog, Design Direction, Build Log, Agents Handoff in `docs/` |
| 14:30 | Docs | PRD expanded (requirement IDs, acceptance criteria, personas, permissions, AI behaviour, release plan); Tech Plan expanded (store actions and events, domain logic, AI contract, data model, migration, cost controls, phases); Backlog lists all done work with IDs |

## Checks run at each milestone

`npx tsc --noEmit` · `npx eslint .` · `npx next build` · DOM checks in the browser preview (dev server on port 3100).

## 11 Oct 2026 — Standalone design thinking board

Added `public/design-thinking-board.html`: 42 editable sticky notes across evidence, personas, problems, HMW, features, prototype and validation. Includes search, persona/type filters, relationship highlighting, zoom/pan, column moves, browser storage, HTML/JSON export and print styling. Separates Gabriel's central composer requirement from the existing drawer decision; research assumptions are labeled.

Validation for this artifact: JavaScript syntax check; browser search, editor, persistence through reload, relationship highlighting, and HTML export handler. At 375px the document width remains 375px; the canvas scrolls internally. Browser reported no console errors/warnings. Download-file capture timed out, so the exported file was not reopened during validation. Application UI was not changed; application build checks were not rerun for this standalone artifact.

## 11 Oct 2026 — Discovery coverage in PRD and Tech Plan

Reconciled the design thinking board with the English PRD and Tech Plan. Added evidence limits, persona/problem/feature mapping, HMW questions, ten discovery acceptance requirements and a usability review matrix. Corrected unsupported quote attribution and identified the centred-input Home requirement as an open submission gap rather than treating `/chat` as compliant. Added proposed technical contracts for context lifecycle, scoped metrics, invoice actions, explainable attention and human-reviewed simulated actions. Preserved existing implementation decisions and hidden routes; no application code changed.

Document review checks cover local links, board-ID coverage and requirement references. Runtime build/test results are not claimed for this documentation-only update. English documentation and new authored copy are recorded as a project instruction in the handoff.

## 11 Oct 2026 — English design thinking presentation

Created `output/heyamara-design-thinking.pptx`, a 15-slide editable deck covering the challenge, reference screens, evidence limits, personas, problems, HMW, priorities, information preservation, prototype flow, proposed technical contracts, the Home composer gap, validation and AI usage. Sources and research limitations are included in speaker notes. Screenshots remain embedded images; authored text and diagrams use native slide objects.

Rendered and visually reviewed all slides, corrected a wrapped problem identifier, and ran presentation package, geometry, font-policy and import checks. These checks do not claim validation in native PowerPoint. Application code was unchanged.

## 11 Oct 2026 — Single product direction

At Rayhan's request, retired the alternative design concept. Its route and component folders were already empty; removed those folders, the shared shell's stale stylesheet import and route detection, and the Ask context route alias. Updated PRD, Tech Plan, Backlog and agent instructions to describe one product direction.

Validation: TypeScript (`tsc --noEmit`), ESLint and production build passed. The production route list contains no alternative design route.

## 11 Oct 2026 — AI interaction rationale in the presentation

Created `output/heyamara-design-thinking-ai-native.pptx`, a 17-slide English revision. Added the rationale for consistent AI button styling and an AI-native feeling, persistent top-right chat access, and collecting active-record context for future LLM requests using Udin Forger as an illustrative example. Updated the drawer comparison slide. Preserved the original deck.

Reviewed the changed slide renders and confirmed the first eleven slides remain visually identical. Package, geometry, font and import checks passed. The LLM flow remains a proposed integration, not a claim of live model behavior.

## 11 Oct 2026 — First-visit Home tour

Added localStorage marker `heyamara:home-tour-seen` with value `true` when the automatic Home tour starts. The first visit to `/` opens the tour after mount. Subsequent visits and reloads keep it closed unless the user starts it manually. Blocked storage falls back to one automatic opening per mounted app session. The Home walkthrough now highlights the question-mark button and explains that each page has its own guide. Both desktop and mobile help controls expose the tour target.

Validation: TypeScript, ESLint and production build passed. In the production browser preview, first access automatically opened the Home tour, its second step highlighted the help control, reload suppressed automatic replay, manual replay worked, and the Clients help control opened its own walkthrough. Screenshot: `.artifacts/home-tour-help.png`. Mobile target is implemented but was not separately browser-tested.

## 11 Oct 2026 — Neutral surfaces and clearer action styles

Invoice rows now use the standard `surface` background with status colours confined to the left edge and tag. Primary buttons and custom primary links use white fills with dark text, including New invoice, pipeline actions, lesson actions and composer submission. Shared Amara buttons use a subtle plum gradient, a clearer lavender border and pale lavender text with the existing Amara mark. Hover and active states preserve the same visual language. Updated Design Direction to reflect these decisions.

Validation: TypeScript, ESLint and production build passed. Browser style inspection confirmed matching invoice surfaces, white primary fills with dark text, and the new AI fill and border. Reviewed `.artifacts/invoice-button-refresh.png` in the production preview.

## 11 Oct 2026 — Home welcome entrance

Added an entrance that runs on the first Home visit after each reload. The orb starts centred, moves aside for a character-typed `Welcome, {firstName}`, then Amara presents the appropriate New member or Day 30 message. The same hero moves into its normal Home position. Overview and metrics appear first, followed by Tasks, Invoices and Leaderboard at staggered intervals. An in-memory desk flag prevents replay on internal navigation. Reduced-motion preferences bypass the introduction. The first-visit localStorage tour marker remains separate, and the automatic tour now waits until the hero and all panels finish entering.

Validation: TypeScript, ESLint and production build passed. Browser checks observed the orb-only state with no panels or tour, partial character typing, staged panel appearance, and final readiness. The first-visit tour opened after readiness. Reload replayed the entrance without repeating the tour, and navigation back from Clients kept Home ready. Both stage messages and the New member fixture were checked. At 375px, the entrance had no horizontal overflow. Browser console reported no errors or warnings. Reviewed desktop and mobile screenshots in `.artifacts/home-entrance-*.png`. Reduced-motion behavior is implemented but was not separately exercised in the browser.

## 11 Oct 2026 — Entrance alignment and message timing

Corrected the welcome row by removing the orb’s independent layout animation, keeping the heading directly beside it on one centreline. The greeting now completes in the centre, pauses, and docks before Amara’s message begins. A hidden message-height reservation prevents the heading from shifting again when the summary appears. Once the hero settles, the purple sky wrapper contracts to 65% scale and fades to 50% opacity.

Validation: TypeScript, ESLint and production build passed. Browser measurements confirmed matching orb and heading vertical centres and approximately 12px of visual separation. The centred state contained no summary, the docking state hid the reserved summary, and the settled state revealed it. The final glow measured scale 0.65 and opacity 0.5. Browser console reported no errors or warnings. Reviewed `.artifacts/home-entrance-aligned.png` and captured `.artifacts/home-entrance-docked.png`.

## 11 Oct 2026 — Restore live preview action styling

The live development preview served stale CSS and blocked dev resources requested from `127.0.0.1`. Restarted the preview and explicitly allowed that loopback hostname in Next.js development configuration. The existing shared action styles now render correctly: New invoice has a white fill and dark text; Chase has the plum fill, lavender border and Amara mark.

Validation: TypeScript, ESLint and production build passed. In the development preview on port 3100, Home completed its entrance and computed styles confirmed both invoice action treatments. Screenshot: `.artifacts/invoice-buttons-live.png`.

## 11 Oct 2026 — Partial greeting alignment and undistorted docking

Left-aligned the typing layer inside the reserved greeting width and centred it vertically beside the orb. Changed the nested hero layout animations to position-only movement, with a content-sized greeting row, so docking translates the greeting without scaling the text or orb.

Validation: TypeScript, ESLint and production build passed. Live browser checks during partial typing measured matching vertical centres and approximately 12px separation. During docking, the orb retained a width-to-height ratio of 1 and all layout transforms used unit scale. Reviewed `.artifacts/home-greeting-partial-fixed.png` and `.artifacts/home-greeting-docking-fixed.png`.

## 11 Oct 2026 — Slower docking and reload-only panel reveal

Unified all greeting docking movement at 1.35 seconds with matching easing, so horizontal and vertical translation follow the same progress between the centre and the final position. The message starts after that movement completes. Overview and panel entrance animations now run only during the initial entrance phase; switching Overview/Analytics or returning Home within the session renders them immediately.

Validation: TypeScript, ESLint and production build passed. Browser timing measured 1,347ms between docking and message. Overview/Analytics switching and Clients-to-Home navigation both rendered invoices with opacity 1 and no transform. Reload replayed docking. Screenshot: `.artifacts/home-tab-switch-no-reveal.png`.

## 11 Oct 2026 — Clients overview icons

Added coloured icon tiles to Active clients, Prospects, Open roles and Fees in play, using building, prospect search, briefcase and banknote glyphs. Extracted the existing Home metric tile rendering into a shared component so both pages retain matching tile styling.

Validation: TypeScript, ESLint and production build passed. Browser inspection confirmed all four glyphs and coloured backgrounds on `/clients`. Reviewed `.artifacts/clients-overview-icons.png`.

## 11 Oct 2026 — Pipeline visual hierarchy

Strengthened stage headings, separated deal counts into badges and placed stage fees on a secondary line. Candidate names are larger and semibold, with long names wrapping; role and client details remain secondary. Card footers separate activity and fees from identity. Attention cards have an amber edge and explicit label above the existing Amara suggestion. The weighted-fee summary has a clearer label, and a divider separates filters from the board. Existing board actions and drag handlers remain in place.

Validation: TypeScript, ESLint and production build passed. Browser checks confirmed six attention deals, two Kestrel Robotics deals under the client filter, and opening/closing the Elle Dawson drawer. Reviewed `.artifacts/pipeline-hierarchy.png`. Drag-and-drop was not separately exercised.

## 11 Oct 2026 — Field-level Audit Trail

Expanded `/audit` with second-level WIB timestamps, actors and roles, source modules, record names and IDs, operation types, searchable field values and expandable before/after comparisons. Tracked collection setters capture nested field changes before the action logs its event, grouping related records without duplicating the existing activity stream. Added explicit changes for approval rules, Home tasks and lesson completion. Live events use real wall-clock time. Incoming applications are individually logged under System. No-op guards prevent duplicate stage/status transitions. CSV/JSON exports include diffs and fee-change reasons; Owner-only export controls remain. Historical fixture rows disclose missing snapshots, and the page states that demo history resets on reload.

Validation: TypeScript, ESLint and production build passed. Diff assertions covered nested fields, create/update/remove, no-op updates, unchanged snapshots and fee formatting. Browser tests verified a stage change with before/after values, Sam and Jordan actor attribution, a shortlist's applicant update plus candidate creation, related-module filtering, actor filtering and disabled export controls for Jordan. Parsed a filtered JSON download and confirmed the actor, source module and both records. Screenshot: `.artifacts/audit-trail-stage-change.png`. Other wired mutation paths were reviewed in source but not individually browser-tested. Backend persistence and tamper resistance remain outside this frontend prototype.

## 11 Oct 2026 — Home daily plan and dropdown spacing

Added the shared Amara-style Plan my day action next to Home's visibility and time-range controls. It opens the contextual Ask drawer with a prioritised suggested plan: the deal with the greatest risk value, incomplete client follow-ups, waiting candidate updates and the dashboard's draft invoice. New members receive their incomplete first steps in order. Guidance uses current in-memory desk state and existing invoice fixtures; AI replies remain simulated. The shared compact select style replaces the native arrow with an inset chevron, reserves 32px on the right and retains native keyboard/select behaviour. Drawer message IDs now use UUIDs to avoid collisions after development refreshes.

Validation: TypeScript, ESLint and production build passed. Browser checks verified Day 30 priorities, new-member steps, Home context, and switching to This week with updated metrics. Computed dropdown styles showed 32px right padding and the chevron 10px from the edge. Screenshot: `.artifacts/home-daily-plan-controls.png`.

## 13 Oct 2026 — Merge with the staging feature set

Rayhan reviewed HeyAmara's staging app (no source, staging access only) and asked to keep building this project while adopting what staging does better. Kept from this project: Chat, Documents, Audit trail, Learnings, the rail sidebar and the existing design direction. Taken from staging: one simplified Candidates list, Calendar, Communication, Tasks on any record, fuller Analytics, a Sales tab, and a Prospects page. Clients and Prospects now sit together under Business in the rail.

- **Candidates** (`/candidates`): applicants, the shortlist, the pipeline and people waiting on an update are one list with one status per person (`lib/people.ts` builds the view over the existing applicant → candidate → deal records, so deal pages, approvals and documents are untouched). Table and Board views; status menu moves people through whichever records they need (`setPersonStatus`). Clicking a row expands it in place: profile, Amara's screening or deal read, history, original application, tasks and notes. `/applicants` and `/pipeline` redirect here.
- **Prospects** (`/prospects`): stages New → Interested → Follow up → Meeting → Negotiation → Terms sent → Terms signed; table and board; expanding rows with contacts, Amara's "Find people at…" (on request), history, tasks and notes; "Make them a client" once signed. Nine new seed prospects. Clients now lists active clients only.
- **Calendar** (`/calendar`): day, week and month; interviews, meetings, calls, follow-ups, start dates, plus tasks on their due day; type filters, "only mine", event details and a New event dialog.
- **Communication** (`/communication`): email, SMS, LinkedIn and WhatsApp threads, call log, Starred and Sent; "No reply yet" flags anything sent 3+ days ago with a "Follow up?" nudge; Amara drafts replies and nudges on request. The Follow-ups composer lives on as the "Waiting on you" folder. `/follow-ups` redirects here.
- **Tasks and notes** on clients, prospects and candidates (`lib/tasks.ts`, store `addTask` / `toggleTask` / `removeTask` / `addNote`). Home's Tasks panel now shows every real task with a chip back to its record. The dummy quiet-client companies were renamed to real prospects and clients (B-005).
- **Home Analytics** rebuilt with Revenue, Lead generation, Conversion and Growth sections; new **Sales** tab (dials, calls booked, show/close rates against targets, closer and setter tables). Small chart kit in `components/home/charts.tsx` with hover and keyboard readouts.
- Search, Ask HeyAmara contexts, notifications, tours and the mobile bottom nav updated for the new pages.

Validation: TypeScript, ESLint and production build passed. Browser checks at 1440px: Candidates table, row expansion, board, status change from Applied to Screening (stats and weighted fees updated); Prospects expansion and Find people; Calendar week view, event details, all-day overflow, New event; Communication folders and a streamed reply draft; Home Analytics and Sales; Home task chip opening the right Candidates row. At 375px no page scrolls horizontally on Home, Candidates, Prospects, Calendar, Communication or Clients. `/applicants`, `/pipeline` and `/follow-ups` return 307 to their new homes. Drag-and-drop on the boards was not exercised in the browser.


## 13 Oct 2026 — Candidates profile, collections and required pipeline forms

Kept Amara Desk's own design direction, using staging only to inspect all nine form-based status workflows. Added quiet status row washes, removed the Tasks table column, made role/location/expected pay editable in the row, and made the full recruiter-managed professional profile the default expanded tab. Profiles cover experience, education, certifications, skills, languages, links, compensation, availability and preferences. Existing source application answers seed known details; missing facts remain editable blanks.

Added many-to-many candidate Collections with owner/status/role/search filtering. Shared modal behavior now portals previews, traps focus, restores focus/scroll and closes only the top modal on Escape. Added the exact 13 named status options plus No Status, with central form enforcement from candidate and deal controls. Valid schedules create local Calendar records; reviewed offer metadata appears in Documents. AI summary/submission drafts and a missing-document-detail checklist are on-request, editable and explicitly simulated. See [Candidates contract](CANDIDATES.md) for fields, design decisions and parity limits.

Validation: TypeScript, ESLint and production build passed. Nine form contract assertions covered missing/complete data, conditional fields, reversed times, document review, fees and timezone/DST conversions. Browser checks covered all nine modal openings and Escape cancellation, invalid/valid interview confirmation, applicant-to-deal retention of profile and collection edits, manual profile/education/skills, inline salary, collections and AI draft review. Nested CV Escape restored body scroll. At 375px Candidates had no horizontal page overflow and the interview modal remained contained. Board drag was attempted but did not trigger a drop; its full interaction remains unverified. Later staging Offer Sent extraction steps were not traversed: the local manual review is an explicit prototype adaptation. No staging saves, deployment or commit.

## 13 Oct 2026 — Communication rework

Rebuilt `/communication` around people instead of folders and channels.

- **One conversation per person** (`lib/conversations.ts`): email, SMS, WhatsApp and LinkedIn threads, calls and an owed update merge into one timeline with day separators. Threads stay per channel underneath.
- **Triage**: stat cards (Replied to you, Owed an update, Gone quiet, Calls this week) and tabs Needs you / Waiting / All / Snoozed / Done. Needs you is grouped by what to do. Each row says why it's there. Owed updates can't be marked done; sending clears them.
- **Composer**: switch channel per message, templates (pre-call pack, booking link, consent, workstyle), Amara drafts on request (reply, nudge, honest update with tone and "what Amara uses"), then Shorter / Warmer / Firmer. Send now or schedule (later today, tomorrow, Monday); scheduled messages can be cancelled.
- **Calls**: start a call from the header (timed), then log outcome and note; manual "Log a call" too. Calls show in the timeline.
- **Context panel**: contact details, candidate status and heat or company stage and terms, Amara's summary on request, what we know, coming up, tasks and notes. Below 1280px it opens as a sheet.
- Pin, snooze, mark done/unread, bulk select (done, read, snooze), right-click on rows, keyboard (J/K, R, E, P, U), search across names and message text.
- Store: `scheduledFor` on messages, `cancelScheduled`, per-person `conversationFlags`. Two new inbound seed threads (Priya Raman SMS, Rohan Iyer LinkedIn). The old folder page and follow-ups composer were replaced.

Validation: TypeScript, ESLint and production build passed. Browser checks at 1440px: Needs you groups and counts; Owen (WhatsApp + call) reply drafted, sent and moved to Waiting; Daniel's owed update drafted from his facts, sent as a new email, Owed count 7 → 6; Marcus call timed, ended, logged with a note (calls 7 → 8) and summarised; search across message text. At 375px: no horizontal scroll, list → conversation → back, details sheet. Not exercised: bulk actions, snooze, scheduled send and cancel, templates.

## 13 Oct 2026 — Communication: labels, new people, list hierarchy

- **Labels**, as in staging (`lib/labels.ts`, components in `components/communication/labels.tsx`). Labels are your own, have a colour, and can nest ("Roles / Senior SRE"). Filtering by a parent includes everything under it. A label bar under the tabs filters the list and shows counts for the current tab; picking a parent opens its sub-labels. Right-click a label to show only it, rename it, add a sub-label, recolour or delete it (with what's nested). Labels are also in the filter menu, in each row's right-click menu ("Label as": a filter-or-create picker with checkboxes), in bulk actions, on rows, and in the side panel. Store: `labels`, `addLabel`, `updateLabel`, `deleteLabel`, `toggleLabel`; labels live on `conversationFlags`. Seeded with New business, Counter-offer risk, Fee talks, Referrals and Roles (Senior SRE, Engineering Manager, Lead Data Engineer). No emoji, per the design direction.
- **New people**: four seed threads from people who aren't a candidate, client or prospect yet (Hannah Whitfield at Arcadia Games, an unknown number that signs as Kai Nguyen, Mateo Alvarez from Tidewater Bank's domain, Chloe Bennett on LinkedIn). They get their own "New people" group in Needs you, a dashed avatar, a banner and a side-panel block. "Add to your desk" (banner, side panel, right-click) makes them a candidate, a contact at an existing company, or a new prospect. Prefilled from their signature, and the email domain suggests the company. Their conversation, labels and pins move onto the new record (`recognizeContact`).
- **List hierarchy**: underlined view tabs with the Needs you count as the loudest element, a toolbar header, group headers with the same coloured tiles as the stat cards, rows as cards with a clear active state, and a coloured reason pill per row. Who and Channel moved into the filter button, with chips when they're on.
- **Fixes**: `useTrackedData` no longer lets an older render's data overwrite a newer write (it caused a "Maximum update depth" loop when Communication marked a thread read). Rows no longer sort unread first, so reading one doesn't cascade through the whole list, and phones don't mark the top conversation read before it's opened.

Validation: TypeScript, ESLint and production build passed. Browser checks at 1440px: label bar filter, filter-menu label, Label as picker, new sub-label under Roles; Kai added as a candidate, Mateo as a Tidewater Bank contact (domain match), Hannah as a new prospect, each keeping their labels; no update-depth errors after reload. At 375px: no horizontal scroll, unread state kept until opened, banner wraps. Not exercised: rename, recolour and delete of a label, bulk label.

## 13 Oct 2026 — One toggle style; Clients list expands in place

- Every two-to-five-option toggle now uses `Segmented` (`components/ui/menu.tsx`): bordered group, sliding raised pill, always a text label, icons on view toggles. Replaced the hand-rolled ones on Clients (was icon-only), Team (view and leaderboard), Home's leaderboard and demo-state toggles, Learnings, and Documents (Register / Generate, direction). `Segmented` options can now be disabled with a reason. Prospects' "Table" is now "List" to match Placements and Clients. Page-level tabs (Home Overview / Analytics / Sales, Communication's views, tabs inside records) stay as they are.
- Clients opens on **List** by default. A row expands in place, like Candidates and Prospects: client facts (location, fee, terms, main contact, since), Open roles / Contacts / History tabs, Tasks and Notes, and a footer with Post a role, Email the main contact, and a link to the full client page. Cards view is unchanged.

Validation: TypeScript, ESLint and production build passed. Browser check at 1440px: Clients list default, Tidewater Bank expanded with roles, contacts and tasks, switch to Cards.

## 13 Oct 2026 — Full-width pages; Communication spacing

- Every page now uses the same 1600px container as Communication (`Page`, Home, the loading skeleton). `Page`'s `wide` prop is kept but no longer changes anything. Text blocks keep their own reading widths.
- Communication: more room between the cards and the panel, wider list (392px) and side panel (320px), more padding in the list header, label bar, group headers and rows, wider margins around the timeline and composer, more space between days and messages, and roomier side-panel sections. Label chips in the side panel no longer truncate.

Validation: TypeScript, ESLint and production build passed. Checked Communication at 1456px; no horizontal scroll at 375px on Communication or Clients.


## 13 Oct 2026 — Talent database and independent Placements

Separated Candidates into a data-only talent library: manually saved profiles, collections, source documents, notes and aggregate history. Removed its pipeline statuses, fit/heat columns, application queues and board. Added Placements at `/placements`, with `/pipeline` redirecting there. Kept expandable list rows and made board cards open their next required workflow form; details/history remains separately accessible.

Added a canonical candidate ID and independent placement IDs per company/role/attempt. A bulk chooser can start several processes from one saved person, validates all roles before writes and blocks duplicate active processes. Closing a company process does not change the shared profile or another company. Completed forms are retained as snapshots; every committed status change, accepted edit, note and AI draft request records actor/time/IDs. Referenced history joins by ID rather than name, and the renderer exposes all retained events. Linked legacy deals remain available without inventing fees for newly created placements.

Profiles, manual talent, processes, dependent source/client/job records, notes, calendar, document metadata and audit history now persist in versioned local browser storage. Added source-grounded demo AI for talent exploration/history, role-title suggestions, editable process next steps, submission drafts and every form's review checklist. Accepted next-step drafts can be saved as notes. Shared header styles now cover Candidates, Placements and the expandable Clients list without changing the existing design direction. Wide native tables use layout/paint containment to keep their scroll area inside the page on mobile.

Validation: seven domain tests passed (`node --test tests/placements.test.mjs`), TypeScript and ESLint passed, and the production build passed. Browser QA created two company processes for one candidate, closed Halcyon as Not Qualified while Northwind remained Active, recorded Northwind's reviewed submission, then created a Tidewater attempt from the closed opportunity. All three retained independent outcomes and the shared profile showed aggregate history. Verified scoped versus aggregate history, saved AI notes, all nine form openings/Escape cancellation, list expansion and board-to-form progress. A manually added profile and a shared salary edit survived reload, along with the three process outcomes. At 375px both pages had document width equal to viewport width, with contained expanded profiles and a scrollable interview modal; inspected Placements at 1440px. Screenshot: `.artifacts/placements-talent-pool.jpg`.

Backend/shared editing, live AI and outbound/file-binary integrations remain unconnected; Offer Sent's later extraction steps retain the disclosed manual-review adaptation. Native board drag remains unverified. No commit or deployment performed. See CANDIDATES.md and PLACEMENTS.md for current contracts.

## 13 Oct 2026 — Expanded candidate profile proportions

Changed the profile to a two-column 1:2 desktop layout. Basic role, pay, contact and availability fields occupy the left third; summary, experience, qualifications, links and collections occupy the right two thirds. Removed the profile reading-width cap while retaining it for History and Notes. Existing edit, documents and AI actions remain available.

Validation: TypeScript, ESLint and production build passed. Browser measurements at 1440px showed 414px and 828px columns with aligned tops; at 375px they stacked at 303px each and document width stayed 375px. Screenshot: `.artifacts/candidate-profile-two-columns.jpg`.

## 13 Oct 2026 — Candidate expanded row follows the Clients pattern

The expanded candidate row (`CandidateRecordView` in `components/candidates/profile.tsx`) now uses the same layout as Clients and Prospects: facts on the left (role, location, pay, contact, notice, work style, work rights, collections as toggle chips), Profile / History tabs in the middle with Read with Amara, Tasks / Notes on the right, and a footer with Edit profile, Documents and Archive. Empty profile sections are quiet "Add …" links in a two-column grid instead of large dashed boxes. Edit, documents and Amara draft modals are unchanged. Tasks were added to the candidate record.

Validation: TypeScript, ESLint and production build passed; Laura Chen's row checked at 1456px.

## 13 Oct 2026 — Candidates record and shared overview styling

Aligned the expanded Candidates record with Clients: icon-led facts, shared record tabs, compact section labels, divided entry lists, collection chips and footer actions. Kept the requested two-column 1:2 layout; Notes shares the content panel rather than adding a third sidebar. Candidates and Placements now use the existing StatRow/StatCard components for overview metrics.

Validation: TypeScript, ESLint and production build passed. Browser checks covered Profile/History/Notes, Edit and Documents with Escape close, and the updated overview strips. Both pages stayed within a 375px document viewport; the expanded profile stacked into two 343px-wide panels. Desktop proof: `.artifacts/candidates-clients-style.jpg` and `.artifacts/placements-shared-statistics.jpg`.

## 13 Oct 2026 — Expanded rows line up with their rows

Candidates, Clients and Prospects now use one 20px inset: list rows, grid table headers (`GridTableHeader`), the expanded panels and their footers. Measured in the browser: the row avatar or logo, the expanded panel's first column and the footer's first button all start at the same x on Candidates and Clients.

## 13 Oct 2026 — Daily welcome and shared subpage navigation

Home claims its welcome once per member per local calendar day in browser storage before the animation starts. Same-day returns and reloads show the docked dashboard; reduced-motion behavior and a session fallback remain supported. Added shared SubpageTabs with Home’s existing visual treatment for Home, Documents and Team. Removed the Home numbers helper sentence. Audit overview now uses StatRow/StatCard; Documents uses colored MetricIconTile file-input/file-output glyphs for received/generated records.

Validation: four daily-gate tests passed, including midnight rollover and unavailable storage. TypeScript, ESLint and production build passed. Browser observed the first visit at orb and a reload at ready, confirmed the removed helper text, Documents Register/Generate and Team Leaderboard switching, the new document tiles and Audit overview. Audit and Documents remained within a 375px viewport. Screenshots: `.artifacts/documents-shared-tabs-icons.jpg` and `.artifacts/audit-shared-overview.jpg`.

## 13 Oct 2026 — Collection sheets and expanded table workspaces

Replaced Candidates collection dropdown/inline creation with a scrollable sheet bar below the table: All Candidates, per-collection tabs with membership counts, and a plus button opening an Escape-closeable creation modal. Added shared TableWorkspace expansion across Candidates, Placements, Clients, Prospects, Documents, Audit, Team permissions/leaderboard, Home leaderboard/Sales and inline chat record tables. Expanded mode fills the usable app area, retains the rail/header, hides page overviews behind it, keeps row/filter state mounted and restores with Back to page or Escape.

Validation: TypeScript, ESLint and production build passed. Browser checks confirmed collection filtering, creation modal Escape priority, expanded Candidate workspace and mobile width 375px. Verified expansion/restoration on Clients, Prospects, Placements, Documents, Audit, Team permissions/leaderboard and Home leaderboard. Saved `.artifacts/candidates-expanded-sheets.jpg`. Sales and inline chat tables share the component but were not individually exercised.

## 13 Oct 2026 — Immediate profile insights and Placement assessment

Candidates shows an immediate AI profile summary from reviewed text or saved fields, with recorded strengths/missing information and editable review. Placements now uses the Candidates/Clients two-panel record layout, immediate company/role-scoped fit, Assessment/History/Notes tabs, process records/context and progression footer. Added recruiter-editable shared role requirements with persistence and audit events. Demo coverage uses explicit term matching; missing briefs and evidence remain unknown, and operational stage signals do not become qualification matches.

Validation: domain insight and placement tests passed; TypeScript, ESLint and production build passed. Browser verified immediate Candidate and Placement cards, editable summary review, Placement History/Notes tabs, role requirements modal Escape, and mobile Placement width equal to 375px. Desktop panels measured 382px/764px at 1280px. Screenshots: `.artifacts/candidates-immediate-summary.jpg` and `.artifacts/placements-immediate-fit.jpg`. Requirement coverage, negated evidence, reviewed summary precedence and cross-company screening isolation are covered in the insight tests.

## 13 Oct 2026 — Candidates header expand control

Moved Candidates expansion into the final table-header cell as an icon-only control. Removed its separate workspace title/action row. Kept tooltip, accessible label, pressed state, collapse icon and Escape focus restoration. Browser verified header placement, empty button text and expand/Escape collapse; screenshot `.artifacts/candidates-header-expand.jpg`. TypeScript, ESLint and production build passed.

## 13 Oct 2026 — Notes wiki

Added a Notes workspace to the main navigation. The page has searchable wiki pages, a focused editor, create/delete controls and browser-local autosave, using the existing dark Amara surfaces and shared page header.

Validation: TypeScript, ESLint and production build passed. Browser confirmed the Notes route, navigation entry, starter page and editor; screenshot `.artifacts/notes-wiki.jpg`.

## 13 Oct 2026 — Notes full-height workspace

Notes now stretches its editor workspace to fill the page height and offers a full-page mode that uses the shared expanded-workspace behavior, including Escape to return. The full-page control stays inside the note toolbar.

Validation: TypeScript, ESLint and production build passed. Browser confirmed the full-height default, full-page expansion and Escape restoration.
