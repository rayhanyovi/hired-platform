import type { Metadata } from "next";
import { ChatPage } from "@/components/chat/chat-page";

export const metadata: Metadata = { title: "Chat · Amara Desk" };

export default function ChatRoute() {
  return <ChatPage />;
}
