import { forwardRef, useId } from "react";
import { heatLoss, idleLabel, initials, temperatureOf, type Temperature } from "@/lib/deal";
import type { Deal } from "@/lib/types";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** HeyAmara's two-stroke "A". */
export function AmaraMark({ className = "size-5" }: { className?: string }) {
  // Unique ids per instance: a hidden copy (e.g. the desktop sidebar on mobile)
  // would otherwise own the gradient and every other mark would render empty.
  const id = useId();
  return (
    <svg viewBox="0 0 28 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f0a8f8" />
          <stop offset="1" stopColor="#e597f4" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a483f2" />
          <stop offset="1" stopColor="#8a64ec" />
        </linearGradient>
      </defs>
      <path d="M9.2 0h7.4L7.8 24H0z" fill={`url(#${id}l)`} />
      <path d="M11.4 0h7.4L28 24h-7.8z" fill={`url(#${id}r)`} opacity="0.92" />
    </svg>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full border border-line-strong bg-raised font-medium text-fg-muted",
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-[11px]",
        size === "lg" && "size-11 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}

const TEMP_COPY: Record<Temperature, string> = {
  hot: "Fresh",
  warm: "Warm",
  cooling: "Cooling",
  cold: "Going cold",
};

const TEMP_COLOR: Record<Temperature, string> = {
  hot: "bg-fg/70",
  warm: "bg-fg/45",
  cooling: "bg-warm",
  cold: "bg-cold",
};

const TEMP_TEXT: Record<Temperature, string> = {
  hot: "text-fg-faint",
  warm: "text-fg-faint",
  cooling: "text-warm",
  cold: "text-cold",
};

/**
 * Deal heat: a short bar that drains as a deal sits untouched.
 * Neutral while healthy, so colour only appears when something needs you.
 */
export function Heat({ deal, showLabel = false }: { deal: Pick<Deal, "stage" | "hoursIdle">; showLabel?: boolean }) {
  const t = temperatureOf(deal);
  const remaining = 1 - heatLoss(deal);
  return (
    <span className="inline-flex items-center gap-2" title={`${TEMP_COPY[t]} · last touched ${idleLabel(deal.hoursIdle)} ago`}>
      <span className="relative h-1 w-10 overflow-hidden rounded-full bg-line-strong" aria-hidden="true">
        <span
          className={cx("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700", TEMP_COLOR[t])}
          style={{ width: `${Math.max(8, remaining * 100)}%` }}
        />
      </span>
      <span className={cx("font-mono text-[11px] num", TEMP_TEXT[t])}>
        {showLabel ? `${TEMP_COPY[t]} · ` : ""}
        {idleLabel(deal.hoursIdle)}
      </span>
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-line-strong bg-raised px-1 font-mono text-[10px] text-fg-muted">
      {children}
    </kbd>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** For AI actions use <AmaraButton>, so every Amara action shares one shape. */
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,opacity,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-[13px]",
        variant === "primary" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
        variant === "secondary" && "border border-line-strong bg-raised text-fg hover:bg-hover",
        variant === "ghost" && "text-fg-muted hover:bg-hover hover:text-fg",
        className,
      )}
      {...props}
    />
  );
});

/**
 * The one shape for anything that hands work to Amara: a gradient edge that
 * fades toward the bottom-right, a faint plum wash and the gradient "A" mark. Used by Ask HeyAmara, "Draft all",
 * "Chase", the next-move button and every other AI action.
 */
const AMARA_SIZES = {
  sm: { box: "h-7 gap-1.5 rounded-lg px-2.5 text-[12px]", mark: "h-2.5 w-3" },
  md: { box: "h-9 gap-2 rounded-xl px-3 text-[13px]", mark: "h-3 w-3.5" },
  lg: { box: "h-11 gap-2.5 rounded-xl px-4 text-[14px]", mark: "h-3.5 w-4" },
} as const;

export const amaraButtonClass = (size: keyof typeof AMARA_SIZES = "md") =>
  cx(
    "amara-action inline-flex shrink-0 items-center whitespace-nowrap transition-[background,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
    AMARA_SIZES[size].box,
  );

export const AmaraButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: keyof typeof AMARA_SIZES; active?: boolean }
>(function AmaraButton({ size = "md", active, className, children, ...props }, ref) {
  return (
    <button ref={ref} className={cx(amaraButtonClass(size), active && "amara-action-active", className)} {...props}>
      <AmaraMark className={cx("shrink-0", AMARA_SIZES[size].mark)} />
      {children}
    </button>
  );
});

/** The same look as a non-interactive hint, e.g. "Ask" on hover inside a clickable card. */
export function AmaraTag({ children, className, wrap = false }: { children: React.ReactNode; className?: string; wrap?: boolean }) {
  return (
    <span
      className={cx(
        "amara-edge gap-1.5 rounded-md bg-surface text-fg",
        wrap ? "flex w-full items-start px-2.5 py-1.5 text-[12px] leading-snug" : "inline-flex h-6 items-center px-2 text-[11px]",
        className,
      )}
    >
      <AmaraMark className={cx("shrink-0", wrap ? "mt-[3px] h-2.5 w-3" : "h-2 w-2.5")} />
      {children}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[11px] font-medium tracking-[0.08em] text-fg-faint uppercase">{children}</h2>
      {aside}
    </div>
  );
}
