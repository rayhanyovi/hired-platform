"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Eye, SquarePen, X } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { askContext, askReply } from "@/lib/ask";
import { useDesk } from "@/lib/store";
import { Composer } from "../home/composer";
import { AmaraMessage, UserMessage, type Message } from "../home/thread";
import { AmaraButton, AmaraMark, Kbd, cx } from "../ui/primitives";

const DRAWER_W = "sm:w-[440px]";
let seq = 0;
const nextId = () => `ask${++seq}`;

/** On the Chat page Amara already has the whole screen, so the drawer stays out of the way. */
const pageHasChat = (pathname: string) => pathname === "/chat";

export function focusPageComposer() {
  const el = [...document.querySelectorAll<HTMLTextAreaElement>("[data-home-composer]")].find((t) => t.getClientRects().length > 0);
  el?.focus();
  return !!el;
}

/** The navbar entry point. */
export function AskButton({ compact = false }: { compact?: boolean }) {
  const { askOpen, setAskOpen } = useDesk();
  const pathname = usePathname();
  if (pageHasChat(pathname)) return null;
  return (
    <AmaraButton
      data-tour="ask-amara"
      onClick={() => setAskOpen(!askOpen)}
      aria-expanded={askOpen}
      aria-controls="ask-drawer"
      active={askOpen}
      className={compact ? "px-2.5" : undefined}
    >
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>Ask HeyAmara</span>
      {!compact && (
        <span className="hidden lg:inline-flex">
          <Kbd>⌘J</Kbd>
        </span>
      )}
    </AmaraButton>
  );
}

/** Wraps the page column so the drawer pushes content aside on wide screens instead of covering it. */
export function ShellFrame({ children }: { children: React.ReactNode }) {
  const { askOpen } = useDesk();
  const pathname = usePathname();
  const open = askOpen && !pageHasChat(pathname);
  return (
    <div className={cx("relative isolate flex min-w-0 flex-1 flex-col pb-16 transition-[padding] duration-300 ease-out md:pb-0", open && "xl:pr-[440px]")}>
      <div className="page-fog pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" aria-hidden="true" />
      {children}
    </div>
  );
}

export function AskDrawer() {
  const desk = useDesk();
  const { askOpen, setAskOpen, pendingAsk } = desk;
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [withContext, setWithContext] = useState(true);
  const lastUser = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const ctx = askContext(pathname, desk);
  const open = askOpen && !pageHasChat(pathname);

  // Each page brings its own context back, even if you dropped it on the last one.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setWithContext(true);
  }

  // ⌘J toggles the drawer anywhere (on the Chat page it focuses the input instead).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        if (pageHasChat(pathname)) return void focusPageComposer();
        setAskOpen(!askOpen);
      }
      if (e.key === "Escape" && askOpen && !document.querySelector('[role="dialog"]:not(#ask-drawer)')) {
        const el = e.target as HTMLElement;
        if (el.matches("textarea") && (el as HTMLTextAreaElement).value) return;
        setAskOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [askOpen, setAskOpen, pathname]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    const context = withContext ? ctx : null;
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "user", text, context: context?.label },
      { id: nextId(), role: "amara", reply: askReply(text, context, desk) },
    ]);
    setBusy(true);
  };

  // A page handed Amara a question (e.g. "Draft all 8" on Home): send it once.
  const [handled, setHandled] = useState(0);
  if (pendingAsk && pendingAsk.n !== handled) {
    setHandled(pendingAsk.n);
    if (!busy) send(pendingAsk.text);
  }

  // Bring each new question to the top of the drawer once it's in the DOM.
  useEffect(() => {
    if (messages.length) lastUser.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [messages.length]);

  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.aside
            id="ask-drawer"
            role="dialog"
            aria-label="Ask HeyAmara"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cx(
              "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line-strong bg-ink-sunken shadow-[-30px_0_80px_-30px_rgb(0_0_0/0.9)]",
              DRAWER_W,
            )}
          >
            <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4 md:h-16">
              <AmaraMark className="h-4 w-[19px]" />
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Ask HeyAmara</h2>
              <div className="ml-auto flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      setMessages([]);
                      setBusy(false);
                    }}
                    aria-label="New conversation"
                    title="New conversation"
                    className="grid size-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                  >
                    <SquarePen className="size-4" />
                  </button>
                )}
                <button
                  onClick={() => setAskOpen(false)}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>

            {/* What Amara is looking at */}
            <div className="shrink-0 border-b border-line px-4 py-3">
              {withContext ? (
                <div className="flex items-start gap-2.5">
                  <Eye className="mt-0.5 size-3.5 shrink-0 text-amara-soft" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-fg-muted">
                      Looking at <span className="text-fg">{ctx.label}</span>
                    </div>
                    <div className="truncate text-[12px] text-fg-faint">{ctx.summary}</div>
                  </div>
                  <button
                    onClick={() => setWithContext(false)}
                    aria-label="Ask without page context"
                    title="Ask without page context"
                    className="grid size-6 shrink-0 place-items-center rounded-md text-fg-faint transition-colors hover:bg-surface hover:text-fg"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setWithContext(true)} className="flex items-center gap-2 text-[12px] text-fg-faint transition-colors hover:text-fg">
                  <Eye className="size-3.5" /> Use {ctx.label} as context
                </button>
              )}
            </div>

            <div
              ref={scroller}
              className="min-h-0 flex-1 overflow-y-auto"
              onClickCapture={(e) => {
                // Where the drawer covers the page, following one of Amara's links should reveal it.
                if ((e.target as HTMLElement).closest("a[href]") && !window.matchMedia("(min-width: 1280px)").matches) setAskOpen(false);
              }}
            >
              {messages.length === 0 ? (
                <div className="flex min-h-full flex-col justify-end px-5 pt-10 pb-6">
                  <span className="amara-orb mb-5 size-8 rounded-full" aria-hidden="true" />
                  <p className="font-serif text-[26px] leading-tight">
                    {withContext ? (
                      <>
                        What do you want to know about <span className="text-fg">{ctx.label}</span>?
                      </>
                    ) : (
                      <>What can I help with?</>
                    )}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                    {withContext ? "I can see the data on this page. Ask in your own words, or start here:" : "Ask about anything on your desk."}
                  </p>
                  <div className="mt-5 flex flex-col items-start gap-2">
                    {ctx.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-line-strong px-3.5 py-1.5 text-left text-[13px] text-fg-muted transition-colors hover:border-white/20 hover:bg-raised hover:text-fg"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-7 px-4 pt-6 pb-6">
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <div key={m.id} ref={i === lastUserIndex ? lastUser : undefined} className="scroll-mt-4">
                        <UserMessage text={m.text} context={m.context} />
                      </div>
                    ) : (
                      <AmaraMessage key={m.id} reply={m.reply} live={busy && i === messages.length - 1} onDone={() => setBusy(false)} onFollowUp={send} />
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-line p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
              <Composer
                docked
                autoFocus
                placeholders={[withContext ? `Ask about ${ctx.label}…` : "Ask Amara anything…"]}
                onSend={send}
                disabled={busy}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
