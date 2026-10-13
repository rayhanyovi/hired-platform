/**
 * Mock numbers for Home's Analytics and Sales tabs. Deterministic per range so
 * the demo never drifts; "day1" (a new member) shows designed empty states instead.
 */
import type { Range } from "./home";

type Point = { label: string; value: number };

const series = (labels: string[], values: number[]): Point[] => labels.map((label, i) => ({ label, value: values[i] }));

const WEEK = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTH = ["12 Sep", "15 Sep", "18 Sep", "21 Sep", "24 Sep", "27 Sep", "30 Sep", "3 Oct", "6 Oct", "9 Oct"];
const ALL = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
export const RANGE_AXIS: Record<Range, string[]> = { week: WEEK, month: MONTH, all: ALL };

/* ── Revenue ───────────────────────────────────────────────────────── */

export const REVENUE: Record<Range, { revenue: Point[]; cost: Point[]; change: { revenue: number; cost: number; profit: number } }> = {
  week: {
    revenue: series(WEEK, [0, 0, 0, 44_000, 0, 0, 38_000]),
    cost: series(WEEK, [180, 0, 420, 260, 390, 310, 280]),
    change: { revenue: 22, cost: -8, profit: 25 },
  },
  month: {
    revenue: series(MONTH, [0, 31_200, 0, 18_900, 0, 0, 22_400, 0, 44_000, 38_000]),
    cost: series(MONTH, [620, 480, 910, 540, 700, 660, 1_240, 580, 820, 760]),
    change: { revenue: 14, cost: 6, profit: 15 },
  },
  all: {
    revenue: series(ALL, [78_000, 121_000, 96_000, 148_000, 171_000, 92_000]),
    cost: series(ALL, [6_400, 7_100, 6_900, 8_200, 8_800, 4_600]),
    change: { revenue: 154, cost: 31, profit: 168 },
  },
};

/* ── Lead generation ───────────────────────────────────────────────── */

export const ACTIVITY: Record<Range, Record<"calls" | "submittals" | "interviews" | "offers" | "placements", Point[]>> = {
  week: {
    calls: series(WEEK, [0, 0, 22, 19, 25, 18, 12]),
    submittals: series(WEEK, [0, 0, 3, 4, 2, 3, 2]),
    interviews: series(WEEK, [1, 0, 2, 1, 2, 1, 1]),
    offers: series(WEEK, [0, 0, 0, 1, 0, 1, 0]),
    placements: series(WEEK, [0, 0, 0, 1, 0, 0, 0]),
  },
  month: {
    calls: series(MONTH, [38, 44, 41, 36, 47, 40, 45, 39, 42, 40]),
    submittals: series(MONTH, [5, 7, 6, 5, 8, 6, 7, 5, 6, 6]),
    interviews: series(MONTH, [2, 3, 4, 2, 3, 4, 3, 2, 3, 3]),
    offers: series(MONTH, [0, 1, 1, 0, 1, 1, 1, 0, 1, 1]),
    placements: series(MONTH, [0, 1, 0, 0, 1, 0, 0, 0, 1, 1]),
  },
  all: {
    calls: series(ALL, [402, 488, 455, 590, 655, 616]),
    submittals: series(ALL, [61, 79, 72, 98, 108, 96]),
    interviews: series(ALL, [31, 40, 37, 51, 57, 49]),
    offers: series(ALL, [7, 9, 8, 12, 13, 10]),
    placements: series(ALL, [4, 5, 5, 7, 8, 5]),
  },
};

/* ── Conversion funnels ────────────────────────────────────────────── */

export const CONVERSION: Record<
  Range,
  {
    callMinutes: number;
    clientMeetings: number;
    prospectMeetings: number;
    retention: number;
    fallenOff: number;
    termsSent: number;
    termsSigned: number;
    clients: number;
    clientsWithRoles: number;
    callsByType: { label: string; value: number }[];
    change: Record<"callMinutes" | "clientMeetings" | "prospectMeetings" | "retention" | "fallenOff", number>;
  }
> = {
  week: {
    callMinutes: 412,
    clientMeetings: 3,
    prospectMeetings: 2,
    retention: 0.91,
    fallenOff: 1,
    termsSent: 2,
    termsSigned: 1,
    clients: 6,
    clientsWithRoles: 6,
    callsByType: [
      { label: "Candidates", value: 58 },
      { label: "Clients", value: 21 },
      { label: "Prospects", value: 14 },
      { label: "Other", value: 3 },
    ],
    change: { callMinutes: 12, clientMeetings: 50, prospectMeetings: 0, retention: 2, fallenOff: -50 },
  },
  month: {
    callMinutes: 1_840,
    clientMeetings: 11,
    prospectMeetings: 7,
    retention: 0.88,
    fallenOff: 4,
    termsSent: 6,
    termsSigned: 3,
    clients: 6,
    clientsWithRoles: 6,
    callsByType: [
      { label: "Candidates", value: 246 },
      { label: "Clients", value: 88 },
      { label: "Prospects", value: 61 },
      { label: "Other", value: 17 },
    ],
    change: { callMinutes: 9, clientMeetings: 22, prospectMeetings: 40, retention: -3, fallenOff: 33 },
  },
  all: {
    callMinutes: 15_310,
    clientMeetings: 74,
    prospectMeetings: 48,
    retention: 0.86,
    fallenOff: 31,
    termsSent: 21,
    termsSigned: 11,
    clients: 6,
    clientsWithRoles: 6,
    callsByType: [
      { label: "Candidates", value: 1_920 },
      { label: "Clients", value: 704 },
      { label: "Prospects", value: 466 },
      { label: "Other", value: 116 },
    ],
    change: { callMinutes: 148, clientMeetings: 120, prospectMeetings: 210, retention: 4, fallenOff: 18 },
  },
};

/* ── Growth ────────────────────────────────────────────────────────── */

export const GROWTH = {
  months: ALL,
  newClients: [1, 0, 2, 1, 1, 1],
  rolesOpened: [4, 6, 5, 7, 9, 8],
  termsSent: [2, 3, 4, 3, 5, 4],
  termsSigned: [1, 2, 2, 1, 3, 2],
  daysToSubmittal: [6.5, 5.8, 5.2, 4.6, 4.1, 3.8],
  daysToFill: [41, 38, 36, 35, 31, 29],
};

/* ── Sales ─────────────────────────────────────────────────────────── */

export type Closer = { id: string; slots: number; booked: number; showed: number; pitched: number; sales: number; cash: number };
export type Setter = { id: string; dials: number; pickups: number; talks30: number; talks5m: number; booked: number; showed: number; hours: number };

type SalesRange = {
  dials: number;
  booked: number;
  showed: number;
  sales: number;
  onboarded: number;
  cash: number;
  target: number;
  change: Record<"dials" | "booked" | "showed" | "sales" | "onboarded", number>;
  closers: Closer[];
  setters: Setter[];
  /** Daily or weekly rates, oldest first, for the sparklines. */
  trend: Record<"show" | "close" | "slots" | "bookedToSale" | "pickup" | "pickupToTalk" | "talkToBooking", number[]>;
};

export const SALES: Record<Range, SalesRange> = {
  week: {
    dials: 212,
    booked: 9,
    showed: 7,
    sales: 2,
    onboarded: 1,
    cash: 12_000,
    target: 15_000,
    change: { dials: 8, booked: 13, showed: 17, sales: 0, onboarded: 100 },
    closers: [
      { id: "sam", slots: 12, booked: 5, showed: 4, pitched: 4, sales: 1, cash: 8_000 },
      { id: "jordan", slots: 12, booked: 4, showed: 3, pitched: 3, sales: 1, cash: 4_000 },
    ],
    setters: [
      { id: "mia", dials: 138, pickups: 31, talks30: 22, talks5m: 9, booked: 6, showed: 5, hours: 11.5 },
      { id: "jordan", dials: 74, pickups: 15, talks30: 11, talks5m: 4, booked: 3, showed: 2, hours: 6 },
    ],
    trend: {
      show: [0.67, 0.75, 0.8, 0.7, 0.78, 0.8, 0.78],
      close: [0.25, 0.3, 0.33, 0.28, 0.3, 0.29, 0.29],
      slots: [0.3, 0.33, 0.38, 0.35, 0.4, 0.37, 0.38],
      bookedToSale: [0.2, 0.22, 0.25, 0.2, 0.22, 0.22, 0.22],
      pickup: [0.2, 0.21, 0.22, 0.23, 0.21, 0.22, 0.22],
      pickupToTalk: [0.7, 0.72, 0.71, 0.73, 0.72, 0.72, 0.72],
      talkToBooking: [0.27, 0.25, 0.28, 0.27, 0.27, 0.27, 0.27],
    },
  },
  month: {
    dials: 868,
    booked: 34,
    showed: 25,
    sales: 8,
    onboarded: 3,
    cash: 44_000,
    target: 60_000,
    change: { dials: 12, booked: 9, showed: -4, sales: 14, onboarded: 50 },
    closers: [
      { id: "sam", slots: 48, booked: 19, showed: 14, pitched: 13, sales: 5, cash: 28_000 },
      { id: "jordan", slots: 48, booked: 15, showed: 11, pitched: 10, sales: 3, cash: 16_000 },
    ],
    setters: [
      { id: "mia", dials: 560, pickups: 118, talks30: 86, talks5m: 37, booked: 23, showed: 17, hours: 46 },
      { id: "jordan", dials: 308, pickups: 61, talks30: 43, talks5m: 16, booked: 11, showed: 8, hours: 25.5 },
    ],
    trend: {
      show: [0.81, 0.78, 0.74, 0.76, 0.72, 0.7, 0.74, 0.73, 0.74, 0.74],
      close: [0.28, 0.3, 0.31, 0.33, 0.3, 0.34, 0.32, 0.31, 0.32, 0.32],
      slots: [0.3, 0.32, 0.34, 0.33, 0.36, 0.35, 0.36, 0.35, 0.35, 0.35],
      bookedToSale: [0.2, 0.21, 0.23, 0.22, 0.24, 0.23, 0.24, 0.23, 0.24, 0.24],
      pickup: [0.19, 0.2, 0.21, 0.2, 0.22, 0.21, 0.2, 0.21, 0.2, 0.21],
      pickupToTalk: [0.71, 0.72, 0.73, 0.72, 0.72, 0.73, 0.72, 0.72, 0.73, 0.72],
      talkToBooking: [0.24, 0.26, 0.25, 0.26, 0.27, 0.26, 0.27, 0.26, 0.26, 0.26],
    },
  },
  all: {
    dials: 6_410,
    booked: 241,
    showed: 186,
    sales: 52,
    onboarded: 11,
    cash: 286_000,
    target: 360_000,
    change: { dials: 154, booked: 131, showed: 128, sales: 160, onboarded: 175 },
    closers: [
      { id: "sam", slots: 320, booked: 136, showed: 107, pitched: 98, sales: 31, cash: 176_000 },
      { id: "jordan", slots: 290, booked: 105, showed: 79, pitched: 71, sales: 21, cash: 110_000 },
    ],
    setters: [
      { id: "mia", dials: 4_120, pickups: 862, talks30: 611, talks5m: 262, booked: 158, showed: 122, hours: 338 },
      { id: "jordan", dials: 2_290, pickups: 451, talks30: 318, talks5m: 128, booked: 83, showed: 64, hours: 182 },
    ],
    trend: {
      show: [0.71, 0.74, 0.76, 0.79, 0.78, 0.77],
      close: [0.24, 0.26, 0.27, 0.29, 0.29, 0.28],
      slots: [0.31, 0.33, 0.36, 0.38, 0.4, 0.39],
      bookedToSale: [0.18, 0.2, 0.21, 0.23, 0.22, 0.22],
      pickup: [0.19, 0.2, 0.2, 0.21, 0.22, 0.2],
      pickupToTalk: [0.69, 0.7, 0.71, 0.71, 0.72, 0.71],
      talkToBooking: [0.25, 0.25, 0.26, 0.27, 0.27, 0.26],
    },
  },
};

/** Targets the team agreed. Below target reads amber; at or above stays neutral. */
export const SALES_TARGETS = { show: 0.75, close: 0.3, slots: 0.4, bookedToSale: 0.25, pickup: 0.25, pickupToTalk: 0.7, talkToBooking: 0.3 };

export const ratio = (a: number, b: number) => (b ? a / b : 0);
export const pct = (v: number) => `${Math.round(v * 100)}%`;
