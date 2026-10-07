"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import { findLesson, KIND_LABEL } from "@/lib/learnings";
import { useDesk } from "@/lib/store";
import { Page } from "../ui/page-header";
import { Avatar, Button, cx } from "../ui/primitives";
import { KindIcon, ProgressBar, VideoPlaceholder } from "./parts";
import { Quiz } from "./quiz";

export function LessonView({ id }: { id: string }) {
  const { completedLessons, setLessonDone, notify } = useDesk();
  const found = findLesson(id);
  if (!found) return null;
  const { lesson, track, prev, next } = found;
  const done = new Set(completedLessons);
  const isDone = done.has(lesson.id);
  const trackDone = track.lessons.filter((l) => done.has(l.id)).length;

  const complete = () => {
    setLessonDone(lesson.id, true);
    notify(next ? "Lesson complete. Next one's ready." : "Lesson complete. That's the whole curriculum.");
  };

  return (
    <Page wide>
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-[12px] text-fg-faint">
        <Link href="/learnings" className="transition-colors hover:text-fg">
          Learnings
        </Link>
        <ChevronRight className="size-3" />
        <span className="truncate">
          Track {track.number} · {track.title}
        </span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article data-tour="lesson-content" className="min-w-0">
          <header className="mb-8 animate-rise">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-fg-faint uppercase">
              <KindIcon kind={lesson.kind} className="size-3.5" />
              {KIND_LABEL[lesson.kind]} · {lesson.minutes} min
              {isDone && (
                <span className="ml-1 inline-flex items-center gap-1 rounded border border-line-strong px-1.5 py-px tracking-normal normal-case text-fg-muted">
                  <Check className="size-3" /> Done
                </span>
              )}
            </div>
            <h1 className="mt-3 font-serif text-[32px] leading-[1.1] tracking-[-0.01em] sm:text-[40px]">{lesson.title}</h1>
            <div className="mt-5 flex items-center gap-3">
              <Avatar name={lesson.mentor.name} size="sm" />
              <div className="text-[13px] leading-tight">
                <div className="text-fg">{lesson.mentor.name}</div>
                <div className="text-[12px] text-fg-faint">{lesson.mentor.role}</div>
              </div>
            </div>
          </header>

          {lesson.kind === "video" && (
            <>
              <VideoPlaceholder minutes={lesson.minutes} />
              <Prose body={lesson.body} className="mt-8" />
            </>
          )}

          {lesson.kind === "reading" && <Prose body={lesson.body} lead={lesson.summary} />}

          {lesson.kind === "quiz" && lesson.questions && (
            <>
              <p className="mb-6 max-w-[62ch] text-[15px] leading-relaxed text-fg-muted">
                {lesson.summary} Score 3 of {lesson.questions.length} or better to complete this check-in.
              </p>
              <Quiz key={lesson.id} questions={lesson.questions} onPass={complete} />
            </>
          )}

          {lesson.takeaways && (
            <section className="mt-10 rounded-xl border border-line bg-surface p-5">
              <h2 className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Key takeaways</h2>
              <ol className="mt-4 space-y-3">
                {lesson.takeaways.map((t, i) => (
                  <li key={t} className="flex gap-3 text-[14px] leading-relaxed text-fg-muted">
                    <span className="font-mono text-[12px] text-fg-faint num">{String(i + 1).padStart(2, "0")}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <footer data-tour="lesson-footer" className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            {lesson.kind !== "quiz" &&
              (isDone ? (
                <Button onClick={() => setLessonDone(lesson.id, false)}>
                  <Check className="size-3.5" /> Completed
                </Button>
              ) : (
                <Button variant="primary" onClick={complete}>
                  <Check className="size-3.5" /> Mark complete
                </Button>
              ))}
            <div className="ml-auto flex gap-2">
              {prev && (
                <Link
                  href={`/learnings/${prev.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] text-fg-muted transition-colors hover:bg-hover hover:text-fg"
                >
                  <ArrowLeft className="size-3.5" /> Previous
                </Link>
              )}
              {next && (
                <Link
                  href={`/learnings/${next.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-raised px-3.5 text-[13px] font-medium text-fg transition-colors hover:bg-hover"
                >
                  Next lesson <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          </footer>
        </article>

        <aside data-tour="lesson-track" className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-line bg-ink-sunken p-2">
            <div className="px-3 pt-2 pb-3">
              <div className="font-mono text-[10px] text-fg-faint">Track {track.number}</div>
              <div className="mt-1 text-[14px] text-fg">{track.title}</div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={trackDone / track.lessons.length} className="flex-1" />
                <span className="font-mono text-[10px] text-fg-faint num">
                  {trackDone}/{track.lessons.length}
                </span>
              </div>
            </div>
            <ol className="space-y-0.5">
              {track.lessons.map((l, i) => {
                const active = l.id === lesson.id;
                const lessonDone = done.has(l.id);
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learnings/${l.id}`}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                        active ? "bg-raised" : "hover:bg-surface",
                      )}
                    >
                      <span
                        className={cx(
                          "mt-px grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[9px]",
                          lessonDone ? "border-transparent bg-fg/90 text-ink" : "border-line-strong text-fg-faint",
                        )}
                      >
                        {lessonDone ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={cx("block text-[13px] leading-snug", active ? "text-fg" : "text-fg-muted")}>{l.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-fg-faint">
                          <KindIcon kind={l.kind} className="size-3" /> {KIND_LABEL[l.kind]} · {l.minutes} min
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function Prose({ body = [], lead, className }: { body?: { heading?: string; text: string }[]; lead?: string; className?: string }) {
  return (
    <div className={cx("max-w-[66ch] space-y-5 text-[15px] leading-[1.75] text-fg-muted", className)}>
      {lead && <p className="text-[18px] leading-relaxed text-fg">{lead}</p>}
      {body.map((block, i) => (
        <div key={i}>
          {block.heading && <h2 className="mt-4 mb-3 font-serif text-[22px] leading-tight text-fg">{block.heading}</h2>}
          <p>{block.text}</p>
        </div>
      ))}
    </div>
  );
}
