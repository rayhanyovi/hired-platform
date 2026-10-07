import type { Metadata } from "next";
import { TeamPage } from "@/components/team/team-page";

export const metadata: Metadata = { title: "Team · Amara Desk" };

export default function TeamRoute() {
  return <TeamPage />;
}
