import { useCallback, useEffect, useRef, type MutableRefObject, type SetStateAction } from "react";
import { useBrowserState } from "./use-browser-state";
import { recordChanges } from "./audit";
import type { AuditModule, AuditRecord } from "./types";

/** Capture changes synchronously so the action's log includes all related writes. */
export function useTrackedData<T extends { id: string }>(initial: T[], module: AuditModule, entityType: string, pending: MutableRefObject<AuditRecord[]>, storageKey?: string) {
  const [data, setData] = useBrowserState(storageKey ?? "", initial, !!storageKey);
  const current = useRef(initial);
  // Only data from elsewhere (saved state loading) resets the ref. Our own writes are
  // already in it, and an older render's value must not overwrite a newer write.
  const ours = useRef(new WeakSet<T[]>());
  useEffect(() => { if (!ours.current.has(data)) current.current = data; }, [data]);
  const update = useCallback((action: SetStateAction<T[]>) => {
    const next = typeof action === "function" ? action(current.current) : action;
    pending.current.push(...recordChanges(current.current, next, module, entityType));
    ours.current.add(next);
    current.current = next;
    setData(next);
  }, [module, entityType, pending, setData]);
  return [data, update] as const;
}
