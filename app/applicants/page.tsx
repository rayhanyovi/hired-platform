import type { Metadata } from "next";
import { ApplicantsPage } from "@/components/sourcing/applicants";

export const metadata: Metadata = { title: "Applicants · Amara Desk" };

export default function ApplicantsRoute() {
  return <ApplicantsPage />;
}
