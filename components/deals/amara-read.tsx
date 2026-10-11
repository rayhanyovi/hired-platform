"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { useDesk } from "@/lib/store";
import type { Deal } from "@/lib/types";
import { AmaraByline, StreamText } from "../ai/stream";
import { AmaraButton, Button, cx } from "../ui/primitives";

/** Amara's take on a deal, plus the one next move it would make. */
export function AmaraRead({ deal }: { deal: Deal }) {
  const { logTouch, notify } = useDesk();
  const [draftRun, setDraftRun] = useState(0);
  const [draftDone, setDraftDone] = useState(false);

  const markDone = () => {
    logTouch(deal.id, { kind: deal.next.kind === "call" ? "call" : "email", text: deal.next.label });
    setDraftRun(0);
    setDraftDone(false);
    notify(`Logged. ${deal.candidate.name.split(" ")[0]}'s deal is fresh again.`);
  };

  return (
    <div className="amara-edge rounded-xl bg-[linear-gradient(180deg,rgb(139_92_246/0.07),transparent_60%)] p-5">
      <AmaraByline>Amara&apos;s read</AmaraByline>
      <p className="mt-3 text-[14px] leading-relaxed text-fg">{deal.read}</p>

      <ul className="mt-4 space-y-1.5">
        {deal.signals.map((s) => (
          <li key={s} className="flex gap-2.5 text-[12.5px] text-fg-muted">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-amara-soft/70" />
            {s}
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2.5 text-[11px] tracking-[0.06em] text-fg-faint uppercase">Next move</div>
        {draftRun === 0 ? (
          <AmaraButton size="lg" onClick={() => setDraftRun(1)} className="w-full">
            <span className="flex-1 truncate text-left">{deal.next.label}</span>
            <span className="text-[12px] text-fg-faint">{deal.next.kind === "call" ? "Prep notes" : "Draft it"}</span>
          </AmaraButton>
        ) : (
          <div>
            <div className="mb-3 text-[13px] font-medium text-fg">{deal.next.label}</div>
            <div className="rounded-lg border border-line bg-ink-sunken p-4 text-[13px] leading-[1.65] text-fg-muted">
              <StreamText key={draftRun} text={deal.next.output} delay={600} onDone={() => setDraftDone(true)} />
            </div>
            <div className={cx("mt-3 flex flex-wrap gap-2 transition-opacity", draftDone ? "opacity-100" : "pointer-events-none opacity-0")}>
              <Button variant="primary" size="sm" onClick={markDone}>
                <Check className="size-3.5" /> {deal.next.kind === "call" ? "Done, log the call" : "Sent, log it"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(deal.next.output);
                  notify("Copied to clipboard");
                }}
              >
                <Copy className="size-3.5" /> Copy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraftDone(false);
                  setDraftRun((n) => n + 1);
                }}
              >
                <RotateCcw className="size-3.5" /> Rewrite
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
