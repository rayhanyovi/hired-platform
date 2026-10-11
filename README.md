# Amara Desk

A concept for HeyAmara's AI platform: the recruiter's daily desk, where AI does the volume and the recruiter keeps the relationships. All data and AI responses are mocked.

Built around three things Harvey Jutton keeps writing about:

| Insight | Screen |
|---|---|
| "Time kills deals" | **Today** and **Pipeline**: every deal has a heat bar that drains while it sits untouched. It drains faster near an offer, and deals are ranked by fee × odds of closing × how cold they are |
| "You didn't ghost me, you told the truth" | **Follow-ups**: everyone waiting on you (rejections included). Write the update yourself, or press Draft with Amara for an honest draft. You review and send |
| "I've never done that sum" | **The Sum** (`/sum`, hidden from the menu for now): billings vs take-home, and what the same desk would earn under your own name |

### Home, Chat and Ask HeyAmara

| Surface | What it does |
|---|---|
| **Home** (`/`) | A welcome, one line from Amara about what matters, and the dashboard with Overview (funnel metrics, tasks, invoices, leaderboard) and Analytics (conversion, fees by month) tabs. A demo toggle switches between a member who just joined and an established desk. Every "ask" on Home opens the drawer with the question already sent |
| **Ask HeyAmara** (navbar, ⌘J) | A drawer that knows which page you're on. It shows what it's looking at ("Follow-ups · 7 people waiting · 6 overdue"), suggests page-specific questions, and answers from that page's data, with links back to the records. On wide screens it pushes the page aside instead of covering it |
| **Chat** (`/chat`) | Amara on its own: an empty, welcoming start that turns into a conversation, with recent chats on the side |
| **Search** (⌘K) | Finds deals, clients, roles, candidates, applicants, follow-ups, documents, lessons and pages. Amara understands phrases like "going cold", "unsigned" or "strong fit", and questions go straight to the Ask HeyAmara drawer |

### Running the agency

| Area | What it does |
|---|---|
| **Clients** | Cards or a list. Every company you hire for or are pitching (Active / Prospect, TOB status), the roles each one is hiring for, and everyone attached to each role: applied, shortlisted, in pipeline, placed |
| **Applicants** | Applications from job ads and email. **Sync** simulates new ones arriving; Amara screens each CV against the brief, and the original application (email and attachments, or screening answers, cover letter and CV) is one tab away. Shortlist (S) or decline (D). Declining queues an honest update in Follow-ups |
| **Candidates** | The curated pool across clients. Reach out, then add to pipeline (creates a deal) |
| **Deal page** | `/deals/[id]`: stage stepper, Amara's read, a discussion thread with @mentions and approval requests, documents, activity |
| **Documents** | Generate a TOB, candidate submission, offer recap or invoice, filled from deal data. Log what clients send you (offer letters, contracts, signed TOBs). One register for both |
| **Team** | Owner / Recruiter / Resourcer, approval rules (fee floor, invoice sign-off), a permissions matrix, "view as" to demo each role, and a team / network leaderboard |
| **Audit log** | Every action from a single event stream (the same one that feeds each deal's Activity). Filter, then export CSV or JSON. Exporting is itself logged |
| **Learnings** | Placeholder curriculum: videos, readings, quizzes |

State lives in memory, so a full page reload resets the demo.

## Docs

[PRD](docs/PRD.md) · [Tech plan](docs/TECH_PLAN.md) · [Backlog](docs/BACKLOG.md) · [Design direction](docs/DESIGN_DIRECTION.md) · [Build log](docs/BUILD_LOG.md) · [Agents handoff](docs/AGENTS_HANDOFF.md)

## Design rules

- **Violet means Amara.** The UI is monochrome, and the brand gradient only appears on AI-authored content, so you always know what a machine wrote.
- **Colour means attention.** Amber means cooling and frost blue means cold. Healthy deals stay neutral.
- **AI drafts, humans send.** Nothing goes out without a click, and every draft shows the facts it was built from.
- The visual language comes from heyamara.com: Playfair Display, Inter, JetBrains Mono, #181818 surfaces, and the two-stroke "A".

## Run

```bash
npm install
npm run dev
```

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind v4, lucide-react. Mock data lives in `lib/data.ts`, and every "AI" output comes from `lib/ai.ts`, so swapping in a real model means replacing those functions with streamed API calls.
