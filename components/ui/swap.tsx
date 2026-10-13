"use client";

import { AnimatePresence, motion } from "motion/react";

const EASE = [0.2, 0, 0, 1] as const;

/**
 * Cross-fades content when `id` changes (a tab, a view, a metric), so
 * switching never snaps. Reduced motion turns it into an instant swap.
 */
export function Swap({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: EASE }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** The selected-tab pill that slides between options. */
export const TAB_SPRING = { type: "spring", stiffness: 520, damping: 40, mass: 0.8 } as const;
