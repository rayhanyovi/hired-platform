import type { Metadata } from "next";
import { LearningsOverview } from "@/components/learnings/overview";

export const metadata: Metadata = { title: "Learnings · Amara Desk" };

export default function LearningsPage() {
  return <LearningsOverview />;
}
