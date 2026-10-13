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

/**
 * An overview card: a coloured icon tile, then the label, the number and one
 * quiet line. Lay several in a `StatRow` so they share borders.
 */
export function StatCard({
  icon,
  tile,
  label,
  value,
  sub,
  action,
  faint = false,
  warm = false,
  className,
}: {
  icon: LucideIcon;
  tile: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** Revealed on hover on desktop, e.g. Ask. */
  action?: React.ReactNode;
  faint?: boolean;
  warm?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("group flex items-center gap-3.5 bg-surface px-5 py-4 transition-colors hover:bg-raised/40", className)}>
      <MetricIconTile icon={icon} label={label} tile={tile} className="size-10 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-fg-muted">{label}</div>
        <div className={cx("mt-0.5 text-[24px] leading-tight font-semibold tracking-[-0.02em] num", faint && "text-fg-faint", warm && "text-warm")}>{value}</div>
        {sub && <div className="stat-sub mt-0.5 truncate text-[11px] text-fg-faint">{sub}</div>}
      </div>
      {action && <div className="shrink-0 self-start transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">{action}</div>}
    </div>
  );
}

/** "▲ 154% vs last period", coloured by direction. */
export function ChangeLine({ value, hidden }: { value: number; hidden?: boolean }) {
  if (hidden) return <>•••</>;
  return (
    <>
      <span className={cx("num", value >= 0 ? "text-good" : "text-bad")}>
        {value >= 0 ? "▲" : "▼"} {Math.abs(value)}%
      </span>{" "}
      vs last period
    </>
  );
}

/** Overview cards in one bordered strip; five across on desktop, no empty cells on smaller screens. */
export function StatRow({ children, className, dataTour, cols = 5, dense = false }: { children: React.ReactNode; className?: string; dataTour?: string; cols?: 4 | 5; /** Two per row on phones, for pages where the cards sit above a workspace. */ dense?: boolean }) {
  return (
    <div
      data-tour={dataTour}
      className={cx(
        "grid overflow-hidden rounded-2xl border border-line bg-line [gap:1px] sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1",
        dense ? "grid-cols-2 [&_.stat-sub]:hidden sm:[&_.stat-sub]:block" : "grid-cols-1",
        cols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
