import type { Metadata } from "next";
import { CommunicationPage } from "@/components/communication/communication-page";

export const metadata: Metadata = { title: "Communication · Amara Desk" };

export default function CommunicationRoute() {
  return <CommunicationPage />;
}
