import type { Deal, Stage } from "./types";

export type Temperature = "hot" | "warm" | "cooling" | "cold";

/**
 * How long a deal can sit untouched before it starts to cool, by stage.
 * Late stages decay fastest — "time kills deals" is most true at offer.
 */
const DECAY_HOURS: Record<Stage, [cooling: number, cold: number] | null> = {
  sourced: [96, 240],
  submitted: [48, 120],
  interview: [48, 96],
  final: [24, 72],
  offer: [12, 36],
  placed: null,
};

export function temperatureOf(deal: Pick<Deal, "stage" | "hoursIdle">): Temperature {
  const limits = DECAY_HOURS[deal.stage];
  if (!limits) return "hot";
  const [cooling, cold] = limits;
  if (deal.hoursIdle >= cold) return "cold";
  if (deal.hoursIdle >= cooling) return "cooling";
  if (deal.hoursIdle >= cooling / 2) return "warm";
  return "hot";
}

/** 0 → just touched, 1 → fully cold. Drives the heat bar. */
export function heatLoss(deal: Pick<Deal, "stage" | "hoursIdle">): number {
  const limits = DECAY_HOURS[deal.stage];
  if (!limits) return 0;
  return Math.min(1, deal.hoursIdle / limits[1]);
}

export const fee = (deal: Pick<Deal, "role" | "feePct">) => Math.round(deal.role.salary * deal.feePct);

/** Rough close probability by stage — used for weighted pipeline value. */
export const STAGE_ODDS: Record<Stage, number> = {
  sourced: 0.05,
  submitted: 0.12,
  interview: 0.25,
  final: 0.5,
  offer: 0.8,
  placed: 1,
};

/** What's actually at stake: fee × odds of closing × how far it has cooled. */
export const riskValue = (deal: Deal) => fee(deal) * STAGE_ODDS[deal.stage] * heatLoss(deal);

export const needsAttention = (deal: Deal) => {
  const t = temperatureOf(deal);
  return deal.stage !== "placed" && (t === "cold" || t === "cooling");
};

export function money(value: number, opts: { compact?: boolean } = {}) {
  if (opts.compact) {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}m`;
    if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  }
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
    .format(value)
    .replace("A$", "$");
}

export function idleLabel(hours: number) {
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}
