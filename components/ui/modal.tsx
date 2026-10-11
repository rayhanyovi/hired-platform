"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cx } from "./primitives";

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" data-close className="absolute inset-0 animate-fade bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        className={cx(
          "relative flex max-h-[92dvh] w-full animate-pop flex-col overflow-hidden rounded-t-2xl border border-line-strong bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] sm:rounded-2xl",
          size === "md" ? "sm:max-w-[520px]" : "sm:max-w-[860px]",
        )}
      >
        <header className="flex items-start gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium text-fg">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
          </div>
          <button
            data-close
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-3 text-[12px] text-fg-muted">
        {label}
        {hint && <span className="text-[11px] text-fg-faint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const fieldBase =
  "rounded-lg border border-line-strong bg-ink-sunken px-3 text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg/40";

/** Full-width form field. */
export const inputClass = `h-9 w-full text-[13px] ${fieldBase}`;

/** Toolbar-sized select that sizes to its content. */
export const compactSelectClass = `compact-select h-8 w-auto max-w-full text-[12px] ${fieldBase}`;
