"use client";

import { useState } from "react";
import { Building2, Target, UserPlus, UserRound } from "lucide-react";
import { companyByDomain, firstName, signatureFor, type Conversation } from "@/lib/conversations";
import { useDesk } from "@/lib/store";
import { Field, inputClass, Modal } from "../ui/modal";
import { Segmented } from "../ui/menu";
import { Button, cx } from "../ui/primitives";

export type AddAs = "candidate" | "contact" | "prospect";

export const ADD_AS: { id: AddAs; label: string; short: string; icon: typeof UserRound }[] = [
  { id: "candidate", label: "Candidate", short: "Candidate", icon: UserRound },
  { id: "contact", label: "Contact at a company", short: "Contact", icon: Building2 },
  { id: "prospect", label: "New prospect", short: "Prospect", icon: Target },
];

/** Someone who isn't on your desk yet: a dashed outline instead of initials we can't trust. */
export function NewPersonAvatar({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span aria-hidden="true" className={cx("grid shrink-0 place-items-center rounded-full border border-dashed border-fg-faint text-fg-muted", size === "lg" ? "size-11" : "size-8")}>
      <UserPlus className={size === "lg" ? "size-4.5" : "size-3.5"} />
    </span>
  );
}

/** What we'd suggest for someone new: their signature first, then their email domain. */
export function suggestFor(conv: Conversation, clients: ReturnType<typeof useDesk>["clients"]) {
  const sig = signatureFor(conv);
  const company = companyByDomain(conv.email, clients) ?? (sig?.company ? clients.find((c) => c.name === sig.company) : undefined);
  const as: AddAs = company ? "contact" : (sig?.as ?? "candidate");
  return { sig, company, as };
}

/** Someone new wrote in: make them a candidate, a contact at a company you know, or a new prospect. */
export function AddToDeskDialog({ conv, initialAs, onClose, onAdded }: { conv: Conversation; initialAs?: AddAs; onClose: () => void; onAdded: (key: string) => void }) {
  const { clients, recognizeContact, notify } = useDesk();
  const { sig, company, as: suggested } = suggestFor(conv, clients);
  const [as, setAs] = useState<AddAs>(initialAs ?? suggested);
  const [name, setName] = useState(sig?.name ?? (firstName(conv.name) === "them" ? "" : conv.name));
  const [title, setTitle] = useState(sig?.title ?? "");
  const [email, setEmail] = useState(conv.email ?? "");
  const [phone, setPhone] = useState(conv.phone ?? "");
  const [location, setLocation] = useState(sig?.location ?? "");
  const [clientId, setClientId] = useState(company?.id ?? "");
  const [newCompany, setNewCompany] = useState(sig?.company && !company ? sig.company : "");
  const ready = name.trim() && title.trim() && (as !== "contact" || clientId) && (as !== "prospect" || newCompany.trim());
  const domainMatch = company && companyByDomain(conv.email, clients)?.id === company.id;

  const save = () => {
    if (!ready) return;
    const key = recognizeContact({ key: conv.key, as, name, title, email: email.trim() || undefined, phone: phone.trim() || undefined, location: location.trim() || undefined, clientId, company: newCompany });
    if (!key) return;
    const where = as === "candidate" ? "a candidate" : as === "prospect" ? `a prospect at ${newCompany.trim()}` : `a contact at ${clients.find((c) => c.id === clientId)?.name}`;
    notify(`${name.trim()} is now ${where}`);
    onAdded(key);
    onClose();
  };

  return (
    <Modal
      title={`Add ${name.trim() || "them"} to your desk`}
      description={sig ? `Prefilled from their message: ${sig.title}${sig.company ? ` at ${sig.company}` : ""}. Check it before you save.` : "They aren't a candidate, client or prospect yet. Their conversation moves onto the record you make."}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!ready}>
            Add to desk
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="max-w-full overflow-x-auto">
          <Segmented label="Add as" value={as} onChange={setAs} options={ADD_AS.map((a) => ({ id: a.id, label: a.label, icon: a.icon }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="add-name">
            <input id="add-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
          <Field label={as === "candidate" ? "Headline" : "Job title"} htmlFor="add-title">
            <input id="add-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={as === "candidate" ? "e.g. Backend Engineer · Atlassian" : "e.g. Head of People"} className={inputClass} autoComplete="off" />
          </Field>
          {as === "contact" && (
            <div className="sm:col-span-2">
              <Field label="Company" htmlFor="add-company" hint={domainMatch ? `Same email domain as ${company!.name}` : undefined}>
                <select id="add-company" value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
                  <option value="">Choose a client or prospect</option>
                  {[...clients]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.status === "active" ? "Client" : "Prospect"}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          )}
          {as === "prospect" && (
            <div className="sm:col-span-2">
              <Field label="Company" htmlFor="add-new-company" hint="Starts as Interested">
                <input id="add-new-company" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company name" className={inputClass} autoComplete="off" />
              </Field>
            </div>
          )}
          <Field label="Email" htmlFor="add-email">
            <input id="add-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
          <Field label="Phone" htmlFor="add-phone">
            <input id="add-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
          {as !== "contact" && (
            <Field label="Location" htmlFor="add-location">
              <input id="add-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City" className={inputClass} autoComplete="off" />
            </Field>
          )}
        </div>
      </form>
    </Modal>
  );
}
