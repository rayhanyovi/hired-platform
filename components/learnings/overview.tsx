"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CONTINUE_LESSON_ID, findLesson, KIND_LABEL, LESSONS, TRACKS, type LessonKind } from "@/lib/learnings";
import { useDesk } from "@/lib/store";
import { Page, PageHeader } from "../ui/page-header";
import { cx } from "../ui/primitives";
import { KindIcon, ProgressBar, VideoPlaceholder } from "./parts";

type Filter = "all" | LessonKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "video", label: "Videos" },
  { id: "reading", label: "Readings" },
  { id: "quiz", label: "Quizzes" },
];

export function LearningsOverview() {
  const { completedLessons } = useDesk();
  const [filter, setFilter] = useState<Filter>("all");
  const done = new Set(completedLessons);
  const overall = done.size / LESSONS.length;

  // Resume the seeded lesson unless it's done, then fall back to the first unfinished one.
  const resumeId = done.has(CONTINUE_LESSON_ID) ? LESSONS.find((l) => !done.has(l.id))?.id : CONTINUE_LESSON_ID;
  const resume = resumeId ? findLesson(resumeId) : null;

  return (
    <Page>
      <PageHeader
        eyebrow="Learnings"
        title="Learn from people who've done it."
        actions={
          <div className="w-40 text-right">
            <div className="text-[26px] font-medium leading-none tracking-[-0.02em] num">{Math.round(overall * 100)}%</div>
            <div className="mt-1.5 text-[11px] text-fg-faint">
              {done.size} of {LESSONS.length} lessons done
            </div>
            <ProgressBar value={overall} className="mt-3" />
          </div>
        }
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Short videos, readings, and check-ins from the mentors in the room.
      </PageHeader>

      {resume && (
        <Link
          data-tour="continue"
          href={`/learnings/${resume.lesson.id}`}
          className="group mb-12 grid animate-rise items-center gap-6 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:grid-cols-[260px_minmax(0,1fr)] sm:p-5"
        >
          {resume.lesson.kind === "video" ? (
            <VideoPlaceholder minutes={resume.lesson.minutes} size="sm" interactive={false} />
          ) : (
            <div className="grid aspect-video place-items-center rounded-lg border border-line bg-ink-sunken">
              <KindIcon kind={resume.lesson.kind} className="size-6 text-fg-faint" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Continue where you left off</div>
            <h2 className="mt-2 font-semibold text-[21px] leading-tight tracking-[-0.02em]">{resume.lesson.title}</h2>
            <p className="mt-2 text-[13px] text-fg-muted">
              {resume.track.title} · {KIND_LABEL[resume.lesson.kind]} · {resume.lesson.minutes} min
            </p>
            <span className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors group-hover:bg-primary-hover">
              Resume <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      )}

      <div data-tour="lesson-filters" className="mb-6 flex items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="tablist" aria-label="Filter lessons">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                "h-7 rounded-md px-3 text-[12px] transition-colors",
                filter === f.id ? "bg-raised text-fg shadow-[0_0_0_1px_rgb(255_255_255/0.06)]" : "text-fg-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="hidden text-[12px] text-fg-faint sm:inline">
          {TRACKS.length} tracks · {LESSONS.reduce((s, l) => s + l.minutes, 0)} min total
        </span>
      </div>

      <div data-tour="tracks" className="space-y-10">
        {TRACKS.map((track) => {
          const lessons = track.lessons.filter((l) => filter === "all" || l.kind === filter);
          if (!lessons.length) return null;
          const trackDone = track.lessons.filter((l) => done.has(l.id)).length;
          return (
            <section key={track.id} aria-labelledby={`track-${track.id}`}>
              <div className="mb-4 grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-end">
                <div>
                  <div className="font-mono text-[11px] text-fg-faint">Track {track.number}</div>
                  <h2 id={`track-${track.id}`} className="mt-1 font-semibold text-[19px] leading-tight tracking-[-0.02em]">
                    {track.title}
                  </h2>
                  <p className="mt-1 max-w-[60ch] text-[13px] text-fg-muted">{track.description}</p>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between font-mono text-[10px] text-fg-faint num">
                    <span>Progress</span>
                    <span>
                      {trackDone}/{track.lessons.length}
                    </span>
                  </div>
                  <ProgressBar value={trackDone / track.lessons.length} />
                </div>
              </div>

              <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {lessons.map((l) => {
                  const isDone = done.has(l.id);
                  const isNext = l.id === resumeId;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learnings/${l.id}`}
                        className="group grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-raised"
                      >
                        <span
                          className={cx(
                            "grid size-8 place-items-center rounded-full border",
                            isDone ? "border-transparent bg-fg/90 text-ink" : "border-line-strong text-fg-muted",
                          )}
                        >
                          {isDone ? <Check className="size-3.5" strokeWidth={2.5} /> : <KindIcon kind={l.kind} className="size-3.5" />}
                        </span>
                        <div className="min-w-0">
                          <div className={cx("truncate text-[14px]", isDone ? "text-fg-muted" : "text-fg")}>{l.title}</div>
                          <div className="mt-0.5 truncate text-[12px] text-fg-faint">
                            {KIND_LABEL[l.kind]} · {l.minutes} min · {l.mentor.name}
                          </div>
                        </div>
                        <span className="flex items-center gap-2 text-[12px] text-fg-faint">
                          {isNext && <span className="rounded border border-line-strong px-1.5 py-0.5 text-[10px] text-fg-muted">Up next</span>}
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </Page>
  );
}
