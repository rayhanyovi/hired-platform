import { peopleRows, personStatus, profileKey, type PersonRow, type PersonStatus } from "./people";
import type { PipelineDetails } from "./candidate-pipeline";
import type { Applicant, Candidate, Client, Deal, FollowUp, Job } from "./types";

export type PlacementForm = { id: string; status: PersonStatus; details: PipelineDetails; at: number; actorId: string };
export type Placement = {
  id: string; candidateId: string; clientId: string; jobId?: string; status: PersonStatus;
  ownerId: string; createdAt: number; updatedAt: number; legacyDealId?: string; forms: PlacementForm[];
};
type TalentData = { deals: Deal[]; candidates: Candidate[]; applicants: Applicant[]; jobs: Job[]; followUps: FollowUp[] };

/** Existing source IDs, never names, identify the one shared talent record. */
export function talentRows(data: TalentData, manual: PersonRow[] = [], placements: Placement[] = []): PersonRow[] {
  const unique = new Map<string, PersonRow>();
  for (const row of [...peopleRows(data), ...manual]) {
    const id = profileKey(row);
    const previous = unique.get(id);
    const ids = [...new Set([...(previous?.ids ?? []), ...row.ids, id])];
    unique.set(id, { ...previous, ...row, key: id, candidateId: id, ids });
  }
  return [...unique.values()].map((row) => ({ ...row, ids: [...new Set([...row.ids, ...placements.filter((p) => p.candidateId === row.key).map((p) => p.id)])] }));
}
export function seedPlacements(talent: PersonRow[], clients: Client[]): Placement[] {
  return talent.filter((r) => r.deal && clients.some((c) => c.name === r.deal!.role.client)).map((r) => ({
    id: `placement-${r.deal!.id}`, candidateId: r.key,
    clientId: clients.find((c) => c.name === r.deal!.role.client)!.id,
    jobId: r.job?.id, status: r.status, ownerId: r.ownerId,
    createdAt: r.addedAt, updatedAt: r.lastTouch, legacyDealId: r.deal!.id, forms: [],
  }));
}
export function placementRows(placements: Placement[], talent: PersonRow[], clients: Client[], jobs: Job[], deals: Deal[]): PersonRow[] {
  return placements.flatMap((p) => {
    const person = talent.find((r) => r.key === p.candidateId);
    if (!person) return [];
    const job = jobs.find((j) => j.id === p.jobId);
    const client = clients.find((c) => c.id === p.clientId);
    return [{ ...person, key: p.id, ids: [...person.ids, p.id], placementId: p.id,
      candidateId: p.candidateId, status: p.status, job, roleTitle: job?.title ?? "Role to confirm",
      client: client?.name ?? "Unknown client", ownerId: p.ownerId, addedAt: p.createdAt,
      lastTouch: p.updatedAt, deal: deals.find((d) => d.id === p.legacyDealId),
    }];
  });
}
export function nextPlacementStatus(status: PersonStatus): PersonStatus {
  return ({ screening: "submitted", submitted: "interview", interview: "offer", final: "offer", offer: "offer-sent", "offer-sent": "placed" } as Partial<Record<PersonStatus, PersonStatus>>)[status] ?? "submitted";
}
export function isPlacementOpen(p: Placement) { return !["closed", "placed"].includes(personStatus(p.status).group); }

export function planPlacementCreation(existing: Placement[], candidateId: string, jobIds: string[], jobs: Job[], clients: Client[]) {
  if (!jobIds.length) throw new Error("Select at least one role.");
  const selected = [...new Set(jobIds)].map((id) => {
    const job = jobs.find((j) => j.id === id && j.status === "open");
    const client = clients.find((c) => c.name === job?.client && c.status === "active");
    if (!job || !client) throw new Error("Choose an open role at an active client.");
    if (existing.some((p) => p.candidateId === candidateId && p.clientId === client.id && p.jobId === job.id && isPlacementOpen(p))) throw new Error(`An active placement already exists for ${job.title} at ${client.name}.`);
    return { job, client };
  });
  return selected;
}
