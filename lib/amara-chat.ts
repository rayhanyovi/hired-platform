/**
 * Simulated Amara for the Home chat. Picks a reply by intent and returns
 * text plus structured blocks the UI renders as cards. A real build would
 * stream these from a model with tool calls; the shapes would stay the same.
 */
import type { MetricKind } from "@/components/ui/metrics";
import { INVOICES, metricsFor, TASKS, type Stage } from "./home";
import type { Fit } from "./types";

export type Block =
  | { type: "candidates"; items: { name: string; headline: string; location: string; fit: Fit; why: string }[] }
  | { type: "drafts"; items: { company: string; initials: string; subject: string; body: string }[]; more?: number }
  | { type: "invoices"; items: { client: string; amount: number; date: string }[] }
  | { type: "metrics"; rows: { kind: MetricKind; now: number; target?: number }[] }
  | { type: "steps"; items: { title: string; detail: string }[] }
  | { type: "list"; items: ListItem[] };

/** A row Amara points at. With a href it opens the thing it's talking about. */
export type ListItem = { title: string; meta?: string; detail?: string; href?: string; tone?: "warm" | "bad" | "good" };

export type Reply = { text: string; blocks: Block[]; followups: string[] };

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

/** Sent invoices, oldest first: the ones most worth chasing. */
const oldestSent = (n: number) =>
  INVOICES.filter((i) => i.status === "sent")
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(0, n);

const SRE_TRIO = [
  { name: "Hamish", company: "REA Group", hook: "the payments platform you ran on-call for" },
  { name: "Rohan", company: "Afterpay", hook: "the incident command work you led" },
  { name: "Kai", company: "Canva", hook: "your observability work" },
];

export function amaraReply(prompt: string, stage: Stage): Reply {
  const q = prompt.toLowerCase();

  // Specific follow-ups first, so every suggestion chip gets a real answer.

  if (has(q, "outreach to all", "all three")) {
    return {
      text: "Three short notes, each opening with something specific to them. Candidates reply to specifics, not to job titles.",
      blocks: [
        {
          type: "drafts",
          items: SRE_TRIO.map((c) => ({
            company: `${c.name} · ${c.company}`,
            initials: c.name.slice(0, 2).toUpperCase(),
            subject: "A Senior SRE role worth 15 minutes",
            body: `Hi ${c.name}, I came across ${c.hook} and thought of a Senior SRE role at a Melbourne bank rebuilding its platform from scratch. Senior scope, strong team, hybrid. Open to a quick call this week?`,
          })),
        },
      ],
      followups: ["Make them warmer", "Find more like Hamish"],
    };
  }

  if (has(q, "why is kai", "possible fit")) {
    return {
      text: "Kai's skills are a strong match: large-scale SRE work at Canva and excellent observability experience. The gap is location. The role is Melbourne hybrid, two days a week in the office, and Kai is in Sydney. If he'd commute or relocate, he moves to a strong fit. Worth asking on the first call.",
      blocks: [],
      followups: ["Draft outreach to all three", "Find more like Hamish"],
    };
  }

  if (has(q, "other five")) {
    const drafts = TASKS.slice(3).map((t) => ({
      company: t.company,
      initials: t.initials,
      subject: `Quick check-in from Whitford Talent`,
      body: `Hi there, I know things get busy. Is the role still open on your side? If it's on hold, no problem at all, just let me know and I'll check back next quarter.`,
    }));
    return { text: "The other five, same tone. Each one gives them an easy way to say 'not now', which gets more replies than silence.", blocks: [{ type: "drafts", items: drafts }], followups: ["Make them warmer"] };
  }

  if (has(q, "warmer")) {
    const t = TASKS.find((x) => q.includes(x.company.toLowerCase())) ?? TASKS[0];
    return {
      text: "Warmer version. It leads with the relationship rather than the role, and drops the ask to a single line:",
      blocks: [
        {
          type: "drafts",
          items: [
            {
              company: t.company,
              initials: t.initials,
              subject: "Hope the quarter's treating you well",
              body: "Hi there, I've been thinking about your team since we last spoke and wanted to check in. No pressure at all. If the hire is still on your mind, I'd love to help. If not, I hope it's a good quarter.",
            },
          ],
        },
      ],
      followups: ["Draft the other five", "Which of these clients is worth the most?"],
    };
  }

  if (has(q, "worth the most")) {
    return {
      text: "Eclipse Solutions and Citadel Group. Both have senior roles open with fees around A$40k each, and both replied quickly before going quiet, which usually means an internal delay rather than lost interest. Start there.",
      blocks: [],
      followups: ["Draft follow-ups for my 8 quiet clients"],
    };
  }

  if (has(q, "reminder")) {
    const sent = oldestSent(4);
    return {
      text: "Four polite reminders. They assume good faith and make paying easy by restating the amount and invoice date:",
      blocks: [
        {
          type: "drafts",
          items: sent.map((i) => ({
            company: i.client,
            initials: i.client.slice(0, 2).toUpperCase(),
            subject: `Invoice from ${i.date}`,
            body: `Hi, a gentle reminder that our invoice dated ${i.date} for A$${i.amount.toLocaleString("en-AU")} is still open. Happy to resend it or the bank details if that helps. Thanks!`,
          })),
        },
      ],
      followups: ["When is the next one due?"],
    };
  }

  if (has(q, "next one due")) {
    return { text: "The next due date is Kestrel Robotics on 18 July, for A$29,900. Nothing is overdue yet, so no reminders are needed beyond the four oldest.", blocks: [], followups: ["Which invoices should I chase?"] };
  }

  if (has(q, "tidewater draft")) {
    return {
      text: "The Tidewater Bank invoice (A$13,750) is still a draft because it needs the Owner's sign-off before it goes out. It's in Documents, waiting for approval.",
      blocks: [],
      followups: ["Which invoices should I chase?"],
    };
  }

  if (has(q, "rank", "network")) {
    return {
      text: "You're 2nd of 8 in the HeyAmara network this month, 24 points behind Priya Nair. She's ahead on calls (980 vs your 912) but your conversion to submittals is better. Another 70 calls this month would likely take first place.",
      blocks: [],
      followups: ["How am I tracking this month?"],
    };
  }

  if (has(q, "good week", "set these")) {
    return {
      text:
        stage === "day1"
          ? "Done. Your weekly targets are 120 calls, 15 submittals and 1 placement a month. I'll show progress against them on Home and nudge you on Friday if you're behind."
          : "A good week for your desk looks like 100+ calls, 12 to 15 submittals and at least two client meetings. You've hit that in three of the last four weeks.",
      blocks: [],
      followups: stage === "day1" ? ["Help me set up my agency", "Find top candidates for a role"] : ["How am I tracking this month?"],
    };
  }

  if (has(q, "add my first client")) {
    return {
      text: "Tell me the company name and I'll pull in what's public: size, recent hires, the likely hiring manager and open roles on their careers page. You confirm it, and they're in Clients with a draft Terms of Business ready to send.",
      blocks: [],
      followups: ["Draft my Terms of Business", "Write my first client outreach"],
    };
  }

  if (has(q, "niche")) {
    return {
      text: "Tech roles in Sydney at 20% is a strong niche. Demand is steady and the fees are healthy. I've saved it to your profile. Next, let's add one client you're already talking to. What's the company?",
      blocks: [],
      followups: ["Draft my Terms of Business", "Find top candidates for a role"],
    };
  }

  if (has(q, "sliding rebate")) {
    return {
      text: "A sliding rebate shares the risk fairly. If a placement leaves in the first 4 weeks the client gets 100% back, then 50% up to 8 weeks and 25% up to 12. Clients sign faster when they know a bad hire won't cost them the full fee.",
      blocks: [],
      followups: ["Is 20% the right fee for me?"],
    };
  }

  if (has(q, "right fee")) {
    return {
      text: "20% is the market rate for permanent tech roles in Australia. Go to 22 to 25% for senior or hard-to-fill roles. Avoid going below 18% to win a client. It's hard to raise later, and it trains them to negotiate.",
      blocks: [],
      followups: ["Draft my Terms of Business"],
    };
  }

  const oneClient = TASKS.find((t) => q.includes(`follow-up to ${t.company.toLowerCase()}`));
  if (oneClient) {
    return {
      text: `${oneClient.company} hasn't replied in ${oneClient.daysAgo} days (${oneClient.detail}). Here's a short follow-up that's easy to answer from a phone:`,
      blocks: [
        {
          type: "drafts",
          items: [
            {
              company: oneClient.company,
              initials: oneClient.initials,
              subject: `Still keen to help ${oneClient.company} hire?`,
              body: `Hi there, it's been a few weeks since my last note and I didn't want it to get buried. I've got two candidates who fit the brief well. Worth a 15-minute call this week? If timing's changed, just tell me and I'll stop chasing.`,
            },
          ],
        },
      ],
      followups: [`Make the ${oneClient.company} email warmer`, "Draft follow-ups for my 8 quiet clients"],
    };
  }

  if (has(q, "follow", "quiet", "eclipse", "no reply", "tasks", "chase client")) {
    const drafts = TASKS.slice(0, 3).map((t) => ({
      company: t.company,
      initials: t.initials,
      subject: `Still keen to help ${t.company} hire?`,
      body: `Hi there, it's been a few weeks since my last note and I didn't want it to get buried. I've got two candidates who fit the brief well. Worth a 15-minute call this week? If timing's changed, just tell me and I'll stop chasing.`,
    }));
    return {
      text: `${TASKS.length} clients haven't replied in 28 days. Here are drafts for the first three, each short enough to answer from a phone. I'll write the other five the same way once you're happy with the tone.`,
      blocks: [{ type: "drafts", items: drafts, more: TASKS.length - drafts.length }],
      followups: ["Make them warmer", "Draft the other five", "Which of these clients is worth the most?"],
    };
  }

  if (has(q, "candidate", "sre", "shortlist", "find", "source")) {
    return {
      text:
        stage === "day1"
          ? "Here's how a shortlist looks. Paste a real job description and I'll search your network, job boards and past applicants for it. For now, three strong Senior SRE profiles:"
          : "Three Senior SREs who match the brief, ranked by fit. Two are open to a move and one is passive, so worth a warm intro.",
      blocks: [
        {
          type: "candidates",
          items: [
            { name: "Hamish Byrne", headline: "Platform Engineer · REA Group", location: "Melbourne", fit: "strong", why: "7 years running Kubernetes at scale, led payments on-call" },
            { name: "Rohan Iyer", headline: "Senior SRE · Afterpay", location: "Melbourne", fit: "strong", why: "Payments infrastructure and incident command" },
            { name: "Kai Tanaka", headline: "Site Reliability Engineer · Canva", location: "Sydney", fit: "possible", why: "Strong observability work. Would need to relocate" },
          ],
        },
      ],
      followups: ["Draft outreach to all three", "Why is Kai only a possible fit?", "Find more like Hamish"],
    };
  }

  if (has(q, "invoice", "chase", "outstanding", "paid", "owed")) {
    if (stage === "day1") {
      return {
        text: "No invoices yet. Your first one is created when you make a placement, filled in from the deal, so you never re-type a salary. Want me to walk you through how fees and rebates work?",
        blocks: [],
        followups: ["How do fees and rebates work?", "Draft my Terms of Business"],
      };
    }
    const sent = oldestSent(4);
    return {
      text: "63 invoices are outstanding and none are overdue yet. These four are the oldest, so they're the ones to chase this week:",
      blocks: [{ type: "invoices", items: sent.map((i) => ({ client: i.client, amount: i.amount, date: i.date })) }],
      followups: ["Draft polite reminders for these four", "When is the next one due?", "Send the Tidewater draft"],
    };
  }

  if (has(q, "track", "month", "metric", "how am i", "compare", "rank", "leaderboard", "target")) {
    if (stage === "day1") {
      return {
        text: "Nothing to track yet, and that's fine. Most members make their first placement within 6 to 8 weeks. Set yourself weekly targets and I'll tell you every morning how you're going.",
        blocks: [{ type: "steps", items: [{ title: "120 calls a week", detail: "The habit that drives everything else" }, { title: "15 submittals a week", detail: "Roughly one in eight calls" }, { title: "1 placement a month", detail: "Where your fees come from" }] }],
        followups: ["Set these as my targets", "What does a good week look like?"],
      };
    }
    const m = metricsFor("day30", "month");
    return {
      text: "You're on pace for calls and ahead on submittals, but offers have dipped 12% on last month. That's usually slow clients, not you. Your eight quiet follow-ups are the fastest fix.",
      blocks: [{ type: "metrics", rows: (["calls", "submittals", "interviews", "offers", "placements"] as MetricKind[]).map((k) => ({ kind: k, now: m[k].value, target: m[k].target })) }],
      followups: ["Draft follow-ups for my 8 quiet clients", "Where do I rank in the network?"],
    };
  }

  if (has(q, "set up", "setup", "agency", "first", "start", "what should")) {
    return {
      text: "Welcome in. Let's get you to your first placement. Four steps, about 20 minutes, and I'll do the heavy lifting on each one:",
      blocks: [
        {
          type: "steps",
          items: [
            { title: "Tell me your niche and fee", detail: "e.g. tech roles in Sydney at 20%" },
            { title: "Add one client you're already talking to", detail: "I'll pull their details from LinkedIn" },
            { title: "Send your Terms of Business", detail: "Drafted from your fee and rebate terms" },
            { title: "Paste their job description", detail: "I'll come back with a shortlist" },
          ],
        },
      ],
      followups: ["My niche is tech roles in Sydney", "Draft my Terms of Business", "Find top candidates for a role"],
    };
  }

  if (has(q, "outreach", "client", "pitch", "email")) {
    return {
      text: "Here's a first client outreach. It leads with one specific candidate, which gets far more replies than a generic intro:",
      blocks: [
        {
          type: "drafts",
          items: [
            {
              company: "A client you're targeting",
              initials: "··",
              subject: "A Senior SRE you might want to meet",
              body: "Hi Priya, I'm working with a platform engineer who's run Kubernetes at scale for a payments business and is quietly looking. Given what Tidewater is building, I thought of you first. Open to a 15-minute call?",
            },
          ],
        },
      ],
      followups: ["Draft my Terms of Business", "Find top candidates for a role"],
    };
  }

  if (has(q, "terms", "tob", "rebate", "fee")) {
    return {
      text: "Your Terms of Business set your fee, the rebate if a placement leaves early, and payment terms. The usual setup is 20% of base salary, a sliding rebate over 12 weeks and 14-day payment. Open Documents and I'll fill one in for any client.",
      blocks: [],
      followups: ["Why a sliding rebate?", "Is 20% the right fee for me?"],
    };
  }

  return {
    text: "I can help with candidates, clients, follow-ups, invoices and your numbers. Ask me in your own words, or start with one of these:",
    blocks: [],
    followups: stage === "day1" ? ["Help me set up my agency", "Find top candidates for a role"] : ["Draft follow-ups for my 8 quiet clients", "How am I tracking this month?"],
  };
}
