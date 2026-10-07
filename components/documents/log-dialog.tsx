"use client";

import { useId, useState } from "react";
import { FileUp, Paperclip } from "lucide-react";
import { DOC_KIND_LABEL, fileSize, RECEIVED_KINDS } from "@/lib/documents";
import { useDesk } from "@/lib/store";
import type { ReceivedDocKind } from "@/lib/types";
import { Field, inputClass, Modal } from "../ui/modal";
import { Button, cx } from "../ui/primitives";

/**
 * Log a document that came from a client (offer letter, contract, signed TOB…).
 * Attach it to a deal, or to a client when it isn't about one candidate.
 * Files stay on this device in the demo; only the name and size are recorded.
 */
export function LogDocumentDialog({ dealId, clientName, onClose }: { dealId?: string; clientName?: string; onClose: () => void }) {
  const { deals, clients, addDocument, notify } = useDesk();
  const ids = useId();
  const [target, setTarget] = useState(dealId ? `deal:${dealId}` : clientName ? `client:${clientName}` : `deal:${deals[0]?.id}`);
  const [kind, setKind] = useState<ReceivedDocKind>(clientName && !dealId ? "signed-tob" : "offer-letter");
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);

  const [type, ref] = target.split(":") as ["deal" | "client", string];
  const deal = type === "deal" ? deals.find((d) => d.id === ref) : undefined;
  const client = deal?.role.client ?? ref;

  const save = () => {
    const about = deal ? deal.candidate.name : client;
    addDocument({
      kind,
      direction: "received",
      title: `${DOC_KIND_LABEL[kind]} — ${about}`,
      dealId: deal?.id,
      client,
      status: kind === "signed-tob" || kind === "contract" ? "signed" : "received",
      fileName: file?.name,
      fileSize: file?.size,
      note: note.trim() || undefined,
    });
    notify("Logged. It's in the register and the audit trail.");
    onClose();
  };

  const pick = (f?: File) => f && setFile({ name: f.name, size: f.size });

  return (
    <Modal
      title="Log a received document"
      description="Anything a client sends you: offer letters, contracts, signed terms."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Log document
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="About" htmlFor={`${ids}-target`}>
          <select id={`${ids}-target`} value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
            <optgroup label="Deals">
              {deals.map((d) => (
                <option key={d.id} value={`deal:${d.id}`}>
                  {d.candidate.name} · {d.role.title}, {d.role.client}
                </option>
              ))}
            </optgroup>
            <optgroup label="Client (not about one candidate)">
              {clients.map((c) => (
                <option key={c.id} value={`client:${c.name}`}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>

        <Field label="Type">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Document type">
            {RECEIVED_KINDS.map((k) => (
              <button
                key={k.id}
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => setKind(k.id)}
                className={cx(
                  "h-8 rounded-lg border px-3 text-[12px] transition-colors",
                  kind === k.id ? "border-fg/40 bg-raised text-fg" : "border-line-strong text-fg-muted hover:text-fg",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="File" hint="Stays on your device in this demo">
          <label
            htmlFor={`${ids}-file`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files[0]);
            }}
            className={cx(
              "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-[13px] transition-colors",
              dragging ? "border-fg/50 bg-raised" : "border-line-strong hover:border-fg/30",
            )}
          >
            {file ? <Paperclip className="size-4 text-fg-muted" /> : <FileUp className="size-4 text-fg-faint" />}
            {file ? (
              <span className="min-w-0 flex-1 truncate text-fg">
                {file.name} <span className="text-fg-faint">· {fileSize(file.size)}</span>
              </span>
            ) : (
              <span className="text-fg-muted">
                Drop a PDF here or <span className="text-fg underline underline-offset-4">browse</span>
              </span>
            )}
            <input id={`${ids}-file`} type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        </Field>

        <Field label="Note" hint="Optional" htmlFor={`${ids}-note`}>
          <textarea
            id={`${ids}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. $260k base, start 16 Nov"
            className={cx(inputClass, "h-auto resize-none py-2")}
          />
        </Field>
      </div>
    </Modal>
  );
}
