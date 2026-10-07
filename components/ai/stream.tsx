"use client";

import { useEffect, useState } from "react";
import { AmaraMark, cx } from "../ui/primitives";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveals text the way a streamed model response arrives: a short "thinking"
 * pause, then a few words at a time. Remount (change `key`) to replay.
 */
export function useStream(text: string, { delay = 450, wordsPerTick = 2, tickMs = 28 } = {}) {
  const words = text.split(/(\s+)/);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = setTimeout(() => {
        setStarted(true);
        setCount(Number.MAX_SAFE_INTEGER);
      }, 0);
      return () => clearTimeout(id);
    }
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      setStarted(true);
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= words.length) {
            clearInterval(interval);
            return c;
          }
          return c + wordsPerTick * 2;
        });
      }, tickMs);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [words.length, delay, wordsPerTick, tickMs]);

  const done = count >= words.length;
  return { shown: words.slice(0, count).join(""), started, done };
}

export function StreamText({
  text,
  className,
  delay,
  onDone,
}: {
  text: string;
  className?: string;
  delay?: number;
  onDone?: () => void;
}) {
  const { shown, started, done } = useStream(text, { delay });

  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  if (!started) return <Thinking />;
  return (
    <div className={cx("whitespace-pre-wrap", !done && "caret", className)} aria-live="polite" aria-busy={!done}>
      {shown}
    </div>
  );
}

export function Thinking({ label = "Amara is reading your desk" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-fg-faint" role="status">
      <span className="amara-orb size-2.5 rounded-full" aria-hidden="true" />
      {label}…
    </div>
  );
}

/** Marks anything Amara wrote, so humans always know what's AI-authored. */
export function AmaraByline({ children = "Amara", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em] uppercase", className)}>
      <AmaraMark className="h-2.5 w-3" />
      <span className="amara-gradient-text">{children}</span>
    </span>
  );
}
