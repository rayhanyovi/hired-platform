"use client";

import { CalendarCheck, CalendarClock, Goal, Handshake, MessagesSquare, Phone, PhoneCall, PhoneIncoming, Target, UserPlus, UserRoundCheck, Wallet } from "lucide-react";
import { TableWorkspace } from "../ui/table-workspace";
import { pct, ratio, SALES, SALES_TARGETS } from "@/lib/analytics";
import { money } from "@/lib/deal";
import type { Range, Stage } from "@/lib/home";
import { memberName } from "@/lib/store";
import { ActorAvatar } from "../ui/member";
import { ChangeLine, StatCard, StatRow, Trend } from "../ui/metrics";
import { AmaraButton, cx } from "../ui/primitives";
import { EmptyChart, Section } from "./analytics";
import { Sparkline } from "./charts";

type TrendKey = keyof (typeof SALES)["month"]["trend"];
type Rate = [TrendKey, string, number, typeof Phone];

/**
 * Sales: winning clients, not placing candidates. Setters dial and book
 * calls with prospects; closers run those calls and sign Terms of Business.
 */
export function Sales({ stage, range, hidden, onAsk }: { stage: Stage; range: Range; hidden: boolean; onAsk: (p: string) => void }) {
  const s = SALES[range];
  const empty = stage === "day1";
  const mask = (v: string) => (hidden ? "•••" : v);
  const kpis = [
    { label: "Dials", value: s.dials, change: s.change.dials, icon: Phone, tile: "bg-calls-tile" },
    { label: "Calls booked", value: s.booked, change: s.change.booked, icon: CalendarCheck, tile: "bg-submittals-tile" },
    { label: "Showed", value: s.showed, change: s.change.showed, icon: UserRoundCheck, tile: "bg-interviews-tile" },
    { label: "Sales", value: s.sales, change: s.change.sales, icon: Handshake, tile: "bg-offers-tile" },
    { label: "Clients onboarded", value: s.onboarded, change: s.change.onboarded, icon: UserPlus, tile: "bg-placements-tile" },
  ];
  const closing: Rate[] = [
    ["show", "Show rate", ratio(s.showed, s.booked), UserRoundCheck],
    ["close", "Close rate", ratio(s.sales, s.closers.reduce((n, c) => n + c.pitched, 0)), Handshake],
    ["slots", "Slots used", ratio(s.booked, s.closers.reduce((n, c) => n + c.slots, 0)), CalendarClock],
    ["bookedToSale", "Booked to sale", ratio(s.sales, s.booked), Target],
  ];
  const setPickups = s.setters.reduce((n, x) => n + x.pickups, 0);
  const setTalks = s.setters.reduce((n, x) => n + x.talks30, 0);
  const setBooked = s.setters.reduce((n, x) => n + x.booked, 0);
  const setting: Rate[] = [
    ["pickup", "Pickup rate", ratio(setPickups, s.dials), PhoneIncoming],
    ["pickupToTalk", "Pickup to talk", ratio(setTalks, setPickups), MessagesSquare],
    ["talkToBooking", "Talk to booking", ratio(setBooked, setTalks), CalendarCheck],
    ["show", "Show rate", ratio(s.setters.reduce((n, x) => n + x.showed, 0), setBooked), UserRoundCheck],
  ];

  return (
    <div data-tour="home-sales" className="mt-4 space-y-4">
      <StatRow>
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            icon={k.icon}
            tile={k.tile}
            label={k.label}
            faint={empty}
            value={empty ? 0 : mask(k.value.toLocaleString("en-AU"))}
            sub={empty ? "No activity yet" : <ChangeLine value={k.change} hidden={hidden} />}
          />
        ))}
      </StatRow>

      {empty ? (
        <Section icon={Handshake} title="Sales" subtitle="Calls booked with prospects, and the Terms of Business they turn into.">
          <EmptyChart body="Book your first call with a prospect from Prospects. Sales numbers start there." />
        </Section>
      ) : (
        <>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            <div className="bg-surface px-5 py-4">
              <div className="flex items-center gap-2 text-[12px] text-fg-muted">
                <Wallet className="size-3.5" strokeWidth={1.75} /> Cash in <span className="text-fg-faint">· {s.sales} sales</span>
              </div>
              <div className="mt-1.5 text-[24px] font-semibold tracking-[-0.02em]">{mask(money(s.cash))}</div>
            </div>
            <div className="bg-surface px-5 py-4">
              <div className="flex items-center justify-between gap-2 text-[12px] text-fg-muted">
                <span className="flex items-center gap-2">
                  <Goal className="size-3.5" strokeWidth={1.75} /> Against target
                </span>
                <span className="font-mono text-fg-faint num">{mask(`${money(s.cash, { compact: true })} / ${money(s.target, { compact: true })}`)}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-strong">
                <div className="h-full rounded-full bg-placements" style={{ width: `${Math.min(100, ratio(s.cash, s.target) * 100)}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-fg-faint">{mask(`${pct(ratio(s.cash, s.target))} of target · ${money(s.target - s.cash, { compact: true })} to go`)}</p>
            </div>
          </div>

          <Section icon={Handshake} title="Closing" subtitle="Calls your closers ran with prospects, and how many signed." action={<AmaraButton size="sm" onClick={() => onAsk("Which prospects are closest to signing?")}>Explain</AmaraButton>}>
            <RateCards items={closing} trend={s.trend} hidden={hidden} />
            <Table
              head={["Open slots", "Booked", "Showed", "Show rate", "Slots used", "Pitched", "Sales", "Close rate", "Cash"]}
              rows={s.closers.map((c) => ({
                id: c.id,
                cells: [
                  String(c.slots),
                  String(c.booked),
                  String(c.showed),
                  rate(ratio(c.showed, c.booked), SALES_TARGETS.show),
                  rate(ratio(c.booked, c.slots), SALES_TARGETS.slots),
                  String(c.pitched),
                  String(c.sales),
                  rate(ratio(c.sales, c.pitched), SALES_TARGETS.close),
                  money(c.cash, { compact: true }),
                ],
              }))}
              hidden={hidden}
            />
          </Section>

          <Section icon={PhoneCall} title="Setting" subtitle="Dials to prospects, and the calls they turn into for closers.">
            <RateCards items={setting} trend={s.trend} hidden={hidden} />
            <Table
              head={["Dials", "Pickups", "Pickup rate", "Talks 30s+", "Talks 5m+", "Booked", "Showed", "Dials / hr", "Hours"]}
              rows={s.setters.map((x) => ({
                id: x.id,
                cells: [
                  x.dials.toLocaleString("en-AU"),
                  String(x.pickups),
                  rate(ratio(x.pickups, x.dials), SALES_TARGETS.pickup),
                  String(x.talks30),
                  String(x.talks5m),
                  String(x.booked),
                  String(x.showed),
                  (x.dials / x.hours).toFixed(1),
                  `${x.hours}h`,
                ],
              }))}
              hidden={hidden}
            />
          </Section>
        </>
      )}
    </div>
  );
}

/** Compare what's shown, so a rounded 40% never reads as missing a 40% target. */
const belowTarget = (v: number, target: number) => Math.round(v * 100) < Math.round(target * 100);

/** "38%", with a marker when it's below target so the cell can read amber. */
const rate = (v: number, target: number) => `${pct(v)}${belowTarget(v, target) ? "!" : ""}`;

function RateCards({ items, trend, hidden }: { items: Rate[]; trend: (typeof SALES)["month"]["trend"]; hidden: boolean }) {
  return (
    <div className="mb-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([key, label, value, Icon]) => {
        const target = SALES_TARGETS[key];
        const below = belowTarget(value, target);
        const t = trend[key];
        const change = t.length > 1 && t[0] ? ((t.at(-1)! - t[0]) / t[0]) * 100 : 0;
        return (
          <div key={label} className="bg-surface px-4 pt-4 pb-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[12px] text-fg-muted">
                <Icon className="size-3.5" strokeWidth={1.75} /> {label}
              </span>
              {!hidden && <Trend value={change} />}
            </div>
            <div className={cx("mt-1.5 text-[24px] leading-tight font-semibold tracking-[-0.02em]", below && !hidden && "text-warm")}>{hidden ? "•••" : pct(value)}</div>
            <div className="mt-3">
              <Sparkline values={t} target={target} color={below ? "var(--color-warm)" : "var(--color-fg-muted)"} height={44} />
            </div>
            <p className="mt-2 text-[11px] text-fg-faint">
              Target ≥ {pct(target)}
              {below && !hidden && <span className="text-warm"> · below</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Table({ head, rows, hidden }: { head: string[]; rows: { id: string; cells: string[] }[]; hidden: boolean }) {
  return (
    <TableWorkspace title="Sales"><div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[760px] text-left text-[12px]">
        <thead>
          <tr className="border-b border-line bg-ink-sunken/60 text-[11px] text-fg-faint">
            <th className="px-4 py-2 font-normal">#</th>
            <th className="px-2 py-2 font-normal">Name</th>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-right font-normal whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={r.id} className="transition-colors hover:bg-raised/40">
              <td className="px-4 py-2.5 font-mono text-fg-faint">{i + 1}</td>
              <td className="px-2 py-2.5">
                <span className="flex items-center gap-2 text-[13px] whitespace-nowrap text-fg">
                  <ActorAvatar id={r.id} size="xs" /> {memberName(r.id)}
                </span>
              </td>
              {r.cells.map((c, j) => {
                const below = c.endsWith("!");
                return (
                  <td key={j} className={cx("px-3 py-2.5 text-right font-mono num", below ? "text-warm" : "text-fg")}>
                    {hidden ? "•••" : c.replace("!", "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div></TableWorkspace>
  );
}
