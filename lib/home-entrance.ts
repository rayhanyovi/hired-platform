/** Claim the welcome once per member and local calendar day, before animation begins. */
export function claimHomeEntrance(storage: Pick<Storage, "getItem" | "setItem">, memberId: string, now = new Date(), sessionReady = false) {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const key = `amara:home-welcome:v1:${memberId}`;
  try {
    if (storage.getItem(key) === day) return false;
    storage.setItem(key, day);
    return true;
  } catch {
    return !sessionReady;
  }
}
