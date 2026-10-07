"use client";

import { useEffect, useId, useRef, useState } from "react";
import { money } from "@/lib/deal";
import { Page, PageHeader } from "../ui/page-header";
import { cx } from "../ui/primitives";

type Inputs = {
  billings: number;
  base: number;
  rate: number;
  threshold: number;
  retained: number;
  costs: number;
};

/** Defaults reproduce the "$840k billed, $190k kept" example recruiters hear on Harvey's feed. */
const DEFAULTS: Inputs = { billings: 840_000, base: 140_000, rate: 0.12, threshold: 3, retained: 0.8, costs: 45_000 };

function compute(i: Inputs) {
  const commissionable = Math.max(0, i.billings - i.base * i.threshold);
  const commission = commissionable * i.rate;
  const kept = i.base + commission;
  const agency = Math.max(0, i.billings - kept);
  const keptShare = i.billings ? kept / i.billings : 0;
  const marginal = commissionable > 0 ? i.rate * 100_000 : 0;
  const own = Math.max(0, i.billings * i.retained - i.costs);
  return { commission, kept, agency, keptShare, marginal, own, gap: own - kept };
}

export function Calculator() {
  const [inputs, setInputs] = useState(DEFAULTS);
  const r = compute(inputs);
  const set = (key: keyof Inputs) => (v: number) => setInputs((p) => ({ ...p, [key]: v }));

  return (
    <Page>
      <PageHeader eyebrow="The Sum" title="What did you bill, and what did you keep?">
        Most recruiters have never done this sum. Put in last year&apos;s numbers. Nothing leaves your browser.
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div data-tour="sum-inputs" className="space-y-8">
          <section className="space-y-6" aria-labelledby="desk-today">
            <h2 id="desk-today" className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Your desk today</h2>
            <Slider label="Billings last year" value={inputs.billings} min={100_000} max={2_000_000} step={10_000} unit="money" onChange={set("billings")} />
            <Slider label="Base salary" value={inputs.base} min={50_000} max={300_000} step={5_000} unit="money" onChange={set("base")} />
            <Slider
              label="Commission rate"
              value={inputs.rate}
              min={0}
              max={0.4}
              step={0.01}
              unit="percent"
              onChange={set("rate")}
            />
            <Slider
              label="Commission starts after"
              hint="multiple of base"
              value={inputs.threshold}
              min={0}
              max={5}
              step={0.5}
              unit="multiple"
              onChange={set("threshold")}
            />
          </section>

          <section className="space-y-6 border-t border-line pt-8" aria-labelledby="own-desk">
            <h2 id="own-desk" className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">If you ran your own desk</h2>
            <Slider
              label="Billings you'd keep"
              hint="not every client follows you"
              value={inputs.retained}
              min={0.3}
              max={1}
              step={0.05}
              unit="percent"
              onChange={set("retained")}
            />
            <Slider label="Cost to run it" hint="tools, insurance, accounting" value={inputs.costs} min={0} max={200_000} step={5_000} unit="money" onChange={set("costs")} />
          </section>

          <button onClick={() => setInputs(DEFAULTS)} className="text-[12px] text-fg-faint underline-offset-4 hover:text-fg hover:underline">
            Reset to example
          </button>
        </div>

        <div className="min-w-0 space-y-6">
          <section data-tour="sum-result" className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <p className="text-[24px] leading-[1.35] font-medium tracking-[-0.02em] text-fg-muted sm:text-[30px]">
              You generated <Tween value={inputs.billings} className="text-fg" />.
              <br />
              You kept <Tween value={r.kept} className="text-fg" />.
            </p>

            <div className="mt-8">
              <div className="flex h-10 overflow-hidden rounded-lg" role="img" aria-label={`You kept ${Math.round(r.keptShare * 100)} percent`}>
                <div
                  className="flex items-center bg-fg px-3 text-[12px] font-medium text-ink transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(r.keptShare * 100, 6)}%` }}
                >
                  {Math.round(r.keptShare * 100)}%
                </div>
                <div className="flex flex-1 items-center justify-end bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.05)_0_6px,rgb(255_255_255/0.025)_6px_12px)] px-3 text-[12px] text-fg-muted">
                  {Math.round((1 - r.keptShare) * 100)}% kept by the agency
                </div>
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-fg-faint num">
                <span>you · {money(r.kept, { compact: true })}</span>
                <span>agency · {money(r.agency, { compact: true })}</span>
              </div>
            </div>

            <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              <Figure label="Per extra $100k you bill" value={money(r.marginal)} note="goes to you" />
              <Figure label="Over three years" value={money(r.agency * 3, { compact: true })} note="you generated and never saw" tone="warm" />
              <Figure label="Commission this year" value={money(r.commission, { compact: true })} note={`on top of ${money(inputs.base, { compact: true })} base`} />
            </dl>
          </section>

          <section data-tour="sum-own" className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Same desk, your own name</h2>
              <span className="text-[11px] text-fg-faint">Illustrative, based on your assumptions</span>
            </div>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-[12px] text-fg-faint">You&apos;d take home</div>
                <Tween value={r.own} className="mt-1 block text-[36px] font-medium leading-none tracking-[-0.03em]" />
              </div>
              <div>
                <div className="text-[12px] text-fg-faint">Difference each year</div>
                <Tween
                  value={r.gap}
                  signed
                  className={cx("mt-1 block text-[36px] font-medium leading-none tracking-[-0.03em]", r.gap > 0 ? "text-good" : "text-fg-muted")}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}

type Unit = "money" | "percent" | "multiple";

const UNIT = {
  money: { show: (v: number) => money(v), toField: (v: number) => String(Math.round(v)), fromField: (n: number) => n, suffix: "" },
  percent: { show: (v: number) => `${Math.round(v * 100)}%`, toField: (v: number) => String(Math.round(v * 100)), fromField: (n: number) => n / 100, suffix: "%" },
  multiple: { show: (v: number) => `${v}× base`, toField: (v: number) => String(v), fromField: (n: number) => n, suffix: "×" },
} satisfies Record<Unit, { show: (v: number) => string; toField: (v: number) => string; fromField: (n: number) => number; suffix: string }>;

/**
 * A slider with a typeable value. Typing can go past the slider's range
 * (some desks bill more than $2m); the thumb just pins to the end.
 */
function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: Unit;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const u = UNIT[unit];
  const [draft, setDraft] = useState<string | null>(null);
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const commit = () => {
    if (draft === null) return;
    const n = Number(draft.replace(/[^0-9.]/g, ""));
    if (draft.trim() !== "" && Number.isFinite(n)) {
      const next = u.fromField(n);
      onChange(unit === "percent" ? Math.min(1, Math.max(0, next)) : Math.max(0, next));
    }
    setDraft(null);
  };

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-range`} className="text-[13px] text-fg-muted">
          {label}
          {hint && <span className="ml-1.5 text-[11px] text-fg-faint">{hint}</span>}
        </label>
        <span className="relative flex items-baseline">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`${label} value`}
            value={draft ?? u.show(value)}
            onFocus={(e) => {
              setDraft(u.toField(value));
              requestAnimationFrame(() => e.target.select());
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(null);
                requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
              }
            }}
            size={Math.max(4, (draft ?? u.show(value)).length)}
            className="rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-right text-[14px] text-fg outline-none transition-colors num hover:border-line-strong focus:border-fg/40 focus:bg-ink-sunken"
          />
          {draft !== null && u.suffix && <span className="pointer-events-none ml-1 text-[13px] text-fg-faint">{u.suffix}</span>}
        </span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ background: `linear-gradient(to right, rgb(237 237 237 / 0.7) ${pct}%, transparent ${pct}%) center / 100% 2px no-repeat` }}
      />
    </div>
  );
}

function Figure({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "warm" }) {
  return (
    <div className="bg-surface px-4 py-4">
      <dt className="text-[11px] text-fg-faint">{label}</dt>
      <dd className={cx("mt-1.5 text-[22px] num", tone === "warm" ? "text-warm" : "text-fg")}>{value}</dd>
      <dd className="mt-0.5 text-[11px] text-fg-faint">{note}</dd>
    </div>
  );
}

/** Eases a number to its new value so the sum feels alive while you drag. */
function Tween({ value, className, signed = false }: { value: number; className?: string; signed?: boolean }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 380);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = origin + (value - origin) * eased;
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const rounded = Math.round(shown);
  return (
    <span className={cx("num", className)}>
      {signed && rounded > 0 ? "+" : ""}
      {money(rounded)}
    </span>
  );
}
