"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useDesk } from "@/lib/store";
import { tourFor, type Tour as TourData } from "@/lib/tours";
import { Button, Kbd, cx } from "../ui/primitives";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const CARD_W = 340;
const GAP = 14;

/** Finds the on-screen element for a step. Hidden (preserved) routes are skipped. */
function findTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  return [...all].find((el) => el.getClientRects().length > 0) ?? null;
}

export function TourOverlay() {
  const { tourOpen, setTourOpen } = useDesk();
  const pathname = usePathname();
  const tour = tourFor(pathname);
  if (!tourOpen || !tour) return null;
  return <TourRunner key={pathname} tour={tour} onClose={() => setTourOpen(false)} />;
}

function TourRunner({ tour, onClose }: { tour: TourData; onClose: () => void }) {
  // Only keep steps whose target exists right now (or that have no target at all).
  const [steps] = useState(() => tour.steps.filter((s) => !s.target || findTarget(s.target)));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(180);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  const measure = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const el = findTarget(step?.target);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    // Clamp very tall targets to the viewport so the spotlight stays on screen.
    const top = Math.max(r.top, 8);
    const bottom = Math.min(r.bottom, window.innerHeight - 8);
    setRect({ top: top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: Math.max(bottom - top, 24) + PAD * 2 });
  }, [step?.target]);

  // Bring the target into view, then measure once scrolling settles.
  useEffect(() => {
    const el = findTarget(step?.target);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 380);
    let frame = 0;
    const onMove = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [step?.target, measure]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, rect]);

  const next = useCallback(() => (last ? onClose() : setIndex((i) => i + 1)), [last, onClose]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  if (!step) return null;

  const mobile = viewport.w < 640;
  let cardStyle: React.CSSProperties;
  if (mobile) {
    cardStyle = { left: 12, right: 12, bottom: 12 };
  } else if (!rect) {
    cardStyle = { left: (viewport.w - CARD_W) / 2, top: Math.max(24, (viewport.h - cardH) / 2) };
  } else {
    const left = Math.min(Math.max(rect.left, 16), viewport.w - CARD_W - 16);
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - cardH;
    if (below + cardH < viewport.h - 16) cardStyle = { left, top: below };
    else if (above > 16) cardStyle = { left, top: above };
    // Target fills the screen: float the card in the corner over it.
    else cardStyle = { right: 24, bottom: 24 };
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`${tour.name} tour`}>
      {/* Click-shield. The spotlight's huge shadow does the dimming. */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl ring-1 ring-white/25 transition-[top,left,width,height] duration-300 ease-out"
          style={{ ...rect, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.62)" }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 animate-fade bg-black/60" />
      )}

      <div
        ref={cardRef}
        key={index}
        style={{ ...cardStyle, width: mobile ? undefined : CARD_W }}
        className="absolute animate-pop rounded-2xl border border-line-strong bg-surface p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-fg-faint num">
            {tour.name} · {index + 1} / {steps.length}
          </span>
          <button onClick={onClose} aria-label="End tour" className="ml-auto grid size-7 place-items-center rounded-md text-fg-faint hover:bg-hover hover:text-fg">
            <X className="size-3.5" />
          </button>
        </div>
        <h2 className="mt-2 text-[15px] font-medium text-fg">{step.title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{step.body}</p>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={cx("h-1 rounded-full transition-all", i === index ? "w-4 bg-fg" : "w-1.5 bg-line-strong")} />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            {index > 0 && (
              <Button size="sm" variant="ghost" onClick={back}>
                <ArrowLeft className="size-3.5" /> Back
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={next}>
              {last ? "Done" : "Next"} {!last && <ArrowRight className="size-3.5" />}
            </Button>
          </div>
        </div>
        {index === 0 && !mobile && (
          <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-fg-faint">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd> to move · <Kbd>esc</Kbd> to leave
          </p>
        )}
      </div>
    </div>
  );
}
