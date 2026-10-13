"use client";

import { useState } from "react";
import { TableWorkspace } from "../ui/table-workspace";
import Link from "next/link";
import { ArrowUpRight, Check, Mail, MapPin, Send, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import type { Block, Reply } from "@/lib/amara-chat";
import { useDesk } from "@/lib/store";
import { StreamText } from "../ai/stream";
import { FitPill } from "../sourcing/parts";
import { METRICS, MetricIcon } from "../ui/metrics";
import { AmaraMark, Avatar, Button, cx } from "../ui/primitives";
import { aud } from "./overview";

export type Message = { id: string; role: "user"; text: string; context?: string } | { id: string; role: "amara"; reply: Reply };

const rise = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] as const } };

export function UserMessage({ text, context }: { text: string; context?: string }) {
  return (
    <motion.div {...rise} className="flex flex-col items-end gap-1.5">
      {context && <span className="text-[11px] text-fg-faint">on {context}</span>}
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-raised px-4 py-2.5 text-[15px] leading-relaxed text-fg">{text}</div>
    </motion.div>
  );
}

export function AmaraMessage({ reply, live, onDone, onFollowUp }: { reply: Reply; live: boolean; onDone: () => void; onFollowUp: (q: string) => void }) {
  // Messages that finished earlier render in full; only the newest one streams.
  const [done, setDone] = useState(!live);

  return (
    <motion.div {...rise} className="flex gap-3">
      <span className="amara-orb mt-1 size-6 shrink-0 rounded-full" style={done ? { animation: "none" } : undefined} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 text-[12px] font-medium amara-gradient-text">Amara</div>
        {done ? (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-fg/95">{reply.text}</p>
        ) : (
          <StreamText
            text={reply.text}
            delay={650}
            className="text-[15px] leading-relaxed text-fg/95"
            onDone={() => {
              setDone(true);
              onDone();
            }}
          />
        )}

        {done && reply.blocks.length > 0 && (
          <div className="mt-4 space-y-3">
            {reply.blocks.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: live ? 0.1 + i * 0.08 : 0 }}>
                <BlockView block={b} onFollowUp={onFollowUp} />
              </motion.div>
            ))}
          </div>
        )}

        {done && reply.followups.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: live ? 0.3 : 0 }} className="mt-4 flex flex-wrap gap-2">
            {reply.followups.map((f) => (
              <button
                key={f}
                onClick={() => onFollowUp(f)}
                className="rounded-full border border-line-strong px-3 py-1.5 text-[13px] text-fg-muted transition-colors hover:border-white/20 hover:bg-raised hover:text-fg"
              >
                {f}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function BlockView({ block: b, onFollowUp }: { block: Block; onFollowUp: (q: string) => void }) {
  if (b.type === "candidates") return <Candidates items={b.items} />;
  if (b.type === "drafts") return <Drafts items={b.items} more={b.more} onFollowUp={onFollowUp} />;
  if (b.type === "invoices") return <Invoices items={b.items} />;
  if (b.type === "metrics") return <Metrics rows={b.rows} />;
  if (b.type === "list") return <List items={b.items} />;
  return <Steps items={b.items} onFollowUp={onFollowUp} />;
}

const card = "rounded-2xl border border-line bg-surface";

function Candidates({ items }: { items: Extract<Block, { type: "candidates" }>["items"] }) {
  const { notify } = useDesk();
  const [added, setAdded] = useState<string[]>([]);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((c) => {
        const isAdded = added.includes(c.name);
        return (
          <div key={c.name} className={cx(card, "flex flex-col p-4")}>
            <div className="flex items-center gap-2.5">
              <Avatar name={c.name} />
              <div className="min-w-0">
                <div className="truncate text-[14px] text-fg">{c.name}</div>
                <div className="truncate text-[12px] text-fg-faint">{c.headline}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-fg-faint">
              <FitPill fit={c.fit} />
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {c.location}
              </span>
            </div>
            <p className="mt-3 flex-1 text-[13px] leading-relaxed text-fg-muted">{c.why}</p>
            <Button
              size="sm"
              variant={isAdded ? "ghost" : "secondary"}
              className="mt-4 w-full"
              onClick={() => {
                if (isAdded) return;
                setAdded((a) => [...a, c.name]);
                notify(`${c.name} added to your shortlist`);
              }}
            >
              {isAdded ? (
                <>
                  <Check className="size-3.5" /> Shortlisted
                </>
              ) : (
                <>
                  <UserPlus className="size-3.5" /> Shortlist
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function Drafts({ items, more, onFollowUp }: { items: Extract<Block, { type: "drafts" }>["items"]; more?: number; onFollowUp: (q: string) => void }) {
  const { notify } = useDesk();
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      {items.map((d) => {
        const isSent = sent.includes(d.company);
        return (
          <div key={d.company} className={cx(card, "overflow-hidden", isSent && "opacity-60")}>
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5 text-[12px] text-fg-muted">
              <Mail className="size-3.5 text-fg-faint" />
              <span className="inline-grid h-5 min-w-5 place-items-center rounded border border-line-strong px-1 text-[10px]">{d.initials}</span>
              {d.company}
              <span className="ml-auto text-[11px] text-fg-faint">AI draft · you send</span>
            </div>
            <div className="px-4 py-3">
              <div className="text-[14px] font-medium text-fg">{d.subject}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{d.body}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant={isSent ? "ghost" : "secondary"}
                  onClick={() => {
                    if (isSent) return;
                    setSent((s) => [...s, d.company]);
                    notify(`Sent to ${d.company}. Logged on the client.`);
                  }}
                >
                  {isSent ? (
                    <>
                      <Check className="size-3.5" /> Sent
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" /> Send
                    </>
                  )}
                </Button>
                {!isSent && (
                  <Button size="sm" variant="ghost" onClick={() => onFollowUp(`Make the ${d.company} email warmer`)}>
                    Rewrite
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {!!more && (
        <button onClick={() => onFollowUp("Draft the other five")} className="text-[13px] text-fg-muted underline-offset-4 hover:text-fg hover:underline">
          + {more} more ready to draft
        </button>
      )}
    </div>
  );
}

function Invoices({ items }: { items: Extract<Block, { type: "invoices" }>["items"] }) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <TableWorkspace title="Records"><div className={cx(card, "overflow-hidden")}>
      <table className="w-full text-[13px]">
        <tbody>
          {items.map((i) => (
            <tr key={i.client + i.date} className="relative border-b border-line bg-sent-row/50">
              <td className="relative py-2.5 pr-3 pl-4 text-fg">
                <span className="absolute inset-y-0 left-0 w-[3px] bg-sent" aria-hidden="true" />
                {i.client}
              </td>
              <td className="py-2.5 font-mono text-[11px] text-fg-muted">sent {i.date}</td>
              <td className="py-2.5 pr-4 text-right text-fg num">{aud(i.amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2.5 pl-4 text-fg-muted" colSpan={2}>
              Total to chase
            </td>
            <td className="py-2.5 pr-4 text-right font-semibold text-fg num">{aud(total)}</td>
          </tr>
        </tbody>
      </table>
    </div></TableWorkspace>
  );
}

function Metrics({ rows }: { rows: Extract<Block, { type: "metrics" }>["rows"] }) {
  return (
    <div className={cx(card, "space-y-3 p-4")}>
      {rows.map((r) => {
        const m = METRICS[r.kind];
        const pct = r.target ? Math.min(1, r.now / r.target) : 0;
        return (
          <div key={r.kind} className="grid grid-cols-[auto_96px_minmax(0,1fr)_72px] items-center gap-3 text-[13px]">
            <MetricIcon kind={r.kind} size="sm" />
            <span className="text-fg-muted">{m.label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-line-strong">
              <motion.span
                className={cx("block h-full rounded-full", m.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
              />
            </span>
            <span className="text-right text-fg num">
              {r.now}
              <span className="text-fg-faint"> / {r.target ?? "–"}</span>
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-fg-faint">This month against your targets</p>
    </div>
  );
}

function Steps({ items, onFollowUp }: { items: Extract<Block, { type: "steps" }>["items"]; onFollowUp: (q: string) => void }) {
  return (
    <ol className={cx(card, "divide-y divide-line overflow-hidden")}>
      {items.map((s, i) => (
        <li key={s.title}>
          <button onClick={() => onFollowUp(s.title)} className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-[11px] text-fg-muted">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] text-fg">{s.title}</span>
              <span className="block text-[12px] text-fg-faint">{s.detail}</span>
            </span>
            <AmaraMark className="h-2.5 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Rows Amara is pointing at. Linked rows open the record, so you can check her work. */
function List({ items }: { items: Extract<Block, { type: "list" }>["items"] }) {
  return (
    <ul className={cx(card, "divide-y divide-line overflow-hidden")}>
      {items.map((it, i) => {
        const body = (
          <>
            <span
              className={cx(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                it.tone === "warm" ? "bg-warm" : it.tone === "bad" ? "bg-bad" : it.tone === "good" ? "bg-good" : "bg-fg-faint",
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[14px] text-fg">{it.title}</span>
                {it.meta && <span className="shrink-0 text-[12px] text-fg-faint num">{it.meta}</span>}
              </span>
              {it.detail && <span className="mt-0.5 block text-[13px] leading-snug text-fg-muted">{it.detail}</span>}
            </span>
            {it.href && <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-fg-faint transition-colors group-hover:text-fg" />}
          </>
        );
        return (
          <li key={`${it.title}-${i}`}>
            {it.href ? (
              <Link href={it.href} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-raised">
                {body}
              </Link>
            ) : (
              <div className="flex items-start gap-3 px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
