"use client";

import { Cpu } from "lucide-react";
import { ROLE_LABEL } from "@/lib/agency";
import { initials } from "@/lib/deal";
import { memberName } from "@/lib/store";
import { MEMBERS } from "@/lib/agency";
import { AmaraMark, cx } from "./primitives";

/** Avatar for whoever did something: a teammate, Amara, or the system. */
export function ActorAvatar({ id, size = "sm" }: { id: string; size?: "xs" | "sm" | "md" }) {
  const box = size === "xs" ? "size-5 text-[9px]" : size === "sm" ? "size-6 text-[10px]" : "size-8 text-[11px]";
  if (id === "amara") {
    return (
      <span className={cx("grid shrink-0 place-items-center rounded-full border border-amara-violet/30 bg-amara-wash", box)} aria-hidden="true">
        <AmaraMark className="h-2.5 w-3" />
      </span>
    );
  }
  if (id === "system") {
    return (
      <span className={cx("grid shrink-0 place-items-center rounded-full border border-line-strong bg-raised text-fg-faint", box)} aria-hidden="true">
        <Cpu className="size-3" />
      </span>
    );
  }
  return (
    <span
      className={cx("grid shrink-0 place-items-center rounded-full border border-line-strong bg-raised font-medium text-fg-muted", box)}
      aria-hidden="true"
    >
      {initials(memberName(id))}
    </span>
  );
}

export function RoleBadge({ memberId }: { memberId: string }) {
  const m = MEMBERS.find((x) => x.id === memberId);
  if (!m) return null;
  return (
    <span className="rounded border border-line-strong px-1.5 py-px text-[10px] text-fg-faint">{ROLE_LABEL[m.role]}</span>
  );
}

/** Renders @Name mentions as highlighted tokens. */
export function WithMentions({ text }: { text: string }) {
  const names = MEMBERS.map((m) => m.firstName);
  const parts = text.split(new RegExp(`(@(?:${names.join("|")}))\\b`, "g"));
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") && names.includes(p.slice(1)) ? (
          <span key={i} className="rounded bg-white/[0.07] px-1 text-fg">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
