"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useDesk } from "@/lib/store";
import { cx } from "./primitives";

const TableControl = createContext<{ title: string; expanded: boolean; onToggle: () => void } | null>(null);

export function TableExpandControl({ mode = "table", showLabel = false }: { mode?: "table" | "full-page"; showLabel?: boolean }) {
  const control = useContext(TableControl);
  if (!control) return null;
  const label = mode === "full-page"
    ? `${control.expanded ? "Exit" : "Open"} ${control.title} full page`
    : `${control.expanded ? "Collapse" : "Expand"} ${control.title} table`;
  const Icon = control.expanded ? Minimize2 : Maximize2;
  return <button data-table-control aria-label={label} title={label} aria-pressed={control.expanded} onClick={control.onToggle} className={cx("items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-hover hover:text-fg", showLabel ? "inline-flex h-8 gap-2 px-2.5 text-[11px]" : "grid size-7 place-items-center rounded-md")}><Icon className="size-3.5" aria-hidden="true" />{showLabel && (control.expanded ? "Exit full page" : "Full page")}</button>;
}

/** Expand the data workspace while keeping its filters and row state mounted. */
export function TableWorkspace({ title, children, className, inlineControl = false, fill = false }: { title: string; children: React.ReactNode; className?: string; inlineControl?: boolean; fill?: boolean }) {
  const { railOpen } = useDesk();
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const workspace = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector('[role="dialog"], [role="menu"]')) return;
      event.preventDefault();
      setExpanded(false);
      if (inlineControl) workspace.current?.querySelector<HTMLButtonElement>("[data-table-control]")?.focus();
      else toggle.current?.focus();
    };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", escape); };
  }, [expanded, inlineControl]);
  return <TableControl.Provider value={{ title, expanded, onToggle: () => setExpanded(!expanded) }}><section ref={workspace} aria-label={`${title} workspace`} data-table-expanded={expanded || undefined} style={{ "--table-rail": railOpen ? "220px" : "68px" } as CSSProperties} className={cx(expanded ? "fixed inset-x-0 top-14 bottom-16 z-[60] flex flex-col bg-ink p-4 sm:p-6 md:top-16 md:bottom-0 md:left-[var(--table-rail)]" : fill ? "flex min-h-0 flex-1 flex-col" : "min-w-0", className)}>
    {!inlineControl && <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
      <span className="text-xs font-medium text-fg-muted">{title}</span>
      <button ref={toggle} aria-label={`${expanded ? "Collapse" : "Expand"} ${title} table`} aria-pressed={expanded} onClick={() => setExpanded(!expanded)} className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs text-fg-muted transition-colors hover:bg-raised hover:text-fg">
        {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}{expanded ? "Back to page" : "Expand"}
      </button>
    </div>}
    <div className={cx("min-w-0", (expanded || fill) && "min-h-0 flex-1", expanded && "overflow-auto overscroll-contain")}>{children}</div>
  </section></TableControl.Provider>;
}
