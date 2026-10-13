"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { TAB_SPRING } from "./swap";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "./primitives";

export type MenuOption<T extends string> = {
  id: T;
  label: string;
  dot?: string;
  hint?: string;
  /** A reason means the option is shown but can't be picked. */
  disabled?: string;
};

/**
 * A status pill that opens a menu. The menu is portalled and fixed, so it is
 * never clipped by a scrolling table or a board column.
 */
export function StatusMenu<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  compact = false,
  allowReselect = false,
}: {
  value: T;
  options: MenuOption<T>[];
  onChange: (v: T) => void;
  label: string;
  className?: string;
  compact?: boolean;
  allowReselect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const r = button.current.getBoundingClientRect();
    const up = r.bottom + 360 > window.innerHeight && r.top > 360;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left: Math.min(r.left, window.innerWidth - 248), up });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "scroll" && menu.current?.contains(e.target as Node)) return;
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      if (e.type === "mousedown" && (menu.current?.contains(e.target as Node) || button.current?.contains(e.target as Node))) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label ?? value}`}
        className={cx(
          "inline-flex max-w-full items-center gap-2 rounded-md border border-line-strong bg-raised/50 text-left text-fg transition-colors hover:border-fg/25 hover:bg-raised",
          compact ? "h-6 pr-1 pl-1.5 text-[11px]" : "h-7 pr-1.5 pl-2 text-[12px]",
          className,
        )}
      >
        {current?.dot && <span className={cx("size-1.5 shrink-0 rounded-full", current.dot)} />}
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDown className="ml-auto size-3 shrink-0 text-fg-faint" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menu}
            role="listbox"
            aria-label={label}
            style={{ top: pos.top, left: pos.left, transform: pos.up ? "translateY(-100%)" : undefined }}
            className="fixed z-[60] max-h-[340px] w-60 animate-pop overflow-y-auto rounded-xl border border-line-strong bg-surface p-1 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((o) => (
              <button
                key={o.id}
                role="option"
                aria-selected={o.id === value}
                aria-disabled={!!o.disabled}
                title={o.disabled ?? o.hint}
                onClick={() => {
                  if (o.disabled) return;
                  setOpen(false);
                  if (o.id !== value || allowReselect) onChange(o.id);
                }}
                className={cx(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors",
                  o.disabled ? "cursor-not-allowed text-fg-faint/70" : "text-fg-muted hover:bg-raised hover:text-fg",
                )}
              >
                {o.dot && <span className={cx("size-1.5 shrink-0 rounded-full", o.dot, o.disabled && "opacity-40")} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.label}</span>
                  {o.disabled && <span className="block truncate text-[10px] text-fg-faint/80">{o.disabled}</span>}
                </span>
                {o.id === value && <Check className="size-3.5 shrink-0 text-fg" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * The one toggle style for mutually exclusive options: views (List / Board,
 * with icons) and scopes (Open / All / Closed). Always labelled with text.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  /** A `disabled` reason shows the option but blocks it, with the reason as its tooltip. */
  options: { id: T; label: string; icon?: typeof Check; count?: number; disabled?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  // One pill per control, sliding to whichever option is selected.
  const pill = useId();
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          disabled={!!o.disabled}
          title={o.disabled}
          onClick={() => onChange(o.id)}
          className={cx(
            "relative flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
            value === o.id ? "text-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {value === o.id && (
            <motion.span layoutId={pill} transition={TAB_SPRING} className="absolute inset-0 rounded-md bg-raised shadow-[0_0_0_1px_rgb(255_255_255/0.06)]" aria-hidden="true" />
          )}
          <span className="relative flex items-center gap-1.5">
            {o.icon && <o.icon className="size-3.5" strokeWidth={1.75} />}
            {o.label}
            {o.count !== undefined && <span className="font-mono text-[10px] text-fg-faint num">{o.count}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
