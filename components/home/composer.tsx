"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, FileUp, Paperclip, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cx } from "../ui/primitives";

const MODES = [
  { id: "chat", label: "Chat", hint: "Ask anything about your desk" },
  { id: "search", label: "Search", hint: "Find candidates and clients" },
  { id: "draft", label: "Draft", hint: "Write emails, terms and notes" },
] as const;
type Mode = (typeof MODES)[number]["id"];

const ATTACH = ["Job description.pdf", "Candidate CV.pdf", "Client brief.docx"];

/**
 * Amara's input. Lives in the hero on Home and docks to the bottom in chat;
 * the parent animates between the two with a shared layout id.
 */
export function Composer({
  placeholders,
  onSend,
  disabled = false,
  docked = false,
  autoFocus = false,
}: {
  placeholders: string[];
  onSend: (text: string) => void;
  disabled?: boolean;
  docked?: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<Mode>("chat");
  const [files, setFiles] = useState<string[]>([]);
  const [menu, setMenu] = useState<"attach" | "mode" | null>(null);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // Rotate example prompts while the box is empty.
  useEffect(() => {
    if (value || placeholders.length < 2) return;
    const id = setInterval(() => setTick((t) => t + 1), 3200);
    return () => clearInterval(id);
  }, [value, placeholders.length]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setMenu(null);
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menu]);

  const canSend = value.trim().length > 0 && !disabled;
  const submit = () => {
    if (!canSend) return;
    const withFiles = files.length ? `${value.trim()} (attached: ${files.join(", ")})` : value.trim();
    onSend(withFiles);
    setValue("");
    setFiles([]);
  };

  const placeholder = placeholders[tick % placeholders.length];

  return (
    <div
      ref={wrap}
      className={cx(
        "relative rounded-[20px] border bg-surface transition-[border-color,box-shadow] duration-200",
        "border-line-strong focus-within:border-white/20",
        docked
          ? "shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.8)]"
          : "shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.02)] focus-within:shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9),0_0_0_4px_rgb(236_124_244/0.08)]",
      )}
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {files.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-raised px-2 py-1 text-[12px] text-fg-muted">
              <Paperclip className="size-3" /> {f}
              <button onClick={() => setFiles((fs) => fs.filter((x) => x !== f))} aria-label={`Remove ${f}`} className="text-fg-faint hover:text-fg">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          data-home-composer
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          aria-label="Message Amara"
          className={cx(
            "block max-h-48 w-full resize-none bg-transparent px-5 text-[15px] leading-relaxed text-fg outline-none [field-sizing:content] focus-visible:outline-none",
            docked ? "min-h-[52px] pt-3.5" : "min-h-[64px] pt-4",
          )}
        />
        {!value && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={placeholder}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              aria-hidden="true"
              className={cx("pointer-events-none absolute left-5 truncate text-[15px] text-fg-faint", docked ? "top-3.5" : "top-4")}
            >
              {placeholder}
            </motion.span>
          </AnimatePresence>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-3 pb-3">
        <div className="relative">
          <IconButton label="Attach a file" active={menu === "attach"} onClick={() => setMenu(menu === "attach" ? null : "attach")}>
            <Plus className="size-[18px]" />
          </IconButton>
          {menu === "attach" && (
            <Menu docked={docked}>
              {ATTACH.map((f) => (
                <MenuItem
                  key={f}
                  onClick={() => {
                    setFiles((fs) => (fs.includes(f) ? fs : [...fs, f]));
                    setMenu(null);
                    ref.current?.focus();
                  }}
                >
                  <FileUp className="size-3.5 text-fg-faint" /> {f}
                </MenuItem>
              ))}
            </Menu>
          )}
        </div>

        <div className="relative ml-auto">
          <button
            onClick={() => setMenu(menu === "mode" ? null : "mode")}
            aria-haspopup="menu"
            aria-expanded={menu === "mode"}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] text-fg-muted transition-colors hover:bg-raised hover:text-fg"
          >
            {MODES.find((m) => m.id === mode)?.label}
            <ChevronDown className="size-3.5" />
          </button>
          {menu === "mode" && (
            <Menu docked={docked} align="right">
              {MODES.map((m) => (
                <MenuItem
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setMenu(null);
                    ref.current?.focus();
                  }}
                >
                  <span className="flex flex-col items-start">
                    <span className={m.id === mode ? "text-fg" : "text-fg-muted"}>{m.label}</span>
                    <span className="text-[11px] text-fg-faint">{m.hint}</span>
                  </span>
                </MenuItem>
              ))}
            </Menu>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          className="grid size-9 place-items-center rounded-[10px] bg-primary text-primary-foreground transition-[background-color,opacity,transform] hover:bg-primary-hover active:scale-95 disabled:opacity-50"
        >
          <ArrowUp className="size-[18px]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-expanded={active}
      className={cx("grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-raised hover:text-fg", active && "bg-raised text-fg")}
    >
      {children}
    </button>
  );
}

function Menu({ children, docked, align = "left" }: { children: React.ReactNode; docked: boolean; align?: "left" | "right" }) {
  return (
    <div
      role="menu"
      className={cx(
        "absolute z-30 w-60 animate-pop overflow-hidden rounded-xl border border-line-strong bg-raised p-1 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.9)]",
        docked ? "bottom-full mb-2" : "top-full mt-2",
        align === "right" ? "right-0" : "left-0",
      )}
    >
      {children}
    </div>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-fg-muted transition-colors hover:bg-hover hover:text-fg">
      {children}
    </button>
  );
}
