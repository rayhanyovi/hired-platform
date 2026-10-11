import { useCallback, useRef, useState, type MutableRefObject, type SetStateAction } from "react";
import { recordChanges } from "./audit";
import type { AuditModule, AuditRecord } from "./types";

/** Capture changes synchronously so the action's log includes all related writes. */
export function useTrackedData<T extends { id: string }>(initial: T[], module: AuditModule, entityType: string, pending: MutableRefObject<AuditRecord[]>) {
  const [data, setData] = useState(initial);
  const current = useRef(initial);
  const update = useCallback((action: SetStateAction<T[]>) => {
    const next = typeof action === "function" ? action(current.current) : action;
    pending.current.push(...recordChanges(current.current, next, module, entityType));
    current.current = next;
    setData(next);
  }, [module, entityType, pending]);
  return [data, update] as const;
}
