import type { Metadata } from "next";
import { AuditPage } from "@/components/audit/audit-page";

export const metadata: Metadata = { title: "Audit trail · Amara Desk" };

export default function AuditRoute() {
  return <AuditPage />;
}
