"use client";

import { useState } from "react";
import { FileText, Paperclip, Quote } from "lucide-react";
import type { Application, Attachment } from "@/lib/application";
import { ago } from "@/lib/time";
import type { Applicant, Job } from "@/lib/types";
import { cx } from "../ui/primitives";
import { Modal } from "../ui/modal";

export const sourceLabel = (app: Application) =>
  app.kind === "email"
    ? "Original email"
    : app.kind === "referral"
      ? "Referral"
      : "Application";

export function readFrom(app: Application) {
  const files = app.attachments.map((f) =>
    f.kind === "cv" ? "CV" : f.kind === "portfolio" ? "portfolio" : f.name,
  );
  const parts =
    app.kind === "email"
      ? ["the email", ...files]
      : app.kind === "referral"
        ? ["the referral note", ...files]
        : [
            ...files,
            app.coverLetter && "cover letter",
            `${app.questions.length} screening answers`,
          ];
  const list = parts.filter(Boolean) as string[];
  return list.length > 1
    ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`
    : list[0];
}

/** The application as it arrived: the email, the referral note or the board form, plus files. */
export function RawApplication({
  app,
  applicant: a,
  job,
}: {
  app: Application;
  applicant: Applicant;
  job?: Job;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const preview = app.attachments.find((f) => f.name === open);
  const when = new Date(a.at).toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 px-6 py-6">
      {app.kind === "email" && (
        <article className="overflow-hidden rounded-xl border border-line bg-surface">
          <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b border-line px-4 py-3 text-[12px]">
            <dt className="text-fg-faint">From</dt>
            <dd className="truncate text-fg">{app.from}</dd>
            <dt className="text-fg-faint">To</dt>
            <dd className="truncate text-fg-muted">{app.to}</dd>
            <dt className="text-fg-faint">Date</dt>
            <dd className="text-fg-muted">{when}</dd>
            <dt className="text-fg-faint">Subject</dt>
            <dd className="font-medium text-fg">{app.subject}</dd>
          </dl>
          <p className="px-4 py-4 text-[14px] leading-[1.7] whitespace-pre-wrap text-fg-muted">
            {app.body}
          </p>
        </article>
      )}

      {app.kind === "referral" && (
        <figure className="rounded-xl border border-line bg-surface px-4 py-4">
          <Quote className="size-4 text-fg-faint" />
          <blockquote className="mt-2 text-[14px] leading-relaxed text-fg">
            {app.note}
          </blockquote>
          <figcaption className="mt-2 text-[12px] text-fg-faint">
            {app.referrer}, referred {ago(a.at)}
          </figcaption>
        </figure>
      )}

      {app.kind === "board" && (
        <>
          <dl className="grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-3">
            {(
              [
                ["Applied via", app.via],
                ["Email", app.email],
                ["Phone", app.phone],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-fg-faint">{k}</dt>
                <dd className="truncate text-fg-muted">{v}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="mb-2 text-[11px] tracking-[0.08em] text-fg-faint uppercase">
              Employer questions
            </h3>
            <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {app.questions.map((x) => (
                <li key={x.q} className="px-4 py-3">
                  <p className="text-[12px] text-fg-faint">{x.q}</p>
                  <p className="mt-1 text-[13px] text-fg">{x.a}</p>
                </li>
              ))}
            </ol>
          </section>

          {app.coverLetter && (
            <section>
              <h3 className="mb-2 text-[11px] tracking-[0.08em] text-fg-faint uppercase">
                Cover letter
              </h3>
              <p className="rounded-xl border border-line bg-surface px-4 py-4 text-[14px] leading-[1.7] whitespace-pre-wrap text-fg-muted">
                {app.coverLetter}
              </p>
            </section>
          )}
        </>
      )}

      <section>
        <h3 className="mb-2 text-[11px] tracking-[0.08em] text-fg-faint uppercase">
          {app.kind === "email" ? "Attachments" : "Files"}
        </h3>
        <ul className="flex flex-wrap gap-2">
          {app.attachments.map((f) => (
            <li key={f.name}>
              <button
                onClick={() => setOpen(open === f.name ? null : f.name)}
                aria-expanded={open === f.name}
                className={cx(
                  "inline-flex h-10 items-center gap-2.5 rounded-lg border px-3 text-left text-[12px] transition-colors",
                  open === f.name
                    ? "border-line-strong bg-raised text-fg"
                    : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
                )}
              >
                <Paperclip className="size-3.5 text-fg-faint" />
                <span className="max-w-[220px] truncate">{f.name}</span>
                <span className="font-mono text-[10px] text-fg-faint num">
                  {f.size}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {preview && (
          <FilePreview
            file={preview}
            applicant={a}
            job={job}
            contact={
              app.kind === "board" ? `${app.email} · ${app.phone}` : undefined
            }
            onClose={() => setOpen(null)}
          />
        )}
      </section>
    </div>
  );
}

/** A stand-in for the PDF viewer: the CV as a page, so the recruiter can check Amara's read. */
function FilePreview({
  file,
  applicant: a,
  contact,
  onClose,
}: {
  file: Attachment;
  applicant: Applicant;
  job?: Job;
  contact?: string;
  onClose: () => void;
}) {
  return (
    <Modal title={file.name} description="Document preview · demo fixture" onClose={onClose} size="lg">
      {file.kind === "cv" ? (
        <div className="mx-auto max-w-[560px] rounded-sm bg-[#f7f6f2] px-8 py-9 text-[#2a2a2a] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)]">
          <h4 className="text-[20px] font-semibold tracking-[-0.01em]">
            {a.name}
          </h4>
          <p className="mt-0.5 text-[12px] text-[#555]">
            {a.headline} · {a.location}
          </p>
          {contact && <p className="text-[11px] text-[#777]">{contact}</p>}
          <h5 className="mt-6 border-b border-[#ddd] pb-1 text-[10px] font-semibold tracking-[0.12em] text-[#777] uppercase">
            Experience
          </h5>
          <ul className="mt-2 space-y-1.5 text-[12px]">
            {a.experience.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h5 className="mt-5 border-b border-[#ddd] pb-1 text-[10px] font-semibold tracking-[0.12em] text-[#777] uppercase">
            Highlights
          </h5>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px]">
            {a.matches.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid h-40 place-items-center text-center text-[13px] text-fg-faint">
          <span>
            <FileText className="mx-auto mb-2 size-5" />
            {file.name}
            <br />
            Preview isn&apos;t part of the demo.
          </span>
        </div>
      )}
    </Modal>
  );
}
