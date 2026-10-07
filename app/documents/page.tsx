import type { Metadata } from "next";
import { DocumentsPage } from "@/components/documents/documents-page";

export const metadata: Metadata = { title: "Documents · Amara Desk" };

export default function DocumentsRoute() {
  return <DocumentsPage />;
}
