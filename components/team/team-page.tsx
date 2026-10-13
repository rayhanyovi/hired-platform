"use client";

import {
  BadgeCheck,
  Check,
  Clock,
  Minus,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  Trophy,
} from "lucide-react";
import { PERMISSIONS, ROLE_BLURB, ROLE_LABEL, type Access } from "@/lib/agency";
import { TableWorkspace } from "../ui/table-workspace";
import { useDesk } from "@/lib/store";
import { ApprovalCard } from "../deals/discussion";
import { Leaderboard } from "./leaderboard";
import { ActorAvatar } from "../ui/member";
import { Page, PageHeader } from "../ui/page-header";
import { Button, SectionTitle, cx } from "../ui/primitives";
import { SubpageTabs } from "../ui/subpage-tabs";

export function TeamPage() {
  const {
    members,
    me,
    setCurrentUser,
    deals,
    approvals,
    rules,
    updateRules,
    isOwner,
    notify,
    teamView,
    setTeamView,
  } = useDesk();
  const pending = approvals.filter((a) => a.status === "pending");
  const floor = Math.round(rules.feeFloorPct * 100);

  return (
    <Page>
      <PageHeader
        eyebrow="Team"
        title="Who does what, and what needs a second look."
      >
        Three roles. Recruiters can do almost anything, but discounts and
        invoices go past the Owner first. Every decision lands in the audit log.
      </PageHeader>

      <div data-tour="team-views" className="mb-8">
        <SubpageTabs
          label="Team view"
          value={teamView}
          onChange={setTeamView}
          options={[
            { id: "members", label: "Members & rules", icon: UsersRound },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
          ]}
        />
      </div>

      {teamView === "leaderboard" ? (
        <Leaderboard />
      ) : (
        <div className="space-y-12">
          <section>
            <SectionTitle icon={UsersRound}
              aside={
                <span className="text-[11px] text-fg-faint">
                  Demo: switch who you&apos;re signed in as
                </span>
              }
            >
              Members
            </SectionTitle>
            <ul
              data-tour="team-members"
              className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
            >
              {members.map((m) => {
                const owned = deals.filter(
                  (d) => d.ownerId === m.id && d.stage !== "placed",
                ).length;
                const isMe = m.id === me.id;
                return (
                  <li
                    key={m.id}
                    className="grid items-center gap-x-4 gap-y-2 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_120px_auto]"
                  >
                    <div className="flex items-center gap-3 sm:contents">
                      <ActorAvatar id={m.id} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[14px] text-fg">
                          {m.name}
                          {isMe && (
                            <span className="rounded bg-white/[0.07] px-1.5 py-px text-[10px] text-fg-muted">
                              You
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[12px] text-fg-faint">
                          {m.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-[12px]">
                      <div className="text-fg">{ROLE_LABEL[m.role]}</div>
                      <div className="text-fg-faint">
                        {owned ? `${owned} live deals` : "Sourcing"}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      {isMe ? (
                        <span className="text-[12px] text-fg-faint">
                          Signed in
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setCurrentUser(m.id);
                            notify(
                              `Now viewing as ${m.name} (${ROLE_LABEL[m.role]})`,
                            );
                          }}
                        >
                          View as {m.firstName}
                        </Button>
                      )}
                    </div>
                    <p className="text-[12px] leading-relaxed text-fg-faint sm:col-span-3 sm:col-start-2">
                      {ROLE_BLURB[m.role]}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section data-tour="team-approvals">
            <SectionTitle icon={BadgeCheck}>Waiting for approval</SectionTitle>
            {pending.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-fg-faint">
                Nothing waiting. All clear.
              </p>
            ) : (
              <div className="space-y-3">
                {pending.map((a) => (
                  <ApprovalCard key={a.id} approval={a} showDeal />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle icon={SlidersHorizontal}
              aside={
                !isOwner && (
                  <span className="text-[11px] text-fg-faint">
                    Only the Owner can change rules
                  </span>
                )
              }
            >
              Approval rules
            </SectionTitle>
            <div
              data-tour="team-rules"
              className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
            >
              <Rule
                title="Fee floor"
                description={`Recruiters can't go below ${floor}% without the Owner's sign-off. Protects you from the quiet 12% discount.`}
                enabled={rules.feeFloorEnabled}
                disabled={!isOwner}
                onToggle={(v) =>
                  updateRules(
                    { feeFloorEnabled: v },
                    v
                      ? `Turned on the ${floor}% fee floor`
                      : "Turned off the fee floor",
                  )
                }
              >
                <div className="flex items-center rounded-lg border border-line-strong bg-ink-sunken">
                  <input
                    type="number"
                    min={5}
                    max={35}
                    value={floor}
                    disabled={!isOwner || !rules.feeFloorEnabled}
                    aria-label="Fee floor percentage"
                    onChange={(e) => {
                      const v = Math.max(
                        5,
                        Math.min(35, Number(e.target.value)),
                      );
                      updateRules(
                        { feeFloorPct: v / 100 },
                        `Set fee floor to ${v}%`,
                      );
                    }}
                    className="h-8 w-12 bg-transparent px-2 text-right text-[13px] text-fg outline-none disabled:text-fg-faint num"
                  />
                  <span className="pr-2.5 text-[13px] text-fg-faint">%</span>
                </div>
              </Rule>
              <Rule
                title="Invoice sign-off"
                description="Placement invoices from Recruiters wait for the Owner before they're sent to a client."
                enabled={rules.invoiceApproval}
                disabled={!isOwner}
                onToggle={(v) =>
                  updateRules(
                    { invoiceApproval: v },
                    v
                      ? "Turned on invoice sign-off"
                      : "Turned off invoice sign-off",
                  )
                }
              />
            </div>
          </section>

          <section>
            <SectionTitle icon={ShieldCheck}>Permissions</SectionTitle>
            <TableWorkspace title="Permissions"><div
              data-tour="team-permissions"
              className="overflow-x-auto rounded-xl border border-line"
            >
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="bg-ink-sunken text-[11px] tracking-[0.06em] text-fg-faint uppercase">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Action</th>
                    {(["owner", "recruiter", "resourcer"] as const).map((r) => (
                      <th
                        key={r}
                        className={cx(
                          "w-28 px-4 py-2.5 text-center font-medium",
                          me.role === r && "text-fg",
                        )}
                      >
                        {ROLE_LABEL[r]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {PERMISSIONS.map((p) => (
                    <tr key={p.action}>
                      <td className="px-4 py-3 text-fg-muted">{p.action}</td>
                      {(["owner", "recruiter", "resourcer"] as const).map(
                        (r) => (
                          <td
                            key={r}
                            className={cx(
                              "px-4 py-3 text-center",
                              me.role === r && "bg-white/[0.02]",
                            )}
                          >
                            <AccessMark access={p[r]} />
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></TableWorkspace>
          </section>
        </div>
      )}
    </Page>
  );
}

function AccessMark({ access }: { access: Access }) {
  if (access === "yes")
    return <Check className="mx-auto size-4 text-fg" aria-label="Allowed" />;
  if (access === "approval")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-warm">
        <Clock className="size-3" /> Approval
      </span>
    );
  return (
    <Minus className="mx-auto size-4 text-fg-faint" aria-label="Not allowed" />
  );
}

function Rule({
  title,
  description,
  enabled,
  disabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] text-fg">{title}</div>
        <p className="mt-0.5 max-w-[60ch] text-[12px] leading-relaxed text-fg-faint">
          {description}
        </p>
      </div>
      {children}
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        disabled={disabled}
        onClick={() => onToggle(!enabled)}
        className={cx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
          enabled ? "bg-fg" : "bg-line-strong",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 size-4 rounded-full transition-[left,background-color]",
            enabled ? "left-[18px] bg-ink" : "left-0.5 bg-fg-muted",
          )}
        />
      </button>
    </div>
  );
}
