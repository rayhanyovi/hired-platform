import { cx } from "./primitives";

export const TABLE_HEADING_CLASS = "border-b border-line text-[11px] tracking-[0.06em] text-fg-faint uppercase";

export function TableHeader({ columns }: { columns: { label: React.ReactNode; align?: "right"; className?: string }[] }) {
  return <thead><tr className={TABLE_HEADING_CLASS}>
    {columns.map((column, i) => <th key={`${column.label}-${i}`} scope="col" className={cx(i === 0 ? "px-5 py-3" : "px-3 py-3", "font-normal", column.align === "right" && "text-right", column.className)}>{column.label || <span className="sr-only">Actions</span>}</th>)}
  </tr></thead>;
}


export function GridTableHeader({ columns, layout }: { columns: { label: string; align?: "right" }[]; layout: string }) {
  return <div className={cx("hidden items-center gap-x-4 px-5 py-3 font-normal md:grid", TABLE_HEADING_CLASS, layout)}>{columns.map((column, i) => <span key={`${column.label}-${i}`} className={column.align === "right" ? "text-right" : undefined}>{column.label}</span>)}</div>;
}
