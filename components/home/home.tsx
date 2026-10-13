"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ChartLine, CircleDollarSign, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { metricsFor, RANGE_LABEL, type Range, type Stage } from "@/lib/home";
import { useDesk } from "@/lib/store";
import { AmaraByline, StreamText } from "../ai/stream";
import { compactSelectClass } from "../ui/modal";
import { AmaraButton, cx } from "../ui/primitives";
import { Analytics } from "./analytics";
import { InvoicesPanel, LeaderboardPanel, MetricsRow, TasksPanel } from "./overview";
import { Sales } from "./sales";
import { Swap } from "../ui/swap";
import { Segmented } from "../ui/menu";
import { SubpageTabs } from "../ui/subpage-tabs";
import { claimHomeEntrance } from "@/lib/home-entrance";

type HomeTab = "overview" | "analytics" | "sales";

const EASE = [0.2, 0, 0, 1] as const;
const DOCK_DURATION = 1.35;
const DOCK_EASE = [0.4, 0, 0.2, 1] as const;
type EntrancePhase = "checking" | "orb" | "welcome" | "message" | "pause" | "docking" | "panels" | "ready";

/**
 * Home: a welcome, one line from Amara about what matters, and the dashboard.
 * Conversations happen in the Ask HeyAmara drawer, so every "ask" here opens it
 * with the question already sent and Home as the context.
 */
export function Home() {
  const { me, ask, homeStage: stage, setHomeStage: setStage, homeEntranceReady, setHomeEntranceReady } = useDesk();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<EntrancePhase>("checking");
  const docked = phase === "docking" || phase === "message" || phase === "panels" || phase === "ready";
  const showDashboard = phase === "panels" || phase === "ready";
  const showMessage = phase === "message" || phase === "panels" || phase === "ready";
  const welcome = `Welcome, ${me.firstName}`;
  const finishEntrance = useCallback(() => {
    setPhase("ready");
    setHomeEntranceReady(true);
  }, [setHomeEntranceReady]);
  const greetingDone = useCallback(() => setPhase("pause"), []);
  const messageDone = useCallback(() => setPhase((current) => current === "message" ? "panels" : current), []);

  useEffect(() => {
    if (phase !== "checking") return;
    const timer = setTimeout(() => {
      let play = !homeEntranceReady;
      try { play = claimHomeEntrance(window.localStorage, me.id, new Date(), homeEntranceReady); } catch { /* Storage may be unavailable. Keep the session fallback. */ }
      if (play) setPhase("orb");
      else finishEntrance();
    }, 0);
    return () => clearTimeout(timer);
  }, [phase, me.id, homeEntranceReady, finishEntrance]);

  useEffect(() => {
    if (phase === "checking" || phase === "ready") return;
    if (reducedMotion) {
      const timer = setTimeout(finishEntrance, 0);
      return () => clearTimeout(timer);
    }
    if (phase === "welcome" || phase === "message") return;
    const next: Partial<Record<EntrancePhase, [number, EntrancePhase]>> = {
      orb: [650, "welcome"],
      pause: [700, "docking"],
      docking: [DOCK_DURATION * 1000, "message"],
    };
    if (phase === "panels") {
      const timer = setTimeout(finishEntrance, 1300);
      return () => clearTimeout(timer);
    }
    const transition = next[phase];
    if (!transition) return;
    const timer = setTimeout(() => setPhase(transition[1]), transition[0]);
    return () => clearTimeout(timer);
  }, [phase, reducedMotion, finishEntrance]);
  const [range, setRange] = useState<Range>("all");
  const [hidden, setHidden] = useState(false);
  const [tab, setTab] = useState<HomeTab>("overview");
  const metrics = metricsFor(stage, range);

  const intro =
    stage === "day1"
      ? "I'm Amara. I'll help you win clients, find candidates and make your first placement. Start with the first steps below, or ask me anything."
      : "8 clients have gone quiet and one invoice is still a draft. Your calls are up 154% on last period.";

  if (phase === "checking") return null;

  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        data-home-entrance={phase}
        initial={false}
        animate={{ height: docked ? "auto" : "calc(100svh - 64px)" }}
        transition={{ duration: reducedMotion ? 0 : DOCK_DURATION, ease: DOCK_EASE }}
        className="relative isolate overflow-hidden"
      >
        {/* The full-screen intro sky. Once the hero docks it fades out and the
            shell's page fog (the same one every page has) is what remains. */}
        <motion.div
          initial={false}
          animate={{ opacity: docked ? 0 : 0.8 }}
          transition={{ duration: reducedMotion ? 0 : DOCK_DURATION * 0.8, ease: DOCK_EASE }}
          className="pointer-events-none absolute inset-0 -z-10"
          data-home-glow
          aria-hidden="true"
        >
          <div className="hero-sky h-full w-full" />
        </motion.div>
        <motion.div
          layout="position"
          transition={{ duration: reducedMotion ? 0 : DOCK_DURATION, ease: DOCK_EASE }}
          className={cx(
            "mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pt-10 pb-8 sm:px-8 sm:pt-12",
            docked ? "lg:flex-row lg:items-end lg:justify-between" : "h-full items-center justify-center",
          )}
        >
          <motion.div layout="position" transition={{ layout: { duration: reducedMotion ? 0 : DOCK_DURATION, ease: DOCK_EASE } }} className={cx("min-w-0", !docked && "w-full")}>
            <motion.div
              layout="position"
              data-tour="home-hero"
              initial={homeEntranceReady ? false : { opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.55, ease: EASE, layout: { duration: reducedMotion ? 0 : DOCK_DURATION, ease: DOCK_EASE } }}
              className={cx("flex w-fit items-center", docked ? "gap-3.5" : "mx-auto")}
            >
              <span className="amara-orb size-9 shrink-0 rounded-full sm:size-10" aria-hidden="true" />
              <motion.h1
                initial={false}
                animate={{ width: phase === "orb" ? 0 : "auto", opacity: phase === "orb" ? 0 : 1, marginLeft: docked || phase === "orb" ? 0 : 14 }}
                transition={{ duration: reducedMotion ? 0 : 0.45, ease: EASE }}
                aria-label={welcome}
                className="relative shrink-0 overflow-hidden text-left font-serif text-[32px] leading-tight tracking-[-0.01em] sm:text-[46px]"
              >
                <span aria-hidden="true" className="invisible block">{welcome}</span>
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-start whitespace-nowrap">
                  <TypedGreeting key={welcome} text={welcome} enabled={phase === "welcome"} complete={phase !== "orb" && phase !== "welcome"} onDone={greetingDone} />
                </span>
              </motion.h1>
            </motion.div>
            {docked && (
              <motion.div
                initial={false}
                animate={{ opacity: showMessage ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE }}
                className="mt-4 max-w-[60ch]"
                aria-hidden={!showMessage}
                data-home-summary
              >
                <AmaraByline className="mb-1.5">{stage === "day1" ? "Amara" : "Today"}</AmaraByline>
                <div className="relative min-h-[44px] text-[15px] leading-relaxed text-fg-muted">
                  {/* Reserve the final message height so the docked greeting stays still. */}
                  <span className="invisible block" aria-hidden="true">{intro}</span>
                  {showMessage && <div className="absolute inset-0"><StreamText key={stage} text={intro} delay={100} onDone={messageDone} /></div>}
                </div>
              </motion.div>
            )}
          </motion.div>

          {docked && (
            <motion.div
              data-tour="home-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: showDashboard ? 1 : 0 }}
              className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-line bg-ink-sunken/80 p-1 pl-3 backdrop-blur lg:self-end"
            >
              <span className="text-[11px] tracking-[0.06em] text-fg-faint uppercase">Demo</span>
              <Segmented
                label="Demo state"
                value={stage}
                onChange={setStage}
                options={[
                  { id: "day1", label: "New member" },
                  { id: "day30", label: "Day 30" },
                ]}
              />
            </motion.div>
          )}
        </motion.div>
      </motion.section>

      {showDashboard && <Overview entrance={phase === "panels"} tab={tab} setTab={setTab} stage={stage} range={range} setRange={setRange} hidden={hidden} setHidden={setHidden} metrics={metrics} onAsk={ask} />}
    </MotionConfig>
  );
}

function Overview({
  entrance,
  tab,
  setTab,
  stage,
  range,
  setRange,
  hidden,
  setHidden,
  metrics,
  onAsk,
}: {
  entrance: boolean;
  tab: HomeTab;
  setTab: (t: HomeTab) => void;
  stage: Stage;
  range: Range;
  setRange: (r: Range) => void;
  hidden: boolean;
  setHidden: (h: boolean) => void;
  metrics: ReturnType<typeof metricsFor>;
  onAsk: (t: string) => void;
}) {
  return (
    <motion.section
      initial={entrance ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.5, ease: EASE }}
      className="mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-8"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div data-tour="home-tabs">
          <SubpageTabs label="Home view" value={tab} onChange={setTab} options={[
            { id: "overview", label: "Overview", icon: LayoutGrid },
            { id: "analytics", label: "Analytics", icon: ChartLine },
            { id: "sales", label: "Sales", icon: CircleDollarSign },
          ]} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AmaraButton size="sm" className="h-8 whitespace-nowrap" onClick={() => onAsk("Plan my day")}>
            Plan my day
          </AmaraButton>
          <button
            onClick={() => setHidden(!hidden)}
            aria-pressed={hidden}
            aria-label={hidden ? "Show numbers" : "Hide numbers"}
            title={hidden ? "Show numbers" : "Hide numbers for screen sharing"}
            className="grid size-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <label className="relative flex items-center">
            <CalendarDays className="pointer-events-none absolute left-2.5 size-3.5 text-fg-muted" />
            <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Time range" className={cx(compactSelectClass, "pl-8")}>
              {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                <option key={r} value={r}>
                  {RANGE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <Swap id={tab}>
      {tab !== "sales" && <MetricsRow values={metrics} stage={stage} hidden={hidden} onAsk={onAsk} />}

      {tab === "sales" ? (
        <Sales stage={stage} range={range} hidden={hidden} onAsk={onAsk} />
      ) : tab === "overview" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.25fr)]">
          <motion.div initial={entrance ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: entrance ? 0.25 : 0, duration: 0.45, ease: EASE }} className="min-w-0">
            <TasksPanel key={`tasks-${stage}`} stage={stage} onAsk={onAsk} />
          </motion.div>
          <motion.div initial={entrance ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: entrance ? 0.5 : 0, duration: 0.45, ease: EASE }} className="min-w-0">
            <InvoicesPanel stage={stage} hidden={hidden} onAsk={onAsk} />
          </motion.div>
          <motion.div initial={entrance ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: entrance ? 0.75 : 0, duration: 0.45, ease: EASE }} className="min-w-0">
            <LeaderboardPanel key={`board-${stage}`} stage={stage} hidden={hidden} onAsk={onAsk} />
          </motion.div>
        </div>
      ) : (
        <Analytics stage={stage} range={range} metrics={metrics} hidden={hidden} onAsk={onAsk} />
      )}
      </Swap>
    </motion.section>
  );
}

/** Character typing runs only during the entrance, with cleanup on navigation. */
function TypedGreeting({ text, enabled, complete, onDone }: { text: string; enabled: boolean; complete: boolean; onDone: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let index = 0;
    let interval: ReturnType<typeof setInterval>;
    const timer = setTimeout(() => {
      interval = setInterval(() => {
        index += 1;
        setCount(index);
        if (index >= text.length) {
          clearInterval(interval);
          onDone();
        }
      }, 55);
    }, 250);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [text, enabled, onDone]);
  return <span className={enabled ? "caret" : undefined}>{complete ? text : text.slice(0, count)}</span>;
}
