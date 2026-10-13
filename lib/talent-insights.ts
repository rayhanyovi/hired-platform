import type { CandidateProfile, PersonRow } from "./people";
import type { Job } from "./types";

export type TalentInsight = { summary: string; matches: string[]; gaps: string[]; badge: string; source: string };

export function profileInsight(row: PersonRow, profile: CandidateProfile): TalentInsight {
  const facts = [profile.experience.length ? `${profile.experience.length} recorded work experience ${profile.experience.length === 1 ? "entry" : "entries"}.` : "Work experience has not been recorded.", profile.skills.length ? `Recorded skills: ${profile.skills.join(", ")}.` : "", profile.location ? `Based in ${profile.location}.` : "", profile.notice ? `Availability: ${profile.notice}.` : ""].filter(Boolean);
  return {
    summary: profile.summary || `${row.name} · ${row.headline || profile.role || "Professional background to confirm"}. ${facts.join(" ")}`,
    matches: [...profile.experience.slice(0, 2), ...(profile.skills.length ? [`Skills: ${profile.skills.join(", ")}`] : [])],
    gaps: [!profile.education.length && "Education not recorded", !profile.salary && "Salary expectations not recorded", !profile.notice && "Availability not recorded"].filter((v): v is string => !!v),
    badge: profile.summary ? "Reviewed summary" : "Profile read",
    source: profile.summary ? "Recruiter-reviewed summary and saved profile fields" : "Saved headline, experience, skills, location and availability",
  };
}

/** Saved screening is role-scoped; a new company never inherits another job's fit. */
export function placementInsight(row: PersonRow, profile: CandidateProfile, job?: Job): TalentInsight {
  job = job?.client === row.client ? job : undefined;
  const scoped = !!job && job.client === row.client && (row.applicant?.jobId === job.id || row.candidate?.jobId === job.id);
  const requirements = job?.requirements?.filter((r) => r.trim()) ?? [];
  if (requirements.length) {
    const evidence = [row.headline, profile.summary, ...profile.experience, ...profile.skills, ...(scoped ? row.matches : [])].filter((line) => line && !/\b(no|not|without|lack|lacks|never|hasn't)\b/i.test(line));
    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ");
    const supported = (requirement: string) => {
      const tokens = normalize(requirement).split(" ").filter((t) => t && !["and", "or", "the", "with", "a", "an", "of", "in", "experience"].includes(t));
      return tokens.length > 0 && evidence.some((line) => { const words = normalize(line).split(" "); return tokens.every((token) => words.includes(token)); });
    };
    const matches = requirements.filter(supported);
    const gaps = requirements.filter((r) => !supported(r));
    return { summary: `${matches.length} of ${requirements.length} recorded requirements have matching terms in ${row.name}'s saved evidence. ${gaps.length ? "Confirm the remaining requirements with the candidate." : "Review the evidence with the client before progressing."}`, matches, gaps, badge: `${matches.length}/${requirements.length} evidenced`, source: "Saved role requirements and candidate evidence · demo term matching, not a hiring recommendation" };
  }
  if (scoped && row.fit) return { summary: row.applicant?.summary ?? row.candidate?.summary ?? "Review the saved screening assessment against the current brief.", matches: row.matches, gaps: row.gaps, badge: { strong: "Strong fit", possible: "Possible fit", unlikely: "Unlikely fit" }[row.fit], source: "Saved demo screening for this exact company and role · current requirements have not been recorded" };
  return { summary: `${row.name}'s recorded background is ${row.headline || profile.role || "not yet documented"}. The target is ${job?.title ?? row.roleTitle ?? "a role to confirm"} at ${row.client}. Add the role requirements before assessing coverage.`, matches: [], gaps: ["Role requirements have not been recorded", ...(!profile.experience.length ? ["Candidate work experience needs confirmation"] : [])], badge: "Brief needed", source: "Shared candidate profile and selected company/role · no prior company's assessment reused" };
}
