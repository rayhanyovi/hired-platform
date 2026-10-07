/**
 * Document templates. Every generated document is filled from deal and client
 * data, so nobody re-types a salary, a fee or a client's name.
 */
import { RECRUITER } from "./data";
import { fee, money } from "./deal";
import { formatDate } from "./time";
import type { Client, Deal, DocKind, DocStatus, GeneratedDocKind, ReceivedDocKind } from "./types";

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  tob: "Terms of Business",
  submission: "Candidate submission",
  "offer-recap": "Offer recap",
  invoice: "Placement invoice",
  "offer-letter": "Offer letter",
  contract: "Employment contract",
  "signed-tob": "Signed TOB",
  reference: "Reference check",
  other: "Other document",
};

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  signed: "Signed",
  received: "Received",
  "pending-approval": "Awaiting approval",
  approved: "Approved",
};

export const GENERATED_KINDS: { id: GeneratedDocKind; label: string; hint: string }[] = [
  { id: "tob", label: "Terms of Business", hint: "Your fee, rebate and payment terms with the client" },
  { id: "submission", label: "Submission", hint: "The candidate profile you send the client" },
  { id: "offer-recap", label: "Offer recap", hint: "A plain summary of the client's offer for the candidate" },
  { id: "invoice", label: "Invoice", hint: "Your placement fee, billed to the client" },
];

export const RECEIVED_KINDS: { id: ReceivedDocKind; label: string }[] = [
  { id: "offer-letter", label: "Offer letter" },
  { id: "contract", label: "Employment contract" },
  { id: "signed-tob", label: "Signed TOB" },
  { id: "reference", label: "Reference check" },
  { id: "other", label: "Other" },
];

export const AGENCY = {
  legalName: "Whitford Talent Pty Ltd",
  abn: "ABN 12 345 678 901",
  address: "Level 4, 22 Bridge Street, Sydney NSW 2000",
};

export type DocBlock =
  | { type: "text"; text: string }
  | { type: "rows"; rows: [string, string][] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "total"; rows: [string, string][]; total: [string, string] };

export type DocContent = {
  title: string;
  subtitle: string;
  parties: { label: string; lines: string[] }[];
  sections: { heading?: string; blocks: DocBlock[] }[];
  footer: string;
};

export function renderDoc(
  kind: GeneratedDocKind,
  { deal, client, note, invoiceNo, date }: { deal?: Deal; client?: Client; note?: string; invoiceNo?: string; date: number },
): DocContent {
  const clientName = client?.name ?? deal?.role.client ?? "Client";
  const contact = client?.contact;
  const agency = { label: "From", lines: [AGENCY.legalName, AGENCY.abn, AGENCY.address] };
  const to = { label: "To", lines: [clientName, ...(contact ? [`Attn: ${contact.name}, ${contact.title}`, contact.email] : [])] };
  const dated = formatDate(date);

  if (kind === "tob") {
    const pct = Math.round((deal?.feePct ?? client?.feePct ?? 0.2) * 100);
    return {
      title: "Terms of Business",
      subtitle: `Permanent recruitment services · ${dated}`,
      parties: [agency, to],
      sections: [
        {
          heading: "1. Fees",
          blocks: [{ type: "text", text: `Our fee is ${pct}% of the candidate's first-year base salary, payable when an introduced candidate accepts an offer of employment.` }],
        },
        {
          heading: "2. Rebate",
          blocks: [
            { type: "text", text: "If a placed candidate leaves within twelve weeks of starting, we credit part of the fee or find a replacement at no cost." },
            { type: "table", head: ["Candidate leaves within", "Credit"], rows: [["4 weeks", "100%"], ["8 weeks", "50%"], ["12 weeks", "25%"]] },
          ],
        },
        {
          heading: "3. Payment",
          blocks: [{ type: "text", text: "Invoices are due within 14 days of the candidate's start date. All fees are exclusive of GST." }],
        },
        {
          heading: "4. Introductions",
          blocks: [{ type: "text", text: "A candidate introduction is valid for 12 months. Any hire within that period incurs the fee above." }],
        },
      ],
      footer: `Signed for ${AGENCY.legalName} by ${RECRUITER.name}. Countersign and return to accept these terms.`,
    };
  }

  if (!deal) return { title: DOC_KIND_LABEL[kind], subtitle: "Choose a deal to fill this in", parties: [], sections: [], footer: "" };
  const c = deal.candidate;

  if (kind === "submission") {
    return {
      title: "Candidate submission",
      subtitle: `${deal.role.title} · ${dated}`,
      parties: [agency, to],
      sections: [
        {
          blocks: [
            {
              type: "rows",
              rows: [
                ["Candidate", c.name],
                ["Current role", `${c.title}, ${c.currentCompany}`],
                ["Location", c.location],
                ["Salary expectation", money(deal.role.salary)],
                ["Right to represent", `Confirmed by ${c.name.split(" ")[0]} on ${dated}`],
              ],
            },
          ],
        },
        { heading: "Why we're putting them forward", blocks: [{ type: "text", text: note?.trim() || "Add your notes on the left. They appear here." }] },
      ],
      footer: `Introduced by ${AGENCY.legalName} under our Terms of Business. Please don't contact the candidate directly.`,
    };
  }

  if (kind === "offer-recap") {
    return {
      title: "Offer recap",
      subtitle: `For ${c.name} · ${dated}`,
      parties: [
        { label: "From", lines: [RECRUITER.name, AGENCY.legalName] },
        { label: "To", lines: [c.name] },
      ],
      sections: [
        {
          blocks: [
            {
              type: "rows",
              rows: [
                ["Role", deal.role.title],
                ["Company", deal.role.client],
                ["Base salary", money(deal.role.salary)],
                ["Start date", "To be confirmed"],
              ],
            },
          ],
        },
        ...(note?.trim() ? [{ heading: "Notes", blocks: [{ type: "text" as const, text: note.trim() }] }] : []),
      ],
      footer: `This recap isn't a contract. The offer letter from ${deal.role.client} is the binding document.`,
    };
  }

  // invoice
  const amount = fee(deal);
  const gst = Math.round(amount * 0.1);
  return {
    title: `Tax invoice ${invoiceNo ?? ""}`.trim(),
    subtitle: `Issued ${dated} · Due in 14 days`,
    parties: [agency, { ...to, label: "Bill to" }],
    sections: [
      {
        blocks: [
          {
            type: "table",
            head: ["Description", "Amount"],
            rows: [
              [
                `Permanent placement: ${c.name}, ${deal.role.title}. ${Math.round(deal.feePct * 100)}% of ${money(deal.role.salary)} base salary.`,
                money(amount),
              ],
            ],
          },
          { type: "total", rows: [["Subtotal", money(amount)], ["GST (10%)", money(gst)]], total: ["Total due", money(amount + gst)] },
        ],
      },
      { heading: "Payment", blocks: [{ type: "text", text: "Bank transfer to Whitford Talent Pty Ltd · BSB 000-000 · Account 0000 0000. Please quote the invoice number." }] },
    ],
    footer: `${AGENCY.legalName} · ${AGENCY.abn}`,
  };
}

export function docTitle(kind: GeneratedDocKind, deal?: Deal, clientName?: string, invoiceNo?: string) {
  if (kind === "tob") return `Terms of Business — ${clientName ?? deal?.role.client ?? ""}`;
  if (kind === "invoice") return `Invoice ${invoiceNo} — ${deal?.candidate.name ?? ""}`;
  return `${DOC_KIND_LABEL[kind]} — ${deal?.candidate.name ?? ""}`;
}

export function fileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** TOB standing for a client, derived from the document register. */
export function tobStatus(clientName: string, docs: { kind: DocKind; client: string; status: DocStatus }[]): "signed" | "sent" | "draft" | "none" {
  const tobs = docs.filter((d) => d.client === clientName && (d.kind === "tob" || d.kind === "signed-tob"));
  if (tobs.some((d) => d.status === "signed" || d.kind === "signed-tob")) return "signed";
  if (tobs.some((d) => d.status === "sent")) return "sent";
  if (tobs.length) return "draft";
  return "none";
}
