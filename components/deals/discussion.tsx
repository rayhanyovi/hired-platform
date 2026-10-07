"use client";

import { useRef, useState } from "react";
import { AtSign, BadgeCheck, Check, Clock, Percent, X } from "lucide-react";
import { money } from "@/lib/deal";
import { memberName, useDesk } from "@/lib/store";
import { ago } from "@/lib/time";
import type { Approval, Comment, Deal } from "@/lib/types";
import { ActorAvatar, RoleBadge, WithMentions } from "../ui/member";
import { Button, cx } from "../ui/primitives";

type Mode = "note" | "fee";

/** Notes, @mentions and approval requests on one deal, in order. */
export function Discussion({ deal }: { deal: Deal }) {
  const { comments, approvals, members, me, addComment, changeFee, notify, rules } = useDesk();
  const thread = comments.filter((c) => c.dealId === deal.id).sort((a, b) => a.at - b.at);
  const [mode, setMode] = useState<Mode>("note");
  const [body, setBody] = useState("");
  const [fee, setFee] = useState(Math.round(deal.feePct * 100));
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const floor = Math.round(rules.feeFloorPct * 100);
  const feeNeedsApproval = rules.feeFloorEnabled && fee < floor && !me.role.includes("owner");
  const canChangeFee = me.role !== "resourcer";

  const submit = () => {
    if (mode === "note") {
      if (!body.trim()) return;
      addComment(deal.id, body.trim());
      setBody("");
      return;
    }
    const result = changeFee(deal.id, fee / 100, body.trim());
    notify(result === "requested" ? "Approval requested from the Owner" : `Fee updated to ${fee}%`);
    setBody("");
    setMode("note");
  };

  const mention = (firstName: string) => {
    setBody((b) => `${b}${b && !b.endsWith(" ") ? " " : ""}@${firstName} `);
    inputRef.current?.focus();
  };

  return (
    <section data-tour="discussion" aria-labelledby="discussion-title">
      <h2 id="discussion-title" className="mb-4 text-[11px] tracking-[0.08em] text-fg-faint uppercase">
        Discussion
      </h2>

      {thread.length === 0 ? (
        <p className="mb-5 rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-fg-faint">
          No notes yet. Leave context for your team, @mention someone, or request an approval.
        </p>
      ) : (
        <ol className="mb-5 space-y-4">
          {thread.map((c) => (
            <CommentItem key={c.id} comment={c} approval={approvals.find((a) => a.id === c.approvalId)} />
          ))}
        </ol>
      )}

      <div className="rounded-xl border border-line bg-surface focus-within:border-line-strong">
        <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
          <ModeTab active={mode === "note"} onClick={() => setMode("note")}>
            Note
          </ModeTab>
          {canChangeFee && (
            <ModeTab active={mode === "fee"} onClick={() => setMode("fee")}>
              <Percent className="size-3" /> Change fee
            </ModeTab>
          )}
          <div className="ml-auto flex items-center gap-1">
            <AtSign className="size-3.5 text-fg-faint" aria-hidden="true" />
            {members
              .filter((m) => m.id !== me.id)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => mention(m.firstName)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-fg-faint transition-colors hover:bg-hover hover:text-fg"
                  title={`Mention ${m.name}`}
                >
                  {m.firstName}
                </button>
              ))}
          </div>
        </div>

        {mode === "fee" && (
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 text-[13px]">
            <label htmlFor="fee-input" className="text-fg-muted">
              New fee
            </label>
            <div className="flex items-center rounded-lg border border-line-strong bg-ink-sunken">
              <input
                id="fee-input"
                type="number"
                min={5}
                max={35}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="h-8 w-14 bg-transparent px-2 text-right text-fg outline-none num"
              />
              <span className="pr-2.5 text-fg-faint">%</span>
            </div>
            <span className="text-fg-faint num">= {money(Math.round(deal.role.salary * (fee / 100)))}</span>
            <span className={cx("ml-auto text-[12px]", feeNeedsApproval ? "text-warm" : "text-fg-faint")}>
              {feeNeedsApproval ? `Below the ${floor}% floor. Goes to the Owner for approval.` : "Applies immediately and is logged."}
            </span>
          </div>
        )}

        <textarea
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder={mode === "note" ? "Add a note for the team…" : "Why? The approver will see this."}
          aria-label={mode === "note" ? "Note" : "Reason for fee change"}
          className="block w-full resize-none bg-transparent px-4 py-3 text-[14px] text-fg outline-none placeholder:text-fg-faint [field-sizing:content] min-h-[64px]"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <span className="flex items-center gap-2 text-[11px] text-fg-faint">
            <ActorAvatar id={me.id} size="xs" /> Posting as {me.name}
          </span>
          <Button variant="primary" size="sm" onClick={submit} disabled={mode === "note" && !body.trim()}>
            {mode === "note" ? "Post note" : feeNeedsApproval ? "Request approval" : "Update fee"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[12px] transition-colors",
        active ? "bg-raised text-fg" : "text-fg-faint hover:text-fg-muted",
      )}
    >
      {children}
    </button>
  );
}

function CommentItem({ comment: c, approval }: { comment: Comment; approval?: Approval }) {
  return (
    <li className="flex gap-3">
      <ActorAvatar id={c.authorId} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[13px] text-fg">{memberName(c.authorId)}</span>
          <RoleBadge memberId={c.authorId} />
          <span className="font-mono text-[11px] text-fg-faint">{ago(c.at)}</span>
        </div>
        <p className="mt-1 text-[14px] leading-relaxed text-fg-muted">
          <WithMentions text={c.body} />
        </p>
        {approval && <ApprovalCard approval={approval} />}
      </div>
    </li>
  );
}

export function ApprovalCard({ approval: a, showDeal = false }: { approval: Approval; showDeal?: boolean }) {
  const { isOwner, decideApproval, notify, deals, openDeal } = useDesk();
  const deal = deals.find((d) => d.id === a.dealId);
  const pending = a.status === "pending";

  return (
    <div
      className={cx(
        "mt-3 rounded-xl border p-4",
        pending ? "border-warm/30 bg-warm/[0.04]" : "border-line bg-ink-sunken",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <BadgeCheck className={cx("size-4", pending ? "text-warm" : a.status === "approved" ? "text-good" : "text-bad")} />
        <span className="text-[13px] font-medium text-fg">{a.title}</span>
        {showDeal && deal && (
          <button onClick={() => openDeal(deal.id)} className="text-[12px] text-fg-faint underline-offset-4 hover:text-fg hover:underline">
            {deal.candidate.name}
          </button>
        )}
        <span
          className={cx(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
            pending && "bg-warm/10 text-warm",
            a.status === "approved" && "bg-good/10 text-good",
            a.status === "rejected" && "bg-bad/10 text-bad",
          )}
        >
          {pending ? <Clock className="size-3" /> : a.status === "approved" ? <Check className="size-3" /> : <X className="size-3" />}
          {pending ? "Awaiting Owner" : a.status === "approved" ? "Approved" : "Rejected"}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{a.detail}</p>
      {a.kind === "fee" && deal && a.feePct !== undefined && (
        <p className="mt-1 text-[12px] text-fg-faint num">
          {Math.round(deal.feePct * 100)}% → {Math.round(a.feePct * 100)}% · fee becomes {money(Math.round(deal.role.salary * a.feePct))}
        </p>
      )}
      {pending ? (
        isOwner ? (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                decideApproval(a.id, true);
                notify("Approved and logged");
              }}
            >
              <Check className="size-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              onClick={() => {
                decideApproval(a.id, false);
                notify("Rejected and logged");
              }}
            >
              Reject
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-fg-faint">Only the Owner can approve this. Switch to Sam in the sidebar to try it.</p>
        )
      ) : (
        a.decidedBy && (
          <p className="mt-2 text-[11px] text-fg-faint">
            {a.status === "approved" ? "Approved" : "Rejected"} by {memberName(a.decidedBy)} · {ago(a.decidedAt ?? a.at)}
          </p>
        )
      )}
    </div>
  );
}
