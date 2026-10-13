"use client";

import { useState } from "react";
import { BriefcaseBusiness, Building2, ChartColumn, CircleDollarSign, Clock3, FileSignature, Handshake, Phone, PhoneCall, Send, Sprout, Target, Timer, UserMinus, UserRoundCheck, UsersRound, Waypoints } from "lucide-react";
import { ACTIVITY, CONVERSION, GROWTH, pct, ratio, REVENUE } from "@/lib/analytics";
import type { metricsFor, Range, Stage } from "@/lib/home";
import { money } from "@/lib/deal";
import { METRIC_ORDER, METRICS, MetricIcon, Trend, type MetricKind } from "../ui/metrics";
import { Segmented } from "../ui/menu";
import { AmaraButton, cx } from "../ui/primitives";
import { ColumnChart, LineChart } from "./charts";
import { Swap } from "../ui/swap";

const COLOR: Record<MetricKind, string> = {
  calls: "var(--color-calls)",
  submittals: "var(--color-submittals)",
  interviews: "var(--color-interviews)",
  offers: "var(--color-offers)",
  placements: "var(--color-placements)",
};

/** For measures where up is bad, say the direction in words rather than a green/red pill. */
const changeNote = (v: number) => `${v >= 0 ? "Up" : "Down"} ${Math.abs(v)}% on last period`;
const compact = (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`);
const count = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(Math.round(v)));

/** Home's Analytics tab: what the desk earns, how the funnel converts, and how it's growing. */
export function Analytics({
  stage,
  range,
  metrics,
  hidden,
  onAsk,
}: {
  stage: Stage;
  range: Range;
  metrics: ReturnType<typeof metricsFor>;
  hidden: boolean;
  onAsk: (prompt: string) => void;
}) {
  const empty = stage === "day1";
  return (
    <div data-tour="home-analytics" className="mt-4 space-y-4">
      <Revenue range={range} empty={empty} hidden={hidden} onAsk={onAsk} />
      <LeadGeneration range={range} metrics={metrics} empty={empty} hidden={hidden} onAsk={onAsk} />
      <Conversion range={range} empty={empty} hidden={hidden} onAsk={onAsk} />
      <Growth empty={empty} hidden={hidden} />
    </div>
  );
}

/* ── Sections ─────────────────────────────────────────────────────── */

function Revenue({ range, empty, hidden, onAsk }: { range: Range; empty: boolean; hidden: boolean; onAsk: (p: string) => void }) {
  const r = REVENUE[range];
  const revenue = r.revenue.reduce((s, p) => s + p.value, 0);
  const cost = r.cost.reduce((s, p) => s + p.value, 0);
  return (
    <Section icon={CircleDollarSign} title="Revenue" subtitle="Placement fees invoiced, against what the desk costs to run." action={!empty && <AmaraButton size="sm" onClick={() => onAsk("Which invoices should I chase?")}>Explain</AmaraButton>}>
      {empty ? (
        <EmptyChart body="Your first placement starts this chart. Most members get there in 6 to 8 weeks." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <LineChart
            label="Revenue and cost"
            hidden={hidden}
            format={compact}
            series={[
              { name: "Revenue", color: COLOR.placements, points: r.revenue },
              { name: "Cost", color: "var(--color-fg-muted)", points: r.cost },
            ]}
          />
          <dl className="grid grid-cols-3 gap-px self-start overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-1">
            <Figure label="Revenue" value={money(revenue, { compact: true })} change={r.change.revenue} hidden={hidden} bar="bg-placements" />
            <Figure label="Cost" value={money(cost, { compact: true })} hidden={hidden} bar="bg-fg-muted" note={`${changeNote(r.change.cost)} · ads, tools, data`} />
            <Figure label="Profit" value={money(revenue - cost, { compact: true })} change={r.change.profit} hidden={hidden} bar="bg-fg" note={`${pct(ratio(revenue - cost, revenue))} margin`} />
          </dl>
        </div>
      )}
    </Section>
  );
}

function LeadGeneration({ range, metrics, empty, hidden, onAsk }: { range: Range; metrics: ReturnType<typeof metricsFor>; empty: boolean; hidden: boolean; onAsk: (p: string) => void }) {
  const [kind, setKind] = useState<MetricKind>("calls");
  const v = (k: MetricKind) => metrics[k].value;
  const steps: [MetricKind, MetricKind, string][] = [
    ["submittals", "interviews", "Submittal to interview"],
    ["interviews", "offers", "Interview to offer"],
    ["offers", "placements", "Offer to placement"],
    ["submittals", "placements", "Submittal to placement"],
  ];
  return (
    <Section
      icon={Waypoints}
      title="Lead generation"
      subtitle="Your funnel activity, and how each stage turns into the next."
      action={!empty && <AmaraButton size="sm" onClick={() => onAsk("How am I tracking this month?")}>Explain</AmaraButton>}
    >
      {empty ? (
        <EmptyChart body="Your conversion rates appear once you've made a few calls and submittals." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="mb-4 overflow-x-auto">
              <Segmented label="Metric" value={kind} onChange={setKind} options={METRIC_ORDER.map((k) => ({ id: k, label: METRICS[k].label }))} />
            </div>
            <Swap id={`${kind}-${range}`}>
              <ColumnChart label={`${METRICS[kind].label} over time`} points={ACTIVITY[range][kind]} color={COLOR[kind]} format={count} hidden={hidden} />
            </Swap>
          </div>
          <ul className="grid gap-px self-start overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {steps.map(([from, to, label]) => {
              const rate = ratio(v(to), v(from));
              return (
                <li key={label} className="bg-surface px-4 py-4">
                  <div className="flex items-center gap-1.5 text-[12px] text-fg-muted">
                    <MetricIcon kind={from} size="sm" className="size-5 rounded-[5px]" />
                    <span aria-hidden="true" className="text-fg-faint">→</span>
                    <MetricIcon kind={to} size="sm" className="size-5 rounded-[5px]" />
                    <span className="ml-1 truncate">{label}</span>
                  </div>
                  <div className="mt-3 text-[26px] leading-none font-semibold tracking-[-0.02em]">{hidden ? "•••" : pct(rate)}</div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-strong">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(rate * 100)}%`, background: COLOR[to] }} />
                  </div>
                  <p className="mt-2 text-[11px] text-fg-faint">{hidden ? "•••" : rate ? `${(1 / rate).toFixed(1)} ${METRICS[from].label.toLowerCase()} per ${METRICS[to].label.toLowerCase().replace(/s$/, "")}` : "Nothing logged yet"}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Section>
  );
}

function Conversion({ range, empty, hidden, onAsk }: { range: Range; empty: boolean; hidden: boolean; onAsk: (p: string) => void }) {
  const c = CONVERSION[range];
  const totalCalls = c.callsByType.reduce((s, x) => s + x.value, 0);
  const maxType = Math.max(...c.callsByType.map((x) => x.value));
  return (
    <Section icon={Target} title="Conversion" subtitle="Calls and meetings, terms signed, and how well candidates stay with you." action={!empty && <AmaraButton size="sm" onClick={() => onAsk("Which prospects are closest to signing?")}>Explain</AmaraButton>}>
      {empty ? (
        <EmptyChart body="Calls, meetings and signed terms show up here as soon as you log them." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              <Figure icon={Phone} label="Calls made" value={count(totalCalls)} hidden={hidden} />
              <Figure icon={Clock3} label="Call time" value={`${Math.round(c.callMinutes / 60)}h ${c.callMinutes % 60}m`} change={c.change.callMinutes} hidden={hidden} />
              <Figure icon={Handshake} label="Client meetings" value={String(c.clientMeetings)} change={c.change.clientMeetings} hidden={hidden} />
              <Figure icon={UsersRound} label="Prospect meetings" value={String(c.prospectMeetings)} change={c.change.prospectMeetings} hidden={hidden} />
              <Figure icon={UserRoundCheck} label="Candidate retention" value={pct(c.retention)} change={c.change.retention} hidden={hidden} note="Still in role after 90 days" />
              <Figure icon={UserMinus} label="Candidates fallen off" value={String(c.fallenOff)} hidden={hidden} note={changeNote(c.change.fallenOff)} />
            </dl>
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              <RatioCard icon={FileSignature} label="Terms sent to signed" a={c.termsSigned} b={c.termsSent} hidden={hidden} detail={`${c.termsSigned} of ${c.termsSent} Terms of Business signed`} />
              <RatioCard icon={BriefcaseBusiness} label="Clients with roles open" a={c.clientsWithRoles} b={c.clients} hidden={hidden} detail={`${c.clientsWithRoles} of ${c.clients} clients are hiring with you`} />
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="mb-3 flex items-center gap-2 text-[12px] text-fg-muted">
              <PhoneCall className="size-3.5" strokeWidth={1.75} /> Calls by who you spoke to
            </h4>
            <ul className="space-y-3">
              {c.callsByType.map((t) => (
                <li key={t.label} className="grid grid-cols-[88px_minmax(0,1fr)_56px] items-center gap-3 text-[12px]">
                  <span className="text-fg-muted">{t.label}</span>
                  <span className="h-2 overflow-hidden rounded-r-[4px]">
                    <span className="block h-full rounded-r-[4px] bg-calls" style={{ width: `${(t.value / maxType) * 100}%` }} />
                  </span>
                  <span className="text-right font-mono text-fg num">{hidden ? "•••" : count(t.value)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-fg-faint">
              {hidden ? "•••" : `${pct(ratio(c.callsByType[1].value + c.callsByType[2].value, totalCalls))} of calls are business development.`} Healthy desks sit between 30% and 40%.
            </p>
          </div>
        </div>
      )}
    </Section>
  );
}

function Growth({ empty, hidden }: { empty: boolean; hidden: boolean }) {
  const pts = (values: number[]) => GROWTH.months.map((label, i) => ({ label, value: values[i] }));
  return (
    <Section icon={Sprout} title="Growth" subtitle="The last six months: new business, and how fast you fill roles.">
      {empty ? (
        <EmptyChart body="Growth trends need a few months of activity. Check back after your first quarter." />
      ) : (
        <div className="grid gap-x-8 gap-y-8 md:grid-cols-2 xl:grid-cols-4">
          <Mini icon={Building2} title="New clients" total={GROWTH.newClients.reduce((a, b) => a + b, 0)} hidden={hidden}>
            <ColumnChart label="New clients by month" points={pts(GROWTH.newClients)} color="var(--color-placements)" format={count} hidden={hidden} height={110} />
          </Mini>
          <Mini icon={BriefcaseBusiness} title="Roles opened" total={GROWTH.rolesOpened.reduce((a, b) => a + b, 0)} hidden={hidden}>
            <ColumnChart label="Roles opened by month" points={pts(GROWTH.rolesOpened)} color="var(--color-offers)" format={count} hidden={hidden} height={110} />
          </Mini>
          <Mini icon={Send} title="Days to first submittal" total={`${GROWTH.daysToSubmittal.at(-1)}d`} hidden={hidden} note="Lower is better">
            <LineChart label="Average days to first submittal" series={[{ name: "Days", color: "var(--color-submittals)", points: pts(GROWTH.daysToSubmittal) }]} format={(v) => `${v.toFixed(v < 10 ? 1 : 0)}d`} hidden={hidden} height={110} />
          </Mini>
          <Mini icon={Timer} title="Days to fill" total={`${GROWTH.daysToFill.at(-1)}d`} hidden={hidden} note="Lower is better">
            <LineChart label="Average days to fill a role" series={[{ name: "Days", color: "var(--color-placements)", points: pts(GROWTH.daysToFill) }]} format={(v) => `${Math.round(v)}d`} hidden={hidden} height={110} />
          </Mini>
        </div>
      )}
    </Section>
  );
}

/* ── Parts ────────────────────────────────────────────────────────── */

export function Section({ icon: Icon, title, subtitle, action, children }: { icon: typeof ChartColumn; title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
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

/** A labelled figure with an optional change pill. `change` is signed so that up is good. */
export function Figure({ label, value, change, hidden, note, bar, icon: Icon }: { label: string; value: string; change?: number; hidden: boolean; note?: string; bar?: string; icon?: typeof Phone }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <dt className="flex items-center gap-2 text-[12px] text-fg-muted">
        {bar && <span className={cx("h-3.5 w-1 rounded-full", bar)} />}
        {Icon && <Icon className="size-3.5 text-fg-faint" strokeWidth={1.75} />}
        {label}
      </dt>
      <dd className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className="text-[20px] leading-tight font-semibold tracking-[-0.02em]">{hidden ? "•••" : value}</span>
        {change !== undefined && !hidden && <Trend value={change} />}
      </dd>
      {note && <p className="mt-1 text-[11px] text-fg-faint">{note}</p>}
    </div>
  );
}

function RatioCard({ icon: Icon, label, a, b, detail, hidden }: { icon: typeof Phone; label: string; a: number; b: number; detail: string; hidden: boolean }) {
  const rate = ratio(a, b);
  return (
    <div className="bg-surface px-4 py-4">
      <div className="flex items-center gap-2 text-[12px] text-fg-muted">
        <Icon className="size-3.5" strokeWidth={1.75} /> {label}
      </div>
      <div className="mt-2 text-[22px] leading-none font-semibold tracking-[-0.02em]">{hidden ? "•••" : pct(rate)}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-strong">
        <div className="h-full rounded-full bg-fg-muted" style={{ width: `${Math.round(rate * 100)}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-fg-faint">{hidden ? "•••" : detail}</p>
    </div>
  );
}

function Mini({ icon: Icon, title, total, note, hidden, children }: { icon: typeof Phone; title: string; total: number | string; note?: string; hidden: boolean; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h4 className="flex items-center gap-2 text-[12px] text-fg-muted">
          <Icon className="size-3.5" strokeWidth={1.75} /> {title}
        </h4>
        <span className="text-[15px] font-semibold num">{hidden ? "•••" : total}</span>
      </div>
      {children}
      {note && <p className="mt-1 text-[10px] text-fg-faint">{note}</p>}
    </div>
  );
}

export function EmptyChart({ body }: { body: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-xl border border-dashed border-line-strong px-6 text-center">
      <p className="max-w-[40ch] text-[13px] leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
