"use client";

import { useId } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./primitives";
import { TAB_SPRING } from "./swap";

/** Page-level navigation, shared with Home. Filters and view toggles use Segmented. */
export function SubpageTabs<T extends string>({ label, value, onChange, options }: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string; icon: LucideIcon; disabled?: string }[];
}) {
  const activeId = useId();
  return <div className="flex flex-wrap gap-1" role="tablist" aria-label={label}>
    {options.map(({ id, label: title, icon: Icon, disabled }) => <button
      key={id} role="tab" aria-selected={value === id} disabled={!!disabled} title={disabled}
      onClick={() => onChange(id)}
      className={cx("relative inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40", value === id ? "text-fg" : "text-fg-muted hover:text-fg")}
    >
      {value === id && <motion.span layoutId={activeId} transition={TAB_SPRING} className="absolute inset-0 rounded-xl border border-line-strong bg-raised" aria-hidden="true" />}
      <Icon className="relative size-4" strokeWidth={1.75} aria-hidden="true" />
      <span className="relative">{title}</span>
    </button>)}
  </div>;
}
