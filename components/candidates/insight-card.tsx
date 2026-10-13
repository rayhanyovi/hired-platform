import { Check, CircleHelp } from "lucide-react";
import type { TalentInsight } from "@/lib/talent-insights";
import { AmaraMark } from "../ui/primitives";

export function InsightCard({ title, insight, matchesLabel, gapsLabel, actions }: { title: string; insight: TalentInsight; matchesLabel: string; gapsLabel: string; actions?: React.ReactNode }) {
  return <section aria-label={title} className="amara-edge rounded-xl bg-amara-wash/30 p-4 sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-xs font-medium tracking-[0.06em] uppercase"><AmaraMark className="size-3.5" /><span className="amara-gradient-text">{title}</span></h3><span className="rounded-full border border-line-strong px-2.5 py-1 text-[11px] text-fg-muted">{insight.badge}</span></div>
    <p className="text-[13px] leading-relaxed text-fg">{insight.summary}</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><h4 className="mb-2 text-[10px] tracking-[0.06em] text-fg-faint uppercase">{matchesLabel}</h4>{insight.matches.length ? <ul className="space-y-2">{insight.matches.map((text, i) => <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-fg-muted"><Check className="mt-0.5 size-3.5 shrink-0 text-good" /><span className="min-w-0 break-words">{text}</span></li>)}</ul> : <p className="text-xs text-fg-faint">No supporting evidence recorded yet.</p>}</div>
      <div><h4 className="mb-2 text-[10px] tracking-[0.06em] text-fg-faint uppercase">{gapsLabel}</h4>{insight.gaps.length ? <ul className="space-y-2">{insight.gaps.map((text, i) => <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-fg-muted"><CircleHelp className="mt-0.5 size-3.5 shrink-0 text-fg-faint" /><span className="min-w-0 break-words">{text}</span></li>)}</ul> : <p className="text-xs text-fg-faint">No gaps recorded. Confirm against source documents.</p>}</div>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"><p className="max-w-[65ch] text-[10px] leading-relaxed text-fg-faint">Demo AI read · {insight.source}. Updates from saved data; no live model connected.</p>{actions}</div>
  </section>;
}
