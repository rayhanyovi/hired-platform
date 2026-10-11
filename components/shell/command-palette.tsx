"use client";

import { useDesk } from "@/lib/store";

export function Toaster() {
  const { toast } = useDesk();
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-pop rounded-lg border border-line-strong bg-raised px-4 py-2.5 text-[13px] text-fg shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] md:bottom-6"
    >
      {toast.text}
    </div>
  );
}
