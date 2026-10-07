/** The demo's "now": Friday 9 October 2026, 08:40 in Sydney (AEDT, UTC+11). */
export const NOW_MS = Date.UTC(2026, 9, 8, 21, 40);

export const hoursAgo = (h: number) => NOW_MS - h * 3_600_000;

/**
 * Time for events created during this session: the fixed "now" plus however
 * long the page has been open, so new events always sort after seeded ones.
 * Only call this from event handlers, never during render.
 */
export const liveNow = () => NOW_MS + Math.round(performance.now());

const TZ = "Australia/Sydney";

export function formatStamp(ms: number) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ms);
}

export function formatDate(ms: number) {
  return new Intl.DateTimeFormat("en-AU", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(ms);
}

export function isoStamp(ms: number) {
  return new Date(ms).toISOString();
}

/** "just now", "3h ago", "2d ago" — relative to the demo's now. */
export function ago(ms: number) {
  const diff = Math.max(0, NOW_MS - ms);
  if (ms > NOW_MS || diff < 60_000) return "just now";
  const h = diff / 3_600_000;
  if (h < 1) return `${Math.round(diff / 60_000)}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
