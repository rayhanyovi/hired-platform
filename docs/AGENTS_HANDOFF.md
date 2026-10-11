# Agents Handoff: Amara Desk

Read this before touching the code. It's written for a coding agent (or a human) picking up the work cold.

**Last updated:** 11 Oct 2026, 14:30 WIB · **Owner:** Rayhan (Jakarta, writes casual Indonesian; reply in kind)

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

Desk state is in memory; **reloading resets the demo**. The Home tour visit marker persists in localStorage (`heyamara:home-tour-seen` = `true`). Home opens its tour automatically once per browser origin, after its entrance and panel reveals finish. The entrance itself replays after a reload and runs once per mounted desk session. Remove only that key to test a first visit again. The question-mark button always allows manual replay.

## 4. Where things live

| You want to change… | Go to |
|---|---|
| Nav items | `components/shell/sidebar.tsx` (`useNav`) |
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
- Cross-page selection goes through store setters (`selectApplicant`, `selectFollowUp`, `selectCandidate`, `setJobFilter`, `setTeamView`), not query strings.
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
- Home invoice clients must match names in `lib/agency.ts` clients, because client pages filter invoices by name (`invoicesFor`). Home Tasks still use dummy company names (B-005).

## 7. Current state

Working: Home (Overview / Analytics, Day 1 / Day 30), Ask drawer, /chat, ⌘K search, Clients (cards / list, detail with invoices), Applicants (screening / original), Candidates, Pipeline, Deal page, Follow-ups (blank + Draft with Amara), Documents, Team (members / leaderboard), Audit log, Learnings, tours.

Hidden: The Sum (`/sum`).

## 8. Next up

1. **Waiting on Rayhan:** go-ahead for "Tasks → Follow-ups" (B-006).
2. Rename Home Tasks companies to real clients/prospects (B-005).
3. Submission write-up, then deploy **only after Rayhan says yes**.

## 9. Handoff checklist for the next agent

- [ ] Read PRD §5 (why chat is a drawer, not centred on Home)
- [ ] Run the three checks and confirm they pass before changing anything
- [ ] Confirm with Rayhan before deploying, committing, or deleting anything
- [ ] Update `docs/BUILD_LOG.md` and `docs/BACKLOG.md` when you finish a part
