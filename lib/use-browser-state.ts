"use client";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

/** Local prototype persistence; a backend can replace this without changing record IDs. */
export function useBrowserState<T>(key: string, initial: T, enabled = true) {
  const [value, setValue] = useState(initial);
  const ready = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return;
      try { setValue(JSON.parse(event.newValue) as T); } catch { /* Ignore malformed external snapshots. */ }
    };
    window.addEventListener("storage", onStorage);
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) setValue(JSON.parse(saved) as T);
      } catch { /* Keep the fixture when storage is unavailable or corrupt. */ }
      ready.current = true;
    });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", onStorage); };
  }, [key, enabled]);
  useEffect(() => {
    if (!enabled || !ready.current) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be disabled in private browser contexts. */ }
  }, [key, value, enabled]);
  const update = useCallback((next: SetStateAction<T>) => setValue(next), []);
  return [value, update] as const;
}
