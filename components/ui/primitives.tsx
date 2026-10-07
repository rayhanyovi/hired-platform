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
          <stop offset="0" stopColor="#e07de6" />
          <stop offset="1" stopColor="#d58cf0" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a678f7" />
          <stop offset="1" stopColor="#7c4fe8" />
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
  variant?: "primary" | "secondary" | "ghost" | "amara";
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
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-[background-color,border-color,color,opacity,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-[13px]",
        variant === "primary" && "bg-fg text-ink hover:bg-white",
        variant === "secondary" && "border border-line-strong bg-raised text-fg hover:bg-hover",
        variant === "ghost" && "text-fg-muted hover:bg-hover hover:text-fg",
        variant === "amara" &&
          "bg-[linear-gradient(100deg,#b65ad1,#7c4fe8)] text-white shadow-[0_0_0_1px_rgb(255_255_255/0.08)_inset,0_6px_20px_-8px_rgb(139_92_246/0.7)] hover:brightness-110",
        className,
      )}
      {...props}
    />
  );
});

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[11px] font-medium tracking-[0.08em] text-fg-faint uppercase">{children}</h2>
      {aside}
    </div>
  );
}
