"use client";
import { useState } from "react";
import { useDesk } from "@/lib/store";
import { isPlacementOpen } from "@/lib/placements";
import { Field, inputClass, Modal } from "../ui/modal";
import { AmaraButton, Button } from "../ui/primitives";

export function CreatePlacementsModal() {
  const { creatingPlacements, newPlacementCandidate } = useDesk();
  return creatingPlacements && <CreateForm key={newPlacementCandidate ?? "new"} initialCandidate={newPlacementCandidate} />;
}
function CreateForm({ initialCandidate }: { initialCandidate: string | null }) {
  const { talent, jobs, clients, placements, createPlacements, getCandidateProfile, setCreatingPlacements, setNewPlacementCandidate, log, notify } = useDesk();
  const [candidateId, setCandidateId] = useState(initialCandidate ?? "");
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const person = talent.find((r) => r.key === candidateId);
  const profile = person ? getCandidateProfile(person) : undefined;
  const close = () => { setCreatingPlacements(false); setNewPlacementCandidate(null); };
  const openJobs = jobs.filter((j) => j.status === "open" && clients.some((c) => c.name === j.client && c.status === "active"));
  const suggest = () => {
    if (!person || !profile) return;
    const words = `${profile.role} ${profile.skills.join(" ")} ${person.headline}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const matches = openJobs.filter((j) => words.some((word) => j.title.toLowerCase().includes(word))).map((j) => j.id);
    setSuggestions(matches);
    log({ action: "placement.ai_suggested", module: "Pipeline", summary: `Amara drafted role suggestions for ${person.name} from the recorded profession and skills`, kind: "note", subjectId: person.key });
  };
  return <Modal title="Start placements" description="One saved candidate, separate processes for each client and role. Existing attempts keep their history." size="lg" onClose={close}>
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (createPlacements(candidateId, jobIds)) { close(); notify(`${jobIds.length} independent placement process${jobIds.length === 1 ? "" : "es"} created`); } }}>
      <Field label="Candidate" htmlFor="placement-candidate"><select id="placement-candidate" required className={inputClass} value={candidateId} onChange={(e) => { setCandidateId(e.target.value); setJobIds([]); setSuggestions(null); }}><option value="">Select saved candidate</option>{talent.map((r) => <option key={r.key} value={r.key}>{r.name} · {getCandidateProfile(r).role || r.headline}</option>)}</select></Field>
      <div className="flex flex-wrap items-center gap-3"><AmaraButton size="sm" disabled={!person} onClick={suggest}>Suggest other roles</AmaraButton><p className="text-xs text-fg-faint">Suggestions use recorded role and skills. You choose which processes to start.</p></div>
      {suggestions && <p className="rounded-lg border border-line bg-ink-sunken p-3 text-xs text-fg-muted">Demo Amara: {suggestions.length ? `${suggestions.length} role titles overlap with the recorded profession or skills. Highlighted below; review the briefs before selecting.` : "No title matches found. Review available roles manually or complete the profile."} No candidate has been selected or submitted automatically.</p>}
      <input aria-label="Search placement roles" placeholder="Search roles or clients" className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} />
      <fieldset disabled={!candidateId}><legend className="mb-3 text-xs text-fg-muted">Select one or more roles across companies</legend><div className="max-h-72 space-y-2 overflow-y-auto">{openJobs.filter((j) => `${j.title} ${j.client}`.toLowerCase().includes(query.toLowerCase())).map((j) => {
        const client = clients.find((c) => c.name === j.client)!;
        const duplicate = placements.some((p) => p.candidateId === candidateId && p.clientId === client.id && p.jobId === j.id && isPlacementOpen(p));
        return <label key={j.id} className={`flex items-start gap-3 rounded-lg border border-line p-3 ${duplicate ? "opacity-40" : ""}`}><input type="checkbox" disabled={duplicate} checked={jobIds.includes(j.id)} onChange={(e) => setJobIds(e.target.checked ? [...jobIds, j.id] : jobIds.filter((id) => id !== j.id))} /><span className="min-w-0"><span className="block text-sm">{j.title}</span><span className="block text-xs text-fg-faint">{j.client} · {j.location}{duplicate ? " · Already active" : suggestions?.includes(j.id) ? " · Amara title match" : ""}</span></span></label>;
      })}</div></fieldset>
      <div className="flex justify-end gap-2"><Button onClick={close}>Cancel</Button><Button type="submit" variant="primary" disabled={!candidateId || !jobIds.length}>Start {jobIds.length || ""} {jobIds.length === 1 ? "placement" : "placements"}</Button></div>
    </form>
  </Modal>;
}
