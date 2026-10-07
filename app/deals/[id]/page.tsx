import { Suspense } from "react";
import type { Metadata } from "next";
import { DealPage } from "@/components/deals/deal-page";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { DEALS } from "@/lib/data";

export function generateStaticParams() {
  return DEALS.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const deal = DEALS.find((d) => d.id === id);
  return { title: `${deal?.candidate.name ?? "Deal"} · Amara Desk` };
}

export default function DealRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Deal params={params} />
    </Suspense>
  );
}

/**
 * Deals created during a session only exist in client state, so unknown ids
 * aren't a 404 here; the client view decides whether the deal exists.
 */
async function Deal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealPage id={id} />;
}
