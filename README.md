# Amara Desk

A concept for HeyAmara's AI platform: the recruiter's daily desk, where AI does the volume and the recruiter keeps the relationships. All data and AI responses are mocked.

Built around three things Harvey Jutton keeps writing about:

| Insight | Screen |
|---|---|
| "Time kills deals" | **Home** and **Candidates**: every deal has a heat bar that drains while it sits untouched. It drains faster near an offer, and deals are ranked by fee × odds of closing × how cold they are |
| "You didn't ghost me, you told the truth" | **Communication → Waiting on you**: everyone waiting on an update (rejections included). Write it yourself, or press Draft with Amara for an honest draft. You review and send |
| "I've never done that sum" | **The Sum** (`/sum`, hidden from the menu for now): billings vs take-home, and what the same desk would earn under your own name |

### Home, Chat and Ask HeyAmara

| Surface | What it does |
|---|---|
| **Home** (`/`) | A welcome, one line from Amara about what matters, and the dashboard with Overview (funnel metrics, every task on the desk, invoices, leaderboard), Analytics (revenue, lead generation, conversion, growth) and Sales (dials, calls booked, show and close rates, closers and setters). A demo toggle switches between a member who just joined and an established desk. Every "ask" on Home opens the drawer with the question already sent |
| **Ask HeyAmara** (navbar, ⌘J) | A drawer that knows which page you're on. It shows what it's looking at ("Follow-ups · 7 people waiting · 6 overdue"), suggests page-specific questions, and answers from that page's data, with links back to the records. On wide screens it pushes the page aside instead of covering it |
| **Chat** (`/chat`) | Amara on its own: an empty, welcoming start that turns into a conversation, with recent chats on the side |
| **Search** (⌘K) | Finds deals, clients, prospects, roles, candidates, applicants, messages, tasks, documents, lessons and pages. Amara understands phrases like "going cold", "unsigned", "strong fit" or "chase", and questions go straight to the Ask HeyAmara drawer |

### Running the agency

The rail groups pages as **Recruit** (Candidates, Calendar, Communication), **Business** (Clients, Prospects, Documents) and **Agency** (Team, Audit trail, Learnings).

| Area | What it does |
|---|---|
| **Candidates** | Applicants, the shortlist, the pipeline and people waiting on an update, as one list with one status each (Applied → Shortlisted → Contacted → Screening → Submitted → Interviewing → Final round → Offer → Placed). Table or Board. Click a row and it opens in place: profile, Amara's screening or deal read, history, the original application, tasks and notes. **Sync** simulates new applications arriving; Amara screens each against the brief. Declining queues an honest update in Communication |
| **Calendar** | Day, week and month. Interviews, meetings, calls, follow-ups and start dates, plus tasks on the day they're due. Event details link back to the deal or record; click a slot to book something |
| **Communication** | Email, SMS, LinkedIn and WhatsApp in one inbox, the call log, and **Waiting on you** (the honest-update composer). Anything you sent 3+ days ago without a reply is flagged "Follow up?"; Amara drafts replies and nudges when you ask |
| **Clients** | Cards or a list of active clients, the roles each one is hiring for, and everyone attached to each role. Each client page has tasks, notes, invoices, documents and activity |
| **Prospects** | Companies you're pitching, New → Interested → Follow up → Meeting → Negotiation → Terms sent → Terms signed. Table or Board; rows expand to contacts (Amara can find more people there), history, tasks and notes. Once signed, make them a client |
| **Tasks** | Written from any client, prospect or candidate; all of them show on Home with a chip back to the record, and dated ones show on the Calendar |
| **Deal page** | `/deals/[id]`: stage stepper, Amara's read, a discussion thread with @mentions and approval requests, documents, activity |
| **Documents** | Generate a TOB, candidate submission, offer recap or invoice, filled from deal data. Log what clients send you (offer letters, contracts, signed TOBs). One register for both |
| **Team** | Owner / Recruiter / Resourcer, approval rules (fee floor, invoice sign-off), a permissions matrix, "view as" to demo each role, and a team / network leaderboard |
| **Audit log** | Every action from a single event stream (the same one that feeds each deal's Activity and every record's History). Filter, then export CSV or JSON. Exporting is itself logged |
| **Learnings** | Placeholder curriculum: videos, readings, quizzes |

`/applicants` and `/pipeline` redirect to Candidates, and `/follow-ups` to Communication.

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
