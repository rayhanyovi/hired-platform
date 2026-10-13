"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Columns3,
  CornerDownLeft,
  FileText,
  GraduationCap,
  Inbox,
  LayoutGrid,
  MessageSquareText,
  Search,
  ShieldCheck,
  Briefcase,
  ListChecks,
  Mail,
  Target,
  UsersRound,
} from "lucide-react";
import { buildIndex, KIND_LABEL, lens, looksLikeQuestion, search, type Result, type ResultKind } from "@/lib/search";
import { useDesk } from "@/lib/store";
import { AmaraMark, Kbd, cx } from "../ui/primitives";

const KIND_ICON: Record<ResultKind, typeof Search> = {
  page: LayoutGrid,
  deal: Columns3,
  client: Building2,
  prospect: Target,
  role: Briefcase,
  candidate: UsersRound,
  applicant: Inbox,
  followup: MessageSquareText,
  message: Mail,
  task: ListChecks,
  document: FileText,
  lesson: GraduationCap,
  member: ShieldCheck,
};

const EXAMPLES = ["deals going cold", "unsigned", "strong fit", "chase", "Laura", "Tidewater"];

/** ⌘K anywhere. */
export function SearchPalette() {
  const { searchOpen, setSearchOpen } = useDesk();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;
  return <Palette onClose={() => setSearchOpen(false)} />;
}

type Row = { type: "ask" } | { type: "result"; result: Result; group: string };

function Palette({ onClose }: { onClose: () => void }) {
  const desk = useDesk();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const index = useMemo(() => buildIndex(desk), [desk]);
  const q = query.trim();
  const found = q ? lens(q, desk, index) : null;
  const results = search(index, q);
  const pages = index.filter((r) => r.kind === "page");

  // Flatten into one keyboard-navigable list.
  const rows: Row[] = [];
  const askFirst = q && (looksLikeQuestion(q) || (!results.length && !found?.results.length));
  if (askFirst) rows.push({ type: "ask" });
  if (found?.results.length) found.results.forEach((r) => rows.push({ type: "result", result: r, group: `amara:${found.label}` }));
  const shown = new Set(found?.results.map((r) => r.id));
  (q ? results.filter((r) => !shown.has(r.id)) : pages).forEach((r) => rows.push({ type: "result", result: r, group: q ? r.kind : "jump" }));
  if (q && !askFirst) rows.push({ type: "ask" });

  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActive(0);
  }

  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-row="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (row: Row | undefined) => {
    if (!row) return;
    onClose();
    if (row.type === "ask") {
      desk.ask(q);
      return;
    }
    row.result.select?.(desk);
    router.push(row.result.href);
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <button aria-label="Close" className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[70vh] w-full max-w-[620px] animate-pop flex-col overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.85)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-fg-faint" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, rows.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(rows[active]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Search deals, clients, candidates… or ask Amara"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={rows.length ? `search-row-${active}` : undefined}
            className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-faint focus-visible:outline-none"
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={list} id="search-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
          {!q && (
            <div className="flex flex-wrap items-center gap-1.5 px-2 pt-1 pb-3 text-[12px] text-fg-faint">
              Try
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setQuery(ex);
                    input.current?.focus();
                  }}
                  className="rounded-md border border-line-strong px-2 py-0.5 text-fg-muted transition-colors hover:bg-raised hover:text-fg"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {q && rows.length === 1 && rows[0].type === "ask" && (
            <p className="px-3 pt-2 pb-3 text-[13px] text-fg-faint">Nothing on your desk matches “{q}”.</p>
          )}

          {rows.map((row, i) => {
            const isActive = i === active;
            if (row.type === "ask") {
              return (
                <button
                  key="ask"
                  id={`search-row-${i}`}
                  data-row={i}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(row)}
                  className={cx(
                    "my-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isActive ? "amara-edge bg-raised" : "hover:bg-raised",
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-amara-violet/30 bg-amara-wash">
                    <AmaraMark className="h-3 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-fg">
                      Ask HeyAmara: <span className="text-fg-muted">“{q}”</span>
                    </span>
                    <span className="block text-[12px] text-fg-faint">Answers from your desk, with this page as context</span>
                  </span>
                  {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-fg-faint" />}
                </button>
              );
            }

            const r = row.result;
            const Icon = KIND_ICON[r.kind];
            const header = row.group !== lastGroup ? row.group : null;
            lastGroup = row.group;
            return (
              <div key={`${row.group}-${r.id}`}>
                {header && (
                  <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5 text-[11px] tracking-[0.06em] text-fg-faint uppercase">
                    {header.startsWith("amara:") ? (
                      <>
                        <AmaraMark className="h-2.5 w-3" />
                        <span className="amara-gradient-text normal-case tracking-normal">Amara found · {header.slice(6)}</span>
                      </>
                    ) : header === "jump" ? (
                      "Jump to"
                    ) : (
                      KIND_LABEL[header as ResultKind]
                    )}
                  </div>
                )}
                <button
                  id={`search-row-${i}`}
                  data-row={i}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(row)}
                  className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors", isActive ? "bg-raised" : "hover:bg-raised/60")}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line-strong bg-ink-sunken">
                    <Icon className="size-4 text-fg-muted" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-fg">
                      <Highlight text={r.title} query={found && row.group.startsWith("amara:") ? "" : q} />
                    </span>
                    <span className="block truncate text-[12px] text-fg-faint">{r.subtitle}</span>
                  </span>
                  {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-fg-faint" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-[11px] text-fg-faint">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> open
          </span>
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <AmaraMark className="h-2.5 w-3" /> Amara understands phrases like “going cold”
          </span>
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-brand/25 text-fg">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}
