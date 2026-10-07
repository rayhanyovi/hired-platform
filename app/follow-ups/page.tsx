import type { Metadata } from "next";
import { Inbox } from "@/components/follow-ups/inbox";

export const metadata: Metadata = { title: "Follow-ups · Amara Desk" };

export default function FollowUpsPage() {
  return <Inbox />;
}
