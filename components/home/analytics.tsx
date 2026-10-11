"use client";

import { ChartColumn, Waypoints } from "lucide-react";
import type { metricsFor, Stage } from "@/lib/home";
import { METRIC_ORDER, METRICS, MetricIcon } from "../ui/metrics";
import { AmaraButton, cx } from "../ui/primitives";

const MONTHS = [
  { m: "May", fees: 78_000 },
  { m: "Jun", fees: 121_000 },
  { m: "Jul", fees: 96_000 },
  { m: "Aug", fees: 148_000 },
  { m: "Sep", fees: 171_000 },
  { m: "Oct", fees: 92_000 },
];

/** Home's Analytics tab: how the funnel converts, and what it earns. */
export function Analytics({
  stage,
  metrics,
  hidden,
  onAsk,
}: {
  stage: Stage;
  metrics: ReturnType<typeof metricsFor>;
  hidden: boolean;
  onAsk: (prompt: string) => void;
}) {
  const steps = METRIC_ORDER.slice(0, -1).map((k, i) => {
    const next = METRIC_ORDER[i + 1];
    return { from: k, to: next, rate: metrics[k].value ? metrics[next].value / metrics[k].value : 0 };
  });
  const maxFees = Math.max(...MONTHS.map((x) => x.fees));
  const empty = stage === "day1";

  return (
    <div data-tour="home-analytics" className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card
        icon={Waypoints}
        title="Conversion"
        subtitle="How each stage turns into the next."
        action={!empty && <AmaraButton size="sm" onClick={() => onAsk("How am I tracking this month?")}>Explain</AmaraButton>}
      >
        {empty ? (
          <EmptyChart body="Your conversion rates appear once you've made a few calls and submittals." />
        ) : (
          <ul className="space-y-4">
            {steps.map((s) => (
              <li key={s.from} className="grid grid-cols-[minmax(0,170px)_minmax(0,1fr)_48px] items-center gap-4 text-[13px]">
                <span className="flex min-w-0 items-center gap-2 text-fg-muted">
                  <MetricIcon kind={s.from} size="sm" className="size-6 rounded-md" />
                  <span aria-hidden="true">→</span>
                  <MetricIcon kind={s.to} size="sm" className="size-6 rounded-md" />
                  <span className="truncate">{METRICS[s.to].label}</span>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-line-strong">
                  <span className={cx("block h-full rounded-full", METRICS[s.to].bar)} style={{ width: `${Math.round(s.rate * 100)}%` }} />
                </span>
                <span className="text-right text-fg num">{hidden ? "•" : `${Math.round(s.rate * 100)}%`}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        icon={ChartColumn}
        title="Fees placed by month"
        subtitle="Placement fees, last six months."
        action={!empty && <AmaraButton size="sm" onClick={() => onAsk("Which invoices should I chase?")}>Explain</AmaraButton>}
      >
        {empty ? (
          <EmptyChart body="Your first placement starts this chart. Most members get there in 6 to 8 weeks." />
        ) : (
          <div className="flex h-48 items-end gap-3" role="img" aria-label="Fees placed by month, May to October">
            {MONTHS.map((x) => (
              <div key={x.m} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] text-fg-muted num">{hidden ? "•" : `$${Math.round(x.fees / 1000)}k`}</span>
                <span className="w-full rounded-t-md bg-placements/80" style={{ height: `${(x.fees / maxFees) * 140}px` }} />
                <span className="text-[12px] text-fg-faint">{x.m}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: typeof ChartColumn;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <header className="flex items-start gap-2.5 border-b border-line px-5 py-4">
        <Icon className="mt-0.5 size-[18px] text-fg-muted" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-medium">{title}</h3>
          <p className="mt-0.5 text-[12px] text-fg-faint">{subtitle}</p>
        </div>
        {action}
      </header>
      <div className="px-5 py-6">{children}</div>
    </section>
  );
}

function EmptyChart({ body }: { body: string }) {
  return (
    <div className="grid h-48 place-items-center rounded-xl border border-dashed border-line-strong px-6 text-center">
      <p className="max-w-[34ch] text-[13px] leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
