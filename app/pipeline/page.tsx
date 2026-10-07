import type { Metadata } from "next";
import { Board } from "@/components/pipeline/board";

export const metadata: Metadata = { title: "Pipeline · Amara Desk" };

export default function PipelinePage() {
  return <Board />;
}
