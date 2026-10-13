import type { AuditModule, AuditRecord } from "./types";

export const AUDIT_MODULES: AuditModule[] = ["Home", "Pipeline", "Clients", "Prospects", "Applicants", "Candidates", "Follow-ups", "Communication", "Calendar", "Tasks", "Documents", "Approvals", "Team", "Learnings", "System"];

export function moduleForAction(action: string): AuditModule {
  const prefix = action.split(".")[0];
  if (prefix === "deal" || prefix === "comment") return "Pipeline";
  if (prefix === "followup") return "Follow-ups";
  if (prefix === "document") return "Documents";
  if (prefix === "approval") return "Approvals";
  if (prefix === "client" || prefix === "job") return "Clients";
  if (prefix === "prospect") return "Prospects";
  if (prefix === "message" || prefix === "call") return "Communication";
  if (prefix === "calendar") return "Calendar";
  if (prefix === "task" || prefix === "note") return "Tasks";
  if (prefix === "team") return "Team";
  if (prefix === "learning") return "Learnings";
  if (action === "sourcing.contacted" || prefix === "candidate") return "Candidates";
  if (prefix === "sourcing" || action === "amara.screened") return "Applicants";
  return "System";
}

function value(v: unknown): string | number | boolean | null {
  if (v === undefined || v === null) return null;
  return typeof v === "object" ? JSON.stringify(v) : v as string | number | boolean;
}

export function changedFields(before: unknown, after: unknown, path = ""): AuditRecord["fields"] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  if (object(before) || object(after)) {
    const a = object(before) ? before : {};
    const b = object(after) ? after : {};
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(key => changedFields(a[key], b[key], path ? `${path}.${key}` : key));
  }
  return [{ field: path, before: value(before), after: value(after) }];
}

export function recordChanges<T extends { id: string }>(before: T[], after: T[], module: AuditModule, entityType: string): AuditRecord[] {
  const old = new Map(before.map(x => [x.id, x]));
  const next = new Map(after.map(x => [x.id, x]));
  return [...new Set([...old.keys(), ...next.keys()])].flatMap(id => {
    const a = old.get(id);
    const b = next.get(id);
    const fields = changedFields(a, b);
    if (!fields.length) return [];
    const record = (b ?? a) as Record<string, unknown>;
    const candidate = record.candidate as { name?: string } | undefined;
    return [{ module, entityType, entityId: id, entityName: String(record.name ?? candidate?.name ?? record.title ?? id), operation: !a ? "created" : !b ? "removed" : "updated", fields }];
  });
}

export function fieldLabel(field: string) {
  return field.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll(".", " · ").replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
}

export function auditValue(field: string, v: string | number | boolean | null) {
  if (v === null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (/Pct$/.test(field) && typeof v === "number") return `${Math.round(v * 100)}%`;
  return String(v);
}
