"use client";

import { FIT_LABEL } from "@/lib/agency";
import { useDesk } from "@/lib/store";
import type { Fit } from "@/lib/types";
import { cx } from "../ui/primitives";
import { compactSelectClass } from "../ui/modal";

export const FIT_RANK: Record<Fit, number> = { strong: 0, possible: 1, unlikely: 2 };

export function FitPill({ fit, className }: { fit: Fit; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
        fit === "strong" && "border-good/30 text-good",
        fit === "possible" && "border-line-strong text-fg-muted",
        fit === "unlikely" && "border-line text-fg-faint",
        className,
      )}
    >
      <span
        className={cx(
          "size-1.5 rounded-full",
          fit === "strong" && "bg-good",
          fit === "possible" && "bg-fg-muted",
          fit === "unlikely" && "bg-fg-faint/60",
        )}
      />
      {FIT_LABEL[fit]}
    </span>
  );
}

/** Job picker grouped by client, shared by Applicants and Candidates. */
export function JobSelect({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const { jobs, clients } = useDesk();
  const open = jobs.filter((j) => j.status !== "filled");
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Job" className={cx(compactSelectClass, className)}>
      <option value="all">All roles</option>
      {clients.map((c) => {
        const roles = open.filter((j) => j.client === c.name);
        if (!roles.length) return null;
        return (
          <optgroup key={c.id} label={c.name}>
            {roles.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
