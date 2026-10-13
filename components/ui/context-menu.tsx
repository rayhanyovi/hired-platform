"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { AmaraMark, cx } from "./primitives";

export type MenuEntry =
  | { separator: true }
  | {
      label: string;
      icon?: LucideIcon;
      /** An AI action: shows Amara's mark instead of an icon. */
      amara?: boolean;
      /** A colour dot instead of an icon, e.g. a label's colour. Takes a background class. */
      swatch?: string;
      onSelect?: () => void;
      /** A reason means the item shows but can't be picked. */
      disabled?: string;
      danger?: boolean;
      /** A short trailing note, e.g. the current value. */
      hint?: string;
      submenu?: MenuEntry[];
      /** Free-form submenu content, e.g. a picker. Gets `close`. */
      panel?: (close: () => void) => React.ReactNode;
      checked?: boolean;
    };

type Item = Exclude<MenuEntry, { separator: true }>;
/** Items, or free-form content (e.g. a picker) that gets `close`. */
type Open = { x: number; y: number; title?: string; items: MenuEntry[] | ((close: () => void) => React.ReactNode) };

const isItem = (e: MenuEntry): e is Item => !("separator" in e);

/**
 * Right-click menus. `bind(title, items)` returns the handlers for a row or
 * card: right-click, Shift+F10 or the Menu key when it's focused, and a long
 * press on touch screens. Render `menu` once, anywhere in the component.
 */
export function useContextMenu() {
  const [open, setOpen] = useState<Open | null>(null);
  const press = useRef<{ timer?: ReturnType<typeof setTimeout>; fired: boolean }>({ fired: false });
  const close = useCallback(() => setOpen(null), []);

  const bind = useCallback(
    (title: string, items: () => MenuEntry[]) => ({
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen({ x: e.clientX, y: e.clientY, title, items: items() });
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        setOpen({ x: r.left + 24, y: r.top + Math.min(r.height, 40), title, items: items() });
      },
      onTouchStart: (e: React.TouchEvent) => {
        const t = e.touches[0];
        press.current.fired = false;
        clearTimeout(press.current.timer);
        press.current.timer = setTimeout(() => {
          press.current.fired = true;
          setOpen({ x: t.clientX, y: t.clientY, title, items: items() });
        }, 500);
      },
      onTouchMove: () => clearTimeout(press.current.timer),
      onTouchEnd: (e: React.TouchEvent) => {
        clearTimeout(press.current.timer);
        // A long press opened the menu: don't let the tap also open the row.
        if (press.current.fired) e.preventDefault();
      },
    }),
    [],
  );

  /** Opens the same menu from a button click, under the button. Pass a function to show a picker instead of items. */
  const show = useCallback((e: React.MouseEvent<HTMLElement>, title: string | undefined, items: Open["items"]) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOpen({ x: r.left, y: r.bottom + 6, title, items });
  }, []);

  const menu = open ? <Menu key={`${open.x}:${open.y}`} {...open} onClose={close} /> : null;
  return { bind, show, menu, close };
}

function Menu({ x, y, title, items, onClose }: Open & { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, ready: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      top: Math.max(8, y + height > window.innerHeight - 8 ? y - height : y),
      ready: true,
    });
    el.querySelector<HTMLElement>('input, [role="menuitem"]:not([aria-disabled="true"])')?.focus();
  }, [x, y]);

  useEffect(() => {
    const away = (e: Event) => {
      if (e.type === "keydown") {
        if ((e as KeyboardEvent).key === "Escape" || (e as KeyboardEvent).key === "Tab") onClose();
        return;
      }
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("mousedown", away);
    window.addEventListener("keydown", away);
    window.addEventListener("resize", away);
    window.addEventListener("scroll", away, true);
    window.addEventListener("blur", away);
    return () => {
      window.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", away);
      window.removeEventListener("resize", away);
      window.removeEventListener("scroll", away, true);
      window.removeEventListener("blur", away);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={title ?? "Actions"}
      onContextMenu={(e) => e.preventDefault()}
      className={cx(
        "fixed z-[70] rounded-xl border border-line-strong bg-surface p-1 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.85)]",
        typeof items === "function" ? "w-auto" : "w-56",
        pos.ready ? "animate-pop" : "opacity-0",
      )}
      style={{ left: pos.left, top: pos.top }}
    >
      {title && <div className="truncate px-2.5 pt-1.5 pb-1 text-[11px] text-fg-faint">{title}</div>}
      {typeof items === "function" ? items(onClose) : <Items items={items} onClose={onClose} />}
    </div>,
    document.body,
  );
}

function Items({ items, onClose }: { items: MenuEntry[]; onClose: () => void }) {
  const [sub, setSub] = useState<number | null>(null);
  const list = useRef<HTMLDivElement>(null);

  const move = (from: HTMLElement, dir: 1 | -1) => {
    const all = [...(list.current?.querySelectorAll<HTMLElement>(':scope > [data-entry] > [role="menuitem"]:not([aria-disabled="true"])') ?? [])];
    const i = all.indexOf(from);
    all[(i + dir + all.length) % all.length]?.focus();
  };

  return (
    <div ref={list}>
      {items.map((e, i) =>
        !isItem(e) ? (
          <div key={`sep-${i}`} className="my-1 h-px bg-line" role="separator" />
        ) : (
          <div key={e.label} data-entry className="relative" onMouseEnter={() => setSub(e.submenu || e.panel ? i : null)}>
            <button
              type="button"
              role="menuitem"
              aria-disabled={e.disabled ? true : undefined}
              aria-haspopup={e.submenu || e.panel ? "menu" : undefined}
              aria-expanded={e.submenu || e.panel ? sub === i : undefined}
              title={e.disabled}
              onClick={() => {
                if (e.disabled) return;
                if (e.submenu || e.panel) return setSub(sub === i ? null : i);
                onClose();
                e.onSelect?.();
              }}
              onKeyDown={(k) => {
                if (k.key === "ArrowDown" || k.key === "ArrowUp") {
                  k.preventDefault();
                  move(k.currentTarget, k.key === "ArrowDown" ? 1 : -1);
                }
                if (k.key === "ArrowRight" && (e.submenu || e.panel) && !e.disabled) {
                  k.preventDefault();
                  setSub(i);
                  requestAnimationFrame(() =>
                    k.currentTarget.parentElement?.querySelector<HTMLElement>('[data-sub] [role="menuitem"]:not([aria-disabled="true"]), [data-sub] button')?.focus(),
                  );
                }
              }}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] outline-none",
                e.disabled
                  ? "cursor-not-allowed text-fg-faint/70"
                  : e.danger
                    ? "text-bad hover:bg-bad/10 focus-visible:bg-bad/10"
                    : "text-fg-muted hover:bg-raised hover:text-fg focus-visible:bg-raised focus-visible:text-fg",
                sub === i && "bg-raised text-fg",
              )}
            >
              {e.amara ? (
                <AmaraMark className="h-2.5 w-3 shrink-0" />
              ) : e.swatch ? (
                <span className="grid size-3.5 shrink-0 place-items-center">
                  <span className={cx("size-2 rounded-full", e.swatch)} />
                </span>
              ) : e.icon ? (
                <e.icon className={cx("size-3.5 shrink-0", e.disabled && "opacity-50")} strokeWidth={1.75} />
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate">{e.label}</span>
              {e.checked && <span className="size-1.5 rounded-full bg-fg" aria-label="Current" />}
              {e.hint && <span className="shrink-0 text-[11px] text-fg-faint">{e.hint}</span>}
              {(e.submenu || e.panel) && <ChevronRight className="size-3.5 shrink-0 text-fg-faint" />}
            </button>
            {sub === i && !e.disabled && (e.submenu || e.panel) && (
              <Submenu
                onBack={() => {
                  setSub(null);
                  list.current?.querySelectorAll<HTMLElement>(':scope > [data-entry] > [role="menuitem"]')[items.filter((x, j) => j < i && isItem(x)).length]?.focus();
                }}
              >
                {e.panel ? e.panel(onClose) : <Items items={e.submenu!} onClose={onClose} />}
              </Submenu>
            )}
          </div>
        ),
      )}
    </div>
  );
}

/** Opens to the right of its item, or to the left when there's no room. */
function Submenu({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<{ x: "right" | "left"; shiftY: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const parent = el.parentElement!.getBoundingClientRect();
    setSide({
      x: parent.right + r.width + 8 > window.innerWidth ? "left" : "right",
      shiftY: Math.min(0, window.innerHeight - 8 - (parent.top + r.height)),
    });
  }, []);
  return (
    <div
      ref={ref}
      data-sub
      role="menu"
      onKeyDown={(k) => {
        if (k.key === "ArrowLeft" || k.key === "Escape") {
          k.preventDefault();
          k.stopPropagation();
          onBack();
        }
      }}
      className={cx(
        "absolute z-10 min-w-48 rounded-xl border border-line-strong bg-surface p-1 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.85)]",
        side ? "animate-pop" : "opacity-0",
        side?.x === "left" ? "right-full mr-1" : "left-full ml-1",
      )}
      style={{ top: -4 + (side?.shiftY ?? 0) }}
    >
      {children}
    </div>
  );
}
