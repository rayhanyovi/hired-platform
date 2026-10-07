"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CornerDownLeft, Search } from "lucide-react";
import { askAmara, SUGGESTED_QUESTIONS, type AmaraAnswer } from "@/lib/ai";
import { useDesk } from "@/lib/store";
import { AmaraByline, StreamText } from "../ai/stream";
import { Kbd, cx } from "../ui/primitives";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useDesk();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  if (!paletteOpen) return null;
  return <Palette onClose={() => setPaletteOpen(false)} />;
}

function Palette({ onClose }: { onClose: () => void }) {
  const { deals, followUps, openDeal } = useDesk();
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState<{ q: string; a: AmaraAnswer; n: number } | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setAsked((prev) => ({ q, a: askAmara(q, deals, followUps), n: (prev?.n ?? 0) + 1 }));
    setQuery("");
  };

  const suggestions = SUGGESTED_QUESTIONS.filter((s) => s !== asked?.q && s.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Ask Amara">
      <button aria-label="Close" className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="amara-edge relative w-full max-w-[600px] animate-pop overflow-hidden rounded-2xl bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(query || suggestions[active] || "");
          }}
          className="flex items-center gap-3 border-b border-line px-4"
        >
          <Search className="size-4 text-fg-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, suggestions.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
            }}
            placeholder={asked ? "Ask a follow-up…" : "Ask Amara about your desk…"}
            className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-faint focus-visible:outline-none"
            aria-label="Ask Amara"
          />
          <Kbd>esc</Kbd>
        </form>

        <div className="max-h-[60vh] overflow-y-auto">
          {asked && (
            <div key={asked.n} className="border-b border-line px-5 py-5">
              <div className="mb-4 text-[13px] text-fg-muted">{asked.q}</div>
              <AmaraByline className="mb-2.5" />
              <StreamText text={asked.a.text} className="text-[14px] leading-relaxed text-fg" />
              {asked.a.links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {asked.a.links.map((l) => (
                    <Link
                      key={l.dealId ?? l.href}
                      href={l.href}
                      onClick={() => {
                        onClose();
                        if (l.dealId) openDeal(l.dealId);
                      }}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-line-strong bg-raised px-2.5 text-xs text-fg-muted transition-colors hover:text-fg"
                    >
                      {l.label}
                      <ArrowUpRight className="size-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 pt-2 pb-1.5 text-[11px] tracking-[0.08em] text-fg-faint uppercase">
                {asked ? "Try" : "Suggested"}
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={s}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => ask(s)}
                  className={cx(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors",
                    i === active ? "bg-raised text-fg" : "text-fg-muted",
                  )}
                >
                  {s}
                  {i === active && <CornerDownLeft className="ml-auto size-3.5 text-fg-faint" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-[11px] text-fg-faint">
          <AmaraByline>Answers from your desk</AmaraByline>
          <span className="ml-auto">Demo · responses are mocked</span>
        </div>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toast } = useDesk();
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-pop rounded-lg border border-line-strong bg-raised px-4 py-2.5 text-[13px] text-fg shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] md:bottom-6"
    >
      {toast.text}
    </div>
  );
}
