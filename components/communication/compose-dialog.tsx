"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { CHANNEL_LABEL } from "@/lib/communication";
import { useDesk } from "@/lib/store";
import type { ComposeRequest, MessageChannel, Subject } from "@/lib/types";
import { Field, inputClass, Modal } from "../ui/modal";
import { Button, cx } from "../ui/primitives";

/* ── Compose ──────────────────────────────────────────────────────── */

export function ComposeDialog({ initial, onClose, onSent }: { initial?: ComposeRequest; onClose: () => void; onSent: (threadId: string) => void }) {
  const { talent, startThread, notify, clients } = useDesk();
  const people = talent;
  const contacts = [
    ...people.map((r) => ({ key: `candidate:${r.key}`, name: r.name, detail: `Candidate · ${r.roleTitle ?? r.headline}`, subject: { kind: "candidate", id: r.key, name: r.name } as Subject })),
    ...clients.flatMap((c) =>
      [c.contact, ...(c.contacts ?? [])].map((p) => ({
        key: `${c.id}:${p.email || p.name}`,
        name: p.name,
        detail: `${p.title} · ${c.name}`,
        subject: { kind: c.status === "active" ? "client" : "prospect", id: c.id, name: c.name } as Subject,
      })),
    ),
  ];
  const [to, setTo] = useState(contacts[0]?.key ?? "");
  const [channel, setChannel] = useState<MessageChannel>(initial?.channel ?? "email");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  // A request from another page fixes the recipient; otherwise pick one.
  const who = initial ? { ...initial.contact, key: "requested", subject: initial.contact.subject! } : contacts.find((c) => c.key === to);

  const send = () => {
    if (!who || !body.trim()) return;
    const id = startThread({ channel, contact: { name: who.name, detail: who.detail, subject: who.subject }, subject: channel === "email" ? subject.trim() || undefined : undefined, body });
    notify(`Sent to ${who.name.split(" ")[0]} by ${CHANNEL_LABEL[channel]}`);
    onSent(id);
  };

  return (
    <Modal
      title="New message"
      description="Goes out from your connected account and is logged on their record."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={send} disabled={!who || !body.trim()}>
            <Send className="size-3.5" /> Send {CHANNEL_LABEL[channel]}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        <Field label="To" htmlFor="cm-to">
          {initial ? (
            <div id="cm-to" className={cx(inputClass, "flex items-center gap-2 truncate")}>
              <span className="truncate text-fg">{initial.contact.name}</span>
              <span className="truncate text-fg-faint">{initial.contact.detail}</span>
            </div>
          ) : (
          <select id="cm-to" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass}>
            <optgroup label="Candidates">
              {contacts
                .filter((c) => c.subject.kind === "candidate")
                .map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Clients and prospects">
              {contacts
                .filter((c) => c.subject.kind !== "candidate")
                .map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} · {c.subject.name}
                  </option>
                ))}
            </optgroup>
          </select>
          )}
        </Field>
        <Field label="Channel" htmlFor="cm-ch">
          <select id="cm-ch" value={channel} onChange={(e) => setChannel(e.target.value as MessageChannel)} className={inputClass}>
            {(Object.keys(CHANNEL_LABEL) as MessageChannel[]).map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        {channel === "email" && (
          <div className="sm:col-span-2">
            <Field label="Subject" htmlFor="cm-subject">
              <input id="cm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label="Message" htmlFor="cm-body">
            <textarea
              id="cm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              placeholder={who ? `Write to ${who.name.split(" ")[0]}…` : "Write a message"}
              className="w-full resize-none rounded-lg border border-line-strong bg-ink-sunken px-3 py-2 text-[13px] leading-relaxed text-fg outline-none placeholder:text-fg-faint focus:border-fg/40"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
