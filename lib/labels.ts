/**
 * Labels: your own way of grouping conversations in Communication, on top of
 * the triage Amara does. A label can nest under another one ("Roles / Senior
 * SRE"); filtering by a parent includes everything under it.
 */
import type { Label, LabelColor } from "./types";

export const LABEL_COLORS: Record<LabelColor, { name: string; dot: string }> = {
  grey: { name: "Grey", dot: "bg-fg-muted" },
  red: { name: "Red", dot: "bg-calls" },
  orange: { name: "Orange", dot: "bg-submittals" },
  violet: { name: "Violet", dot: "bg-interviews" },
  blue: { name: "Blue", dot: "bg-offers" },
  green: { name: "Green", dot: "bg-placements" },
};

export const LABELS: Label[] = [
  { id: "lb-new-business", name: "New business", color: "blue" },
  { id: "lb-counter", name: "Counter-offer risk", color: "red" },
  { id: "lb-fees", name: "Fee talks", color: "orange" },
  { id: "lb-roles", name: "Roles", color: "grey" },
  { id: "lb-sre", name: "Senior SRE", color: "violet", parentId: "lb-roles" },
  { id: "lb-em", name: "Engineering Manager", color: "violet", parentId: "lb-roles" },
  { id: "lb-data", name: "Lead Data Engineer", color: "violet", parentId: "lb-roles" },
  { id: "lb-referrals", name: "Referrals", color: "green" },
];

/** Labels already on conversations when the demo starts, by conversation key. */
export const SEED_LABELS: Record<string, string[]> = {
  "c:tidewater-bank:Priya Shah": ["lb-counter", "lb-data"],
  "p:Marcus Oyelaran": ["lb-counter", "lb-data"],
  "c:saltwater-co:Jess Morgan": ["lb-fees"],
  "c:brightline-rail:Nadia Kovac": ["lb-new-business"],
  "c:quokka-health:Amira Haddad": ["lb-new-business"],
  "c:corvid-labs:Elena Park": ["lb-new-business"],
  "c:fernhill-foods:Greg Tan": ["lb-new-business", "lb-fees"],
  "c:opal-insurance:Sophie Grant": ["lb-new-business"],
  "p:Rohan Iyer": ["lb-sre"],
  "p:Ben Nakamura": ["lb-sre"],
  "p:Priya Raman": ["lb-em"],
  "u:+61 412 889 301": ["lb-referrals", "lb-sre"],
};

/** Labels in reading order, children straight after their parent. */
export function labelTree(labels: Label[], parentId?: string, depth = 0): { label: Label; depth: number }[] {
  return labels
    .filter((l) => l.parentId === parentId)
    .flatMap((label) => [{ label, depth }, ...labelTree(labels, label.id, depth + 1)]);
}

/** A label and everything nested under it. */
export function withChildren(labels: Label[], id: string): string[] {
  return [id, ...labels.filter((l) => l.parentId === id).flatMap((l) => withChildren(labels, l.id))];
}

/** "Roles / Senior SRE". */
export function labelPath(labels: Label[], id: string): string {
  const l = labels.find((x) => x.id === id);
  if (!l) return "";
  return l.parentId ? `${labelPath(labels, l.parentId)} / ${l.name}` : l.name;
}
