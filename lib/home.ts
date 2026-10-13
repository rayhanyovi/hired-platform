/**
 * Mock data for the Home screen, mirroring Amara's current dashboard:
 * five funnel metrics, follow-up tasks, invoices and a leaderboard.
 * "day1" is a member who has just joined; "day30" is an established desk.
 */
import type { MetricKind } from "@/components/ui/metrics";

export type Stage = "day1" | "day30";
export type Range = "all" | "month" | "week";

export const RANGE_LABEL: Record<Range, string> = { all: "All time", month: "This month", week: "This week" };

type MetricValue = { value: number; target?: number; change: number };

const METRICS_DAY30: Record<Range, Record<MetricKind, MetricValue>> = {
  all: {
    calls: { value: 3206, change: 154 },
    submittals: { value: 514, change: 144 },
    interviews: { value: 265, change: 152 },
    offers: { value: 59, change: 136 },
    placements: { value: 34, change: 240 },
  },
  month: {
    calls: { value: 412, target: 500, change: 18 },
    submittals: { value: 61, target: 60, change: 12 },
    interviews: { value: 29, target: 30, change: 7 },
    offers: { value: 7, target: 8, change: -12 },
    placements: { value: 4, target: 5, change: 33 },
  },
  week: {
    calls: { value: 96, target: 120, change: 9 },
    submittals: { value: 14, target: 15, change: -6 },
    interviews: { value: 8, target: 7, change: 14 },
    offers: { value: 2, target: 2, change: 0 },
    placements: { value: 1, target: 1, change: 100 },
  },
};

const ZERO: Record<MetricKind, MetricValue> = {
  calls: { value: 0, change: 0 },
  submittals: { value: 0, change: 0 },
  interviews: { value: 0, change: 0 },
  offers: { value: 0, change: 0 },
  placements: { value: 0, change: 0 },
};

export const metricsFor = (stage: Stage, range: Range) => (stage === "day1" ? ZERO : METRICS_DAY30[range]);

/* ── Quiet clients ─────────────────────────────────────────────────── */

/** Clients and prospects that have gone quiet. Amara's follow-up drafts read from these. */
export type Task = { id: string; company: string; initials: string; detail: string; daysAgo: number; priority: 1 | 2 | 3 };

export const TASKS: Task[] = [
  { id: "t1", company: "Fernhill Foods", initials: "FF", detail: "no reply to your intro email", daysAgo: 6, priority: 3 },
  { id: "t2", company: "Opal Insurance", initials: "OI", detail: "no reply to your capabilities deck", daysAgo: 9, priority: 3 },
  { id: "t3", company: "Corvid Labs", initials: "CL", detail: "no reply to your TOB", daysAgo: 4, priority: 3 },
  { id: "t4", company: "Marlowe Studios", initials: "MS", detail: "no reply to your last email", daysAgo: 12, priority: 2 },
  { id: "t5", company: "Harbour & Vine", initials: "HV", detail: "no reply to your intro call", daysAgo: 8, priority: 2 },
  { id: "t6", company: "Ember AI", initials: "EA", detail: "no reply to your proposal", daysAgo: 5, priority: 2 },
  { id: "t7", company: "Lumen Logistics", initials: "LL", detail: "no reply to your Q4 check-in", daysAgo: 7, priority: 1 },
  { id: "t8", company: "Pinecrest Pay", initials: "PP", detail: "no reply to your shortlist", daysAgo: 4, priority: 1 },
];

/** A new member's first steps instead of follow-ups. */
export const FIRST_STEPS = [
  { id: "s1", title: "Tell Amara about your agency", detail: "Your niche, fee and the clients you want", prompt: "Help me set up my agency" },
  { id: "s2", title: "Add your first client", detail: "A company you're already talking to", prompt: "Help me add my first client" },
  { id: "s3", title: "Send your Terms of Business", detail: "Amara drafts it from your fee and rebate", prompt: "Draft my Terms of Business" },
  { id: "s4", title: "Find candidates for a role", detail: "Paste a job description and get a shortlist", prompt: "Find top candidates for a role" },
];

/* ── Invoices ──────────────────────────────────────────────────────── */

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type Invoice = { id: string; client: string; date: string; amount: number; status: InvoiceStatus };

export const INVOICES: Invoice[] = [
  { id: "i1", client: "Tidewater Bank", date: "May 5, 2026", amount: 13_750, status: "draft" },
  { id: "i2", client: "Halcyon Health", date: "Apr 8, 2026", amount: 22_400, status: "paid" },
  { id: "i3", client: "Northwind Capital", date: "May 27, 2026", amount: 31_200, status: "sent" },
  { id: "i4", client: "Bluegum Energy", date: "Apr 8, 2026", amount: 18_900, status: "sent" },
  { id: "i5", client: "Tidewater Bank", date: "Mar 25, 2026", amount: 27_500, status: "paid" },
  { id: "i6", client: "Lumen Logistics", date: "Apr 4, 2026", amount: 16_800, status: "paid" },
  { id: "i7", client: "Kestrel Robotics", date: "Jun 3, 2026", amount: 38_000, status: "sent" },
  { id: "i8", client: "Lumen Logistics", date: "May 9, 2026", amount: 21_600, status: "sent" },
  { id: "i9", client: "Halcyon Health", date: "Mar 25, 2026", amount: 24_750, status: "sent" },
  { id: "i10", client: "Tidewater Bank", date: "Apr 15, 2026", amount: 19_200, status: "sent" },
  { id: "i11", client: "Bluegum Energy", date: "Jun 18, 2026", amount: 17_350, status: "sent" },
  { id: "i12", client: "Kestrel Robotics", date: "Jul 4, 2026", amount: 29_900, status: "sent" },
  { id: "i13", client: "Northwind Capital", date: "Mar 22, 2026", amount: 20_100, status: "paid" },
];

/** A client's invoices, newest first. */
export const invoicesFor = (client: string) => INVOICES.filter((i) => i.client === client).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

/** The full register has 86 invoices; the list shows the most recent. */
export const INVOICE_TOTAL = 86;
export const INVOICE_SUMMARY = {
  draft: { count: 1, amount: 13_750 },
  outstanding: { count: 63, amount: 1_284_300 },
  overdue: { count: 0, amount: 0 },
};

/* ── Leaderboard ───────────────────────────────────────────────────── */

export type LeaderRow = {
  name: string;
  agency?: string;
  score: number;
  stats: Record<MetricKind, number>;
  billed: number;
  you?: boolean;
};

/** Your own agency. A solo desk has nobody to rank against yet. */
export const TEAM_BOARD: LeaderRow[] = [
  { name: "Sam Whitford", score: 388, stats: { calls: 912, submittals: 141, interviews: 74, offers: 17, placements: 10 }, billed: 196_000, you: true },
  { name: "Jordan Reyes", score: 241, stats: { calls: 604, submittals: 88, interviews: 41, offers: 9, placements: 5 }, billed: 92_000 },
  { name: "Mia Okafor", score: 117, stats: { calls: 388, submittals: 52, interviews: 0, offers: 0, placements: 0 }, billed: 0 },
];

/** Everyone in the HeyAmara network this month. */
export const NETWORK_BOARD: LeaderRow[] = [
  { name: "Priya Nair", agency: "Nair Search", score: 412, stats: { calls: 980, submittals: 160, interviews: 81, offers: 19, placements: 11 }, billed: 214_000 },
  { name: "Sam Whitford", agency: "Whitford Talent", score: 388, stats: { calls: 912, submittals: 141, interviews: 74, offers: 17, placements: 10 }, billed: 196_000, you: true },
  { name: "Divyam Talwar", agency: "Talwar Partners", score: 301, stats: { calls: 744, submittals: 118, interviews: 60, offers: 12, placements: 7 }, billed: 151_000 },
  { name: "Mia Chen", agency: "Chen & Co", score: 266, stats: { calls: 690, submittals: 97, interviews: 52, offers: 10, placements: 6 }, billed: 128_000 },
  { name: "Tushar Banik", agency: "Banik Talent", score: 214, stats: { calls: 610, submittals: 80, interviews: 38, offers: 8, placements: 4 }, billed: 87_000 },
  { name: "Grace Liu", agency: "Harbour Search", score: 187, stats: { calls: 520, submittals: 66, interviews: 31, offers: 6, placements: 3 }, billed: 64_000 },
  { name: "Owen Hart", agency: "Hart Recruitment", score: 142, stats: { calls: 455, submittals: 51, interviews: 22, offers: 4, placements: 2 }, billed: 41_000 },
  { name: "Leila Haddad", agency: "Northline", score: 98, stats: { calls: 318, submittals: 37, interviews: 15, offers: 2, placements: 1 }, billed: 22_000 },
];

/* ── Suggestions ───────────────────────────────────────────────────── */

export const SUGGESTIONS: Record<Stage, string[]> = {
  day30: [
    "Draft follow-ups for my 8 quiet clients",
    "Find top candidates for a Senior SRE",
    "Which invoices should I chase?",
    "How am I tracking this month?",
  ],
  day1: ["Help me set up my agency", "Find top candidates for a role", "Write my first client outreach", "What should I do first?"],
};

export const PLACEHOLDERS: Record<Stage, string[]> = {
  day30: ["Find top candidates…", "Draft a follow-up to Fernhill Foods…", "Which invoices are outstanding?", "Prep me for my next client call…"],
  day1: ["Tell me about your agency…", "Find top candidates…", "Who should I call first?"],
};
