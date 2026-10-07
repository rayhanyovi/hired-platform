import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/learnings/lesson-view";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { findLesson, LESSONS } from "@/lib/learnings";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const found = findLesson(id);
  return { title: found ? `${found.lesson.title} · Learnings` : "Learnings" };
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!findLesson(id)) notFound();
  return <LessonView id={id} />;
}
