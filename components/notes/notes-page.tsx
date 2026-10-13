"use client";

import { useMemo, useState } from "react";
import { BookOpen, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useBrowserState } from "@/lib/use-browser-state";
import { Button } from "@/components/ui/primitives";
import { Page, PageHeader } from "@/components/ui/page-header";
import { TableExpandControl, TableWorkspace } from "@/components/ui/table-workspace";

type WikiNote = { id: string; title: string; content: string; updatedAt: number };

const STARTER_NOTES: WikiNote[] = [
  {
    id: "welcome-to-notes",
    title: "Welcome to Notes",
    content: "A shared place for the team's playbooks, client context and working knowledge.\n\nStart with a heading, then capture the details your team will want to find again.\n\nIdeas for this space\nRecruiting playbooks\nClient briefs and preferences\nInterview guides\nTeam processes",
    updatedAt: 0,
  },
];

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `note-${Date.now()}`;
}

function relativeSavedAt(timestamp: number) {
  if (!timestamp) return "Starter page";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Saved just now";
  if (minutes < 60) return `Saved ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Saved ${hours}h ago`;
  return `Saved ${Math.floor(hours / 24)}d ago`;
}

export function NotesPage() {
  const [notes, setNotes] = useBrowserState<WikiNote[]>("amara:wiki-notes:v1", STARTER_NOTES);
  const [activeId, setActiveId] = useState("welcome-to-notes");
  const [query, setQuery] = useState("");
  const visibleNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? notes.filter((note) => `${note.title}\n${note.content}`.toLowerCase().includes(normalized)) : notes;
  }, [notes, query]);
  const active = notes.find((note) => note.id === activeId) ?? visibleNotes[0] ?? notes[0];

  function updateActive(changes: Partial<Pick<WikiNote, "title" | "content">>) {
    if (!active) return;
    setNotes((current) => current.map((note) => note.id === active.id ? { ...note, ...changes, updatedAt: Date.now() } : note));
  }

  function createNote() {
    const note = { id: makeId(), title: "Untitled", content: "", updatedAt: Date.now() };
    setNotes((current) => [note, ...current]);
    setActiveId(note.id);
    setQuery("");
  }

  function deleteActive() {
    if (!active || notes.length < 2) return;
    const remaining = notes.filter((note) => note.id !== active.id);
    setNotes(remaining);
    setActiveId(remaining[0].id);
  }

  return (
    <Page className="flex flex-1 flex-col">
      <PageHeader eyebrow="Workspace" title="Notes">
        A home for team knowledge, playbooks and the details worth keeping.
      </PageHeader>

      <TableWorkspace title="Notes" inlineControl fill className="overflow-hidden rounded-2xl border border-line bg-surface">
      <section className="grid h-full min-h-[min(60vh,560px)] overflow-hidden md:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col border-b border-line bg-ink-sunken/40 md:border-r md:border-b-0">
          <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
            <div className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-fg-muted">
              <BookOpen className="size-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">Workspace</span>
              <span className="font-mono text-[10px] text-fg-faint num">{notes.length}</span>
            </div>
            <button onClick={createNote} aria-label="Create a note" title="Create a note" className="grid size-7 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-hover hover:text-fg">
              <Plus className="size-4" />
            </button>
          </div>
          <label className="mx-3 mb-3 flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-fg-faint focus-within:border-line-strong">
            <Search className="size-3.5 shrink-0" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a note" className="min-w-0 flex-1 bg-transparent text-[11px] text-fg outline-none placeholder:text-fg-faint" aria-label="Find a note" />
          </label>
          <div className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-1 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
            {visibleNotes.map((note) => {
              const selected = note.id === active?.id;
              return (
                <button key={note.id} onClick={() => setActiveId(note.id)} aria-current={selected ? "page" : undefined} className={`flex min-w-[180px] items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors md:min-w-0 ${selected ? "bg-raised text-fg" : "text-fg-muted hover:bg-raised/60 hover:text-fg"}`}>
                  <FileText className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px]">{note.title.trim() || "Untitled"}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-fg-faint">{note.content.split("\n").find((line) => line.trim()) || "Empty page"}</span>
                  </span>
                </button>
              );
            })}
            {visibleNotes.length === 0 && <p className="px-3 py-5 text-center text-[11px] text-fg-faint">No notes found.</p>}
          </div>
          <div className="hidden border-t border-line px-4 py-3 text-[10px] text-fg-faint md:block">Changes save in this browser</div>
        </aside>

        {active ? (
          <article className="flex min-w-0 flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-14 lg:py-10">
            <div className="mb-8 flex min-w-0 items-center justify-between gap-4">
              <div className="truncate text-[11px] text-fg-faint">Notes <span className="mx-1.5 text-line-strong">/</span> {active.title.trim() || "Untitled"}</div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-[10px] text-fg-faint sm:inline">{relativeSavedAt(active.updatedAt)}</span>
                <TableExpandControl mode="full-page" showLabel />
                <button onClick={deleteActive} disabled={notes.length < 2} aria-label="Delete this note" title={notes.length < 2 ? "Keep at least one page in Notes" : "Delete this note"} className="grid size-8 place-items-center rounded-lg text-fg-faint transition-colors hover:bg-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-30">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <input value={active.title} onChange={(event) => updateActive({ title: event.target.value })} aria-label="Page title" placeholder="Untitled" className="mb-5 w-full bg-transparent text-[30px] leading-tight font-semibold tracking-[-0.03em] text-fg outline-none placeholder:text-fg-faint sm:text-[36px]" />
            <textarea value={active.content} onChange={(event) => updateActive({ content: event.target.value })} aria-label="Page content" placeholder="Start writing…" className="min-h-[42vh] w-full flex-1 resize-none bg-transparent text-[14px] leading-7 text-fg-muted outline-none placeholder:text-fg-faint sm:text-[15px]" />
            <div className="mt-5 border-t border-line pt-3 text-[10px] text-fg-faint md:hidden">Changes save in this browser</div>
          </article>
        ) : (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div><BookOpen className="mx-auto mb-3 size-5 text-fg-faint" /><p className="text-[13px] text-fg-muted">No pages yet</p><Button onClick={createNote} size="sm" className="mt-4"><Plus className="size-3.5" />Create a note</Button></div>
          </div>
        )}
      </section>
      </TableWorkspace>
    </Page>
  );
}
