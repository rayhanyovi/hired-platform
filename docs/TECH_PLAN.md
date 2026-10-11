# Tech Plan: Amara Desk

| | |
|---|---|
| **Status** | Frontend prototype; all data and AI mocked, client-side only |
| **Last updated** | 11 Oct 2026 |
| **Related** | [PRD](PRD.md) · [Design direction](DESIGN_DIRECTION.md) · [Backlog](BACKLOG.md) · [Agents handoff](AGENTS_HANDOFF.md) · [Design thinking board](../public/design-thinking-board.html) |

Documentation language: English. Sections describing the existing prototype are architectural notes, not a fresh verification report. Proposed contracts and release gates are explicitly separated below; they do not imply code has been changed.

---

## 1. Goals of the technical design

1. **Feel real on mock data.** Streaming, instant navigation, stable timestamps, every action logged.
2. **Mock at the edges only.** Components never know data is fake. Swapping in a backend replaces `lib/` functions and store actions, not UI.
3. **One contract for AI output.** Every AI reply is `{ text, blocks[], followups[] }`. A real model returns the same shape through tool calls.
4. **AI cost proportional to intent.** Generation is triggered by user action, never by rendering.

## 2. Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js App Router | 16.4.0 | `cacheComponents: true`, `partialPrefetching: true`, `devIndicators: false`, `experimental.agentFeedback` |
| UI runtime | React | 19.3.0 | Client components for all interactive pages |
| Styling | Tailwind CSS v4 via `@tailwindcss/turbopack` | ^4 | Tokens in `@theme` (`app/globals.css`) |
| Motion | `motion` (`motion/react`) | ^14.1 | Shared-layout composer, panel entrances; `MotionConfig reducedMotion="user"` |
| Icons | lucide-react | ^1.52 | |
| Fonts | `next/font/google` | — | Inter, Playfair Display, JetBrains Mono as CSS variables |
| Language | TypeScript strict | ^5 | |
| Lint | ESLint 9 + `eslint-config-next` | 16.4.0 | Includes React hooks rules (no setState in effects) |

> Next.js 16.4 has breaking changes vs older versions. Read `node_modules/next/dist/docs/` before changing routing, caching or data fetching (see `AGENTS.md`).

## 3. Repository layout

```
app/
  layout.tsx              fonts, <DeskProvider>, <AppShell>
  page.tsx                Home
  chat/ clients/ clients/[id]/ applicants/ candidates/ pipeline/ deals/[id]/
  follow-ups/ documents/ team/ audit/ learnings/ learnings/[id]/ sum/ (hidden)
components/
  shell/                  app-shell, sidebar (Rail, TopBar, MobileNav, MobileHeader, menus),
                          ask-drawer, search, tour, command-palette (Toaster)
  home/                   home, overview (metrics, tasks, invoices, leaderboard), analytics,
                          composer, thread (message + block renderers)
  chat/  clients/  sourcing/ (applicants, candidates)  pipeline/ (board, deal-drawer)
  deals/ (deal-page, amara-read, discussion, activity)  follow-ups/  documents/
  team/ (team-page, leaderboard)  audit/  learnings/  sum/  ai/ (stream)  ui/
lib/
  types.ts                domain model
  data.ts                 deals, follow-ups, stages, recruiter
  agency.ts               members, permissions, rules, clients, approvals, comments,
                          documents, jobs, applicants, candidates, seed events
  home.ts                 Home metrics, tasks, first steps, invoices, leaderboards, suggestions
  application.ts          raw applications per source
  store.tsx               DeskProvider + useDesk()
  deal.ts                 temperature, heat, fee, odds, risk, money formatting
  clients.ts              rolesFor, peopleCount, liveFees
  documents.ts            doc labels, renderDoc, tobStatus
  ai.ts                   follow-up drafts
  amara-chat.ts           Reply/Block contract, amaraReply intents
  ask.ts                  askContext, routeKey, askReply
  search.ts               index, scoring, lenses
  tours.ts                per-route tours
  learnings.ts            tracks, lessons, quizzes
  time.ts                 fixed "now", formatters
public/company-logo/      logo-ipsum SVGs
docs/                     this folder
```

Size: ~4.8k lines in `lib/`, ~9.7k lines in `components/`.

## 4. Runtime architecture (today)

```
┌──────────────────────────── Browser ─────────────────────────────┐
│ RootLayout                                                       │
│  └ DeskProvider (useDeskState: all state + actions)              │
│     └ AppShell                                                   │
│        ├ Rail · ShellFrame(TopBar, MobileHeader, <route page>)   │
│        ├ MobileNav                                               │
│        └ overlays: DealDrawer · AskDrawer · SearchPalette ·      │
│                    TourOverlay · Toaster                         │
│                                                                  │
│ Pages read useDesk() → render → call actions → setState + log()  │
│ AI surfaces call pure functions in lib/ (askReply, draftFollowUp)│
│ and render through StreamText                                    │
└──────────────────────────────────────────────────────────────────┘
No server data. Server work = prerendering static shells.
```

### 4.1 Routing and rendering

| Route | Rendering | Notes |
|---|---|---|
| `/`, `/chat`, `/clients`, `/applicants`, `/candidates`, `/pipeline`, `/follow-ups`, `/documents`, `/team`, `/audit`, `/learnings`, `/sum` | Static (○) | Thin `page.tsx` with `metadata` + one client component |
| `/clients/[id]` | Partial prerender | `generateStaticParams` from seed clients; `params` read inside `<Suspense fallback={<PageSkeleton/>}>`. Unknown ids are handled client-side because clients added in-session only exist in state |
| `/deals/[id]` | Partial prerender | Same pattern; the client view shows "This deal isn't on your desk." for unknown ids |
| `/learnings/[id]` | Partial prerender | Static lessons, so unknown ids call `notFound()` |

Cache Components rules this follows: dynamic `params` must be read under Suspense; `generateStaticParams` must return at least one entry; `dynamicParams` isn't available. Activity keeps up to three routes mounted, so list selections and tabs survive quick back-and-forth.

### 4.2 State: `lib/store.tsx`

One context, `DeskProvider`, exposing `useDesk(): DeskState`. Memory only; reload resets.

**UI state:** `toast/notify`, `askOpen`, `pendingAsk` + `ask(text)`, `searchOpen`, `homeStage` (day1 / day30), `tourOpen`, `railOpen`, `openDealId` (quick-view drawer), `selectedFollowUpId`, `selectedApplicantId`, `selectedCandidateId`, `jobFilter`, `teamView` (members / leaderboard), `docRequest` (open generator for a deal).

**Data state:** `currentUserId` (+ derived `me`, `isOwner`), `members`, `rules`, `deals`, `followUps`, `sentCount`, `events`, `comments`, `approvals`, `documents`, `jobs`, `clients`, `applicants`, `candidates`, `syncing`, `completedLessons`.

**Actions and the events they log:**

| Action | Effect | Event `action` |
|---|---|---|
| `logTouch(dealId, event)` | Resets deal heat | `deal.call_logged` / `deal.email_logged` / `deal.note_added` / `deal.client_update` |
| `moveTo(dealId, stage)`, `advance(dealId)` | Change stage, reset heat | `deal.stage_changed` |
| `addComment(dealId, body)` | Thread note | `comment.added` |
| `changeFee(dealId, pct, reason)` | Owner: direct. Others below floor: approval | `deal.fee_changed` or `approval.requested` |
| `decideApproval(id, approve)` | Owner only; applies fee or approves invoice | `approval.approved` / `approval.rejected` |
| `addDocument(doc)` | Invoice by non-Owner with rule on → `pending-approval` | `document.*` (+ `approval.requested`) |
| `setDocStatus(id, status)` | | `document.status_changed` |
| `updateRules(rules)` | Owner only | `team.rules_changed` |
| `markSent(followUpId)` | Removes from inbox, counts | `followup.sent` |
| `postJob(job)` | | `job.posted` |
| `syncApplicants()` | Once: adds 3 incoming applicants after a delay | `sourcing.synced` (system), `amara.screened` (amara) |
| `decideApplicant(id, shortlist/reject)` | Shortlist → candidate; reject → rejection follow-up | `sourcing.shortlisted` / `sourcing.rejected` |
| `markContacted(id)` | | `sourcing.contacted` |
| `addToPipeline(id)` | Creates deal at Sourced, fee = max(floor, 20%) | `deal.created` |
| `addClient(c)`, `setClientStatus(id, s)` | | `client.added` / `client.status_changed` |
| `exportedAudit(format, n)` | | `audit.exported` |
| `setLessonDone(id, done)` | Records lesson completion/reopening | `learning.progress_changed` |
| `setHomeTaskDone(id, name, done)` | Records Home task completion/reopening | `task.completion_changed` |

`log()` is the single write path for history. Live audit events use the real wall-clock timestamp, displayed in WIB with seconds and exported as ISO UTC. Events carry `actorId` (member id, `amara` or `system`), `kind`, source `module`, optional `dealId` and `reason`, plus `records` with entity IDs, names, modules, operation types and field-level before/after values. Deal Activity and the Audit Trail remain views of the same event array.

`useTrackedData` mirrors collection updates synchronously and computes record diffs through `lib/audit.ts`. Pending diffs are consumed by the action's `log()` call, grouping related writes (for example applicant status plus candidate creation) into one event. Rules, Home tasks and learning completion add explicit field diffs. Applicant sync records each incoming application under System, then logs the batch summary and Amara screening activity. No-op guards avoid duplicate status and stage changes. Source-module filters also match affected record modules. CSV/JSON exports include full diffs, with CSV formula escaping. Only Owners can export through the UI. This remains an in-memory prototype: no database persistence or server-enforced audit integrity; production auditing must be written atomically with mutations on the server. Historical fixtures have no reconstructed before/after data.

**Cross-page intents** use store setters rather than URL params (`selectApplicant`, `selectFollowUp`, `selectCandidate`, `setJobFilter`, `setTeamView`, `setDocDealId`, `ask`). Reason: `useSearchParams` in a client component requires a Suspense boundary under Cache Components, and in-memory intents also survive Activity-preserved routes.

**Render-time derivation instead of effects:** consumers of one-shot requests (`pendingAsk`, `docRequest`) compare a counter `n` with the last handled value during render and update local state there, which satisfies the "no setState in effect" lint rule.

### 4.3 Time

`NOW_MS` is pinned to Fri 9 Oct 2026, 08:40 Sydney (AEDT). Seeds use `hoursAgo(h)`. New events use `liveNow() = NOW_MS + performance.now()` so they sort after seeds. Only call `liveNow()` from handlers, never during render (hydration).

### 4.4 Domain logic

| Concept | Implementation |
|---|---|
| Temperature | `temperatureOf(deal)`: hot → warm (½ cooling) → cooling → cold, by stage thresholds (hours): sourced 96/240, submitted 48/120, interview 48/96, final 24/72, offer 12/36, placed none |
| Heat bar | `heatLoss = min(1, hoursIdle / coldHours)` |
| Fee | `salary × feePct` |
| Close odds | sourced 5%, submitted 12%, interview 25%, final 50%, offer 80%, placed 100% |
| Risk | `fee × odds × heatLoss` → sorts "going cold" and Amara's priorities |
| Needs attention | Not placed and cooling or cold |
| Roles per client | `rolesFor(client)`: per job → applicants (new), pool (candidates not in pipeline), live deals, placed deals |
| TOB status | Any signed TOB / signed-tob doc → signed; any sent → sent; any → draft; else none |
| Client invoices | `invoicesFor(clientName)`; Home invoice client names must match `CLIENTS` names |

These temperature thresholds, close odds and the resulting risk score are deterministic demo heuristics, not calibrated probabilities or evidence that a deal will be lost. §10.4 proposes explainable attention signals alongside this existing logic. Changing that logic requires a separate implementation task.

### 4.5 AI layer (mocked)

**Contract** (`lib/amara-chat.ts`):

```ts
type Reply = { text: string; blocks: Block[]; followups: string[] };
type Block =
  | { type: "candidates"; items: { name; headline; location; fit; why }[] }
  | { type: "drafts"; items: { company; initials; subject; body }[]; more?: number }
  | { type: "invoices"; items: { client; amount; date }[] }
  | { type: "metrics"; rows: { kind: MetricKind; now: number; target?: number }[] }
  | { type: "steps"; items: { title; detail }[] }
  | { type: "list"; items: { title; meta?; detail?; href?; tone? }[] };
```

`components/home/thread.tsx` renders each block type; list rows with `href` link to records.

**Pipeline for a question:**

1. `askContext(pathname, desk)` → `{ key, label, summary, suggestions, ref? }`. Keys: home, chat/general, followups, pipeline, clients, client (ref = id), applicants, candidates, documents, team, audit, sum, learnings, deal (ref = id).
2. `routeKey(key, q)` sends Home/general questions to the page that owns the data (waiting → followups; applicant/strong fit → applicants; unsigned/approval → documents; prospects/biggest fees → clients; cold/stuck → pipeline).
3. `askReply(prompt, ctx, desk)` runs the page handler, which reads live store data. Unhandled keys fall through to `amaraReply(prompt, stage)`, an ordered list of ~21 intents (order matters: specific before broad).
4. The drawer streams `reply.text` with `StreamText`, then shows blocks and follow-up chips.

**Other AI functions:** `draftFollowUp(f, tone, channel)` (5 kinds × 3 tones, channel formatting: SMS one-liner with sign-off, email with greeting + subject, LinkedIn), `subjectFor(f)`, `applicationFor(applicant, job)` (raw material; deterministic via string hash so the mock never flickers), search `lens()`.

**Streaming simulation:** `useStream(text, { delay, wordsPerTick, tickMs })` reveals two words every 28ms after a short "thinking" delay; reduced motion shows the full text immediately. Remounting with a new `key` replays.

### 4.6 Search

`buildIndex(desk)` produces `Result { id, kind, title, subtitle, href, keywords?, select? }` across 10 kinds. `search()` scores title exact 100, prefix 80, word-start 60, contains 40, metadata word-start 25, metadata contains 15; max 5 per kind. `lens()` maps phrases to record sets. `looksLikeQuestion()` detects `?` or leading who/what/how/draft/summarise… and puts "Ask HeyAmara" first.

### 4.7 Tours

`lib/tours.ts` maps route patterns to `{ name, steps: { target, title, body }[] }` (15 tours, 69 steps). `TourOverlay` finds `[data-tour="target"]`, spotlights it and positions the card; missing targets fall back to a centred card. `?` or the help button starts the tour for the current route.

### 4.8 Styling system

- Tokens in `@theme`: surfaces, text, brand, Amara gradient stops, five metric colours (+ tile), status (good/bad/warm/cold), invoice row/chip colours, fonts, animations.
- Base styles in `@layer base` so utilities like `outline-none` win.
- Unlayered helpers: `.num` (tabular), `.amara-gradient-text`, `.amara-edge` (gradient border via mask; sets `position: relative`), `.amara-orb`, `.hero-sky`, `.caret`, range input styles.
- Primitives: `cx`, `AmaraMark` (unique gradient ids via `useId`), `Avatar`, `Heat`, `Kbd`, `Button` (primary/secondary/ghost), `AmaraButton` (sm/md/lg), `AmaraTag`, `SectionTitle`, `Modal`, `Field`, `PageHeader`, `Page`, `MetricIcon`.

## 5. Quality

### 5.1 Today
| Check | Command | When |
|---|---|---|
| Types | `npx tsc --noEmit` | Every change |
| Lint | `npx eslint .` | Every change |
| Build | `npx next build` | Before hand-off; catches Cache Components violations |
| Behaviour | DOM checks in the browser preview (port 3100) | After UI changes |

### 5.2 Proposed
| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | `lib/deal.ts` (temperature, risk), `lib/search.ts` (scoring, lenses), `lib/ask.ts` (routing, page handlers), `lib/application.ts` |
| Component | React Testing Library | Follow-ups composer (blank → draft → send), Applicants tabs and keys, Ask drawer context |
| E2E | Playwright | The five core loops in PRD §7 at 1440px and 375px; axe accessibility scan |
| Visual | Playwright screenshots | Home Day 1 / Day 30, drawer open, mobile nav |

### 5.3 Discovery acceptance checks (planned)

Trace each check to PRD §16. Functional checks prove behavior; usability sessions test whether the design is understandable. Neither is marked complete without recorded evidence.

| Check | Requirement | Expected result |
|---|---|---|
| Home layout and entry | DC-1 | Composer is centred on Home, or reviewer clarification is recorded; a composer on `/chat` alone does not close the gap |
| Information inventory at 375px, 768px, 1280px, 1440px | DC-2 | Five metrics, tasks, invoices, leaderboard, range and analytics remain reachable; no unexplained comparison percentages |
| Day 1 / returning fixtures | DC-4 | Appropriate prompts and next steps; no fabricated first-placement or team achievement |
| Record → ask → reply → return | DC-3 | Correct context identity and scope; removable context; origin and unsent draft retained within the session |
| Context removal, record change and late response | DC-3, DC-6 | Removed context is not reattached; old response does not overwrite a newer request or appear attributed to a different record |
| Follow-up / invoice draft review | DC-6–DC-7 | Sources and missing facts visible; no automatic simulated send or mutation on generation |
| Attention explanation | DC-5, DC-8 | Reason and owner shown when available; missing data does not become a fabricated urgency claim |
| Unknown intent / failure / retry | DC-6 | Helpful fallback, preserved input, explicit retry and no duplicate simulated action |
| Keyboard, reduced motion and focus | DC-3, DC-10 | Entry and return are keyboard accessible; focus moves predictably; full answer remains available with reduced motion |

Use PRD §16.1 for user tasks. Log evidence and failures in `docs/BUILD_LOG.md`, and unresolved implementation work in `docs/BACKLOG.md`. Compile, lint and build results are reported separately from behavioral and user-research results.

## 6. Production architecture

```
Next.js (App Router)
  ├ Server Components: read via data layer (RLS-scoped)
  ├ Server Actions: mutations (same names as store actions) → DB + events
  ├ Route handler /api/ask (stream): context builder → Claude → tool calls → Blocks
  └ Route handler /api/draft (stream): follow-ups, next moves, chases
Postgres (Supabase/Neon) + RLS per agency
Object storage: CVs, attachments, generated PDFs
Queue/worker: ingestion, CV parsing, screening, daily "Today" summary
Integrations: Gmail/Outlook, Seek/LinkedIn/Indeed, Xero, e-signature, calendar
```

### 6.1 Data model (first cut)

| Table | Key columns |
|---|---|
| `agencies` | id, name, fee_floor_pct, invoice_approval, created_at |
| `members` | id, agency_id, user_id, name, email, role (owner/recruiter/resourcer) |
| `clients` | id, agency_id, name, industry, location, status, contact_name/title/email, fee_pct, since, logo_url |
| `jobs` | id, agency_id, client_id, title, salary, location, channels[], status, posted_at, brief |
| `applications` | id, agency_id, job_id, source, received_at, raw (jsonb: email headers/body or board answers), cover_letter, status |
| `attachments` | id, application_id, kind (cv/portfolio/other), file_url, size, text_extract |
| `screenings` | id, application_id, job_brief_version, fit, summary, matches[], gaps[], model, created_at |
| `candidates` | id, agency_id, person fields, status (pool/contacted/pipeline), added_by |
| `deals` | id, agency_id, candidate_id, job_id, owner_id, stage, fee_pct, last_touch_at |
| `follow_ups` | id, agency_id, person, kind, context[] , reason, positive, deal_id, waiting_since, sent_at |
| `drafts` | id, agency_id, member_id, subject_type/id, tone, channel, body, model, tokens, sent (bool) |
| `documents` | id, agency_id, kind, direction, deal_id, client_id, status, amount, file_url |
| `invoices` | id, agency_id, client_id, deal_id, number, amount, status, issued_at, due_at, paid_at |
| `approvals` | id, deal_id, kind, requested_by, status, decided_by, decided_at, fee_pct, document_id |
| `comments` | id, deal_id, author_id, body, approval_id |
| `events` | id, agency_id, at, actor_id, action, summary, kind, deal_id, payload (jsonb). **Append-only** (no UPDATE/DELETE grants) |

`hoursIdle` becomes `now() - last_touch_at`, updated by any logged touch.

### 6.2 Migration from mocks

| Mock today | Replacement | UI change |
|---|---|---|
| `useDeskState` data arrays | Server Components fetch + client cache (React Query or RSC refresh) | Pages receive data instead of reading context for data |
| Store actions | Server Actions with optimistic updates | None; same names and signatures |
| `log()` | DB trigger or action wrapper inserting into `events` | None |
| `askReply` | `/api/ask` streaming endpoint | `StreamText` consumes a real stream |
| `amaraReply` intents | Model + tools; intents become eval cases | None |
| `draftFollowUp` | `/api/draft` | None |
| `applicationFor` | `applications` + `attachments` tables | None |
| `syncApplicants` | Ingestion workers + realtime push | Button triggers a fetch instead of a timer |
| Home mock metrics/invoices/leaderboards | SQL views per range | None |
| `NOW_MS` | Real time | Remove pinning |

### 6.3 AI design

**Context builder.** `askContext` already describes each page. In production it also attaches the records the page shows (ids + compact JSON), capped by token budget, plus the agency's rules (fee floor, invoice approval).

**Tools the model can call** (each returns a `Block`):

| Tool | Returns |
|---|---|
| `list_records(kind, filter)` | `list` with hrefs |
| `find_candidates(job_id, criteria)` | `candidates` |
| `draft_messages(targets[], tone, channel)` | `drafts` |
| `get_invoices(filter)` | `invoices` |
| `get_metrics(range)` | `metrics` |
| `plan_steps(goal)` | `steps` |

Tools are **read or draft only**. State-changing actions (send, move stage, approve) stay as explicit UI buttons.

**Models.** Small/fast Claude model for routing, screening and classification; larger model for drafts the user will send and for open-ended chat.

**Cost controls.**
- Generate on intent (Draft with Amara, Explain, Chase), never on view.
- Cache screenings per (application, job brief version); cache the daily "Today" line per member per day.
- Prompt caching for the stable system prompt and agency context.
- Per-agency monthly budget with soft warnings; log tokens per `drafts` row.
- Track sent/generated draft usage alongside edits and usefulness; investigate low usage instead of optimizing for sending alone.

**Quality and safety.**
- Evals: the current mock intents become golden prompts with expected block types and facts.
- Grounding: drafts must only use facts from the provided context; show them in "What Amara used".
- No autonomous sending; every outbound message needs a human click and is logged.
- PII: CV text never leaves the agency's tenant context; redact in logs.

### 6.4 Integrations

| Integration | Direction | Use |
|---|---|---|
| Gmail / Outlook | In + out | Ingest email applications; send follow-ups and chases from the recruiter's address |
| Seek, LinkedIn, Indeed | In | Applications with screening answers |
| Calendar | Out | Interview scheduling |
| Xero | Out + in | Create invoices from placements; read paid status |
| E-signature | Out + in | TOBs and offers; status back into documents |

### 6.5 Security and compliance

- Auth with org membership; role checks on every Server Action, mirrored by RLS.
- Audit log append-only; export restricted to Owner and itself logged.
- Australian Privacy Act: consent for candidate data, retention windows, deletion on request (tombstone events, not deletes).
- Attachments in private buckets with signed URLs.

### 6.6 Observability

Structured logs per action; traces on `/api/ask` and `/api/draft` (latency, tokens, tool calls); product analytics for the PRD success metrics.

## 7. Phased delivery

| Phase | Engineering scope | Est. |
|---|---|---|
| 0 | Existing mocked prototype + planned tests from §5.2–5.3; close PRD DC-1 submission gap | Remaining work depends on acceptance checks |
| 1 | Auth, Postgres, Server Actions for deals/follow-ups/clients, events table, `/api/ask` + `/api/draft` on Claude, Gmail send | 4–6 weeks |
| 2 | Ingestion (email first, then boards), attachments, CV parsing, screening worker | 4 weeks |
| 3 | Invoices + Xero, e-signature, approvals on real documents | 3–4 weeks |
| 4 | Network leaderboard (cross-agency, opt-in), Learnings CMS | 2–3 weeks |

## 8. Known gotchas

| Gotcha | Fix |
|---|---|
| Unlayered `.amara-edge` sets `position: relative` and beats `lg:absolute` | Wrap in a positioned span. `@layer components` doesn't help; Tailwind v4 unwraps it |
| Global `:focus-visible` overrode `outline-none` | Base styles in `@layer base` |
| Duplicate SVG gradient ids blanked `AmaraMark` on mobile | `useId()` |
| Stale `.next/types` after deleting a route | `rm -rf .next/types` |
| `params` outside Suspense breaks the instant shell | Read in an async child under `<Suspense>` |
| `liveNow()` during render | Hydration mismatch; handlers only |
| New `amaraReply` intent never fires | An earlier, broader intent matches first; reorder |
| Browser preview pane is small and throttled | Verify with DOM checks |

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Single client context re-renders everything | Fine at demo scale; slow with real data | Split contexts or move to server data + query cache in Phase 1 |
| Mock intent matching looks brittle | Demo feels scripted | Chips steer; real model in Phase 1 |
| State lost on reload | Demo hiccup | Mention up front; `localStorage` snapshot in backlog |
| Model cost grows with usage | Margin | §6.3 controls + drafts-sent ratio |
| Job board API access | Phase 2 delay | Start with email ingestion |

## 10. Technical coverage of the discovery board

The board at `public/design-thinking-board.html` is an editable planning artifact, not a production data source. Its browser storage and exported snapshots are independent of the app's memory-only store. Board IDs are traceability labels; proposed app contracts below must be implemented and verified before they are described as available.

### 10.1 Home states and composer (DC-1, DC-4)

Keep `homeStage` for deterministic Day 1 / returning fixtures. The proposed compliant Home variant reuses the composer, `Reply`/`Block` renderers and request lifecycle rather than introducing a second AI engine. It can coexist with the global drawer. Evolve the main Home within the single product direction.

Derive starter prompts from state and available records. Day 1 offers setup or a first role; returning state offers work tied to real fixture records. No records means an actionable empty state, not invented urgency. Optional checklist progress belongs in session UI state until persistence is separately implemented. A draft is generated only after user intent; the existing static/mock Today sentence must not be presented as a fresh live-model call.

### 10.2 Context and conversation lifecycle (DC-3, DC-6)

Existing `askContext`, `pendingAsk`, `askReply` and `Reply` provide the starting point. Proposed additions must carry selected-record context, not just a page label. The following is a planned context envelope, not the current TypeScript interface:

| Field | Contract |
|---|---|
| Request identity | Unique request ID; only the active request may append its response |
| Origin | Route, initiating control and record reference; return target remains available |
| Subject | Allowlisted kind and stable record ID; validate existence before building context |
| Scope | Day 1 / returning fixture, selected date range and personal/team scope |
| Facts | Compact snapshot with source record IDs and timestamps; do not include unrelated records |
| User control | Context chip reflects attached facts; remove clears the attachment for subsequent requests |
| Draft state | User question and unsent edited output survive drawer close and in-session return |

Lifecycle: `idle → submitting → streaming → ready`, with explicit `error` and `cancelled` states. Preserve the user's text on failure; retry uses the intended snapshot and a new request identity. Reject late responses after cancellation or a context change. Starting a conversation updates focus and layout; the return action restores orientation to the initiating element when it still exists.

Keep the existing `Reply`/`Block` output contract. Before adding types, reuse current `drafts`, `metrics`, `invoices`, `steps` and linked `list` blocks. Proposed provenance and missing-information metadata can live in a separate reply envelope; do not claim the current block schema already carries it. Unknown intents should offer a relevant next step instead of fabricating records or facts.

### 10.3 Metrics, invoices and team scope (DC-2, DC-7–DC-8)

- Metrics require current range, comparison range, scope and definitions for each funnel stage. Only show growth when comparable data and a defined denominator exist; a missing or zero denominator requires an explicit unavailable state. Do not label a fixture target as the previous-period value. Current screenshot percentages are not verified business definitions.
- Preserve all reference information: five funnel counts, tasks, draft/outstanding/overdue invoice totals and invoice rows, leaderboard or its empty state, range control and Overview/Analytics access. Compact layouts must retain a direct detail path.
- Proposed invoice context includes stable invoice/client IDs, amount, currency, status, issued/due dates and any missing fields. The existing name-based fixture join remains documented in §4.4; production relationships use IDs. Draft actions inspect missing information; unpaid actions prepare reminders; paid invoices do not trigger payment chasing. Neither age nor a zero amount determines payment status.
- Personal/team scope and assignee are distinct. Do not add an admin permission role merely because the board identifies an administrative responsibility. Existing Owner/Recruiter/Resourcer permissions remain the prototype policy until separately reviewed.

### 10.4 Explainable attention (DC-5, DC-8)

Proposed attention items carry a subject reference, owner when known, next action, explicit reason code and supporting fact. Candidate reasons include missed promised update, feedback past its agreed date, overdue task and incomplete invoice. Show an overdue invoice only when status and due date support it. Keep missing due dates and assignees visible as unknown.

The existing inactivity heat score can remain an illustrative secondary signal, clearly labeled as a demo heuristic. It must not be described as a calibrated probability, predicted fee loss or proof a deal is dying. A proposed ranking should prioritize confirmed commitments before generic inactivity and use deterministic tie-breaking for repeatable demos. Team coaching and mentorship routing remain later discovery work.

### 10.5 Human review and simulated actions (DC-6–DC-7)

Draft generation is read/draft only. Show source facts, identify missing information, allow edits and require a separate explicit action to change simulated state. Explain that no email, message, accounting action or live model call occurs in this prototype. Generation alone must not call `markSent`, move a stage, change invoice status or log an outbound-send event.

Production actions require tenant-scoped authorization, server validation and duplicate-submission protection; client context and model output cannot grant permissions. External sends should have distinct pending/succeeded/failed states, with success recorded only after provider confirmation. These are future integration requirements, not implemented guarantees.

### 10.6 Evidence, scope and submission (DC-9–DC-10)

Keep source observations, hypotheses, design decisions and test outcomes distinguishable in English documentation. Product measurements must include period and scope; research notes must identify the source and evaluator. Do not turn the board's illustrative persona statements into interview quotes.

The minimum demo is a combined home, preserved dashboard and one contextual follow-up loop, with both new-member and returning fixtures. Surrounding desk features are extensions; the hidden calculator remains intact but outside this scope. Auth, backend persistence, real AI and integrations remain non-goals for the challenge. Prototype time estimates in §7 are planning estimates, not delivery commitments.

Submission checklist: demo and source, concise design rationale, explicit central-input trade-off, mock/data limitations, evidence of checks, and an honest explanation of AI usage. Record AI-assisted research synthesis, content drafting, implementation or validation only when it actually occurred; distinguish human decisions from AI suggestions. Deployment and commits retain the authorization rules in `docs/AGENTS_HANDOFF.md`.
