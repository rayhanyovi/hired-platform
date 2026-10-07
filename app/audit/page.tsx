import type { Metadata } from "next";
import { AuditPage } from "@/components/audit/audit-page";

export const metadata: Metadata = { title: "Audit log · Amara Desk" };

export default function AuditRoute() {
  return <AuditPage />;
}
