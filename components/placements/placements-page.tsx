"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, BriefcaseBusiness, Building2, CalendarClock, FileText, ChevronDown, Columns3, GitBranch, MapPin, Pencil, Plus, Target, UsersRound, Search, Table2, UserRoundCheck, Workflow } from "lucide-react";
import { useDesk, memberName } from "@/lib/store";
import { PERSON_STATUSES, personStatus, type PersonRow } from "@/lib/people";
import { isPlacementOpen, nextPlacementStatus } from "@/lib/placements";
import { placementInsight } from "@/lib/talent-insights";
import { money } from "@/lib/deal";
import { InsightCard } from "../candidates/insight-card";
import { Swap } from "../ui/swap";
import { ago } from "@/lib/time";
import { Page, PageHeader } from "../ui/page-header";
import { StatCard, StatRow } from "../ui/metrics";
import { TableWorkspace } from "../ui/table-workspace";
import { TableHeader } from "../ui/table-header";
import { AmaraButton, Avatar, Button, cx } from "../ui/primitives";
import { Field, compactSelectClass, inputClass, Modal } from "../ui/modal";
import { Segmented, StatusMenu } from "../ui/menu";
import { History, InfoRow, Notes, RecordTabs } from "../records/record";

export function PlacementStatusMenu({ row }: { row: PersonRow }) {
  const { setPersonStatus, notify } = useDesk();
  return <StatusMenu label={`Placement status for ${row.name} at ${row.client}`} value={row.status} allowReselect onChange={(to) => { if (setPersonStatus(row, to)) notify(`${row.name} at ${row.client} moved to ${personStatus(to).label}`); }} options={PERSON_STATUSES.map((status) => ({ id: status.id, label: status.label, dot: status.dot, hint: status.description }))} />;
}

export function PlacementsPage() {
  const { placements, placementPeople, clients, setCreatingPlacements, setNewPlacementCandidate, ask, setPersonStatus } = useDesk();
  const [view, setView] = useState<"list" | "board">("list");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [clientId, setClientId] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PersonRow | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const visible = placementPeople.filter((row) => {
    const p = placements.find((p) => p.id === row.placementId)!;
    return (filter === "all" || (filter === "open" ? isPlacementOpen(p) : !isPlacementOpen(p))) && (clientId === "all" || p.clientId === clientId) && (!query || `${row.name} ${row.client} ${row.roleTitle}`.toLowerCase().includes(query.toLowerCase()));
  });
  const progress = (row: PersonRow) => {
    if (["closed", "placed"].includes(personStatus(row.status).group)) { setNewPlacementCandidate(row.candidateId ?? null); setCreatingPlacements(true); }
    else setPersonStatus(row, nextPlacementStatus(row.status));
  };
  const begin = () => { setNewPlacementCandidate(null); setCreatingPlacements(true); };
  return <Page wide>
    <PageHeader eyebrow="Placements" title="Every opportunity, its own story." actions={<Button variant="primary" onClick={begin}><Plus className="size-3.5" />Start placements</Button>}>
      Track each candidate with each company independently. When one opportunity ends, their profile stays in your talent pool for the next one.
    </PageHeader>
    <StatRow dataTour="placement-stats" cols={4} className="mb-6">
      <StatCard icon={Workflow} tile="bg-submittals-tile" label="Open processes" value={placements.filter(isPlacementOpen).length} />
      <StatCard icon={Building2} tile="bg-offers-tile" label="Companies" value={new Set(placements.filter(isPlacementOpen).map((p) => p.clientId)).size} />
      <StatCard icon={GitBranch} tile="bg-interviews-tile" label="In multiple processes" value={new Set(placements.filter((p) => isPlacementOpen(p) && placements.filter((other) => other.candidateId === p.candidateId && isPlacementOpen(other)).length > 1).map((p) => p.candidateId)).size} />
      <StatCard icon={UserRoundCheck} tile="bg-placements-tile" label="Placed" value={placements.filter((p) => p.status === "placed").length} />
    </StatRow>
    <TableWorkspace title="Placements">
    <div data-tour="placement-filters" className="mb-5 flex flex-wrap items-center gap-2">
      <Segmented label="Placement view" value={view} onChange={setView} options={[{ id: "list", label: "List", icon: Table2 }, { id: "board", label: "Board", icon: Columns3 }]} />
      <Segmented label="Placement scope" value={filter} onChange={setFilter} options={[{ id: "open", label: "Open" }, { id: "all", label: "All" }, { id: "closed", label: "Closed & placed" }]} />
      <select aria-label="Placement client" className={compactSelectClass} value={clientId} onChange={(e) => setClientId(e.target.value)}><option value="all">All clients</option>{clients.filter((c) => c.status === "active").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <AmaraButton size="sm" onClick={() => ask("Review the open placements. Suggest next actions using each company's process and recorded history; do not change status or submit anyone.")}>Plan next moves</AmaraButton>
      <div className="relative ml-auto w-full sm:w-60"><Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" /><input aria-label="Search placements" placeholder="Search candidates or companies" className={`${inputClass} h-8 pl-8 text-xs`} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    </div>
    {view === "list" ? <div data-tour="placement-list" className="[contain:layout_paint] overflow-x-auto rounded-2xl border border-line bg-surface"><table className="w-full min-w-[850px] text-left text-[13px]">
      <TableHeader columns={[{ label: "Candidate" }, { label: "Client / role" }, { label: "Status" }, { label: "Last activity" }, { label: "Owner" }, { label: "", className: "w-10" }]} />
      <tbody className="divide-y divide-line">{visible.map((row) => <Fragment key={row.key}><tr id={`placement-${row.key}`} onClick={() => setOpenId(openId === row.key ? null : row.key)} style={{ backgroundColor: `${personStatus(row.status).color}0d` }} className="cursor-pointer transition-colors hover:bg-raised">
        <td className="px-5 py-3"><button aria-expanded={openId === row.key} className="flex items-center gap-3 text-left"><Avatar name={row.name} /><span><span className="block text-sm font-medium">{row.name}</span><span className="block text-xs text-fg-faint">{row.headline}</span></span></button></td>
        <td className="px-3 py-3"><span className="block text-sm">{row.client}</span><span className="block text-xs text-fg-faint">{row.roleTitle}</span></td>
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><PlacementStatusMenu row={row} /></td>
        <td className="px-3 py-3 text-xs text-fg-muted">{ago(row.lastTouch)}</td><td className="px-3 py-3 text-xs text-fg-muted">{memberName(row.ownerId)}</td><td className="px-3 py-3"><ChevronDown className={cx("size-4 text-fg-faint", openId === row.key && "rotate-180")} /></td>
      </tr>{openId === row.key && <tr><td colSpan={6} className="p-0"><PlacementRecord row={row} /></td></tr>}</Fragment>)}{!visible.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-fg-faint">No placements match. Start one from a saved talent profile.</td></tr>}</tbody>
    </table></div> : <div data-tour="placement-board" className="overflow-x-auto pb-4"><div className="flex gap-3">
      {PERSON_STATUSES.filter((s) => filter === "all" || (filter === "closed" ? ["closed", "placed"].includes(s.group) : !["closed", "placed"].includes(s.group))).map((s) => <section key={s.id} aria-label={`${s.label} placements`} className="min-h-80 w-64 shrink-0 rounded-xl border border-line bg-ink-sunken/50 p-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const row = visible.find((r) => r.key === dragId); setDragId(null); if (row) setPersonStatus(row, s.id); }}>
        <h2 className="mb-3 flex items-center gap-2 px-2 py-1 text-sm"><span className={cx("h-3 w-1 rounded-full", s.dot)} />{s.label}<span className="ml-auto text-xs text-fg-faint num">{visible.filter((r) => r.status === s.id).length}</span></h2>
        <div className="space-y-2">{visible.filter((r) => r.status === s.id).map((row) => <article key={row.key} className="rounded-lg border border-line bg-surface p-3" draggable onDragStart={() => setDragId(row.key)} onDragEnd={() => setDragId(null)}>
          <button onClick={() => progress(row)} className="w-full text-left" aria-label={`Progress ${row.name} at ${row.client}`}><span className="block text-sm font-medium">{row.name}</span><span className="mt-1 block text-xs text-fg-muted">{row.client}</span><span className="mt-1 block text-xs text-fg-faint">{row.roleTitle} · {row.location}</span></button>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2"><button onClick={() => setDetail(row)} className="text-xs text-fg-muted hover:text-fg">Details & history</button><Button size="sm" onClick={() => progress(row)}>Progress<ArrowRight className="size-3" /></Button></div>
        </article>)}</div>
      </section>)}
    </div></div>}
    </TableWorkspace>
    {detail && <Modal title={`${detail.name} · ${detail.client}`} size="lg" onClose={() => setDetail(null)}><PlacementRecord row={placementPeople.find((r) => r.key === detail.key) ?? detail} /></Modal>}
  </Page>;
}

function PlacementRecord({ row }: { row: PersonRow }) {
  const { placements, events, getCandidateProfile, setPersonStatus, setFocusPerson, setNewPlacementCandidate, setCreatingPlacements, log, clients, jobs, addNote, notify, saveJobRequirements } = useDesk();
  const [tab, setTab] = useState<"details" | "history" | "notes">("details");
  const [read, setRead] = useState<string | null>(null);
  const [editingBrief, setEditingBrief] = useState(false);
  const [brief, setBrief] = useState("");
  const p = placements.find((p) => p.id === row.placementId)!;
  const profile = getCandidateProfile(row);
  const job = jobs.find((j) => j.id === p.jobId);
  const fit = placementInsight(row, profile, job);
  const history = events.filter((e) => e.subjectId === p.id || (p.jobId && e.subjectId === p.jobId) || (p.legacyDealId && e.dealId === p.legacyDealId));
  const ai = () => {
    const profile = getCandidateProfile(row);
    setRead(`${row.name} is ${personStatus(p.status).label.toLowerCase()} for ${row.roleTitle} at ${row.client}. ${personStatus(p.status).group === "closed" ? "Keep the person in your talent pool and review another company's brief. This outcome applies only to this placement." : `Next: complete the ${personStatus(nextPlacementStatus(p.status)).label.toLowerCase()} form for this company.`} ${profile.experience.length ? `${profile.experience.length} experience entries are recorded.` : "Work history needs confirmation."} ${!profile.education.length ? "Education has not been recorded." : "Education is recorded; verify it against the source documents."} Recent history: ${history.slice(0, 3).map((event) => event.summary).join("; ") || "No events recorded yet."}`);
    log({ action: "placement.ai_drafted", module: "Pipeline", summary: `Amara drafted next steps for ${row.name} at ${row.client}`, kind: "note", subjectId: p.id });
  };
  const labelValue = (key: string, value: unknown) => key === "client" ? clients.find((c) => c.id === value)?.name : key === "role" ? jobs.find((j) => j.id === value)?.title : Array.isArray(value) ? value.map((id) => clients.find((c) => c.id === id)?.name ?? jobs.find((j) => j.id === id)?.title ?? id).join(", ") : String(value);
  return <div className="max-w-[calc(100vw-2rem)] animate-rise border-t border-line bg-ink-sunken/70 lg:max-w-none">
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside className="min-w-0 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Placement</div>
        <div className="mt-3 flex items-center gap-3"><Avatar name={row.name} size="lg" /><div className="min-w-0"><div className="truncate text-[15px] font-medium">{row.name}</div><div className="truncate text-xs text-fg-faint">{row.headline}</div></div></div>
        <div className="mt-4 border-t border-line pt-2">
          <InfoRow icon={Building2} label="Company">{row.client}</InfoRow>
          <InfoRow icon={BriefcaseBusiness} label="Role">{row.roleTitle}</InfoRow>
          <InfoRow icon={MapPin} label="Location">{job?.location || "Not recorded"}</InfoRow>
          <InfoRow icon={Banknote} label="Role budget">{job?.salary ? money(job.salary) : "Not recorded"}</InfoRow>
          <InfoRow icon={Target} label="Expected">{profile.salary || "Not recorded"}</InfoRow>
          <InfoRow icon={UsersRound} label="Owner">{memberName(p.ownerId)}</InfoRow>
          <InfoRow icon={CalendarClock} label="Started">{ago(p.createdAt)}</InfoRow>
        </div>
        <div className="mt-3 border-t border-line pt-3"><div className="mb-2 text-[11px] text-fg-faint">Current stage</div><PlacementStatusMenu row={row} /><p className="mt-2 text-xs leading-relaxed text-fg-faint">{personStatus(row.status).description}</p></div>
        <Link onClick={() => setFocusPerson(p.candidateId)} href="/candidates" className="mt-4 inline-flex items-center gap-2 text-xs text-fg-muted hover:text-fg">Open shared profile<ArrowRight className="size-3.5" /></Link>
      </aside>
      <section className="min-w-0 p-4">
        <RecordTabs label="Placement detail" value={tab} onChange={setTab} tabs={[{ id: "details", label: "Assessment" }, { id: "history", label: "History", count: history.length }, { id: "notes", label: "Notes" }]} aside={<AmaraButton size="sm" onClick={ai}>Draft next steps</AmaraButton>} />
        <Swap id={tab} className="pt-4">
          {tab === "history" ? <History events={history} /> : tab === "notes" ? <Notes subject={{ kind: "candidate", id: p.id, name: `${row.name} · ${row.client}` }} /> : <div className="space-y-5">
            <InsightCard title="AI role fit" insight={fit} matchesLabel="Matches the brief" gapsLabel="Gaps / to confirm" actions={job ? <Button size="sm" variant="ghost" onClick={() => { setBrief(job.requirements?.join("\n") ?? ""); setEditingBrief(true); }}><Pencil className="size-3" />{job.requirements?.length ? "Edit requirements" : "Add requirements"}</Button> : undefined} />
            {job?.requirements?.length ? <section><h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-fg-muted"><BriefcaseBusiness className="size-3.5" />Role requirements</h4><ul className="divide-y divide-line rounded-xl border border-line bg-surface">{job.requirements.map((requirement, i) => <li key={i} className="px-3.5 py-2.5 text-xs leading-relaxed text-fg-muted">{requirement}</li>)}</ul></section> : null}
            {read && <div className="amara-edge rounded-xl p-4"><label htmlFor={`next-${p.id}`} className="text-xs text-fg-muted">Amara draft · source: this placement, shared profile and recorded history</label><textarea id={`next-${p.id}`} className={`${inputClass} mt-2 min-h-28 py-2`} value={read} onChange={(e) => setRead(e.target.value)} /><div className="mt-3"><Button size="sm" onClick={() => { if (!read.trim()) return; addNote({ kind: "candidate", id: p.id, name: `${row.name} · ${row.client}` }, read); setRead(null); notify("Reviewed next steps saved to this placement"); }}>Save reviewed next steps</Button></div></div>}
            {row.deal?.read && <section><h4 className="mb-2 text-xs font-medium text-fg-muted">Recorded placement context</h4><p className="text-xs leading-relaxed text-fg-muted">{row.deal.read}</p></section>}
            <section><h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-fg-muted"><FileText className="size-3.5" />Process records<span className="ml-auto font-mono text-[10px] text-fg-faint">{p.forms.length} completed</span></h4>
              {p.forms.length ? <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">{p.forms.slice().reverse().map((form) => <details key={form.id} className="p-3.5"><summary className="cursor-pointer text-xs text-fg-muted">{personStatus(form.status).label} · {ago(form.at)} · {memberName(form.actorId)}</summary><dl className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(form.details).filter(([, v]) => v !== "" && (!Array.isArray(v) || v.length)).map(([key, value]) => <div key={key}><dt className="text-[11px] capitalize text-fg-faint">{key.replace(/([A-Z])/g, " $1")}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-xs text-fg-muted">{labelValue(key, value)}</dd></div>)}</dl></details>)}</div> : <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-fg-muted">No completed forms yet.</p><p className="mt-1 text-xs text-fg-faint">Progress this placement to record its next step. Required forms open before the stage changes.</p></div>}
            </section>
          </div>}
        </Swap>
      </section>
    </div>
    <footer className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
      <Button size="sm" variant="primary" onClick={() => setPersonStatus(row, nextPlacementStatus(row.status))}>Progress this placement<ArrowRight className="size-3.5" /></Button>
      <Button size="sm" onClick={() => { setNewPlacementCandidate(p.candidateId); setCreatingPlacements(true); }}><Plus className="size-3.5" />Start another placement</Button>
      <span className="ml-auto text-[11px] text-fg-faint">Updated {ago(p.updatedAt)} · Outcome applies to this company only</span>
    </footer>
    {editingBrief && job && <Modal title={`${job.title} · requirements`} description={`Saved for ${job.client}. Every placement for this role uses the same brief.`} onClose={() => setEditingBrief(false)}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveJobRequirements(job.id, brief.split("\n")); setEditingBrief(false); notify("Role requirements saved. Fit evidence updated."); }}><Field label="Requirements" htmlFor={`brief-${p.id}`} hint="One requirement per line. Use the client's actual brief."><textarea id={`brief-${p.id}`} className={`${inputClass} min-h-40 py-2`} value={brief} onChange={(e) => setBrief(e.target.value)} /></Field><div className="flex justify-end gap-2"><Button onClick={() => setEditingBrief(false)}>Cancel</Button><Button type="submit" variant="primary">Save requirements</Button></div></form></Modal>}
  </div>;
}
