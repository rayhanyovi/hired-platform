"use client";

import { useState } from "react";
import { TableWorkspace } from "../ui/table-workspace";
import { ROLE_LABEL } from "@/lib/agency";
import { NETWORK_BOARD, TEAM_BOARD, type LeaderRow } from "@/lib/home";
import { useDesk } from "@/lib/store";
import { aud } from "../home/overview";
import { METRIC_ORDER, METRICS, MetricIcon } from "../ui/metrics";
import { AmaraButton, AmaraTag, Avatar, cx } from "../ui/primitives";
import { Segmented } from "../ui/menu";

/** The full leaderboard: your team, or everyone on HeyAmara this month. */
export function Leaderboard() {
  const { members, me, ask } = useDesk();
  const [board, setBoard] = useState<"team" | "network">("team");
  const rows = board === "team" ? TEAM_BOARD : NETWORK_BOARD;
  const isYou = (r: LeaderRow) => (board === "team" ? r.name === me.name : !!r.you);
  const subtitle = (r: LeaderRow) => {
    if (board === "network") return r.agency;
    const m = members.find((x) => x.name === r.name);
    return m ? ROLE_LABEL[m.role] : undefined;
  };
  const stuck = TEAM_BOARD.find((r) => r.stats.submittals > 0 && r.stats.interviews === 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Leaderboard"
          value={board}
          onChange={setBoard}
          options={[
            { id: "team", label: "Your team" },
            { id: "network", label: "HeyAmara network" },
          ]}
        />
        <span className="text-[12px] text-fg-faint">This month</span>
        <AmaraButton size="sm" className="ml-auto" onClick={() => ask("Who's top of the leaderboard?")}>
          Explain the gaps
        </AmaraButton>
      </div>

      {board === "team" && stuck && (
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
          <AmaraTag>Amara</AmaraTag>
          {stuck.name.split(" ")[0]} has {stuck.stats.submittals} submittals and no interviews yet. Worth a look at who&apos;s being submitted.
        </p>
      )}

      <TableWorkspace title="Leaderboard"><div data-tour="team-leaderboard" className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] text-fg-faint">
              <th className="w-12 py-3 pl-4 text-left font-normal">#</th>
              <th className="py-3 text-left font-normal">Name</th>
              <th className="px-3 py-3 text-right font-normal">Score</th>
              {METRIC_ORDER.map((k) => (
                <th key={k} className="px-3 py-3 font-normal">
                  <span className="flex items-center justify-end gap-1.5">
                    <MetricIcon kind={k} size="sm" className="size-5 rounded" />
                    {METRICS[k].label}
                  </span>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-normal">Sub → Int</th>
              <th className="py-3 pr-4 text-right font-normal">Billed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const you = isYou(r);
              const conv = r.stats.submittals ? Math.round((r.stats.interviews / r.stats.submittals) * 100) : 0;
              return (
                <tr key={r.name} className={cx("border-b border-line last:border-0", you && "bg-raised/70")}>
                  <td className={cx("py-3 pl-4 font-mono text-[12px]", i < 3 ? "text-fg" : "text-fg-faint")}>{i + 1}</td>
                  <td className="py-3 pr-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={r.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-fg">
                          {r.name}
                          {you && <span className="ml-1.5 text-[11px] text-fg-faint">You</span>}
                        </span>
                        {subtitle(r) && <span className="block truncate text-[11px] text-fg-faint">{subtitle(r)}</span>}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] text-fg num">{r.score}</td>
                  {METRIC_ORDER.map((k) => (
                    <td key={k} className={cx("px-3 py-3 text-right font-mono text-[12px] num", r.stats[k] ? "text-fg-muted" : "text-fg-faint")}>
                      {r.stats[k].toLocaleString("en-AU")}
                    </td>
                  ))}
                  <td className={cx("px-3 py-3 text-right font-mono text-[12px] num", conv ? "text-fg-muted" : "text-warm")}>{conv}%</td>
                  <td className="py-3 pr-4 text-right font-mono text-[12px] text-fg num">{r.billed ? aud(r.billed, false) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></TableWorkspace>
      <p className="text-[12px] text-fg-faint">Score weights later stages more: a placement counts for far more than a call.</p>
    </div>
  );
}
