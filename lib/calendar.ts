/**
 * Calendar seed and date maths. The demo lives in October–November 2026, which
 * is all daylight saving in Sydney (AEDT, UTC+11), so wall-clock times are a
 * fixed offset from UTC.
 */
import { NOW_MS } from "./time";
import type { CalendarEvent, CalendarKind } from "./types";

const OFFSET = 11 * 3_600_000;
const DAY = 86_400_000;

/** Sydney wall-clock time on the demo's day + `days`. */
export const sydney = (days: number, hour = 0, minute = 0) => Date.UTC(2026, 9, 9 + days, hour, minute) - OFFSET;

/** Year, month, day, weekday, hour and minute in Sydney. */
export function parts(ms: number) {
  const d = new Date(ms + OFFSET);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay(), h: d.getUTCHours(), min: d.getUTCMinutes() };
}

/** Midnight in Sydney for the day containing `ms`. */
export const dayStart = (ms: number) => {
  const p = parts(ms);
  return Date.UTC(p.y, p.m, p.d) - OFFSET;
};

export const addDays = (ms: number, n: number) => ms + n * DAY;
export const sameDay = (a: number, b: number) => dayStart(a) === dayStart(b);
export const TODAY = dayStart(NOW_MS);

/** Sunday-first week, as Amara's calendar shows it. */
export const weekStart = (ms: number) => addDays(dayStart(ms), -parts(ms).wd);

export function timeLabel(ms: number) {
  const { h, min } = parts(ms);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 || 12;
  return min ? `${hour}:${String(min).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const monthLabel = (ms: number) => `${MONTHS[parts(ms).m]} ${parts(ms).y}`;
export const dayLabel = (ms: number, short = false) => {
  const p = parts(ms);
  return short ? `${DAYS[p.wd].slice(0, 3)} ${p.d}` : `${DAYS[p.wd]}, ${p.d} ${MONTHS[p.m]}`;
};
export const weekdayShort = (i: number) => DAYS[i].slice(0, 3);

/** Relative due label for tasks: "Today", "Tomorrow", "3d overdue", "Tue 13". */
export function dueLabel(due: number) {
  const days = Math.round((dayStart(due) - TODAY) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${-days}d overdue`;
  if (days < 7) return dayLabel(due, true);
  return `${parts(due).d} ${MONTHS[parts(due).m].slice(0, 3)}`;
}
export const isOverdue = (due: number | undefined) => due !== undefined && dayStart(due) < TODAY;

export const CALENDAR_KINDS: { id: CalendarKind | "task"; label: string; dot: string; chip: string }[] = [
  { id: "interview", label: "Interviews", dot: "bg-interviews", chip: "border-interviews/40 bg-interviews/12 text-fg" },
  { id: "meeting", label: "Meetings", dot: "bg-fg", chip: "border-line-strong bg-raised text-fg" },
  { id: "call", label: "Calls", dot: "bg-calls", chip: "border-calls/40 bg-calls/12 text-fg" },
  { id: "follow-up", label: "Follow-ups", dot: "bg-warm", chip: "border-warm/40 bg-warm/10 text-fg" },
  { id: "placement", label: "Placements", dot: "bg-placements", chip: "border-placements/40 bg-placements/12 text-fg" },
  { id: "task", label: "Tasks", dot: "bg-fg-muted", chip: "border-dashed border-line-strong bg-surface text-fg-muted" },
  { id: "event", label: "Other", dot: "bg-fg-faint", chip: "border-line-strong bg-surface text-fg-muted" },
];

export const kindStyle = (id: CalendarKind | "task") => CALENDAR_KINDS.find((k) => k.id === id) ?? CALENDAR_KINDS[CALENDAR_KINDS.length - 1];

const candidate = (id: string, name: string) => ({ kind: "candidate" as const, id, name });
const client = (id: string, name: string) => ({ kind: "client" as const, id, name });
const prospect = (id: string, name: string) => ({ kind: "prospect" as const, id, name });

const weekly = [-7, 0, 7, 14, 21].map(
  (d, i): CalendarEvent => ({
    id: `ev-review-${i}`,
    kind: "event",
    title: "Team pipeline review",
    start: sydney(d, 9),
    minutes: 45,
    with: ["Jordan Reyes", "Mia Okafor"],
    where: "Google Meet",
    detail: "Weekly: every live deal, what's cooling, who owns the next move.",
    ownerId: "sam",
  }),
);

export const EVENTS: CalendarEvent[] = [
  ...weekly,
  { id: "ev-laura-debrief", kind: "call", title: "Debrief with Laura Chen", start: sydney(-4, 16), minutes: 30, subject: candidate("laura-chen", "Laura Chen"), dealId: "laura-chen", ownerId: "sam", detail: "Ranked Kestrel first. Two other finals in play." },
  { id: "ev-salt-fee", kind: "meeting", title: "Saltwater Co. · fee and rebate", start: sydney(-1, 11), minutes: 45, subject: prospect("saltwater-co", "Saltwater Co."), with: ["Jess Morgan"], where: "Zoom", ownerId: "sam", detail: "Jess wants 15%. Floor is 18%. Offer exclusivity for the rate." },
  { id: "ev-owen-contract", kind: "call", title: "Owen Price · contract questions", start: sydney(0, 11), minutes: 15, subject: candidate("owen-price", "Owen Price"), dealId: "owen-price", ownerId: "sam" },
  { id: "ev-kestrel-ceo", kind: "call", title: "Call Dan Mercer about Laura's offer", start: sydney(0, 14), minutes: 20, subject: client("kestrel-robotics", "Kestrel Robotics"), dealId: "laura-chen", with: ["Dan Mercer"], ownerId: "sam", detail: "Jordan held his 2pm gap. Ask for a verbal offer by Monday 5pm." },
  { id: "ev-priya-r2", kind: "interview", title: "Priya Raman · round 2", start: sydney(1, 10), minutes: 90, subject: candidate("priya-raman", "Priya Raman"), dealId: "priya-raman", with: ["Ravi Menon (Halcyon CTO)"], where: "Halcyon Health, Surry Hills", ownerId: "sam", detail: "Panel: CTO and two staff engineers. Expect depth on scaling a team from 6 to 18." },
  { id: "ev-amelia-call", kind: "call", title: "Screening call: Amelia Brooks", start: sydney(3, 10), minutes: 30, subject: candidate("c-amelia", "Amelia Brooks"), ownerId: "mia" },
  { id: "ev-sofia-chase", kind: "follow-up", title: "Chase Halcyon on Sofia Marchetti", start: sydney(3, 10, 30), minutes: 15, subject: candidate("sofia-marchetti", "Sofia Marchetti"), dealId: "sofia-marchetti", ownerId: "jordan" },
  { id: "ev-ben-intro", kind: "call", title: "Intro call: Ben Nakamura", start: sydney(3, 12, 30), minutes: 20, subject: candidate("ben-nakamura", "Ben Nakamura"), dealId: "ben-nakamura", ownerId: "jordan" },
  { id: "ev-james-board", kind: "interview", title: "James Whitlock · board meeting", start: sydney(4, 9, 30), minutes: 60, subject: candidate("james-whitlock", "James Whitlock"), dealId: "james-whitlock", where: "Northwind Capital, Barangaroo", ownerId: "sam" },
  { id: "ev-quokka", kind: "meeting", title: "Quokka Health · intro meeting", start: sydney(4, 14), minutes: 45, subject: prospect("quokka-health", "Quokka Health"), with: ["Amira Haddad"], where: "Google Meet", ownerId: "jordan", detail: "They're hiring 6 engineers in Perth next year. Bring two anonymised profiles." },
  { id: "ev-aisha-r2", kind: "interview", title: "Aisha Karim · round 2", start: sydney(5, 11), minutes: 60, subject: candidate("aisha-karim", "Aisha Karim"), dealId: "aisha-karim", where: "Lumen Logistics, Melbourne", ownerId: "sam" },
  { id: "ev-pinecrest", kind: "meeting", title: "Pinecrest Pay · scoping the backend role", start: sydney(6, 10), minutes: 45, subject: prospect("pinecrest-pay", "Pinecrest Pay"), with: ["Tom Leary"], where: "Zoom", ownerId: "jordan" },
  { id: "ev-laura-culture", kind: "interview", title: "Laura Chen · culture chat", start: sydney(6, 15), minutes: 45, subject: candidate("laura-chen", "Laura Chen"), dealId: "laura-chen", where: "Kestrel Robotics, Alexandria", ownerId: "sam", detail: "Try to bring this forward. Every day without an offer moves her down the list." },
  { id: "ev-hana-start", kind: "placement", title: "Hana Lee starts at Bluegum Energy", start: sydney(24), minutes: 0, allDay: true, subject: candidate("hana-lee", "Hana Lee"), dealId: "hana-lee", ownerId: "sam" },
  { id: "ev-hana-checkin", kind: "follow-up", title: "First-week check-in: Hana Lee", start: sydney(26, 16), minutes: 15, subject: candidate("hana-lee", "Hana Lee"), dealId: "hana-lee", ownerId: "sam" },
  { id: "ev-owen-start", kind: "placement", title: "Owen Price starts at Halcyon Health", start: sydney(38), minutes: 0, allDay: true, subject: candidate("owen-price", "Owen Price"), dealId: "owen-price", ownerId: "sam" },
  { id: "ev-chris-30", kind: "follow-up", title: "30-day check-in: Chris Mbeki", start: sydney(17, 11), minutes: 15, subject: candidate("chris-mbeki", "Chris Mbeki"), dealId: "chris-mbeki", ownerId: "sam" },
];

/** "2026-10-13" + "14:30" in Sydney → epoch ms. */
export function fromInputs(date: string, time = "09:00") {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min) - OFFSET;
}

/** Epoch ms → "2026-10-13" for a date input. */
export function toDateInput(ms: number) {
  const p = parts(ms);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
