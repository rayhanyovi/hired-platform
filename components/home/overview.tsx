"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  ListChecks,
  Plus,
  Receipt,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trophy,
} from "lucide-react";
import {
  FIRST_STEPS,
  INVOICE_SUMMARY,
  INVOICE_TOTAL,
  INVOICES,
  NETWORK_BOARD,
  TASKS,
  TEAM_BOARD,
  type Invoice,
  type LeaderRow,
  type Stage,
} from "@/lib/home";
import { clientIdFor } from "@/lib/agency";
import { useDesk } from "@/lib/store";
import { initials } from "@/lib/deal";
import {
  METRIC_ORDER,
  METRICS,
  MetricIcon,
  type MetricKind,
} from "../ui/metrics";
import { AmaraButton, AmaraTag, cx } from "../ui/primitives";

/* ── Shared ────────────────────────────────────────────────────────── */

/** Australian dollars written the way Amara shows them: A$13,750.00 */
export const aud = (n: number, cents = true) =>
  "A$" +
  n.toLocaleString("en-AU", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

/** Numbers that can be hidden with the eye toggle, for screen-sharing. */
export function Num({
  hidden,
  children,
  className,
}: {
  hidden: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("num", className)}>{hidden ? "•••" : children}</span>
  );
}

/** Hands a question to Amara. The dashboard is a launchpad into the Ask HeyAmara drawer. */
export function AskButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <AmaraButton size="sm" onClick={onClick} className={className}>
      {children}
    </AmaraButton>
  );
}

function Panel({
  icon: Icon,
  title,
  count,
  actions,
  children,
  className,
  dataTour,
}: {
  icon: typeof Receipt;
  title: string;
  count?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dataTour?: string;
}) {
  return (
    <section
      data-tour={dataTour}
      className={cx(
        "flex max-h-[520px] min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface lg:h-[440px]",
        className,
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4">
        <Icon className="size-[18px] text-fg-muted" strokeWidth={1.75} />
        <h2 className="text-[14px] font-medium">{title}</h2>
        {count !== undefined && (
          <span className="text-[13px] text-fg-faint num">{count}</span>
        )}
        <div className="ml-auto flex items-center gap-1.5">{actions}</div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

function Empty({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof Receipt;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid h-full place-items-center px-6 py-10 text-center">
      <div>
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-line-strong bg-raised">
          <Icon className="size-5 text-fg-muted" strokeWidth={1.75} />
        </span>
        <p className="text-[14px] font-medium text-fg">{title}</p>
        <p className="mx-auto mt-1 max-w-[30ch] text-[13px] leading-relaxed text-fg-muted">
          {body}
        </p>
        {children && <div className="mt-4 flex justify-center">{children}</div>}
      </div>
    </div>
  );
}

/* ── Metrics ───────────────────────────────────────────────────────── */

export function MetricsRow({
  values,
  stage,
  hidden,
  onAsk,
}: {
  values: Record<
    MetricKind,
    { value: number; target?: number; change: number }
  >;
  stage: Stage;
  hidden: boolean;
  onAsk: (prompt: string) => void;
}) {
  return (
    <div
      data-tour="home-metrics"
      className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-line [gap:1px] sm:grid-cols-6 lg:grid-cols-5"
    >
      {METRIC_ORDER.map((k, i) => {
        const v = values[k];
        const m = METRICS[k];
        return (
          <div
            key={k}
            className={cx(
              "group flex flex-col bg-surface px-5 pt-4 pb-5 transition-colors hover:bg-raised/40 lg:col-span-1",
              // 2 columns on phones, 3 + 2 on tablets, 5 across on desktop: no empty cells.
              i < 3 ? "sm:col-span-2" : "sm:col-span-3",
              i === 4 && "col-span-2",
            )}
          >
            {/* 1. What it is: small and quiet. */}
            <div className="flex h-7 items-center gap-2">
              <MetricIcon kind={k} size="sm" className="size-6 rounded-md" />
              <span className="text-[13px] text-fg-muted">{m.label}</span>
              <AmaraButton
                size="sm"
                onClick={() =>
                  onAsk(
                    stage === "day1"
                      ? `What's a good weekly target for ${m.label.toLowerCase()}?`
                      : `How are my ${m.label.toLowerCase()} tracking?`,
                  )
                }
                aria-label={`Ask Amara about ${m.label.toLowerCase()}`}
                className="ml-auto px-2 transition-[opacity,background-color] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
              >
                <span className="hidden xl:inline">Ask</span>
              </AmaraButton>
            </div>
            {/* 2. The number: the loudest thing in the card. */}
            <Num
              hidden={hidden}
              className={cx(
                "mt-3 text-[32px] leading-none font-semibold tracking-[-0.03em]",
                stage === "day1" && "text-fg-faint",
              )}
            >
              {v.value.toLocaleString("en-AU")}
            </Num>
            {/* 3. Context: one quiet line. */}
            <span className="mt-2 text-[12px] text-fg-faint">
              {stage === "day1" ? (
                "No activity yet"
              ) : hidden ? (
                "•••"
              ) : (
                <>
                  <span
                    className={cx(
                      "num",
                      v.change >= 0 ? "text-good" : "text-bad",
                    )}
                  >
                    {v.change >= 0 ? "▲" : "▼"} {Math.abs(v.change)}%
                  </span>{" "}
                  vs last period
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Tasks ─────────────────────────────────────────────────────────── */

const PRIORITY_ICON = { 3: SignalHigh, 2: SignalMedium, 1: SignalLow } as const;

export function TasksPanel({
  stage,
  onAsk,
}: {
  stage: Stage;
  onAsk: (prompt: string) => void;
}) {
  const [done, setDone] = useState<string[]>([]);

  if (stage === "day1") {
    return (
      <Panel
        icon={ListChecks}
        title="First steps"
        count={`${done.length}/${FIRST_STEPS.length}`}
        dataTour="home-tasks"
      >
        <ol className="divide-y divide-line">
          {FIRST_STEPS.map((s, i) => {
            const isDone = done.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setDone((d) => (d.includes(s.id) ? d : [...d, s.id]));
                    onAsk(s.prompt);
                  }}
                  className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-raised"
                >
                  <span
                    className={cx(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[11px]",
                      isDone
                        ? "border-transparent bg-placements text-white"
                        : "border-line-strong text-fg-muted",
                    )}
                  >
                    {isDone ? (
                      <Check className="size-3.5" strokeWidth={2.5} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cx(
                        "block text-[14px]",
                        isDone ? "text-fg-muted line-through" : "text-fg",
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-fg-faint">
                      {s.detail}
                    </span>
                  </span>
                  <AmaraTag className="opacity-0 transition-opacity group-hover:opacity-100">
                    Start
                  </AmaraTag>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>
    );
  }

  const open = TASKS.filter((t) => !done.includes(t.id));
  return (
    <Panel
      icon={ListChecks}
      title="Tasks"
      count={open.length}
      dataTour="home-tasks"
      actions={
        open.length > 0 && (
          <AskButton
            onClick={() => onAsk("Draft follow-ups for my 8 quiet clients")}
          >
            Draft all {open.length}
          </AskButton>
        )
      }
    >
      {open.length === 0 ? (
        <Empty
          icon={ListChecks}
          title="All caught up"
          body="No follow-ups due. Amara will add tasks when a client goes quiet."
        />
      ) : (
        <ul className="divide-y divide-line">
          {TASKS.map((t) => {
            const isDone = done.includes(t.id);
            const P = PRIORITY_ICON[t.priority];
            return (
              <li
                key={t.id}
                className={cx(
                  "group flex items-start gap-3 px-4 py-3 transition-[opacity,background-color] hover:bg-raised/50",
                  isDone && "opacity-40",
                )}
              >
                <button
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={`Done: follow up ${t.company}`}
                  onClick={() =>
                    setDone((d) =>
                      isDone ? d.filter((x) => x !== t.id) : [...d, t.id],
                    )
                  }
                  className={cx(
                    "mt-px grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
                    isDone
                      ? "border-transparent bg-placements text-white"
                      : "border-line-strong hover:border-fg/40",
                  )}
                >
                  {isDone && <Check className="size-3" strokeWidth={3} />}
                </button>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="inline-grid h-5 min-w-5 shrink-0 place-items-center rounded border border-line-strong px-1 text-[10px] text-fg-muted">
                      {t.initials}
                    </span>
                    <span
                      className={cx(
                        "truncate text-[13px] text-fg",
                        isDone && "line-through",
                      )}
                    >
                      {t.company}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-fg-faint">
                    <P
                      className={cx(
                        "size-3.5 shrink-0",
                        t.priority === 3 ? "text-fg-muted" : "text-fg-faint",
                      )}
                      aria-label={`Priority ${t.priority}`}
                    />
                    <span className="truncate">Follow up · {t.detail}</span>
                  </span>
                </span>
                {/* On desktop the age gives way to "Draft" on hover; on touch screens both show. */}
                <span className="flex shrink-0 items-center gap-2 self-start lg:relative">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 pt-0.5 text-[12px] text-bad transition-opacity",
                      !isDone &&
                        "lg:group-hover:opacity-0 lg:group-focus-within:opacity-0",
                    )}
                  >
                    <CircleAlert className="size-3.5" /> {t.daysAgo}d ago
                  </span>
                  {!isDone && (
                    <span className="transition-opacity lg:absolute lg:top-1/2 lg:right-0 lg:-translate-y-1/2 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                      <AmaraButton
                        size="sm"
                        onClick={() =>
                          onAsk(`Draft a follow-up to ${t.company}`)
                        }
                        aria-label={`Draft a follow-up to ${t.company}`}
                        title={`Draft a follow-up to ${t.company}`}
                        className="px-2 lg:px-2.5"
                      >
                        <span className="hidden lg:inline">Draft</span>
                      </AmaraButton>
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ── Invoices ──────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<
  Invoice["status"],
  { edge: string; chip: string; label: string }
> = {
  draft: {
    edge: "bg-fg-faint",
    chip: "bg-draft-chip text-fg-muted",
    label: "Draft",
  },
  sent: {
    edge: "bg-sent",
    chip: "bg-sent-chip text-[#c3d2ff]",
    label: "Sent",
  },
  paid: {
    edge: "bg-paid",
    chip: "bg-paid-chip text-[#c8f0cc]",
    label: "Paid",
  },
  overdue: {
    edge: "bg-bad",
    chip: "bg-bad-wash text-bad",
    label: "Overdue",
  },
};

/** One invoice line. On Home it names the client and links to them; on a client page it shows the date instead. */
export function InvoiceRow({
  invoice: inv,
  hidden = false,
  showClient = true,
}: {
  invoice: Invoice;
  hidden?: boolean;
  showClient?: boolean;
}) {
  const st = STATUS_STYLE[inv.status];
  return (
    <li
      className="relative flex items-center gap-3 border-b border-line bg-surface py-2.5 pr-3 pl-4 text-[13px] last:border-0"
    >
      <span
        className={cx("absolute inset-y-0 left-0 w-[3px]", st.edge)}
        aria-hidden="true"
      />
      {showClient ? (
        <Link
          href={`/clients/${clientIdFor(inv.client)}#invoices`}
          className="min-w-0 flex-1 truncate text-fg underline-offset-4 hover:underline"
        >
          {inv.client}
        </Link>
      ) : (
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-fg-muted">
          {inv.date}
        </span>
      )}
      {showClient && (
        <span className="hidden font-mono text-[11px] text-fg-muted sm:inline">
          {inv.date}
        </span>
      )}
      <Num hidden={hidden} className="w-24 text-right text-fg">
        {aud(inv.amount)}
      </Num>
      <span
        className={cx(
          "w-16 rounded-md px-2 py-0.5 text-center text-[11px]",
          st.chip,
        )}
      >
        {st.label}
      </span>
    </li>
  );
}

export function InvoicesPanel({
  stage,
  hidden,
  onAsk,
}: {
  stage: Stage;
  hidden: boolean;
  onAsk: (prompt: string) => void;
}) {
  return (
    <Panel
      icon={Receipt}
      title="Invoices"
      count={stage === "day1" ? 0 : INVOICE_TOTAL}
      dataTour="home-invoices"
      actions={
        <>
          {stage === "day30" && (
            <AskButton onClick={() => onAsk("Which invoices should I chase?")}>
              Chase
            </AskButton>
          )}
          <Link
            href="/documents"
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus className="size-3.5" /> New invoice
          </Link>
        </>
      }
    >
      {stage === "day1" ? (
        <Empty
          icon={Receipt}
          title="No invoices yet"
          body="Your first placement creates one, filled in from the deal. You'll never re-type a salary."
        >
          <AskButton onClick={() => onAsk("How do fees and rebates work?")}>
            How do fees work?
          </AskButton>
        </Empty>
      ) : (
        <>
          <dl className="grid grid-cols-3 border-b border-line">
            {(
              [
                ["Draft", INVOICE_SUMMARY.draft, "bg-fg-faint"],
                ["Outstanding", INVOICE_SUMMARY.outstanding, "bg-sent"],
                ["Overdue", INVOICE_SUMMARY.overdue, "bg-bad"],
              ] as const
            ).map(([label, s, bar], i) => (
              <div
                key={label}
                className={cx("px-4 py-3", i > 0 && "border-l border-line")}
              >
                <dt className="flex items-center gap-1.5 text-[11px] text-fg-muted">
                  <span className={cx("h-3 w-[3px] rounded-full", bar)} />
                  {label}
                  <span className="text-fg-faint num">· {s.count}</span>
                </dt>
                <dd className="mt-1 truncate text-[15px] font-semibold tracking-[-0.01em]">
                  <Num hidden={hidden}>
                    {s.amount >= 1_000_000
                      ? `A$${(s.amount / 1_000_000).toFixed(2)}m`
                      : aud(s.amount, false)}
                  </Num>
                </dd>
              </div>
            ))}
          </dl>
          <ul>
            {INVOICES.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} hidden={hidden} />
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

/* ── Leaderboard ───────────────────────────────────────────────────── */

export function LeaderboardPanel({
  stage,
  hidden,
  onAsk,
}: {
  stage: Stage;
  hidden: boolean;
  onAsk: (prompt: string) => void;
}) {
  const { setTeamView } = useDesk();
  // A brand-new solo desk has no team to rank against, so default to the network.
  const [board, setBoard] = useState<"team" | "network">(
    stage === "day1" ? "network" : "team",
  );
  const rows =
    board === "team"
      ? stage === "day1"
        ? []
        : TEAM_BOARD
      : stage === "day1"
        ? NETWORK_BOARD.filter((r) => !r.you)
        : NETWORK_BOARD;

  return (
    <Panel
      icon={Trophy}
      title="Leaderboard"
      dataTour="home-leaderboard"
      actions={
        <>
          <Link
            href="/team"
            onClick={() => setTeamView("leaderboard")}
            className="text-[12px] text-fg-faint transition-colors hover:text-fg"
          >
            See all
          </Link>
          <div
            className="inline-flex rounded-lg border border-line bg-ink-sunken p-0.5"
            role="tablist"
            aria-label="Leaderboard"
          >
            {(["team", "network"] as const).map((b) => (
              <button
                key={b}
                role="tab"
                aria-selected={board === b}
                onClick={() => setBoard(b)}
                className={cx(
                  "h-6 rounded-md px-2.5 text-[12px] capitalize transition-colors",
                  board === b
                    ? "bg-raised text-fg"
                    : "text-fg-faint hover:text-fg-muted",
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty
          icon={Trophy}
          title="No team leaderboard yet"
          body="It fills in as your team logs calls and placements. See how the network is doing meanwhile."
        >
          <button
            onClick={() => setBoard("network")}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-line-strong bg-raised px-2.5 text-[12px] text-fg hover:bg-hover"
          >
            View network <ArrowUpRight className="size-3" />
          </button>
        </Empty>
      ) : (
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line">
              <th className="w-8 py-2.5 pl-4 text-left text-[11px] font-normal text-fg-faint">
                #
              </th>
              <th className="py-2.5 text-left text-[11px] font-normal text-fg-faint">
                Name
              </th>
              {METRIC_ORDER.map((k) => (
                <th key={k} className="w-8 py-2.5 text-center">
                  <MetricIcon
                    kind={k}
                    size="sm"
                    className="mx-auto size-6 rounded-md"
                  />
                </th>
              ))}
              <th className="w-14 py-2.5 pr-4 text-right text-[11px] font-normal text-fg-faint">
                $
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <Row key={r.name + i} rank={i + 1} row={r} hidden={hidden} />
            ))}
            {stage === "day1" && board === "network" && (
              <tr className="bg-raised/60">
                <td className="py-3 pl-4 font-mono text-[12px] text-fg-faint">
                  —
                </td>
                <td className="py-3" colSpan={7}>
                  <span className="flex items-center justify-between gap-3 pr-4">
                    <span className="text-[13px] text-fg">
                      You{" "}
                      <span className="text-fg-faint">· not ranked yet</span>
                    </span>
                    <AskButton
                      onClick={() => onAsk("What does a good week look like?")}
                    >
                      Get on the board
                    </AskButton>
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function Row({
  rank,
  row,
  hidden,
}: {
  rank: number;
  row: LeaderRow;
  hidden: boolean;
}) {
  return (
    <tr
      className={cx(
        "border-b border-line last:border-0",
        row.you && "bg-raised/70",
      )}
    >
      <td className="py-2.5 pl-4 font-mono text-[12px] text-fg-faint">
        {rank}
      </td>
      <td className="max-w-0 py-2.5 pr-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-line-strong bg-raised text-[9px] text-fg-muted">
            {initials(row.name)}
          </span>
          <span className="min-w-0 truncate">
            <span className="text-fg">{row.you ? "You" : row.name}</span>
            <span className="ml-1.5 text-[11px] text-fg-faint num">
              {row.score}
            </span>
          </span>
        </span>
      </td>
      {METRIC_ORDER.map((k) => (
        <td
          key={k}
          className="py-2.5 text-center font-mono text-[12px] text-fg-muted"
        >
          <Num hidden={hidden}>{row.stats[k]}</Num>
        </td>
      ))}
      <td className="py-2.5 pr-4 text-right font-mono text-[12px] text-fg">
        <Num hidden={hidden}>
          {row.billed ? `$${Math.round(row.billed / 1000)}k` : "$0"}
        </Num>
      </td>
    </tr>
  );
}
