"use client";
import { Fragment, useEffect, useState } from "react";
import { BriefcaseBusiness, ChevronDown, FolderOpen, LayoutGrid, ListChecks, Plus, Search, UsersRound } from "lucide-react";
import { useDesk, memberName } from "@/lib/store";
import { profileFor } from "@/lib/people";
import { CandidateCellEditor, CandidateRecordView } from "./profile";
import { Page, PageHeader } from "../ui/page-header";
import { StatCard, StatRow } from "../ui/metrics";
import { TableExpandControl, TableWorkspace } from "../ui/table-workspace";
import { TableHeader } from "../ui/table-header";
import { AmaraButton, Avatar, Button, cx } from "../ui/primitives";
import { Field, inputClass, compactSelectClass, Modal } from "../ui/modal";
import { ActorAvatar } from "../ui/member";

export function CandidatesPage() {
  const { talent, getCandidateProfile, candidateCollections, addCandidateCollection, focusPerson, setFocusPerson, archived, ask } = useDesk();
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("all");
  const [owner, setOwner] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCollection, setNewCollection] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [seenFocus, setSeenFocus] = useState<string | null>(null);
  if (focusPerson && focusPerson !== seenFocus) {
    const row = talent.find((r) => r.ids.includes(focusPerson));
    setSeenFocus(focusPerson); setOpenId(row?.key ?? null); setQuery(""); setCollection("all"); setOwner("all");
    setShowArchived(!!row && row.ids.some((id) => archived.includes(id)));
  }
  useEffect(() => { if (focusPerson) setFocusPerson(null); }, [focusPerson, setFocusPerson]);
  const active = talent.filter((r) => !r.ids.some((id) => archived.includes(id)));
  const visible = talent.filter((r) => r.ids.some((id) => archived.includes(id)) === showArchived).filter((r) => {
    const profile = getCandidateProfile(r);
    return (collection === "all" || profile.collections.includes(collection)) && (owner === "all" || r.ownerId === owner) && (!query || `${r.name} ${r.headline} ${profile.role} ${profile.location} ${profile.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  });
  const browseWithAmara = () => ask(`Review the talent pool data for ${visible.map((r) => r.name).join(", ")}. Identify missing profile information and suggest useful collection tags. Keep recommendations as drafts.`);
  return <Page wide>
    <PageHeader eyebrow="Candidates" title="Your talent pool." actions={<Button variant="primary" onClick={() => setAdding(true)}><Plus className="size-3.5" />Add candidate</Button>}>
      One profile for every person you know. Store their experience, qualifications, preferences and documents, and build a network you can return to.
    </PageHeader>
    <StatRow dataTour="people-stats" cols={4} className="mb-6">
      <StatCard icon={UsersRound} tile="bg-placements-tile" label="Saved candidates" value={active.length} />
      <StatCard icon={FolderOpen} tile="bg-submittals-tile" label="Collections" value={candidateCollections.length} />
      <StatCard icon={BriefcaseBusiness} tile="bg-offers-tile" label="With work history" value={active.filter((r) => getCandidateProfile(r).experience.length).length} />
      <StatCard icon={ListChecks} tile="bg-interviews-tile" label="Profiles to complete" value={active.filter((r) => !getCandidateProfile(r).education.length || !getCandidateProfile(r).salary).length} />
    </StatRow>
    <TableWorkspace title="Candidates" inlineControl>
    <div data-tour="people-filters" className="mb-5 flex flex-wrap items-center gap-2">
      <select aria-label="Candidate owner" className={compactSelectClass} value={owner} onChange={(e) => setOwner(e.target.value)}><option value="all">All owners</option>{[...new Set(talent.map((r) => r.ownerId))].map((id) => <option key={id} value={id}>{memberName(id)}</option>)}</select>
      <button aria-pressed={showArchived} onClick={() => setShowArchived(!showArchived)} className={cx("h-8 rounded-lg border px-3 text-xs", showArchived ? "border-line-strong bg-raised" : "border-line text-fg-muted")}>Archived</button>
      <AmaraButton size="sm" onClick={browseWithAmara}>Explore talent pool</AmaraButton>
      <div className="relative ml-auto w-full sm:w-64"><Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" /><input aria-label="Search candidates" placeholder="Search names, skills or locations" className={`${inputClass} h-8 pl-8 text-xs`} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    </div>
    <div data-tour="people-table" className="[contain:layout_paint] overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[900px] text-left text-[13px]">
        <TableHeader columns={[{ label: "Candidate" }, { label: "Role / profession" }, { label: "Location" }, { label: "Expected pay" }, { label: "Collections" }, { label: "Owner" }, { label: <TableExpandControl />, className: "w-10" }]} />
        <tbody className="divide-y divide-line">{visible.map((row) => <Fragment key={row.key}>
          <tr id={`person-${row.key}`} className="cursor-pointer transition-colors hover:bg-raised" onClick={() => setOpenId(openId === row.key ? null : row.key)}>
            <td className="px-5 py-3"><button aria-expanded={openId === row.key} className="flex items-center gap-3 text-left"><Avatar name={row.name} /><span><span className="block text-sm font-medium">{row.name}</span><span className="block max-w-64 truncate text-xs text-fg-faint">{row.headline}</span></span></button></td>
            <td className="max-w-52 px-3 py-3"><CandidateCellEditor row={row} field="role" /></td>
            <td className="max-w-40 px-3 py-3"><CandidateCellEditor row={row} field="location" /></td>
            <td className="max-w-40 px-3 py-3"><CandidateCellEditor row={row} field="salary" /></td>
            <td className="max-w-48 px-3 py-3 text-xs text-fg-muted">{getCandidateProfile(row).collections.join(", ") || "No collection"}</td>
            <td className="px-3 py-3"><ActorAvatar id={row.ownerId} size="xs" /></td>
            <td className="px-3 py-3"><ChevronDown className={cx("size-4 text-fg-faint", openId === row.key && "rotate-180")} /></td>
          </tr>
          {openId === row.key && <tr><td colSpan={7} className="p-0"><CandidateRecordView row={row} /></td></tr>}
        </Fragment>)}{!visible.length && <tr><td colSpan={7} className="px-5 py-12 text-center text-fg-faint">No candidates match these filters.</td></tr>}</tbody>
      </table>
    </div>
    <div data-tour="candidate-collections" className="sticky bottom-0 z-10 mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-2 py-2">
      <div role="tablist" aria-label="Candidate collections" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {["all", ...candidateCollections].map((name) => { const selected = collection === name; const count = active.filter((row) => name === "all" || getCandidateProfile(row).collections.includes(name)).length; const Icon = name === "all" ? LayoutGrid : FolderOpen; return <button key={name} role="tab" aria-selected={selected} onClick={() => setCollection(name)} className={cx("inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs transition-colors", selected ? "border-line-strong bg-raised text-fg" : "border-transparent text-fg-muted hover:bg-hover hover:text-fg")}><Icon className="size-3.5" />{name === "all" ? "All Candidates" : name}<span className="font-mono text-[10px] text-fg-faint">{count}</span></button>; })}
      </div>
      <Button size="sm" onClick={() => setCreatingCollection(true)} aria-label="Add collection" title="Add collection"><Plus className="size-3.5" /></Button>
    </div>
    </TableWorkspace>
    {creatingCollection && <Modal title="Create collection" description="Group saved candidates without duplicating their profiles." onClose={() => setCreatingCollection(false)}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const name = newCollection.trim(); if (!name) return; addCandidateCollection(name); setCollection(name); setNewCollection(""); setCreatingCollection(false); }}><Field label="Collection name" htmlFor="collection-name"><input autoFocus id="collection-name" required className={inputClass} value={newCollection} onChange={(e) => setNewCollection(e.target.value)} /></Field><div className="flex justify-end gap-2"><Button onClick={() => setCreatingCollection(false)}>Cancel</Button><Button type="submit" variant="primary" disabled={!newCollection.trim()}>Create collection</Button></div></form></Modal>}
    {adding && <AddTalentModal onClose={() => setAdding(false)} onCreated={(id) => { setQuery(""); setCollection("all"); setOwner("all"); setOpenId(id); }} />}
  </Page>;
}

function AddTalentModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { addTalent, notify } = useDesk();
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  return <Modal title="Add candidate to talent pool" description="Save a person once. Placement processes are managed separately." onClose={onClose}>
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; const profile = { ...profileFor({ key: "new", ids: [], name, firstName: name.split(" ")[0], headline, roleTitle: role, location, email, phone: "", status: "applied", addedAt: 0, lastTouch: 0, matches: [], gaps: [], ownerId: "" }), role, location, email, collections: [] }; const id = addTalent(name, headline, profile); onCreated(id); onClose(); notify("Candidate saved. Complete their profile whenever you have more information."); }}>
      {[ ["name", "Full name", name, setName], ["headline", "Professional headline", headline, setHeadline], ["role", "Role / profession", role, setRole], ["location", "Location", location, setLocation], ["email", "Email", email, setEmail] ].map(([id, label, value, update]) => <Field key={String(id)} label={String(label)} htmlFor={`new-${id}`}><input id={`new-${id}`} required={id === "name"} type={id === "email" ? "email" : "text"} className={inputClass} value={String(value)} onChange={(e) => (update as (v: string) => void)(e.target.value)} /></Field>)}
      <p className="text-xs text-fg-faint">Unknown qualifications can stay blank. Amara can help draft a summary once experience has been recorded.</p>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">Save candidate</Button></div>
    </form>
  </Modal>;
}
