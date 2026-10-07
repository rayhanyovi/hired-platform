import type { Metadata } from "next";
import { Calculator } from "@/components/sum/calculator";

export const metadata: Metadata = { title: "The Sum · Amara Desk" };

export default function SumPage() {
  return <Calculator />;
}
