"use client";

import { useState } from "react";
import {
  Archive,
  Award,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  FileText,
  GraduationCap,
  Languages,
  Laptop,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Sparkle,
  Target,
  Wallet,
} from "lucide-react";
import { historyFor, type CandidateProfile, type PersonRow } from "@/lib/people";
import { useDesk } from "@/lib/store";
import { ago } from "@/lib/time";
import type { Subject } from "@/lib/types";
import { History, InfoRow, Notes, RecordTabs } from "../records/record";
import { Swap } from "../ui/swap";
import { AmaraButton, Avatar, Button, cx } from "../ui/primitives";
import { Field, inputClass, Modal } from "../ui/modal";
import { RawApplication } from "../sourcing/application";
import { DOC_STATUS_LABEL, renderDoc } from "@/lib/documents";
import type { AgencyDoc, GeneratedDocKind } from "@/lib/types";
import { DocPaper } from "../documents/doc-paper";
import { profileInsight } from "@/lib/talent-insights";
import { InsightCard } from "./insight-card";
import { applicationFor } from "@/lib/application";

const listFields = ["experience", "education", "certifications", "skills", "languages", "links"] as const;
const fields: { key: keyof CandidateProfile; label: string; hint?: string }[] = [
  { key: "role", label: "Role / target role" }, { key: "location", label: "Location" },
  { key: "salary", label: "Expected salary", hint: "Include currency and period" }, { key: "currentSalary", label: "Current salary" },
  { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
  { key: "notice", label: "Notice period / availability" }, { key: "workPreference", label: "Work preference" },
  { key: "workRights", label: "Work authorization" }, { key: "summary", label: "Professional summary" },
  { key: "experience", label: "Work experience", hint: "One entry per line: role · employer · dates · achievements" },
  { key: "education", label: "Education", hint: "One qualification per line: degree · institution · dates" },
  { key: "certifications", label: "Certifications", hint: "One per line" },
  { key: "skills", label: "Skills", hint: "One per line" }, { key: "languages", label: "Languages", hint: "One per line" },
  { key: "links", label: "Professional links", hint: "One URL per line" },
];

/**
 * A candidate opened in place, laid out like a client or prospect: facts on
 * the left third, profile, history and notes on the right two thirds,
 * and the next steps in a footer.
 */
export function CandidateRecordView({ row }: { row: PersonRow }) {
  const { documents: agencyDocuments, clients, getCandidateProfile, saveCandidateProfile, candidateCollections, notify, log, events, placements, archived, toggleArchive, ask } = useDesk();
  const profile = getCandidateProfile(row);
  const [tab, setTab] = useState<"profile" | "history" | "notes">("profile");
  const [editing, setEditing] = useState(false);
  const [documents, setDocuments] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<AgencyDoc | null>(null);
  const linkedDocuments = agencyDocuments.filter((doc) => doc.candidateId === row.candidateId || (doc.dealId && row.ids.includes(doc.dealId)));
  const [draft, setDraft] = useState(profile);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const subject: Subject = { kind: "candidate", id: row.key, name: row.name };
  const history = historyFor(row, events);
  const placementCount = placements.filter((p) => p.candidateId === row.key).length;
  const isArchived = archived.includes(row.key);
  const missing = [!profile.education.length && "education", !profile.salary && "salary expectations", !profile.notice && "availability", !profile.certifications.length && "certifications"].filter(Boolean);
  const edit = () => {
    setDraft(profile);
    setEditing(true);
  };
  const generate = () => {
    setAiDraft(profileInsight(row, profile).summary);
    setAiOpen(true);
    log({ action: "candidate.ai_drafted", module: "Candidates", summary: `Amara drafted a profile summary for ${row.name}`, kind: "note", subjectId: row.key });
  };
  const value = (v: string) => (v ? v : <span className="text-fg-faint">Not recorded</span>);

  return (
    <div className="max-w-[calc(100vw-2rem)] animate-rise border-t border-line bg-ink-sunken/70 lg:max-w-none">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="min-w-0 border-b border-line p-5 lg:border-r lg:border-b-0">
          <div className="text-[11px] tracking-[0.08em] text-fg-faint uppercase">Candidate</div>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={row.name} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-medium">{row.name}</div>
              <div className="truncate text-[12px] text-fg-faint">{row.headline}</div>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-2">
            <InfoRow icon={Target} label="Role">{value(profile.role)}</InfoRow>
            <InfoRow icon={MapPin} label="Location">{value(profile.location)}</InfoRow>
            <InfoRow icon={Banknote} label="Expected">{value(profile.salary)}</InfoRow>
            <InfoRow icon={Wallet} label="Current">{value(profile.currentSalary)}</InfoRow>
            <InfoRow icon={Mail} label="Email"><span className="block truncate">{value(profile.email)}</span></InfoRow>
            <InfoRow icon={Phone} label="Phone"><span className="num">{value(profile.phone)}</span></InfoRow>
            <InfoRow icon={CalendarClock} label="Notice">{value(profile.notice)}</InfoRow>
            <InfoRow icon={Laptop} label="Works">{value(profile.workPreference)}</InfoRow>
            <InfoRow icon={BadgeCheck} label="Work rights">{value(profile.workRights)}</InfoRow>
          </div>
        </aside>

        <section className="min-w-0 p-5">
          <RecordTabs
            label="Candidate view"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "profile", label: "Profile" },
              { id: "history", label: "History", count: history.length },
              { id: "notes", label: "Notes" },
            ]}
            aside={
              <AmaraButton size="sm" onClick={() => ask(`Summarize the recorded history for ${row.name}. Use the saved profile and events only; identify information that needs confirmation.`)}>
                Read with Amara
              </AmaraButton>
            }
          />
          <Swap id={tab} className="pt-4">
            {tab === "history" ? (
              <History events={history} />
            ) : tab === "notes" ? (
              <Notes subject={subject} ids={row.ids} />
            ) : (
              <div className="space-y-5">
                <InsightCard title="AI profile summary" insight={profileInsight(row, profile)} matchesLabel="Recorded strengths" gapsLabel="To complete" actions={<div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => { setSelectedDoc(null); setDocuments(true); }}>See documents</Button><AmaraButton size="sm" onClick={generate}>Review summary</AmaraButton></div>} />
                <div className="grid gap-5 sm:grid-cols-2">
                {listFields.map((key) => (
                  <section key={key} className={key === "experience" ? "sm:col-span-2" : undefined}>
                    <SectionLabel icon={LIST_ICON[key]}>{LIST_LABEL[key]}</SectionLabel>
                    {profile[key].length ? (
                      key === "skills" || key === "languages" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {profile[key].map((entry, i) => (
                            <span key={i} className="rounded-md border border-line-strong bg-surface px-2 py-0.5 text-[12px] text-fg-muted">
                              {entry}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                          {profile[key].map((entry, i) => (
                            <li key={i} className="px-3.5 py-2.5 text-[13px] leading-relaxed break-words text-fg-muted">
                              {entry}
                            </li>
                          ))}
                        </ul>
                      )
                    ) : (
                      <button onClick={edit} className="inline-flex items-center gap-1.5 text-[12px] text-fg-faint transition-colors hover:text-fg">
                        <Plus className="size-3" /> Add {LIST_LABEL[key].toLowerCase()}
                      </button>
                    )}
                  </section>
                ))}
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <div className="mb-2 text-[11px] text-fg-faint">Collections</div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidateCollections.map((name) => {
                      const on = profile.collections.includes(name);
                      return (
                        <button
                          key={name}
                          aria-pressed={on}
                          onClick={() => saveCandidateProfile(row, { ...profile, collections: on ? profile.collections.filter((n) => n !== name) : [...profile.collections, name] })}
                          className={cx("inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] transition-colors", on ? "border-fg/25 bg-raised text-fg" : "border-dashed border-line-strong text-fg-faint hover:text-fg")}
                        >
                          {on ? <Check className="size-3" /> : <Plus className="size-3" />}
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Swap>
        </section>

      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">
        <Button size="sm" variant="primary" onClick={edit}>
          <Pencil className="size-3.5" /> Edit profile
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setSelectedDoc(null);
            setDocuments(true);
          }}
        >
          <FileText className="size-3.5" /> Documents{linkedDocuments.length ? <span className="font-mono text-[10px] text-fg-faint num">{linkedDocuments.length}</span> : null}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toggleArchive({ kind: "candidate", id: row.key, name: row.name })}>
          <Archive className="size-3.5" /> {isArchived ? "Restore profile" : "Archive profile"}
        </Button>
        <span className="ml-auto text-[11px] text-fg-faint num">
          Saved {ago(row.addedAt)} · {placementCount} {placementCount === 1 ? "placement" : "placements"}
        </span>
      </footer>

      {editing && (
        <Modal title={`Edit ${row.name}'s profile`} description="All fields are recruiter-entered. Leave unknown information blank." size="lg" onClose={() => setEditing(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCandidateProfile(row, draft);
              setEditing(false);
              notify("Candidate profile saved");
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {fields.map(({ key, label, hint }) => {
              const multiline = key === "summary" || listFields.some((k) => k === key);
              return (
                <div key={key} className={multiline ? "sm:col-span-2" : ""}>
                  <Field label={label} hint={hint} htmlFor={`profile-${key}`}>
                    {multiline ? (
                      <textarea
                        id={`profile-${key}`}
                        className={`${inputClass} min-h-24 py-2`}
                        value={Array.isArray(draft[key]) ? draft[key].join("\n") : draft[key]}
                        onChange={(e) => setDraft({ ...draft, [key]: listFields.some((k) => k === key) ? e.target.value.split("\n") : e.target.value })}
                      />
                    ) : (
                      <input id={`profile-${key}`} className={inputClass} value={String(draft[key])} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                    )}
                  </Field>
                </div>
              );
            })}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" variant="primary">
                Save profile
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {documents && (
        <Modal title={selectedDoc?.title ?? `${row.name} · documents`} size="lg" onClose={() => setDocuments(false)}>
          {selectedDoc ? (
            <div className="space-y-4">
              <Button size="sm" onClick={() => setSelectedDoc(null)}>
                Back to documents
              </Button>
              {selectedDoc.direction === "generated" ? (
                <DocPaper doc={renderDoc(selectedDoc.kind as GeneratedDocKind, { deal: row.deal, client: clients.find((c) => c.name === selectedDoc.client), note: selectedDoc.note, date: selectedDoc.at })} />
              ) : (
                <div className="rounded-xl border border-line bg-ink-sunken p-5">
                  <p className="text-sm">{selectedDoc.fileName ?? selectedDoc.title}</p>
                  <p className="mt-2 text-xs text-fg-muted">{selectedDoc.note || "Document logged as received."}</p>
                  <p className="mt-3 text-xs text-fg-faint">Original file storage is not connected in this prototype.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {linkedDocuments.map((doc) => (
                <button key={doc.id} onClick={() => setSelectedDoc(doc)} className="flex w-full justify-between gap-4 rounded-lg border border-line bg-ink-sunken p-3 text-left text-xs">
                  <span>{doc.title}</span>
                  <span className="text-fg-faint">{DOC_STATUS_LABEL[doc.status]}</span>
                </button>
              ))}
              {row.applicant ? <RawApplication app={applicationFor(row.applicant, row.job)} applicant={row.applicant} job={row.job} /> : !linkedDocuments.length && <p className="text-sm text-fg-muted">No documents recorded for this candidate yet.</p>}
            </div>
          )}
        </Modal>
      )}
      {aiOpen && (
        <Modal title="Amara · profile draft" description="Demo assistant · built only from the existing headline and recorded experience. No external enrichment or live model is connected." onClose={() => setAiOpen(false)}>
          <textarea aria-label="AI profile summary draft" value={aiDraft ?? ""} onChange={(e) => setAiDraft(e.target.value)} className={`${inputClass} min-h-32 py-2`} />
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">Still to confirm: {missing.join(", ") || "review all details with the candidate"}. Amara does not invent missing qualifications.</p>
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                saveCandidateProfile(row, { ...profile, summary: aiDraft ?? "" });
                setAiOpen(false);
                notify("Reviewed summary saved");
              }}
            >
              Use reviewed summary
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const LIST_LABEL: Record<(typeof listFields)[number], string> = {
  experience: "Work experience",
  education: "Education",
  certifications: "Certifications",
  skills: "Skills",
  languages: "Languages",
  links: "Links",
};
const LIST_ICON: Record<(typeof listFields)[number], typeof FileText> = {
  experience: BriefcaseBusiness,
  education: GraduationCap,
  certifications: Award,
  skills: Sparkle,
  languages: Languages,
  links: Link2,
};

function SectionLabel({ icon: Icon, children }: { icon: typeof FileText; children: React.ReactNode }) {
  return (
    <h4 className="mb-2 flex items-center gap-2 text-[12px] font-medium text-fg-muted">
      <Icon className="size-3.5 text-fg-faint" strokeWidth={1.75} />
      {children}
    </h4>
  );
}

export function CandidateCellEditor({ row, field }: { row: PersonRow; field: "role" | "location" | "salary" }) {
  const { getCandidateProfile, saveCandidateProfile } = useDesk();
  const profile = getCandidateProfile(row);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  return <div className="min-w-0" onClick={(e) => e.stopPropagation()}>{editing ? <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); saveCandidateProfile(row, { ...profile, [field]: value.trim() }); setEditing(false); }}><input autoFocus aria-label={`Edit ${field} for ${row.name}`} className={`${inputClass} h-7 min-w-0 px-2 text-xs`} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setEditing(false); } }} /><button type="submit" aria-label={`Save ${field}`} className="text-xs text-fg-muted">Save</button></form> : <button aria-label={`Edit ${field} for ${row.name}`} title={profile[field] || `Add ${field}`} onClick={() => { setValue(profile[field]); setEditing(true); }} className="group flex w-full min-w-0 items-center gap-1 text-left text-xs text-fg-muted hover:text-fg"><span className="truncate">{profile[field] || `Add ${field}`}</span><Pencil className="size-3 shrink-0 opacity-0 group-hover:opacity-100 group-focus:opacity-100" /></button>}</div>;
}
