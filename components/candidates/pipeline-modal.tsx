"use client";

import { useState } from "react";
import { FORM_ACTIONS, FORM_TITLES, validatePipeline, type PipelineDetails } from "@/lib/candidate-pipeline";
import { personStatus, type PersonRow, type PersonStatus } from "@/lib/people";
import { useDesk } from "@/lib/store";
import { Field, inputClass, Modal } from "../ui/modal";
import { AmaraButton, Button } from "../ui/primitives";

export function CandidatePipelineModal() {
  const { pendingCandidateTransition } = useDesk();
  return pendingCandidateTransition && <PipelineForm key={`${pendingCandidateTransition.row.key}-${pendingCandidateTransition.to}`} {...pendingCandidateTransition} />;
}

function PipelineForm({ row, to }: { row: PersonRow; to: PersonStatus }) {
  const { clients, jobs, members, me, getCandidateProfile, setPersonStatus, setPendingCandidateTransition, notify, placements, log } = useDesk();
  const profile = getCandidateProfile(row);
  const placement = placements.find((p) => p.id === row.placementId);
  const allowedClients = clients.filter((c) => c.id === placement?.clientId);
  const [data, setData] = useState<PipelineDetails>({ timezone: "America/New_York", email: profile.email, assignee: me.id, interviewType: "Virtual Interview", attendees: "Candidate + Client", meetingNotes: true, submittalType: "Client Submittal", emailStyle: "Concise highlights", documentType: "Offer Letter", client: placement?.clientId ?? "", role: placement?.jobId ?? "", roles: placement?.jobId ? [placement.jobId] : [], clients: placement ? [placement.clientId] : [], contacts: [], attachments: [], includePay: false });
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [aiNote, setAiNote] = useState(false);
  const set = (key: string, value: string | string[] | boolean) => { setData((prev) => ({ ...prev, [key]: value })); setError(null); };
  const client = clients.find((c) => c.id === data.client);
  const roles = jobs.filter((j) => j.client === client?.name && (!placement?.jobId || j.id === placement.jobId));
  const contacts = client ? [client.contact, ...(client.contacts ?? [])] : [];
  const close = () => setPendingCandidateTransition(null);
  const field = (key: string, label: string, type = "text", optional = false) => <Field label={label} hint={optional ? "Optional" : undefined} htmlFor={`pipeline-${key}`}><input id={`pipeline-${key}`} type={type} name={key} required={!optional} className={inputClass} value={String(data[key] ?? "")} onInput={(e) => set(key, e.currentTarget.value)} onChange={(e) => set(key, e.target.value)} /></Field>;
  const text = (key: string, label: string, optional = false) => <Field label={label} hint={optional ? "Optional" : undefined} htmlFor={`pipeline-${key}`}><textarea id={`pipeline-${key}`} required={!optional} className={`${inputClass} min-h-24 py-2`} value={String(data[key] ?? "")} onChange={(e) => set(key, e.target.value)} /></Field>;
  const select = (key: string, label: string, options: { value: string; label: string }[], optional = false, disabled = false) => <Field label={label} hint={optional ? "Optional" : undefined} htmlFor={`pipeline-${key}`}><select id={`pipeline-${key}`} required={!optional} disabled={disabled} className={`${inputClass} disabled:opacity-40`} value={String(data[key] ?? "")} onChange={(e) => { if (key === "client") setData((prev) => ({ ...prev, client: e.target.value, role: "", contacts: [], location: "" })); else set(key, e.target.value); }}><option value="">{disabled ? "Select client first" : `Select ${label.toLowerCase()}`}</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>;
  const multi = (key: string, label: string, options: { value: string; label: string }[], disabled = false) => <fieldset disabled={disabled} className="space-y-2 disabled:opacity-40"><legend className="mb-2 text-xs text-fg-muted">{label}</legend><div className="max-h-36 space-y-2 overflow-auto rounded-lg border border-line-strong bg-ink-sunken p-3">{options.length ? options.map((o) => <label key={o.value} className="flex items-center gap-2 text-[13px] text-fg-muted"><input type="checkbox" checked={Array.isArray(data[key]) && data[key].includes(o.value)} onChange={(e) => { const values = Array.isArray(data[key]) ? data[key] : []; set(key, e.target.checked ? [...values, o.value] : values.filter((v) => v !== o.value)); }} />{o.label}</label>) : <p className="text-xs text-fg-faint">Select client first</p>}</div></fieldset>;
  const radio = (key: string, label: string, values: string[]) => <fieldset className="space-y-2"><legend className="mb-2 text-xs text-fg-muted">{label}</legend>{values.map((value) => <label key={value} className="flex items-center gap-2 text-[13px]"><input type="radio" name={key} value={value} checked={data[key] === value} onChange={() => set(key, value)} />{value}</label>)}</fieldset>;
  const clientRole = <div className="grid gap-4 sm:grid-cols-2">{select("client", "Client", allowedClients.map((c) => ({ value: c.id, label: c.name })))}{select("role", "Role", roles.map((j) => ({ value: j.id, label: j.title })), false, !client)}</div>;
  const schedule = <div className="grid gap-4 sm:grid-cols-2">{field("date", to === "interview" ? "Interview Date" : "Date", "date")}{select("timezone", "Timezone", [{ value: "America/New_York", label: "New York (EST/EDT)" }, { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" }, { value: "Asia/Jakarta", label: "Jakarta (WIB)" }, { value: "Europe/London", label: "London (GMT/BST)" }, { value: "UTC", label: "UTC" }])}{field("start", "Start Time", "time")}{field("end", "End Time", "time")}</div>;
  const invite = `${to === "screening" ? "Screening" : "Interview"}: ${row.name}${client ? ` · ${client.name}` : ""}\n${data.date || "Date pending"} · ${data.start || "Time pending"}–${data.end || ""} (${data.timezone})\n${data.attendees || "Candidate"}${data.stage ? ` · ${data.stage === "Custom..." ? data.customStage : data.stage}` : ""}`;
  const meetingNotes = <label className="flex items-center justify-between gap-3 text-[13px] text-fg-muted">Enable Meeting Notes<input type="checkbox" role="switch" checked={!!data.meetingNotes} onChange={(e) => set("meetingNotes", e.target.checked)} /></label>;
  const preview = <details open={inviteOpen} onToggle={(e) => setInviteOpen(e.currentTarget.open)} className="rounded-lg border border-line bg-ink-sunken p-3"><summary className="cursor-pointer text-[13px]">{to === "screening" ? "Calendar invitation preview" : "Invite message"}</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-fg-muted">{invite}</p><p className="mt-2 text-[11px] text-fg-faint">Preview only. Confirming adds a local calendar event; no invitation is sent.</p></details>;
  const confirm = () => {
    const result = validatePipeline(to, data);
    if (result) { setError(result); return; }
    if (setPersonStatus(row, to, { ...data, invite })) notify(`${row.firstName} moved to ${personStatus(to).label}. Saved to this placement.`);
  };
  const submissionDraft = () => {
    if (!Array.isArray(data.clients) || !data.clients.length) { setError("Select at least one client first."); return; }
    const names = clients.filter((c) => Array.isArray(data.clients) && data.clients.includes(c.id)).map((c) => c.name).join(", ");
    set("message", `Hi ${names},\n\nI'd like to introduce ${row.name}: ${row.headline}.\n\n${(data.emailStyle === "Detailed profile" ? [profile.summary, ...profile.experience, ...profile.skills.map((skill) => `Skill: ${skill}`)] : profile.experience.slice(0, 2)).filter(Boolean).join("\n") || "Please review the candidate profile and confirm their experience."}${data.includePay && profile.salary ? `\n\nExpected pay: ${profile.salary}` : ""}\n\nWould you like to discuss next steps?`);
    log({ action: "placement.submission_drafted", module: "Pipeline", summary: `Amara drafted a submission for ${row.name} at ${row.client}`, kind: "note", subjectId: row.placementId });
    setAiNote(true); setStep(2);
  };
  return <Modal title={FORM_TITLES[to] ?? personStatus(to).label} description={`${row.name} · ${row.client} · ${row.roleTitle} · ${personStatus(row.status).label} → ${personStatus(to).label}`} onClose={close} size={to === "interview" ? "lg" : "md"}>
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (to === "submitted" && step === 1) submissionDraft(); else if (to === "offer-sent" && step < 5) { if (step === 1 && (!data.file || !data.client || !data.role)) { setError("Choose a document, client and role first."); return; } if (step === 2 && (!data.offerSalary || !data.offerStart)) { setError("Record salary and start date first."); return; } setStep(step + 1); } else confirm(); }}>
      {to === "screening" && <>{schedule}{field("email", "Email", "email")}{meetingNotes}{preview}</>}
      {to === "interview" && <>
        {select("stage", "Interview Stage", ["Interview", "Phone Screen", "First Round", "Technical Round", "Cultural Fit", "Final Round", "Custom..."].map((value) => ({ value, label: value })), true)}
        {data.stage === "Custom..." && field("customStage", "Custom interview stage")}
        {clientRole}{multi("contacts", "Contacts", contacts.map((c) => ({ value: c.email, label: `${c.name} · ${c.email}` })), !client)}{schedule}
        <div className="grid gap-5 sm:grid-cols-2">{radio("interviewType", "Interview Type", ["In-Person", "Virtual Interview", "Phone Call"])}{radio("attendees", "Attendees", ["Candidate + Client", "Recruiter Only"])}</div>
        {data.interviewType === "In-Person" ? select("location", "Interview Location", client ? [{ value: client.location, label: client.location }] : [], false, !client) : meetingNotes}
        {preview}
      </>}
      {to === "final" && <>{schedule}{select("assignee", "Assignee", members.map((m) => ({ value: m.id, label: m.id === me.id ? "Assign to yourself" : m.name })))}{text("description", "Description", true)}</>}
      {to === "offer" && <>{clientRole}{text("notes", "Notes", true)}</>}
      {to === "interested" && multi("roles", "Available Roles", jobs.filter((j) => j.status === "open" && j.client === client?.name).map((j) => ({ value: j.id, label: `${j.title} · ${j.client}` })))}
      {to === "placed" && <>{clientRole}{field("startDate", "Start Date", "date")}{field("fee", "Placement Fee ($)", "number", true)}<p className="text-xs text-fg-faint">Enter the fee excluding GST — GST is added at the invoice step.</p></>}
      {to === "fell-off" && text("reason", "Reason the candidate fell off")}
      {to === "submitted" && <><p className="text-xs text-fg-faint">Step {step} of 2</p>{step === 1 ? <>
        {select("submittalType", "Submittal Type", ["Client Submittal", "Speculative Submittal"].map((value) => ({ value, label: value })))}
        {select("emailStyle", "Email style", ["Concise highlights", "Detailed profile"].map((value) => ({ value, label: value })))}
        {multi("clients", "Select Clients", allowedClients.map((c) => ({ value: c.id, label: c.name })))}
        <Field label="Attachments" htmlFor="submission-attachments"><input id="submission-attachments" type="file" multiple className="block w-full text-xs text-fg-muted" onChange={(e) => set("attachments", Array.from(e.target.files ?? []).map((f) => f.name))} /></Field>
        <label className="flex items-center justify-between text-[13px]">Include Pay Rate<input role="switch" type="checkbox" checked={!!data.includePay} onChange={(e) => set("includePay", e.target.checked)} /></label>
        {data.includePay && !profile.salary && <p className="text-xs text-warm">Expected pay has not been recorded. Add it in the candidate profile.</p>}
      </> : <>{text("message", "Submission email")}{aiNote && <p className="text-xs leading-relaxed text-fg-faint">Demo Amara draft · source: headline, recorded work experience and selected clients. Review and edit before recording. No email is sent.</p>}<AmaraButton size="sm" onClick={submissionDraft}>Redraft with Amara</AmaraButton></>}</>}
      {to === "offer-sent" && <><p className="text-xs text-fg-faint">Step {step} of 5 · document extraction is not connected</p>{step === 1 ? <>
        {select("documentType", "Document type", ["Offer Letter", "Employment Contract"].map((value) => ({ value, label: value })))}
        <Field label={String(data.documentType)} htmlFor="offer-document"><input id="offer-document" required type="file" accept=".pdf,.doc,.docx" className="block w-full text-xs text-fg-muted" onChange={(e) => set("file", e.target.files?.[0]?.name ?? "")} /></Field>{clientRole}
        <p className="text-xs text-fg-faint">The demo keeps the file name only. Enter the document details manually in the next step.</p>
      </> : step === 2 ? <>{field("offerSalary", "Offer salary (currency / period)")}{field("offerStart", "Offer start date", "date")}{text("offerTerms", "Other offer terms", true)}<AmaraButton size="sm" onClick={() => setAiNote(true)}>Check missing details with Amara</AmaraButton>{aiNote && <p className="text-xs text-fg-muted">Demo checklist: confirm salary, start date, employer, role, probation and conditions against the original document. Automated extraction is planned.</p>}</> : step === 3 ? <>{text("offerNotes", "Recruiter notes", true)}<p className="text-xs text-fg-faint">Confirm any outstanding terms with the client before recording.</p></> : step === 4 ? <dl className="space-y-3 text-sm">{["file", "documentType", "offerSalary", "offerStart", "offerTerms"].map((key) => <div key={key}><dt className="text-xs text-fg-faint">{key.replace(/([A-Z])/g, " $1")}</dt><dd>{String(data[key] || "Not recorded")}</dd></div>)}</dl> : <label className="flex gap-2 text-[13px]"><input required type="checkbox" checked={!!data.reviewed} onChange={(e) => set("reviewed", e.target.checked)} />I reviewed the original document and confirmed these details.</label>}</>}
      <AmaraButton size="sm" onClick={() => { setAiNote(true); log({ action: "placement.form_reviewed", module: "Pipeline", summary: `Requested Amara form review for ${row.name} at ${row.client}`, kind: "note", subjectId: row.placementId }); }}>Check with Amara</AmaraButton>
      {aiNote && to !== "submitted" && <p className="text-xs leading-relaxed text-fg-muted">Demo checklist: verify candidate consent, this client and role, and all dates against the source. {validatePipeline(to, data) ?? "Required fields are complete. Review factual accuracy before confirming."}</p>}
      {error && <p role="alert" className="rounded-lg border border-bad/30 bg-bad/5 p-3 text-xs text-bad">{error}</p>}
      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        {step > 1 && <Button onClick={() => setStep(step - 1)}>Back</Button>}<Button onClick={close}>Cancel</Button>
        {to === "submitted" && step === 1 ? <AmaraButton type="submit">Generate Email</AmaraButton> : <Button type="submit" variant="primary">{to === "offer-sent" && step < 5 ? step === 1 ? "Review document details" : "Continue" : FORM_ACTIONS[to]}</Button>}
      </div>
      <p className="text-[11px] text-fg-faint">Status changes only after confirmation. This placement and its history are saved in this browser.</p>
    </form>
  </Modal>;
}
