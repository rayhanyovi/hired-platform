import type { DocContent } from "@/lib/documents";
import { AmaraMark } from "../ui/primitives";

/** A light "paper" preview, so documents read like documents inside a dark app. */
export function DocPaper({ doc }: { doc: DocContent }) {
  return (
    <article className="rounded-lg bg-[#f6f5f2] px-7 py-8 text-[12.5px] leading-relaxed text-[#2a2a2a] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] sm:px-10 sm:py-10">
      <header className="flex items-start justify-between gap-6 border-b border-black/10 pb-5">
        <div>
          <h3 className="font-serif text-[24px] leading-tight text-[#141414]">{doc.title}</h3>
          <p className="mt-1 text-[11.5px] text-black/50">{doc.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-black/60">
          <AmaraMark className="h-3 w-3.5" /> Whitford Talent
        </div>
      </header>

      {doc.parties.length > 0 && (
        <div className="grid gap-5 border-b border-black/10 py-5 sm:grid-cols-2">
          {doc.parties.map((p) => (
            <div key={p.label}>
              <div className="mb-1 text-[10px] font-medium tracking-[0.1em] text-black/40 uppercase">{p.label}</div>
              {p.lines.map((l) => (
                <div key={l} className="text-black/75">
                  {l}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-5 pt-5">
        {doc.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h4 className="mb-1.5 text-[12.5px] font-semibold text-[#141414]">{s.heading}</h4>}
            <div className="space-y-3">
              {s.blocks.map((b, j) => {
                if (b.type === "text") return <p key={j} className="text-black/75">{b.text}</p>;
                if (b.type === "rows")
                  return (
                    <dl key={j} className="divide-y divide-black/10 border-y border-black/10">
                      {b.rows.map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[150px_1fr] gap-4 py-2">
                          <dt className="text-black/45">{k}</dt>
                          <dd className="text-black/85">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  );
                if (b.type === "table")
                  return (
                    <table key={j} className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-black/15 text-[10px] tracking-[0.08em] text-black/45 uppercase">
                          {b.head.map((h, k) => (
                            <th key={h} className={k === b.head.length - 1 ? "py-1.5 text-right font-medium" : "py-1.5 font-medium"}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r, k) => (
                          <tr key={k} className="border-b border-black/10">
                            {r.map((cell, m) => (
                              <td key={m} className={m === r.length - 1 ? "py-2 pl-4 text-right whitespace-nowrap tabular-nums" : "py-2 text-black/80"}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                return (
                  <div key={j} className="ml-auto w-full max-w-[260px] space-y-1 pt-1 tabular-nums">
                    {b.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between text-black/60">
                        <span>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-black/20 pt-1.5 font-semibold text-[#141414]">
                      <span>{b.total[0]}</span>
                      <span>{b.total[1]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {doc.footer && <footer className="mt-8 border-t border-black/10 pt-4 text-[11px] text-black/45">{doc.footer}</footer>}
    </article>
  );
}
