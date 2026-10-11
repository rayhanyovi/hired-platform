import { cx } from "./primitives";

export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
  greeting = false,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Serif is reserved for welcoming moments, like Amara's "Olá, Zoe". */
  greeting?: boolean;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header data-tour="page-header" className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 animate-rise">
        {eyebrow && <div className={cx("mb-3 font-mono text-[11px] tracking-[0.08em] text-fg-faint uppercase", !greeting && "md:hidden")}>{eyebrow}</div>}
        <h1
          className={
            greeting
              ? "font-serif text-[34px] leading-[1.05] tracking-[-0.01em] sm:text-[42px]"
              : "text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[30px]"
          }
        >
          {title}
        </h1>
        {children && <div className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-fg-muted">{children}</div>}
      </div>
      {actions && <div data-tour="page-actions" className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

export function Page({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto w-full px-4 pt-6 pb-16 sm:px-8 sm:pt-8 ${wide ? "max-w-[1400px]" : "max-w-[1180px]"}`}>
      {children}
    </main>
  );
}
