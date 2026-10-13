import { redirect } from "next/navigation";

/** Applicants, the shortlist and the pipeline are one list on Candidates now. */
export default function MovedToCandidates() {
  redirect("/candidates");
}
