"use client";

import { useState } from "react";
import Link from "next/link";
import { FileInput, FileOutput, FilePlus2, FileText, Search, Upload } from "lucide-react";
import { DOC_KIND_LABEL, DOC_STATUS_LABEL, docTitle, fileSize, GENERATED_KINDS, renderDoc } from "@/lib/documents";
import { memberName, useDesk } from "@/lib/store";
import { formatDate, NOW_MS } from "@/lib/time";
import type { AgencyDoc, DocStatus, GeneratedDocKind } from "@/lib/types";
import { Field, compactSelectClass, inputClass, Modal } from "../ui/modal";
import { Page, PageHeader } from "../ui/page-header";
import { Button, cx } from "../ui/primitives";
import { DocPaper } from "./doc-paper";
import { LogDocumentDialog } from "./log-dialog";
import { TableWorkspace } from "../ui/table-workspace";
import { MetricIconTile } from "../ui/metrics";
import { SubpageTabs } from "../ui/subpage-tabs";
import { Segmented } from "../ui/menu";

type Tab = "register" | "generate";
type Direction = "all" | "generated" | "received";

export function DocumentsPage() {
  const { docRequest, deals, me } = useDesk();
  const [tab, setTab] = useState<Tab>("register");
  const [dealId, setDealId] = useState(deals[0]?.id ?? "");
  const [logOpen, setLogOpen] = useState(false);

  // A deal page asked to generate something: jump straight to the generator for that deal.
  const [handled, setHandled] = useState(0);
  if (docRequest && docRequest.n !== handled) {
    setHandled(docRequest.n);
    setTab("generate");
    setDealId(docRequest.dealId);
  }

  const canGenerate = me.role !== "resourcer";

  return (
    <Page wide>
      <PageHeader
        eyebrow="Documents"
        title="Everything you send and receive."
        actions={
          <>
            <Button onClick={() => setLogOpen(true)}>
              <Upload className="size-3.5" /> Log received
            </Button>
            <Button variant="primary" disabled={!canGenerate} onClick={() => setTab("generate")}>
              <FilePlus2 className="size-3.5" /> Generate
            </Button>
          </>
        }
      >
        Terms, submissions, offer recaps and invoices are filled from your deals, so nobody re-types a salary. Everything a client sends you gets
        logged here too.
      </PageHeader>

      <div data-tour="doc-tabs" className="mb-6">
        <SubpageTabs
          label="Documents view"
          value={tab}
          onChange={setTab}
          options={[
            { id: "register", label: "Register", icon: FileText },
            { id: "generate", label: "Generate", icon: FilePlus2, disabled: canGenerate ? undefined : "Resourcers can't generate documents" },
          ]}
        />
      </div>

      {tab === "register" ? <Register /> : <Generator dealId={dealId} setDealId={setDealId} onSaved={() => setTab("register")} />}
      {logOpen && <LogDocumentDialog onClose={() => setLogOpen(false)} />}
    </Page>
  );
}

/* ── Generator ─────────────────────────────────────────────────────── */

function Generator({ dealId, setDealId, onSaved }: { dealId: string; setDealId: (id: string) => void; onSaved: () => void }) {
  const { deals, clients, documents, addDocument, notify, rules, isOwner } = useDesk();
  const [kind, setKind] = useState<GeneratedDocKind>("submission");
  const [clientName, setClientName] = useState(clients[0]?.name ?? "");
  const [note, setNote] = useState("");

  const deal = deals.find((d) => d.id === dealId);
  const client = clients.find((c) => c.name === (kind === "tob" ? clientName : deal?.role.client));
  const invoiceNo = `INV-2026-${String(15 + documents.filter((d) => d.kind === "invoice").length - 1).padStart(3, "0")}`;
  const content = renderDoc(kind, { deal: kind === "tob" ? undefined : deal, client, note, invoiceNo, date: NOW_MS });
  const invoiceNeedsApproval = kind === "invoice" && rules.invoiceApproval && !isOwner;

  const save = (status: DocStatus) => {
    const title = docTitle(kind, deal, clientName, invoiceNo);
    const result = addDocument({
      kind,
      direction: "generated",
      title,
      dealId: kind === "tob" ? undefined : deal?.id,
      client: kind === "tob" ? clientName : (deal?.role.client ?? ""),
      status,
      note: note.trim() || undefined,
      amount: kind === "invoice" && deal ? Math.round(deal.role.salary * deal.feePct) : undefined,
    });
    notify(result.status === "pending-approval" ? "Saved. Sent to the Owner for approval." : `Saved as ${DOC_STATUS_LABEL[result.status].toLowerCase()}. Logged.`);
    setNote("");
    onSaved();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-5">
        <Field label="Template">
          <div className="grid grid-cols-2 gap-2">
            {GENERATED_KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                aria-pressed={kind === k.id}
                className={cx(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  kind === k.id ? "border-fg/40 bg-raised" : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <div className={cx("text-[13px]", kind === k.id ? "text-fg" : "text-fg-muted")}>{k.label}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-fg-faint">{k.hint}</div>
              </button>
            ))}
          </div>
        </Field>

        {kind === "tob" ? (
          <Field label="Client" htmlFor="gen-client">
            <select id="gen-client" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass}>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.status === "prospect" ? "(prospect)" : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Deal" hint="Fills everything in" htmlFor="gen-deal">
            <select id="gen-deal" value={dealId} onChange={(e) => setDealId(e.target.value)} className={inputClass}>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.candidate.name} · {d.role.title}, {d.role.client}
                </option>
              ))}
            </select>
          </Field>
        )}

        {(kind === "submission" || kind === "offer-recap") && (
          <Field label={kind === "submission" ? "Why you're putting them forward" : "Notes for the candidate"} htmlFor="gen-note">
            <textarea
              id="gen-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder={kind === "submission" ? "Two or three lines the hiring manager will actually read." : "e.g. Bonus and equity details to follow."}
              className={cx(inputClass, "h-auto resize-none py-2 leading-relaxed")}
            />
          </Field>
        )}

        {invoiceNeedsApproval && (
          <p className="rounded-lg border border-warm/30 bg-warm/[0.05] px-3 py-2.5 text-[12px] text-warm">
            Invoices need Owner approval before they go out. Saving sends it for approval.
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="primary" onClick={() => save(kind === "invoice" ? "approved" : "sent")}>
            {invoiceNeedsApproval ? "Request approval" : kind === "invoice" ? "Save invoice" : "Save & mark sent"}
          </Button>
          <Button onClick={() => save("draft")}>Save draft</Button>
        </div>
        <p className="text-[11px] text-fg-faint">Every save is written to the audit log.</p>
      </div>

      <div className="min-w-0 rounded-2xl border border-line bg-ink-sunken p-4 sm:p-8">
        <DocPaper doc={content} />
      </div>
    </div>
  );
}

/* ── Register ──────────────────────────────────────────────────────── */

function Register() {
  const { documents, deals, clients, setDocStatus, notify } = useDesk();
  const [direction, setDirection] = useState<Direction>("all");
  const [client, setClient] = useState("all");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<AgencyDoc | null>(null);

  const rows = documents
    .filter((d) => direction === "all" || d.direction === direction)
    .filter((d) => client === "all" || d.client === client)
    .filter((d) => !query || `${d.title} ${d.fileName ?? ""} ${d.client}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.at - a.at);

  return (
    <TableWorkspace title="Documents">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          label="Direction"
          value={direction}
          onChange={setDirection}
          options={[
            { id: "all", label: "All" },
            { id: "generated", label: "Sent by you" },
            { id: "received", label: "From clients" },
          ]}
        />
        <select value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client" className={compactSelectClass}>
          <option value="all">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="relative ml-auto w-full sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-fg-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents" aria-label="Search documents" className={cx(inputClass, "h-8 pl-8 text-[12px]")} />
        </div>
      </div>

      <div data-tour="doc-register" className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="bg-ink-sunken text-[11px] tracking-[0.06em] text-fg-faint uppercase">
            <tr>
              <th className="px-4 py-2.5 font-medium">Document</th>
              <th className="px-4 py-2.5 font-medium">Deal</th>
              <th className="px-4 py-2.5 font-medium">Client</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">By</th>
              <th className="px-4 py-2.5 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {rows.map((d) => {
              const deal = deals.find((x) => x.id === d.dealId);
              return (
                <tr key={d.id} className="transition-colors hover:bg-raised">
                  <td className="px-4 py-3">
                    <button onClick={() => setPreview(d)} className="flex items-center gap-3 text-left">
                      <MetricIconTile
                        icon={d.direction === "received" ? FileInput : FileOutput}
                        label={d.direction === "received" ? "Received document" : "Generated document"}
                        tile={d.direction === "received" ? "bg-submittals-tile" : "bg-offers-tile"}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-fg hover:underline hover:underline-offset-4">{DOC_KIND_LABEL[d.kind]}</span>
                        <span className="block truncate text-[11px] text-fg-faint">
                          {d.fileName ? `${d.fileName} · ${fileSize(d.fileSize)}` : d.direction === "generated" ? "Generated from deal data" : "Logged"}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {deal ? (
                      <Link href={`/deals/${deal.id}`} className="hover:text-fg hover:underline hover:underline-offset-4">
                        {deal.candidate.name}
                      </Link>
                    ) : (
                      <span className="text-fg-faint">Client-level</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{d.client}</td>
                  <td className="px-4 py-3">
                    <StatusCell
                      doc={d}
                      onAdvance={(status) => {
                        setDocStatus(d.id, status);
                        notify(`Marked ${DOC_STATUS_LABEL[status].toLowerCase()}`);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{memberName(d.byId).split(" ")[0]}</td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-fg-faint">{formatDate(d.at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="bg-surface px-4 py-10 text-center text-[13px] text-fg-faint">No documents match.</p>}
      </div>

      {preview && <PreviewDialog doc={preview} onClose={() => setPreview(null)} />}
    </TableWorkspace>
  );
}

function StatusCell({ doc, onAdvance }: { doc: AgencyDoc; onAdvance: (s: DocStatus) => void }) {
  const next: DocStatus | null = doc.status === "draft" ? "sent" : doc.status === "sent" && doc.kind === "tob" ? "signed" : null;
  return (
    <span className="flex items-center gap-2">
      <span
        className={cx(
          "inline-flex items-center gap-1.5 text-[12px]",
          doc.status === "pending-approval" ? "text-warm" : doc.status === "draft" ? "text-fg-faint" : "text-fg-muted",
        )}
      >
        <span
          className={cx(
            "size-1.5 rounded-full",
            doc.status === "pending-approval" ? "bg-warm" : doc.status === "draft" ? "bg-fg-faint" : doc.status === "signed" || doc.status === "approved" ? "bg-good" : "bg-fg-muted",
          )}
        />
        {DOC_STATUS_LABEL[doc.status]}
      </span>
      {next && (
        <button onClick={() => onAdvance(next)} className="rounded border border-line-strong px-1.5 py-0.5 text-[11px] text-fg-faint transition-colors hover:text-fg">
          Mark {DOC_STATUS_LABEL[next].toLowerCase()}
        </button>
      )}
    </span>
  );
}

function PreviewDialog({ doc, onClose }: { doc: AgencyDoc; onClose: () => void }) {
  const { deals, clients } = useDesk();
  const deal = deals.find((d) => d.id === doc.dealId);
  const client = clients.find((c) => c.name === doc.client);

  return (
    <Modal title={doc.title} description={`${doc.direction === "received" ? "Received from" : "Sent to"} ${doc.client} · ${formatDate(doc.at)} · ${memberName(doc.byId)}`} onClose={onClose} size="lg">
      {doc.direction === "generated" ? (
        <div className="rounded-xl bg-ink-sunken p-4 sm:p-6">
          <DocPaper
            doc={renderDoc(doc.kind as GeneratedDocKind, {
              deal,
              client,
              note: doc.note,
              invoiceNo: doc.kind === "invoice" ? doc.title.split(" ")[1] : undefined,
              date: doc.at,
            })}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-line bg-ink-sunken p-5">
            <FileText className="size-8 text-fg-faint" strokeWidth={1.5} />
            <div className="min-w-0">
              <div className="truncate text-[14px] text-fg">{doc.fileName ?? "No file attached"}</div>
              <div className="mt-0.5 text-[12px] text-fg-faint">{doc.fileSize ? fileSize(doc.fileSize) : "Logged without a file"}</div>
            </div>
          </div>
          {doc.note && <p className="text-[14px] leading-relaxed text-fg-muted">{doc.note}</p>}
          <p className="text-[12px] text-fg-faint">In the real product the file is stored securely and opens here. In this demo only its name and size are kept.</p>
        </div>
      )}
    </Modal>
  );
}
