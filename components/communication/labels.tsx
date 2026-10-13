"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, CornerDownRight, FolderPlus, Palette, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { LABEL_COLORS, labelPath, labelTree, withChildren } from "@/lib/labels";
import { useDesk } from "@/lib/store";
import type { Label, LabelColor } from "@/lib/types";
import { useContextMenu, type MenuEntry } from "../ui/context-menu";
import { Field, inputClass, Modal } from "../ui/modal";
import { Button, cx } from "../ui/primitives";

export function LabelDot({ color, className }: { color: LabelColor; className?: string }) {
  return <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", LABEL_COLORS[color].dot, className)} />;
}

/** A label on a row or a conversation. */
/** `wide` lets the chip use the room it has (side panel) instead of truncating like it must in a list row. */
export function LabelChip({ label, onRemove, title, wide = false }: { label: Label; onRemove?: () => void; title?: string; wide?: boolean }) {
  return (
    <span title={title ?? label.name} className={cx("group/chip inline-flex h-5 min-w-0 items-center", wide ? "max-w-full" : "max-w-[9rem]", "gap-1.5 rounded-md border border-line-strong bg-ink/60 px-1.5 text-[11px] text-fg-muted")}>
      <LabelDot color={label.color} className="size-1.5" />
      <span className="truncate">{label.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label.name}`}
          className="-mr-0.5 grid size-3.5 place-items-center rounded text-fg-faint hover:bg-hover hover:text-fg"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

/** Tick labels on or off for one conversation, or make a new one from what you typed. */
export function LabelPicker({ convKey, name }: { convKey: string; name: string }) {
  const { labels, conversationFlags, toggleLabel, addLabel } = useDesk();
  const [query, setQuery] = useState("");
  const applied = conversationFlags[convKey]?.labels ?? [];
  const q = query.trim().toLowerCase();
  const rows = labelTree(labels).filter(({ label }) => !q || labelPath(labels, label.id).toLowerCase().includes(q));
  const exact = labels.some((l) => l.name.toLowerCase() === q);

  return (
    <div className="w-60">
      <div className="relative px-1 pt-1 pb-1.5">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-fg-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q && !exact) {
              e.preventDefault();
              toggleLabel(convKey, name, addLabel({ name: query.trim(), color: "grey" }));
              setQuery("");
            }
          }}
          placeholder="Filter or create"
          aria-label="Filter labels"
          className="h-8 w-full rounded-lg border border-line-strong bg-ink-sunken pr-2 pl-8 text-[12px] text-fg outline-none placeholder:text-fg-faint focus:border-fg/40"
        />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {rows.map(({ label, depth }) => {
          const on = applied.includes(label.id);
          return (
            <button
              key={label.id}
              role="menuitemcheckbox"
              aria-checked={on}
              onClick={() => toggleLabel(convKey, name, label.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-fg-muted outline-none hover:bg-raised hover:text-fg focus-visible:bg-raised focus-visible:text-fg"
              style={{ paddingLeft: 10 + depth * 14 }}
            >
              <span className={cx("grid size-3.5 shrink-0 place-items-center rounded border", on ? "border-fg bg-fg text-ink" : "border-line-strong")}>{on && <Check className="size-2.5" strokeWidth={3} />}</span>
              <LabelDot color={label.color} />
              <span className="min-w-0 flex-1 truncate">{label.name}</span>
            </button>
          );
        })}
        {q && !exact && (
          <button
            onClick={() => {
              toggleLabel(convKey, name, addLabel({ name: query.trim(), color: "grey" }));
              setQuery("");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-fg-muted hover:bg-raised hover:text-fg"
          >
            <Plus className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              Create <span className="text-fg">&ldquo;{query.trim()}&rdquo;</span>
            </span>
          </button>
        )}
        {!rows.length && !q && <p className="px-2.5 py-2 text-[12px] text-fg-faint">No labels yet. Type a name to make one.</p>}
      </div>
    </div>
  );
}

type Editing = { mode: "new"; parentId?: string } | { mode: "edit"; label: Label };

/**
 * Labels across the top of the list: pick one to filter. Picking a parent
 * shows what's nested under it. Right-click a label to rename, nest, recolour
 * or delete it.
 */
export function LabelBar({ active, onChange, counts }: { active: string | null; onChange: (id: string | null) => void; counts: Record<string, number> }) {
  const { labels, updateLabel, deleteLabel, notify } = useDesk();
  const { bind, menu } = useContextMenu();
  const [editing, setEditing] = useState<Editing | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  // Picked from the filter menu or a stat card, the active label may be off to the side: bring it in.
  useEffect(() => {
    bar.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [active]);
  const top = labels.filter((l) => !l.parentId);
  // The open branch: the active label's ancestors, so its siblings and children stay in reach.
  const open = new Set<string>();
  let at = labels.find((x) => x.id === active);
  while (at) {
    open.add(at.id);
    const parent: string | undefined = at.parentId;
    at = labels.find((x) => x.id === parent);
  }

  const manage = (l: Label): MenuEntry[] => [
    { label: active === l.id ? "Show everything" : "Show only this", icon: Tag, onSelect: () => onChange(active === l.id ? null : l.id) },
    { separator: true },
    { label: "Rename", icon: Pencil, onSelect: () => setEditing({ mode: "edit", label: l }) },
    { label: "Add sub-label", icon: FolderPlus, onSelect: () => setEditing({ mode: "new", parentId: l.id }) },
    {
      label: "Colour",
      icon: Palette,
      submenu: (Object.keys(LABEL_COLORS) as LabelColor[]).map((c) => ({ label: LABEL_COLORS[c].name, checked: l.color === c, onSelect: () => updateLabel(l.id, { color: c }) })),
    },
    { separator: true },
    {
      label: "Delete",
      icon: Trash2,
      danger: true,
      hint: withChildren(labels, l.id).length > 1 ? `+${withChildren(labels, l.id).length - 1} nested` : undefined,
      onSelect: () => {
        if (active && withChildren(labels, l.id).includes(active)) onChange(null);
        deleteLabel(l.id);
        notify(`Deleted ${l.name}`);
      },
    },
  ];

  const chip = (l: Label, nested: boolean) => {
    const on = active === l.id;
    const kids = labels.filter((x) => x.parentId === l.id);
    return (
      <button
        key={l.id}
        {...bind(labelPath(labels, l.id), () => manage(l))}
        onClick={() => onChange(on ? null : l.id)}
        aria-pressed={on}
        title={kids.length ? `${l.name}: includes ${kids.map((k) => k.name).join(", ")}` : l.name}
        className={cx(
          "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[12px] whitespace-nowrap transition-colors",
          on ? "border-fg/25 bg-raised text-fg shadow-[0_0_0_1px_rgb(255_255_255/0.04)]" : "border-line-strong text-fg-muted hover:border-fg/20 hover:text-fg",
          nested && !on && "border-dashed",
        )}
      >
        {nested && <CornerDownRight className="-ml-0.5 size-3 text-fg-faint" />}
        <LabelDot color={l.color} />
        {l.name}
        {counts[l.id] > 0 && <span className={cx("font-mono text-[10px] num", on ? "text-fg-muted" : "text-fg-faint")}>{counts[l.id]}</span>}
        {kids.length > 0 && <ChevronRight className={cx("-mx-0.5 size-3 text-fg-faint transition-transform", open.has(l.id) && "rotate-90")} aria-hidden="true" />}
        {on && <X className="-mr-0.5 size-3 text-fg-muted" aria-hidden="true" />}
      </button>
    );
  };

  const branch = (l: Label, depth: number): React.ReactNode[] => [chip(l, depth > 0), ...(open.has(l.id) ? labels.filter((x) => x.parentId === l.id).flatMap((k) => branch(k, depth + 1)) : [])];

  return (
    <>
      <div ref={bar} className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 [mask-image:linear-gradient(90deg,#000_calc(100%-24px),transparent)] [scrollbar-width:none]!" role="toolbar" aria-label="Labels">
        <Tag className="mr-0.5 size-3.5 shrink-0 text-fg-faint" aria-hidden="true" />
        {top.flatMap((l) => branch(l, 0))}
        <button
          onClick={() => setEditing({ mode: "new", parentId: active ?? undefined })}
          aria-label="New label"
          title="New label"
          className="mr-6 grid size-7 shrink-0 place-items-center rounded-lg border border-dashed border-line-strong text-fg-faint hover:border-fg/25 hover:text-fg"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {menu}
      {/* A new label has nothing on it yet, so don't filter to it; open its parent so you can see where it went. */}
      {editing && <LabelDialog editing={editing} onClose={() => setEditing(null)} onCreated={(parentId) => parentId && onChange(parentId)} />}
    </>
  );
}

/** Make a label, or rename and recolour one. */
function LabelDialog({ editing, onClose, onCreated }: { editing: Editing; onClose: () => void; onCreated: (parentId?: string) => void }) {
  const { labels, addLabel, updateLabel, notify } = useDesk();
  const editingLabel = editing.mode === "edit" ? editing.label : undefined;
  const [name, setName] = useState(editingLabel?.name ?? "");
  const [color, setColor] = useState<LabelColor>(editingLabel?.color ?? "grey");
  const [parentId, setParentId] = useState<string>(editingLabel?.parentId ?? (editing.mode === "new" ? (editing.parentId ?? "") : ""));
  // A label can't nest under itself or anything inside it.
  const blocked = editingLabel ? withChildren(labels, editingLabel.id) : [];
  const taken = labels.some((l) => l.id !== editingLabel?.id && (l.parentId ?? "") === parentId && l.name.toLowerCase() === name.trim().toLowerCase());

  const save = () => {
    if (!name.trim() || taken) return;
    if (editingLabel) {
      updateLabel(editingLabel.id, { name: name.trim(), color, parentId: parentId || undefined });
      notify(`Saved ${name.trim()}`);
    } else {
      addLabel({ name: name.trim(), color, parentId: parentId || undefined });
      onCreated(parentId || undefined);
      notify(`Created ${name.trim()}`);
    }
    onClose();
  };

  return (
    <Modal
      title={editingLabel ? "Edit label" : "New label"}
      description="Labels are yours: group conversations however you work. Nest one under another to keep them tidy."
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!name.trim() || taken}>
            {editingLabel ? "Save" : "Create label"}
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
        <Field label="Name" htmlFor="label-name" hint={taken ? "Already used here" : undefined}>
          <input id="label-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shortlist, Fee talks" className={inputClass} autoComplete="off" />
        </Field>
        <Field label="Colour">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Colour">
            {(Object.keys(LABEL_COLORS) as LabelColor[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                onClick={() => setColor(c)}
                className={cx("inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[12px] transition-colors", color === c ? "border-fg/30 bg-raised text-fg" : "border-line-strong text-fg-muted hover:text-fg")}
              >
                <LabelDot color={c} />
                {LABEL_COLORS[c].name}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Nest under" htmlFor="label-parent" hint="Optional">
          <select id="label-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass}>
            <option value="">Nothing, keep it at the top</option>
            {labelTree(labels)
              .filter(({ label }) => !blocked.includes(label.id))
              .map(({ label, depth }) => (
                <option key={label.id} value={label.id}>
                  {`${"  ".repeat(depth)}${label.name}`}
                </option>
              ))}
          </select>
        </Field>
      </form>
    </Modal>
  );
}
