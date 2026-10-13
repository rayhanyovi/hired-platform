import type { Metadata } from "next";
import { ProspectsPage } from "@/components/prospects/prospects-page";

export const metadata: Metadata = { title: "Prospects · Amara Desk" };

export default function ProspectsRoute() {
  return <ProspectsPage />;
}
