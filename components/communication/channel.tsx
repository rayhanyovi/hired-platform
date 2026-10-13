import { Mail, MessageCircle, SendHorizontal, Smartphone, type LucideIcon } from "lucide-react";
import type { MessageChannel } from "@/lib/types";

export const CHANNEL_ICON: Record<MessageChannel, LucideIcon> = {
  email: Mail,
  sms: Smartphone,
  linkedin: SendHorizontal,
  whatsapp: MessageCircle,
};
