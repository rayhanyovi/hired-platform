"use client";

import { ArrowRight, BadgeCheck, Building2, FileText, Mail, MessageSquare, Phone, Search, Settings2, StickyNote, Cpu } from "lucide-react";
import { memberName, useDesk } from "@/lib/store";
import { ago, NOW_MS } from "@/lib/time";
import type { AuditEvent } from "@/lib/types";
import { cx } from "../ui/primitives";

export const EVENT_ICON: Record<AuditEvent["kind"], typeof Phone> = {
  call: Phone,
  email: Mail,
  stage: ArrowRight,
  client: Building2,
  note: StickyNote,
  comment: MessageSquare,
  approval: BadgeCheck,
  document: FileText,
  sourcing: Search,
  team: Settings2,
  system: Cpu,
};

/** A deal's story, read straight from the agency event log. */
export function ActivityList({ dealId, limit }: { dealId: string; limit?: number }) {
  const { events } = useDesk();
  const items = events.filter((e) => e.dealId === dealId).slice(0, limit);
  if (!items.length) return <p className="text-[13px] text-fg-faint">No activity yet.</p>;

  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-line-strong">
      {items.map((e) => {
        const Icon = EVENT_ICON[e.kind];
        const fresh = e.at > NOW_MS;
        return (
          <li key={e.id} className={cx("relative flex gap-3", fresh && "animate-rise")}>
            <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong bg-ink">
              <Icon className="size-3 text-fg-faint" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] text-fg-muted">{e.summary}</p>
              <p className="mt-0.5 font-mono text-[11px] text-fg-faint">
                {memberName(e.actorId)} · {ago(e.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
