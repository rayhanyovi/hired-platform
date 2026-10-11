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
