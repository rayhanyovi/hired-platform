import type { Deal, FollowUp, Stage } from "./types";

/** The demo is pinned to a fixed morning so every relative time stays stable. */
export const NOW_LABEL = "Friday, 9 October";

export const RECRUITER = {
  name: "Sam Whitford",
  firstName: "Sam",
  desk: "Whitford Talent",
  city: "Sydney",
  monthlyTarget: 120_000,
  placedThisMonth: 71_200,
};

/** Pipeline stages, in order. `description` feeds the column tooltips and the Pipeline tour. */
export const STAGES: { id: Stage; label: string; description: string }[] = [
  {
    id: "sourced",
    label: "Sourced",
    description:
      "You've found someone who could fit a role and started talking to them, but haven't sent them to the client yet. Your job here: qualify them and get their go-ahead to be put forward.",
  },
  {
    id: "submitted",
    label: "Submitted",
    description:
      "Their profile has gone to the client with the candidate's permission. Now you're waiting for the client to say yes or no to an interview, so chase if it goes quiet.",
  },
  {
    id: "interview",
    label: "Interviewing",
    description:
      "The client is interviewing them, usually across one or more rounds. Prep the candidate before each round and debrief both sides after.",
  },
  {
    id: "final",
    label: "Final round",
    description:
      "The last interview before a decision. This is where deals die from slowness: candidates often have other finals, so push the client to decide fast.",
  },
  {
    id: "offer",
    label: "Offer",
    description:
      "The client has made or is about to make an offer. You negotiate salary and start date, and watch for a counter-offer from their current employer.",
  },
  {
    id: "placed",
    label: "Placed",
    description:
      "They've accepted and signed. You invoice the client for your fee, and the rebate period starts: if they leave early, part of the fee is credited back.",
  },
];

const BASE_DEALS: Omit<Deal, "ownerId">[] = [
  {
    id: "laura-chen",
    candidate: {
      name: "Laura Chen",
      title: "Director of Product",
      currentCompany: "Fintrail",
      location: "Sydney",
    },
    role: { title: "Head of Product", client: "Kestrel Robotics", salary: 230_000 },
    stage: "final",
    feePct: 0.2,
    hoursIdle: 76,
    signals: [
      "Final round finished 6 days ago",
      "Kestrel pushed a ‘culture chat’ to next Thursday",
      "Laura is at final stage with two other companies",
    ],
    read: "Laura ranked Kestrel first on Monday. Every day without an offer moves her down the list — the two other processes are both expected to close by Wednesday. Waiting for next Thursday's chat likely loses her.",
    next: {
      label: "Call Kestrel's CEO to move the offer up",
      kind: "call",
      output: `Call prep — Dan Mercer, CEO, Kestrel Robotics

Open with the risk, not the ask
• "Laura told me Monday you're her first choice. That was Monday."
• She has two other finals. Both expect to offer by Wednesday.

What to ask for
• Skip the culture chat, or run it as a 30-min call this afternoon.
• Verbal offer by Monday 5pm. Paperwork can follow.

Numbers to hold
• She wants $230k base. Kestrel signed off $220–235k.
• If they hesitate: $230k + 0.15% equity is still under their approved band.

If he says "she'll wait for us"
• "She might. The last two finalists we placed didn't." Then stop talking.`,
    },
    timeline: [
      { kind: "client", hoursAgo: 76, text: "Kestrel: “Loved her. Want one culture chat with the team next Thu.”" },
      { kind: "call", hoursAgo: 98, text: "Debrief with Laura — ranked Kestrel #1, flagged two other finals" },
      { kind: "stage", hoursAgo: 144, text: "Moved to Final round" },
      { kind: "email", hoursAgo: 190, text: "Sent interview prep pack" },
      { kind: "stage", hoursAgo: 310, text: "Submitted to Kestrel Robotics" },
    ],
  },
  {
    id: "marcus-oyelaran",
    candidate: {
      name: "Marcus Oyelaran",
      title: "Senior Data Engineer",
      currentCompany: "Quantia",
      location: "Melbourne",
    },
    role: { title: "Lead Data Engineer", client: "Tidewater Bank", salary: 185_000 },
    stage: "offer",
    feePct: 0.18,
    hoursIdle: 30,
    signals: [
      "Verbal offer at $175k, Marcus asked for $185k",
      "His manager has ‘asked to chat’ — likely counter-offer",
      "No contact with Marcus since Wednesday",
    ],
    read: "The gap is $10k and the real threat is a counter-offer from Quantia. Tidewater can't move base past $180k, but sign-on bonuses come from a separate budget.",
    next: {
      label: "Propose $180k base + $8k sign-on",
      kind: "close",
      output: `To: Priya Shah (Tidewater, Talent)

Hi Priya — quick one on Marcus.

He's keen, but Quantia have asked him for a chat, which is almost always a counter. I'd like to close him before that conversation happens.

Proposal: $180k base (inside your band) plus an $8k sign-on from the separate budget. That bridges his ask without reopening the band.

If you can confirm by 2pm I'll get his verbal acceptance today.

Sam`,
    },
    timeline: [
      { kind: "call", hoursAgo: 30, text: "Marcus: “Manager wants to chat Monday.”" },
      { kind: "client", hoursAgo: 52, text: "Verbal offer from Tidewater at $175k base" },
      { kind: "stage", hoursAgo: 52, text: "Moved to Offer" },
      { kind: "stage", hoursAgo: 200, text: "Moved to Final round" },
    ],
  },
  {
    id: "rafael-souza",
    candidate: {
      name: "Rafael Souza",
      title: "Staff Engineer",
      currentCompany: "Linktree",
      location: "Remote · Brisbane",
    },
    role: { title: "Staff Engineer, Platform", client: "Northwind Capital", salary: 250_000 },
    stage: "interview",
    feePct: 0.2,
    hoursIdle: 100,
    signals: ["Panel interview postponed twice", "No update to Rafael in 4 days"],
    read: "Northwind keep moving the panel. Rafael hasn't heard from anyone in 4 days — candidates at this level read silence as a no and start taking other calls.",
    next: {
      label: "Send Rafael an honest no-news update",
      kind: "message",
      output: `Hey Rafael — no news yet, and I didn't want you hearing nothing.

Northwind moved the panel again (calendar issue on their side, not about you). I'm pushing for a fixed date and will have one for you by Tuesday either way.

Sam`,
    },
    timeline: [
      { kind: "client", hoursAgo: 100, text: "Northwind postponed panel (2nd time)" },
      { kind: "call", hoursAgo: 170, text: "Prep call with Rafael" },
      { kind: "stage", hoursAgo: 240, text: "Moved to Interviewing" },
    ],
  },
  {
    id: "tom-gallagher",
    candidate: {
      name: "Tom Gallagher",
      title: "Account Executive",
      currentCompany: "Xero",
      location: "Sydney",
    },
    role: { title: "Enterprise AE", client: "Bluegum Energy", salary: 140_000 },
    stage: "submitted",
    feePct: 0.18,
    hoursIdle: 110,
    signals: ["CV submitted 4 days ago", "No feedback from Bluegum yet"],
    read: "Bluegum usually reply within 48 hours. A 4-day silence normally means the hiring manager hasn't opened it.",
    next: {
      label: "Nudge Bluegum's hiring manager",
      kind: "nudge",
      output: `Hi Jen — following up on Tom Gallagher for the Enterprise AE role.

He's interviewing elsewhere and I'd rather you saw him first. 15 minutes Monday or Tuesday?

Sam`,
    },
    timeline: [
      { kind: "stage", hoursAgo: 110, text: "Submitted to Bluegum Energy" },
      { kind: "call", hoursAgo: 130, text: "Screening call — strong, closes well" },
    ],
  },
  {
    id: "aisha-karim",
    candidate: {
      name: "Aisha Karim",
      title: "Senior Product Designer",
      currentCompany: "SafetyCulture",
      location: "Sydney",
    },
    role: { title: "Lead Product Designer", client: "Lumen Logistics", salary: 150_000 },
    stage: "interview",
    feePct: 0.2,
    hoursIdle: 60,
    signals: ["Positive feedback from round 1", "Round 2 not booked yet"],
    read: "Feedback was strong but nobody has booked round 2. Lock the date while the enthusiasm is fresh on both sides.",
    next: {
      label: "Book round 2 with Lumen",
      kind: "nudge",
      output: `Hi Marco — Aisha loved meeting the team too. Can we lock round 2 for Tuesday or Wednesday? I'll send her the brief the moment it's booked.

Sam`,
    },
    timeline: [
      { kind: "client", hoursAgo: 60, text: "Lumen: “Strong portfolio, want to see her again.”" },
      { kind: "stage", hoursAgo: 120, text: "Moved to Interviewing" },
    ],
  },
  {
    id: "james-whitlock",
    candidate: {
      name: "James Whitlock",
      title: "Finance Director",
      currentCompany: "Macquarie",
      location: "Sydney",
    },
    role: { title: "CFO", client: "Northwind Capital", salary: 320_000 },
    stage: "final",
    feePct: 0.25,
    hoursIdle: 18,
    signals: ["Board meeting with James on Tuesday"],
    read: "On track. The board meeting is the last step. Make sure James is briefed on Northwind's Q3 numbers before Tuesday.",
    next: {
      label: "Send James a board-meeting brief",
      kind: "message",
      output: `James — ahead of Tuesday, three things the board will push on: Q3 fund performance, the Series C fundraise timeline, and how you'd restructure the finance team. Happy to run through it on a call Monday.

Sam`,
    },
    timeline: [
      { kind: "call", hoursAgo: 18, text: "Confirmed board meeting for Tuesday" },
      { kind: "stage", hoursAgo: 90, text: "Moved to Final round" },
    ],
  },
  {
    id: "owen-price",
    candidate: {
      name: "Owen Price",
      title: "Head of Sales",
      currentCompany: "Employment Hero",
      location: "Sydney",
    },
    role: { title: "Sales Director", client: "Halcyon Health", salary: 260_000 },
    stage: "offer",
    feePct: 0.22,
    hoursIdle: 4,
    signals: ["Contract out for signature"],
    read: "Accepted verbally. Contract is with Owen. Check in tomorrow if it isn't signed.",
    next: {
      label: "Check the contract is signed",
      kind: "nudge",
      output: `Owen — just checking the contract came through OK and nothing in it needs a second look. Big move, well earned.

Sam`,
    },
    timeline: [
      { kind: "client", hoursAgo: 4, text: "Contract sent to Owen" },
      { kind: "call", hoursAgo: 26, text: "Owen accepted verbally" },
    ],
  },
  {
    id: "priya-raman",
    candidate: {
      name: "Priya Raman",
      title: "Engineering Manager",
      currentCompany: "Canva",
      location: "Sydney",
    },
    role: { title: "Engineering Manager", client: "Halcyon Health", salary: 210_000 },
    stage: "interview",
    feePct: 0.2,
    hoursIdle: 14,
    signals: ["Round 2 tomorrow at 10am"],
    read: "On track. Send prep notes today. The panel will focus on how she scales teams.",
    next: {
      label: "Send Priya round-2 prep",
      kind: "message",
      output: `Priya — tomorrow's panel is Halcyon's CTO and two staff engineers. Expect depth on how you grew the team from 6 to 18, and one systems question on their scheduling platform. You've got this.

Sam`,
    },
    timeline: [
      { kind: "client", hoursAgo: 14, text: "Round 2 confirmed for Sat 10am" },
      { kind: "stage", hoursAgo: 96, text: "Moved to Interviewing" },
    ],
  },
  {
    id: "sofia-marchetti",
    candidate: {
      name: "Sofia Marchetti",
      title: "Senior Frontend Engineer",
      currentCompany: "Atlassian",
      location: "Remote · Adelaide",
    },
    role: { title: "Senior Frontend Engineer", client: "Halcyon Health", salary: 170_000 },
    stage: "submitted",
    feePct: 0.18,
    hoursIdle: 26,
    signals: ["Submitted yesterday"],
    read: "Fresh submission. Expect feedback by Monday.",
    next: {
      label: "Set a Monday reminder",
      kind: "nudge",
      output: "Reminder set: chase Halcyon on Sofia Marchetti, Monday 10am.",
    },
    timeline: [{ kind: "stage", hoursAgo: 26, text: "Submitted to Halcyon Health" }],
  },
  {
    id: "nina-petrov",
    candidate: {
      name: "Nina Petrov",
      title: "Data Scientist",
      currentCompany: "Afterpay",
      location: "Melbourne",
    },
    role: { title: "Senior Data Scientist", client: "Lumen Logistics", salary: 165_000 },
    stage: "submitted",
    feePct: 0.18,
    hoursIdle: 8,
    signals: ["Submitted this morning"],
    read: "Just submitted. Nothing to do yet.",
    next: {
      label: "Nothing needed today",
      kind: "nudge",
      output: "No action needed. Amara will flag this if Lumen goes quiet for more than 48 hours.",
    },
    timeline: [{ kind: "stage", hoursAgo: 8, text: "Submitted to Lumen Logistics" }],
  },
  {
    id: "ben-nakamura",
    candidate: {
      name: "Ben Nakamura",
      title: "Site Reliability Engineer",
      currentCompany: "Seek",
      location: "Melbourne",
    },
    role: { title: "Senior SRE", client: "Tidewater Bank", salary: 175_000 },
    stage: "sourced",
    feePct: 0.18,
    hoursIdle: 50,
    signals: ["Replied ‘open to a chat’ 2 days ago"],
    read: "Warm reply, no call booked. Book it before he goes quiet.",
    next: {
      label: "Offer Ben two call times",
      kind: "message",
      output: `Ben — great to hear back. Would Monday 12:30 or Tuesday 5pm work for 20 minutes? I'll walk you through what Tidewater are building.

Sam`,
    },
    timeline: [{ kind: "email", hoursAgo: 50, text: "Ben replied: “Open to a chat.”" }],
  },
  {
    id: "elle-dawson",
    candidate: {
      name: "Elle Dawson",
      title: "Senior Talent Partner",
      currentCompany: "Culture Amp",
      location: "Melbourne",
    },
    role: { title: "Head of Talent", client: "Kestrel Robotics", salary: 160_000 },
    stage: "sourced",
    feePct: 0.2,
    hoursIdle: 200,
    signals: ["Outreach unanswered for 8 days"],
    read: "One message, no reply. A short second touch on a different channel usually gets a response.",
    next: {
      label: "Try LinkedIn with a shorter note",
      kind: "message",
      output: `Elle — Kestrel are building their first talent function from scratch. You'd own it. Worth 15 minutes?

Sam`,
    },
    timeline: [{ kind: "email", hoursAgo: 200, text: "Intro email sent" }],
  },
  {
    id: "tariq-haddad",
    candidate: {
      name: "Tariq Haddad",
      title: "Software Engineer",
      currentCompany: "Employment Hero",
      location: "Sydney",
    },
    role: { title: "Fullstack Developer", client: "Corvid Labs", salary: 150_000 },
    stage: "submitted",
    feePct: 0.2,
    hoursIdle: 10,
    signals: ["Submitted to Corvid yesterday", "Corvid's first role with us"],
    read: "First submission to a new client. A fast, sharp first shortlist is what turns a prospect into an account.",
    next: {
      label: "Ask Corvid for feedback by Monday",
      kind: "nudge",
      output: `Hi Elena — Tariq's profile is with you. I've got two more strong fullstack engineers lined up, so a quick read on Tariq by Monday helps me calibrate the next two.

Sam`,
    },
    timeline: [{ kind: "stage", hoursAgo: 10, text: "Submitted to Corvid Labs" }],
  },
  {
    id: "hana-lee",
    candidate: {
      name: "Hana Lee",
      title: "Marketing Lead",
      currentCompany: "Linear",
      location: "Sydney",
    },
    role: { title: "Head of Marketing", client: "Bluegum Energy", salary: 200_000 },
    stage: "placed",
    feePct: 0.2,
    hoursIdle: 72,
    signals: ["Starts 2 November"],
    read: "Placed. Amara will remind you to check in during her first week.",
    next: {
      label: "Schedule a first-week check-in",
      kind: "nudge",
      output: "Check-in scheduled for Wednesday 4 November.",
    },
    timeline: [{ kind: "stage", hoursAgo: 72, text: "Placed — contract signed" }],
  },
  {
    id: "chris-mbeki",
    candidate: {
      name: "Chris Mbeki",
      title: "Product Manager",
      currentCompany: "Zip",
      location: "Sydney",
    },
    role: { title: "Payments PM", client: "Tidewater Bank", salary: 190_000 },
    stage: "placed",
    feePct: 0.16,
    hoursIdle: 290,
    signals: ["Started Monday"],
    read: "Placed and started. The rebate period ends 8 January.",
    next: {
      label: "Log a first-week check-in",
      kind: "nudge",
      output: "Logged. Next check-in: 30-day mark.",
    },
    timeline: [{ kind: "stage", hoursAgo: 290, text: "Placed — started Monday" }],
  },
];

/** Who on the team runs each deal. Everything else belongs to Sam. */
const DEAL_OWNERS: Record<string, string> = {
  "marcus-oyelaran": "jordan",
  "ben-nakamura": "jordan",
  "sofia-marchetti": "jordan",
  "nina-petrov": "jordan",
  "tariq-haddad": "jordan",
};

export const DEALS: Deal[] = BASE_DEALS.map((d) => ({ ...d, ownerId: DEAL_OWNERS[d.id] ?? "sam" }));

export const FOLLOW_UPS: FollowUp[] = [
  {
    id: "daniel-ortiz",
    name: "Daniel Ortiz",
    firstName: "Daniel",
    role: "CFO",
    client: "Northwind Capital",
    kind: "rejection",
    daysWaiting: 3,
    detail: "Didn't get the CFO role after the final round. He hasn't been told yet.",
    context: [
      "Final round on 2 Oct, panel of 4",
      "Northwind chose someone with PE-backed fund experience",
      "Panel liked his operating depth and board presence",
    ],
    reason: "They went with someone who has run finance at a PE-backed fund. That was the deciding factor, not your interviews.",
    reasonShort: "It was PE fund experience, not you.",
    positive: "The panel singled out your operating depth and how you handled the board questions.",
  },
  {
    id: "tom-gallagher",
    name: "Tom Gallagher",
    firstName: "Tom",
    role: "Enterprise AE",
    client: "Bluegum Energy",
    kind: "no-news",
    daysWaiting: 4,
    detail: "Waiting on Bluegum for 4 days. No feedback yet.",
    context: ["CV submitted Monday", "Bluegum usually replies within 48h", "You're chasing their hiring manager today"],
    dealId: "tom-gallagher",
  },
  {
    id: "rafael-souza",
    name: "Rafael Souza",
    firstName: "Rafael",
    role: "Staff Engineer, Platform",
    client: "Northwind Capital",
    kind: "no-news",
    daysWaiting: 4,
    detail: "Northwind's panel has been postponed twice.",
    context: ["Panel moved twice, a scheduling issue on Northwind's side", "No contact with Rafael since Monday"],
    dealId: "rafael-souza",
  },
  {
    id: "mei-tanaka",
    name: "Mei Tanaka",
    firstName: "Mei",
    role: "Senior Frontend Engineer",
    client: "Halcyon Health",
    kind: "rejection",
    daysWaiting: 6,
    detail: "Screened out. Halcyon needs someone strong on accessibility.",
    context: [
      "Applied 1 Oct",
      "Halcyon needs WCAG / accessibility depth for a health product",
      "Strong React and design-system work in her portfolio",
    ],
    reason: "They need deep accessibility (WCAG) experience for a health product, and that tipped it.",
    reasonShort: "They needed accessibility depth.",
    positive: "Your React and design-system work stood out, and I'd put you forward for a product-led team tomorrow.",
  },
  {
    id: "grace-holloway",
    name: "Grace Holloway",
    firstName: "Grace",
    role: "Operations Manager",
    client: "Lumen Logistics",
    kind: "on-hold",
    daysWaiting: 5,
    detail: "Lumen froze the role. Not her fault, but she doesn't know yet.",
    context: ["Lumen froze hiring until January", "Grace was due for a first interview"],
  },
  {
    id: "aisha-karim",
    name: "Aisha Karim",
    firstName: "Aisha",
    role: "Lead Product Designer",
    client: "Lumen Logistics",
    kind: "progress",
    daysWaiting: 2,
    detail: "Round 1 went well. Round 2 is being booked.",
    context: ["Lumen: “Strong portfolio, want to see her again”", "Round 2 likely Tue or Wed"],
    dealId: "aisha-karim",
  },
  {
    id: "kofi-asante",
    name: "Kofi Asante",
    firstName: "Kofi",
    role: "Head of Data",
    client: "—",
    kind: "keep-warm",
    daysWaiting: 9,
    detail: "Great candidate with no live role that fits. Keep him warm.",
    context: ["Met 3 weeks ago", "Wants a Head of Data role at a scale-up", "Open to Melbourne or remote"],
  },
];

export const FOLLOW_UP_LABEL: Record<FollowUp["kind"], string> = {
  rejection: "Not progressing",
  "no-news": "No news yet",
  progress: "Moving forward",
  "on-hold": "Role on hold",
  "keep-warm": "Keep warm",
};
