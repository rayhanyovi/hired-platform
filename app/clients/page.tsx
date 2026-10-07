import type { Metadata } from "next";
import { ClientsList } from "@/components/clients/clients-list";

export const metadata: Metadata = { title: "Clients · Amara Desk" };

export default function ClientsRoute() {
  return <ClientsList />;
}
