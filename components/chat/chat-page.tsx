"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, SquarePen } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import { amaraReply } from "@/lib/amara-chat";
import { PLACEHOLDERS, SUGGESTIONS } from "@/lib/home";
import { useDesk } from "@/lib/store";
import { Composer } from "../home/composer";
import { AmaraMessage, UserMessage, type Message } from "../home/thread";
import { cx } from "../ui/primitives";

type Conversation = { id: string; title: string; messages: Message[] };

const EASE = [0.2, 0, 0, 1] as const;
const SPRING = { type: "spring" as const, stiffness: 240, damping: 30, mass: 0.9 };

let seq = 0;
const nextId = (p: string) => `${p}${++seq}`;

/** Amara on its own: an empty, welcoming start that turns into a conversation. */
export function ChatPage() {
  const { me } = useDesk();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastUser = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];
  const started = messages.length > 0;

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    const user: Message = { id: nextId("m"), role: "user", text };
    const amara: Message = { id: nextId("m"), role: "amara", reply: amaraReply(text, "day30") };
    setBusy(true);
    if (!active) {
      const id = nextId("c");
      setConversations((cs) => [{ id, title: text, messages: [user, amara] }, ...cs]);
      setActiveId(id);
      window.scrollTo({ top: 0 });
    } else {
      setConversations((cs) => cs.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, user, amara] } : c)));
      requestAnimationFrame(() => lastUser.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const newChat = () => {
    setActiveId(null);
    setBusy(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        newChat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started]);

  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-4rem)]">
        {/* Conversation history */}
        <aside
          data-tour="chat-history"
          className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-[248px] shrink-0 flex-col border-r border-line bg-ink-sunken/60 lg:flex"
        >
          <div className="p-3">
            <button
              onClick={newChat}
              className="flex h-9 w-full items-center gap-2 rounded-lg border border-line-strong px-3 text-[13px] text-fg transition-colors hover:bg-surface"
            >
              <SquarePen className="size-4 text-fg-muted" /> New chat
            </button>
          </div>
          <div className="px-4 pt-2 pb-2 text-[10px] tracking-[0.1em] text-fg-faint uppercase">Recent</div>
          <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Conversations">
            {conversations.length === 0 ? (
              <p className="px-2 py-2 text-[12px] leading-relaxed text-fg-faint">Your conversations with Amara will show up here.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (busy) return;
                    setActiveId(c.id);
                  }}
                  aria-current={c.id === activeId ? "true" : undefined}
                  className={cx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                    c.id === activeId ? "bg-raised text-fg" : "text-fg-muted hover:bg-surface hover:text-fg",
                  )}
                >
                  <MessageSquareText className="size-3.5 shrink-0 text-fg-faint" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))
            )}
          </nav>
        </aside>

        <LayoutGroup>
          <div className="relative min-w-0 flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {!started ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE } }}
                  className="relative isolate flex min-h-[calc(100dvh-3.5rem)] w-full flex-col items-center justify-center px-4 pb-24 md:min-h-[calc(100dvh-4rem)]"
                >
                  <div className="hero-sky pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="flex items-center gap-3.5"
                  >
                    <span className="amara-orb size-9 rounded-full sm:size-11" aria-hidden="true" />
                    <h1 className="font-serif text-[40px] leading-none tracking-[-0.01em] sm:text-[54px]">Olá, {me.firstName}</h1>
                  </motion.div>
                  <motion.div layoutId="chat-composer" transition={SPRING} className="mt-10 w-full max-w-[720px]" data-tour="chat-composer">
                    <Composer placeholders={PLACEHOLDERS.day30} onSend={send} disabled={busy} autoFocus />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="mt-4 flex max-w-[720px] flex-wrap justify-center gap-2"
                  >
                    {SUGGESTIONS.day30.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-line-strong bg-ink-sunken/60 px-3.5 py-1.5 text-[13px] text-fg-muted transition-colors hover:border-white/20 hover:bg-raised hover:text-fg"
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key={`thread-${activeId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-col md:min-h-[calc(100dvh-4rem)]"
                >
                  <div className="mx-auto w-full max-w-[760px] flex-1 space-y-8 px-4 pt-10 pb-8">
                    {messages.map((m, i) =>
                      m.role === "user" ? (
                        <div key={m.id} ref={i === lastUserIndex ? lastUser : undefined} className="scroll-mt-24">
                          <UserMessage text={m.text} />
                        </div>
                      ) : (
                        <AmaraMessage
                          key={m.id}
                          reply={m.reply}
                          live={busy && i === messages.length - 1}
                          onDone={() => setBusy(false)}
                          onFollowUp={send}
                        />
                      ),
                    )}
                  </div>
                  <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 bg-gradient-to-t from-ink from-60% to-transparent px-4 pt-8 pb-4 md:bottom-0">
                    <div className="mx-auto max-w-[760px]">
                      <motion.div layoutId="chat-composer" transition={SPRING}>
                        <Composer docked placeholders={["Reply to Amara…"]} onSend={send} disabled={busy} autoFocus />
                      </motion.div>
                      <p className="mt-2 hidden text-center text-[11px] text-fg-faint sm:block">
                        Amara drafts, you decide. ⌘⇧O for a new chat. Replies are simulated in this demo.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>
    </MotionConfig>
  );
}
