"use client";

import { FileText, ListChecks, Play, PlayCircle } from "lucide-react";
import type { LessonKind } from "@/lib/learnings";
import { useDesk } from "@/lib/store";
import { cx } from "../ui/primitives";

export const KIND_ICON: Record<LessonKind, typeof FileText> = {
  video: PlayCircle,
  reading: FileText,
  quiz: ListChecks,
};

export function KindIcon({ kind, className }: { kind: LessonKind; className?: string }) {
  const Icon = KIND_ICON[kind];
  return <Icon className={cx("size-4", className)} strokeWidth={1.75} aria-hidden="true" />;
}

/** Stand-in for a real player: an empty frame with a play button. */
export function VideoPlaceholder({
  minutes,
  size = "lg",
  interactive = true,
}: {
  minutes: number;
  size?: "sm" | "lg";
  /** Off when the frame sits inside a link, so we don't nest a button in an anchor. */
  interactive?: boolean;
}) {
  const { notify } = useDesk();
  const playClass = cx(
    "relative grid place-items-center rounded-full border border-white/15 bg-white/10 text-fg backdrop-blur transition-[transform,background-color] duration-200",
    interactive && "hover:scale-105 hover:bg-white/15",
    size === "lg" ? "size-16" : "size-9",
  );
  const icon = <Play className={cx("translate-x-px fill-current", size === "lg" ? "size-6" : "size-3.5")} />;
  return (
    <div
      className={cx(
        "relative grid aspect-video w-full place-items-center overflow-hidden border border-line bg-[radial-gradient(90%_120%_at_50%_0%,#262626,#141414)]",
        size === "lg" ? "rounded-2xl" : "rounded-lg",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.03)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden="true"
      />
      {interactive ? (
        <button onClick={() => notify("Video placeholder. No footage in this demo.")} aria-label="Play video (placeholder)" className={playClass}>
          {icon}
        </button>
      ) : (
        <span className={playClass} aria-hidden="true">
          {icon}
        </span>
      )}
      <span
        className={cx(
          "absolute rounded bg-black/60 font-mono text-fg-muted num",
          size === "lg" ? "right-4 bottom-4 px-2 py-1 text-[11px]" : "right-2 bottom-2 px-1.5 py-0.5 text-[10px]",
        )}
      >
        {minutes}:00
      </span>
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-1 overflow-hidden rounded-full bg-line-strong", className)}>
      <div className="h-full rounded-full bg-fg/80 transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
