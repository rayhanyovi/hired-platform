import type { Metadata } from "next";
import { CandidatesPage } from "@/components/candidates/candidates-page";

export const metadata: Metadata = { title: "Candidates · Amara Desk" };

export default function CandidatesRoute() {
  return <CandidatesPage />;
}
