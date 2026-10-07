import { Suspense } from "react";
import type { Metadata } from "next";
import { ClientPage } from "@/components/clients/client-page";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { CLIENTS } from "@/lib/agency";

export function generateStaticParams() {
  return CLIENTS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${CLIENTS.find((c) => c.id === id)?.name ?? "Client"} · Amara Desk` };
}

export default function ClientRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientFromParams params={params} />
    </Suspense>
  );
}

/** Clients added during a session live in client state, so the view decides if one exists. */
async function ClientFromParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientPage id={id} />;
}
