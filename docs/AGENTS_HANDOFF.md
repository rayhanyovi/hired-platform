# Agents Handoff: Amara Desk

Read this before touching the code. It's written for a coding agent (or a human) picking up the work cold.

**Last updated:** 13 Oct 2026 · **Owner:** Rayhan (Jakarta, writes casual Indonesian; reply in kind)

## 1. What this is

A frontend prototype for HeyAmara's CTO challenge: redesign Home so the dashboard and the AI chat entry point feel like one experience. It has grown into a working concept of the whole recruiter desk. Everything is mocked; no backend, no real model.

Read in this order: `docs/PRD.md` (requirements with IDs, e.g. F-3) → `docs/DESIGN_DIRECTION.md` → `docs/TECH_PLAN.md` (store actions, AI contract, production plan) → `docs/BACKLOG.md` (open items B-xxx, done items D-xxx). History: `docs/BUILD_LOG.md`.

## 2. Ground rules (from Rayhan)

1. **Maintain one product direction.** Rayhan has removed the alternative design exploration; evolve the main Home and shared shell.
2. **Don't commit** unless asked. **Don't deploy** (Vercel) without asking; it makes the demo public.
3. **Don't delete The Sum.** It's hidden from the menu and search on purpose; `/sum` must keep working.
4. Keep the AI style rules: `AmaraButton` for every AI action, `AmaraTag` for AI labels, gradient only for AI. See DESIGN_DIRECTION §4.
5. **AI on request.** Don't add AI generation that runs on page load. Put it behind a button.
6. No serif for numbers or body text. Inter for UI, Playfair only for greetings and empty-state headlines, JetBrains Mono for figures.
7. This Next.js (16.4) differs from training data. Read `node_modules/next/dist/docs/` before changing routing, caching or data fetching (`AGENTS.md`).
8. Write project documentation and newly authored artifact/interface copy in English (Rayhan's instruction). Preserve intentional existing greetings and source quotations. See PRD §16 and Tech Plan §10 for discovery coverage; proposed requirements are not proof of implemented behavior.

## 3. Run and verify

```bash
cd hired_platform
npm install
npm run dev            # or the "amara-desk" launch config in hired_bot/.claude/launch.json (port 3100)
npx tsc --noEmit
npx eslint .
npx next build
```

All three must pass before handing back. The in-app browser pane is small and throttled: verify with DOM checks (`javascript_tool`) and use screenshots only for visual proof.

Talent profiles, placements, their dependency records, document metadata, notes, calendar and audit history persist in versioned browser-local storage. Other UI/conversation fixtures can still reset. See `docs/CANDIDATES.md` and `docs/PLACEMENTS.md`; this is not a shared backend. The Home tour visit marker persists in localStorage (`heyamara:home-tour-seen` = `true`). Home opens its tour automatically once per browser origin, after its entrance and panel reveals finish. The entrance plays once per member per local calendar day, tracked separately with `amara:home-welcome:v1:<memberId>`. Reloads on that day skip it; removing the tour marker only resets the tour. The question-mark button always allows manual replay.

## 4. Where things live

| You want to change… | Go to |
|---|---|
| Nav items | `components/shell/sidebar.tsx` (`useNav`): Recruit (Candidates, Placements, Calendar, Communication), Business (Clients, Prospects, Documents), Agency |
| Talent database and candidate profiles | `components/candidates/`, `lib/people.ts`, `talentRows` in `lib/placements.ts` |
| Company-specific recruitment processes | `components/placements/`, `lib/placements.ts`, `lib/candidate-pipeline.ts`, store `createPlacements` / `setPersonStatus` |
| Prospect stages, "Find people" results | `lib/prospects.ts`, UI in `components/prospects/prospects-page.tsx` |
| Calendar seed and Sydney date maths | `lib/calendar.ts`, UI in `components/calendar/calendar-page.tsx` |
| Threads, call log, reply/nudge drafts | `lib/communication.ts`, UI in `components/communication/` (`updates.tsx` is the old Follow-ups composer) |
| Tasks and notes seed | `lib/tasks.ts`; shared UI in `components/records/` (`TaskList`, `Notes`, `History`, `RecordTabs`) |
| Analytics and Sales numbers | `lib/analytics.ts`; charts in `components/home/charts.tsx` |
| Home, Documents and Team subpage navigation | `components/ui/subpage-tabs.tsx` |
| Daily Home welcome gate | `lib/home-entrance.ts`; local browser calendar day and per-member localStorage marker |
| Status pill menu, Table/Board toggle | `components/ui/menu.tsx` (`StatusMenu`, `Segmented`) |
| Ask drawer UI / shortcut | `components/shell/ask-drawer.tsx` |
| What the drawer knows about a page, and its answers | `lib/ask.ts` (`askContext`, `askReply`, `routeKey`) |
| Generic Amara answers on Home / Chat | `lib/amara-chat.ts` (`amaraReply`, intent order matters) |
| Search results and lenses | `lib/search.ts`, UI in `components/shell/search.tsx` |
| Any state or action | `lib/store.tsx` (`useDesk`) |
| Seed data | `lib/data.ts` (deals, follow-ups), `lib/agency.ts` (clients, jobs, applicants, candidates, members, documents) |
| Home mock data (metrics, tasks, invoices, leaderboards) | `lib/home.ts` |
| Raw applications | `lib/application.ts` |
| Follow-up draft text | `lib/ai.ts` |
| Tours | `lib/tours.ts` + `data-tour` attributes |
| Tokens | `app/globals.css` (`@theme`) |

## 5. Conventions

- One folder per feature in `components/`; routes in `app/` are thin.
- Cross-page selection goes through store setters (`setFocusPerson`, `setFocusProspect`, `selectThread`, `selectFollowUp`, `setJobFilter`, `setTeamView`), not query strings. `useOpenSubject()` in `components/records/tasks.tsx` opens any client, prospect or candidate.
- Anything about a record logs with `subjectId` so the record's History tab can read it.
- Every user action calls `log()` so it appears in the deal Activity and the Audit log.
- Dynamic routes: read `params` inside `<Suspense fallback={<PageSkeleton/>}>` and `generateStaticParams` returns at least one id. `/clients/[id]` and `/deals/[id]` handle unknown ids in the client view (records created in-session only exist in state); `/learnings/[id]` uses `notFound()`.
- New AI reply shapes must reuse `Block` types (`candidates | drafts | invoices | metrics | steps | list`) so the thread renders them.
- When adding an intent to `amaraReply`, check that an earlier, broader intent doesn't catch it first.
- When adding a page section worth explaining, add a tour step and a `data-tour` target.
- Match existing comment density: short "why" comments, no narration.

## 6. Gotchas

- `.amara-edge` is unlayered CSS with `position: relative`; it beats Tailwind utilities. To position an AmaraButton absolutely, wrap it in a positioned span.
- `AmaraMark` gradients need unique ids (`useId`), already handled; don't hard-code ids in new SVGs.
- After deleting a route, `rm -rf .next/types` before running tsc.
- If a long-running `next dev` serves new pages with 500s that read like missing store fields, its server copy of `lib/store.tsx` is stale: touch `lib/store.tsx` and `app/layout.tsx` and reload.
- Home invoice clients must match names in `lib/agency.ts` clients, because client pages filter invoices by name (`invoicesFor`). Home Tasks still use dummy company names (B-005).

## 7. Current state

Working: Home (Overview / Analytics / Sales, Day 1 / Day 30), Ask drawer, /chat, ⌘K search, Candidates (data-only talent library with expanding profiles), Placements (list / board, independent status per candidate–client process), Calendar, Communication (inbox, no reply yet, calls, waiting on you), Clients (active only, detail with tasks, notes, invoices), Prospects (table / board, expanding rows), Deal page, Documents, Team (members / leaderboard), Audit log, Learnings, tours.

Redirects: `/applicants` → `/candidates`; `/pipeline` → `/placements`; `/follow-ups` → `/communication`.

Hidden: The Sum (`/sum`).

## 8. Next up

1. Rayhan's review of the staging merge (13 Oct): naming, status list, Sales semantics.
2. B-033 board drag-and-drop check, B-034 Calendar Day view on phones.
3. Submission write-up, then deploy **only after Rayhan says yes**.

## 9. Handoff checklist for the next agent

- [ ] Read PRD §5 (why chat is a drawer, not centred on Home)
- [ ] Run the three checks and confirm they pass before changing anything
- [ ] Confirm with Rayhan before deploying, committing, or deleting anything
- [ ] Update `docs/BUILD_LOG.md` and `docs/BACKLOG.md` when you finish a part
