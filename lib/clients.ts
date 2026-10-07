import { fee } from "./deal";
import type { Applicant, Candidate, Deal, Job } from "./types";

export type RolePeople = {
  job: Job;
  /** Applied, not yet screened by a human. */
  applicants: Applicant[];
  /** Shortlisted or contacted, not yet in the pipeline. */
  pool: Candidate[];
  /** In the pipeline, not placed. */
  live: Deal[];
  placed: Deal[];
};

/** Every role a client is hiring for, with everyone attached to it at each step. */
export function rolesFor(
  clientName: string,
  { jobs, applicants, candidates, deals }: { jobs: Job[]; applicants: Applicant[]; candidates: Candidate[]; deals: Deal[] },
): RolePeople[] {
  return jobs
    .filter((j) => j.client === clientName)
    .map((job) => {
      const roleDeals = deals.filter((d) => d.role.client === job.client && d.role.title === job.title);
      return {
        job,
        applicants: applicants.filter((a) => a.jobId === job.id && a.status === "new"),
        pool: candidates.filter((c) => c.jobId === job.id && c.status !== "pipeline"),
        live: roleDeals.filter((d) => d.stage !== "placed"),
        placed: roleDeals.filter((d) => d.stage === "placed"),
      };
    })
    .sort((a, b) => Number(a.job.status === "filled") - Number(b.job.status === "filled") || peopleCount(b) - peopleCount(a));
}

export const peopleCount = (r: RolePeople) => r.applicants.length + r.pool.length + r.live.length + r.placed.length;

export const liveFees = (roles: RolePeople[]) => roles.reduce((s, r) => s + r.live.reduce((t, d) => t + fee(d), 0), 0);
