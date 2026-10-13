"use client";

import { useState } from "react";
import Image from "next/image";
import { initials, money } from "@/lib/deal";
import { tobStatus } from "@/lib/documents";
import type { RolePeople } from "@/lib/clients";
import { useDesk } from "@/lib/store";
import type { Client, JobChannel } from "@/lib/types";
import { Field, inputClass, Modal } from "../ui/modal";
import { Button, cx } from "../ui/primitives";

/** The client's mark on a light tile, so dark and colourful logos read equally well. */
export function ClientLogo({ client, size = "md" }: { client: Pick<Client, "name" | "logo">; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-14 rounded-xl p-2.5" : size === "sm" ? "size-8 rounded-md p-1.5" : "size-11 rounded-lg p-2";
  return (
    <span className={cx("grid shrink-0 place-items-center bg-[#f4f3ef] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]", box)}>
      {client.logo ? (
        <Image src={client.logo} alt="" width={40} height={40} unoptimized className="size-full object-contain" />
      ) : (
        <span className={cx("font-medium text-[#2a2a2a]", size === "lg" ? "text-[15px]" : size === "sm" ? "text-[11px]" : "text-[13px]")} aria-hidden="true">
          {initials(client.name)}
        </span>
      )}
    </span>
  );
}

export function ClientStatus({ status }: { status: Client["status"] }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
        status === "active" ? "border-line-strong text-fg-muted" : "border-dashed border-line-strong text-fg-faint",
      )}
    >
      <span className={cx("size-1.5 rounded-full", status === "active" ? "bg-good" : "bg-fg-faint")} />
      {status === "active" ? "Active client" : "Prospect"}
    </span>
  );
}

const TOB_COPY = {
  signed: "TOB signed",
  sent: "TOB sent, not signed",
  draft: "TOB drafted",
  none: "No TOB yet",
} as const;

export function TobChip({ clientName }: { clientName: string }) {
  const { documents } = useDesk();
  const s = tobStatus(clientName, documents);
  return <span className={cx("text-[11px]", s === "signed" ? "text-fg-faint" : "text-warm")}>{TOB_COPY[s]}</span>;
}

/** The four steps a person moves through for a role, as compact counts. */
export function Funnel({ role, compact = false }: { role: RolePeople; compact?: boolean }) {
  const steps = [
    ["To review", role.applicants.length],
    ["Shortlisted", role.pool.length],
    ["In pipeline", role.live.length],
    ["Placed", role.placed.length],
  ] as const;
  return (
    <dl className={cx("grid grid-cols-4", compact ? "gap-3" : "gap-px overflow-hidden rounded-lg border border-line bg-line")}>
      {steps.map(([label, n]) => (
        <div key={label} className={cx(!compact && "bg-surface px-3 py-2")}>
          <dt className="text-[10px] text-fg-faint">{label}</dt>
          <dd className={cx("num", compact ? "text-[13px]" : "mt-0.5 text-[16px]", n ? "text-fg" : "text-fg-faint")}>{n}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Overlapping initials for everyone attached to a role. */
export function PeopleStack({ names, max = 4 }: { names: string[]; max?: number }) {
  if (!names.length) return <span className="text-[11px] text-fg-faint">No one yet</span>;
  return (
    <span className="flex items-center" title={names.join(", ")}>
      {names.slice(0, max).map((n, i) => (
        <span
          key={`${n}-${i}`}
          className="-ml-1.5 grid size-6 place-items-center rounded-full border-2 border-surface bg-raised text-[9px] font-medium text-fg-muted first:ml-0"
        >
          {initials(n)}
        </span>
      ))}
      {names.length > max && <span className="ml-1.5 text-[11px] text-fg-faint">+{names.length - max}</span>}
    </span>
  );
}

export const roleNames = (r: RolePeople) => [
  ...r.live.map((d) => d.candidate.name),
  ...r.placed.map((d) => d.candidate.name),
  ...r.pool.map((c) => c.name),
  ...r.applicants.map((a) => a.name),
];

export function channelsLabel(channels: JobChannel[]) {
  return channels.length ? `Advertised on ${channels.join(", ")}` : "Headhunt, not advertised";
}

export function AddClientDialog({ onClose, onAdded, kind = "prospect" }: { onClose: () => void; onAdded: (id: string) => void; kind?: Client["status"] }) {
  const { addClient, notify } = useDesk();
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "Sydney",
    status: kind,
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    fee: 20,
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    if (!form.name.trim()) return;
    const id = addClient({
      name: form.name.trim(),
      industry: form.industry.trim() || "—",
      location: form.location.trim(),
      status: form.status,
      contact: { name: form.contactName.trim() || "—", title: form.contactTitle.trim(), email: form.contactEmail.trim() },
      feePct: Number(form.fee) / 100,
    });
    notify(`${form.name.trim()} added`);
    onAdded(id);
  };

  return (
    <Modal
      title={kind === "active" ? "Add a client" : "Add a prospect"}
      description={kind === "active" ? "A company you're already hiring for." : "A company you're pitching. It starts at New on Prospects."}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
            {form.status === "active" ? "Add client" : "Add prospect"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Company" htmlFor="cl-name">
            <input id="cl-name" value={form.name} onChange={set("name")} placeholder="e.g. Corvid Labs" className={inputClass} />
          </Field>
        </div>
        <Field label="Industry" htmlFor="cl-ind">
          <input id="cl-ind" value={form.industry} onChange={set("industry")} placeholder="e.g. Fintech" className={inputClass} />
        </Field>
        <Field label="Location" htmlFor="cl-loc">
          <input id="cl-loc" value={form.location} onChange={set("location")} className={inputClass} />
        </Field>
        <Field label="Status" htmlFor="cl-status">
          <select id="cl-status" value={form.status} onChange={set("status")} className={inputClass}>
            <option value="prospect">Prospect</option>
            <option value="active">Active client</option>
          </select>
        </Field>
        <Field label="Standard fee" hint="%" htmlFor="cl-fee">
          <input id="cl-fee" type="number" min={5} max={35} value={form.fee} onChange={set("fee")} className={inputClass} />
        </Field>
        <Field label="Contact name" htmlFor="cl-cn">
          <input id="cl-cn" value={form.contactName} onChange={set("contactName")} className={inputClass} />
        </Field>
        <Field label="Contact title" htmlFor="cl-ct">
          <input id="cl-ct" value={form.contactTitle} onChange={set("contactTitle")} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Contact email" htmlFor="cl-ce">
            <input id="cl-ce" type="email" value={form.contactEmail} onChange={set("contactEmail")} className={inputClass} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

const CHANNELS: JobChannel[] = ["Seek", "LinkedIn", "Indeed", "Website"];

export function PostRoleDialog({ client, onClose }: { client: Client; onClose: () => void }) {
  const { postJob, notify } = useDesk();
  const [title, setTitle] = useState("");
  const [salary, setSalary] = useState(150_000);
  const [location, setLocation] = useState(client.location);
  const [channels, setChannels] = useState<JobChannel[]>(["Seek", "LinkedIn"]);

  const save = () => {
    if (!title.trim()) return;
    postJob({ title: title.trim(), client: client.name, salary, location, channels });
    notify(channels.length ? `${title.trim()} posted to ${channels.join(", ")}` : `${title.trim()} added as a headhunt`);
    onClose();
  };

  return (
    <Modal
      title={`New role at ${client.name}`}
      description="Advertise it, or keep it as a quiet headhunt."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!title.trim()}>
            {channels.length ? "Post role" : "Add headhunt"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Role title" htmlFor="job-title">
            <input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fullstack Developer" className={inputClass} />
          </Field>
        </div>
        <Field label="Base salary" hint={money(salary)} htmlFor="job-salary">
          <input
            id="job-salary"
            type="number"
            step={5000}
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Location" htmlFor="job-loc">
          <input id="job-loc" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Advertise on" hint="None = headhunt">
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((ch) => {
                const on = channels.includes(ch);
                return (
                  <button
                    key={ch}
                    aria-pressed={on}
                    onClick={() => setChannels((prev) => (on ? prev.filter((x) => x !== ch) : [...prev, ch]))}
                    className={cx(
                      "h-8 rounded-lg border px-3 text-[12px] transition-colors",
                      on ? "border-fg/40 bg-raised text-fg" : "border-line-strong text-fg-muted hover:text-fg",
                    )}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
