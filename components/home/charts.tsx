"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cx } from "../ui/primitives";

/**
 * Small, quiet charts: 2px lines, ≤24px columns with 4px rounded ends,
 * hairline grids, one axis, and a hover/focus readout on every chart.
 * Colours come in as CSS variables from the funnel palette; text stays in text tokens.
 */

type Point = { label: string; value: number };
export type Series = { name: string; color: string; points: Point[] };

/** A round axis maximum: 1, 2, 2.5 or 5 × 10ⁿ above the data. */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

function axisLabels(labels: string[]) {
  if (labels.length <= 7) return labels.map((l, i) => ({ l, i }));
  const step = Math.ceil(labels.length / 5);
  return labels.map((l, i) => ({ l, i })).filter(({ i }) => i % step === 0 || i === labels.length - 1);
}

function YAxis({ max, format, height }: { max: number; format: (v: number) => string; height: number }) {
  return (
    <div className="relative w-11 shrink-0 font-mono text-[10px] text-fg-faint num" style={{ height }} aria-hidden="true">
      {[1, 0.5, 0].map((f) => (
        <span key={f} className="absolute right-2 -translate-y-1/2" style={{ top: `${(1 - f) * 100}%` }}>
          {format(max * f)}
        </span>
      ))}
    </div>
  );
}

function Grid() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {[0, 0.5, 1].map((f) => (
        <span key={f} className="absolute inset-x-0 h-px bg-line" style={{ top: `${f * 100}%` }} />
      ))}
    </div>
  );
}

export function LineChart({ series, height = 180, format, hidden = false, label }: { series: Series[]; height?: number; format: (v: number) => string; hidden?: boolean; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const labels = series[0].points.map((p) => p.label);
  const n = labels.length;
  const max = niceMax(Math.max(...series.flatMap((s) => s.points.map((p) => p.value))));
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / max) * 100;
  const fmt = (v: number) => (hidden ? "•••" : format(v));

  return (
    <figure aria-label={label}>
      {series.length > 1 && (
        <figcaption className="mb-3 flex flex-wrap gap-4 text-[11px] text-fg-muted">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </figcaption>
      )}
      <div className="flex">
        <YAxis max={max} format={fmt} height={height} />
        <div className="min-w-0 flex-1">
          <div
            className="relative outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amara-soft"
            style={{ height }}
            tabIndex={0}
            role="img"
            aria-label={`${label}. ${series.map((s) => `${s.name}: ${s.points.map((p) => `${p.label} ${format(p.value)}`).join(", ")}`).join(". ")}`}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
            }}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(n - 1)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n - 1) - 1));
              if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
            }}
          >
            <Grid />
            <motion.svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
              aria-hidden="true"
              initial={{ clipPath: "inset(-10% 100% -10% 0)" }}
              animate={{ clipPath: "inset(-10% 0% -10% 0)" }}
              transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
            >
              {series.map((s) => {
                const d = s.points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
                return (
                  <g key={s.name}>
                    <motion.path d={`${d} L${x(n - 1)},100 L${x(0)},100 Z`} fill={s.color} initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} transition={{ duration: 0.6, delay: 0.25 }} />
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </motion.svg>
            {hover !== null && <span className="pointer-events-none absolute inset-y-0 w-px bg-fg/25" style={{ left: `${x(hover)}%` }} aria-hidden="true" />}
            {series.map((s) => {
              const i = hover ?? n - 1;
              return (
                <span
                  key={s.name}
                  aria-hidden="true"
                  className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 animate-[fade_240ms_ease-out_0.55s_both] rounded-full ring-2 ring-surface"
                  style={{ left: `${x(i)}%`, top: `${y(s.points[i].value)}%`, background: s.color }}
                />
              );
            })}
            {hover !== null && (
              <div
                className="pointer-events-none absolute top-0 z-10 min-w-[120px] -translate-y-[calc(100%+8px)] rounded-lg border border-line-strong bg-raised px-2.5 py-2 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.8)]"
                style={hover > n / 2 ? { right: `${100 - x(hover)}%` } : { left: `${x(hover)}%` }}
              >
                <div className="mb-1 text-[10px] text-fg-faint">{labels[hover]}</div>
                {series.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-[12px]">
                    <span className="h-0.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="font-semibold text-fg num">{fmt(s.points[hover].value)}</span>
                    <span className="text-fg-faint">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <XAxis labels={labels} />
        </div>
      </div>
    </figure>
  );
}

function XAxis({ labels }: { labels: string[] }) {
  const n = labels.length;
  return (
    <div className="relative mt-2 h-4 font-mono text-[10px] text-fg-faint" aria-hidden="true">
      {axisLabels(labels).map(({ l, i }) => (
        <span
          key={i}
          className={cx("absolute whitespace-nowrap", i === 0 ? "" : i === n - 1 ? "-translate-x-full" : "-translate-x-1/2")}
          style={{ left: `${n === 1 ? 50 : (i / (n - 1)) * 100}%` }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

export function ColumnChart({ points, color, height = 160, format, hidden = false, label }: { points: Point[]; color: string; height?: number; format: (v: number) => string; hidden?: boolean; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const fmt = (v: number) => (hidden ? "•••" : format(v));
  return (
    <figure aria-label={label}>
      <div className="flex">
        <YAxis max={max} format={fmt} height={height} />
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            <Grid />
            <div className="absolute inset-0 flex items-end">
              {points.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  aria-label={`${p.label}: ${format(p.value)}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="relative flex h-full flex-1 cursor-default items-end justify-center outline-none focus-visible:bg-white/[0.03]"
                >
                  <motion.span
                    className="w-[60%] max-w-6 rounded-t-[4px] transition-[filter]"
                    initial={{ height: 0 }}
                    animate={{ height: `${(p.value / max) * 100}%` }}
                    transition={{ duration: 0.45, delay: i * 0.03, ease: [0.2, 0, 0, 1] }}
                    style={{ minHeight: p.value ? 2 : 0, background: color, filter: hover === i ? "brightness(1.2)" : undefined }}
                  />
                  {hover === i && (
                    <span className="pointer-events-none absolute bottom-full z-10 mb-1 rounded-lg border border-line-strong bg-raised px-2 py-1.5 text-left whitespace-nowrap shadow-[0_10px_30px_-10px_rgb(0_0_0/0.8)]">
                      <span className="block text-[10px] text-fg-faint">{p.label}</span>
                      <span className="block text-[12px] font-semibold text-fg num">{fmt(p.value)}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex font-mono text-[10px] text-fg-faint" aria-hidden="true">
            {points.map((p, i) => (
              <span key={p.label} className="flex-1 truncate text-center">
                {points.length <= 10 || i % 2 === 0 ? p.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

/** A trend in a card: no axes, the last value marked. */
export function Sparkline({ values, color, target, height = 56 }: { values: number[]; color: string; target?: number; height?: number }) {
  const lo = Math.min(...values, target ?? Infinity);
  const hi = Math.max(...values, target ?? -Infinity);
  const span = hi - lo || 1;
  const x = (i: number) => (i / Math.max(1, values.length - 1)) * 100;
  const y = (v: number) => 92 - ((v - lo) / span) * 84;
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <div className="relative" style={{ height }} aria-hidden="true">
      {target !== undefined && <span className="absolute inset-x-0 h-px bg-fg-faint/35" style={{ top: `${y(target)}%` }} />}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        initial={{ clipPath: "inset(-10% 100% -10% 0)" }}
        animate={{ clipPath: "inset(-10% 0% -10% 0)" }}
        transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </motion.svg>
      <span className="absolute size-2 -translate-x-1/2 -translate-y-1/2 animate-[fade_240ms_ease-out_0.5s_both] rounded-full ring-2 ring-surface" style={{ left: "100%", top: `${y(values.at(-1)!)}%`, background: color }} />
    </div>
  );
}
