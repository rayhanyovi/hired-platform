import type { ProspectStage } from "./types";

/**
 * The sales conversation, in order. Signed terms is where a prospect becomes a client.
 * Neutral dots: only "follow up" (needs you) and "signed" (done) carry colour.
 */
export const PROSPECT_STAGES: { id: ProspectStage; label: string; description: string; dot: string }[] = [
  { id: "new", label: "New", description: "Added, not contacted yet.", dot: "bg-fg-faint" },
  { id: "interested", label: "Interested", description: "They've replied and want to hear more.", dot: "bg-fg-muted" },
  { id: "follow-up", label: "Follow up", description: "Waiting on them. Chase if it goes quiet.", dot: "bg-warm" },
  { id: "meeting", label: "Meeting", description: "A call or meeting is booked or done.", dot: "bg-fg-muted" },
  { id: "negotiation", label: "Negotiation", description: "Talking fee, rebate and exclusivity.", dot: "bg-fg" },
  { id: "terms-sent", label: "Terms sent", description: "Your Terms of Business are with them to sign.", dot: "bg-fg" },
  { id: "terms-signed", label: "Terms signed", description: "Signed. Make them a client and start on roles.", dot: "bg-placements" },
];

export const prospectStage = (id: ProspectStage | undefined) => PROSPECT_STAGES.find((s) => s.id === (id ?? "new")) ?? PROSPECT_STAGES[0];

/** Mocked "Find people at…" results: who Amara would surface at a company. */
export function suggestedContacts(company: string, domain = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com.au`) {
  return [
    { name: "Hannah Brooks", title: "Head of Talent Acquisition", email: `hannah.brooks@${domain}` },
    { name: "Marcus Lee", title: "Chief People Officer", email: `marcus.lee@${domain}` },
  ];
}
