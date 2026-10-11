import { FileText, MessagesSquare, Phone, Send, UserRound, type LucideIcon } from "lucide-react";
import { cx } from "./primitives";

/** The five funnel metrics Amara tracks, each with its own colour. */
export type MetricKind = "calls" | "submittals" | "interviews" | "offers" | "placements";

export const METRICS: Record<MetricKind, { label: string; icon: typeof Phone; tile: string; text: string; bar: string }> = {
  calls: { label: "Calls", icon: Phone, tile: "bg-calls-tile", text: "text-calls", bar: "bg-calls" },
  submittals: { label: "Submittals", icon: Send, tile: "bg-submittals-tile", text: "text-submittals", bar: "bg-submittals" },
  interviews: { label: "Interviews", icon: MessagesSquare, tile: "bg-interviews-tile", text: "text-interviews", bar: "bg-interviews" },
  offers: { label: "Offers", icon: FileText, tile: "bg-offers-tile", text: "text-offers", bar: "bg-offers" },
  placements: { label: "Placements", icon: UserRound, tile: "bg-placements-tile", text: "text-placements", bar: "bg-placements" },
};

export const METRIC_ORDER: MetricKind[] = ["calls", "submittals", "interviews", "offers", "placements"];

/** Coloured rounded tile with a white glyph, as in Amara's metric cards and leaderboard header. */
export function MetricIcon({ kind, size = "md", className }: { kind: MetricKind; size?: "sm" | "md"; className?: string }) {
  const m = METRICS[kind];
  return <MetricIconTile icon={m.icon} label={m.label} tile={m.tile} size={size} className={className} />;
}

export function MetricIconTile({ icon: Icon, label, tile, size = "md", className }: { icon: LucideIcon; label: string; tile: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      title={label}
      className={cx(
        "grid shrink-0 place-items-center text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]",
        tile,
        size === "md" ? "size-9 rounded-[10px]" : "size-7 rounded-lg",
        className,
      )}
    >
      <Icon className={size === "md" ? "size-[18px]" : "size-3.5"} strokeWidth={1.9} aria-hidden="true" />
    </span>
  );
}

/** ▲ 154% / ▼ 100% change pill. */
export function Trend({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] num",
        up ? "bg-good-wash text-good" : "bg-bad-wash text-bad",
        className,
      )}
    >
      <span aria-hidden="true" className="text-[8px]">
        {up ? "▲" : "▼"}
      </span>
      <span className="sr-only">{up ? "Up" : "Down"}</span>
      {Math.abs(Math.round(value))}%
    </span>
  );
}
