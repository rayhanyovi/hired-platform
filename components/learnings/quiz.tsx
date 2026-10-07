"use client";

import { useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type { Question } from "@/lib/learnings";
import { Button, cx } from "../ui/primitives";

const LETTERS = ["A", "B", "C", "D", "E"];
const PASS_MARK = 0.6;

export function Quiz({ questions, onPass }: { questions: Question[]; onPass: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const finished = results.length === questions.length;

  const q = questions[index];
  const score = results.filter(Boolean).length;

  const check = () => {
    if (selected === null) return;
    setChecked(true);
    setResults((r) => [...r, selected === q.answer]);
  };

  const next = () => {
    setIndex(index + 1);
    setSelected(null);
    setChecked(false);
  };

  const passed = finished && score / questions.length >= PASS_MARK;

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setResults([]);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface">
      {/* Progress */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <span className="font-mono text-[11px] text-fg-faint num">
          {finished ? "Done" : `Question ${index + 1} of ${questions.length}`}
        </span>
        <ol className="ml-auto flex gap-1.5" aria-label="Quiz progress">
          {questions.map((_, i) => (
            <li
              key={i}
              className={cx(
                "h-1 w-6 rounded-full transition-colors",
                results[i] === true && "bg-good",
                results[i] === false && "bg-bad",
                results[i] === undefined && (i === index ? "bg-fg/60" : "bg-line-strong"),
              )}
            />
          ))}
        </ol>
      </div>

      <div className="px-5 py-6 sm:px-7">
        <fieldset key={index} className="animate-rise">
          <legend className="text-[17px] leading-snug text-fg">{q.prompt}</legend>
          <div className="mt-5 space-y-2" role="radiogroup">
            {q.options.map((option, i) => {
              const isSelected = selected === i;
              const isAnswer = q.answer === i;
              const state = !checked ? (isSelected ? "selected" : "idle") : isAnswer ? "correct" : isSelected ? "wrong" : "dim";
              return (
                <button
                  key={option}
                  role="radio"
                  aria-checked={isSelected}
                  disabled={checked}
                  onClick={() => setSelected(i)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-colors",
                    state === "idle" && "border-line bg-ink-sunken text-fg-muted hover:border-line-strong hover:text-fg",
                    state === "selected" && "border-fg/50 bg-raised text-fg",
                    state === "correct" && "border-good/50 bg-good/[0.07] text-fg",
                    state === "wrong" && "border-bad/50 bg-bad/[0.07] text-fg",
                    state === "dim" && "border-line bg-ink-sunken text-fg-faint",
                  )}
                >
                  <span
                    className={cx(
                      "grid size-6 shrink-0 place-items-center rounded-md border font-mono text-[11px]",
                      state === "selected" ? "border-fg/60 bg-fg text-ink" : "border-line-strong text-fg-faint",
                      state === "correct" && "border-good/60 bg-good text-ink",
                      state === "wrong" && "border-bad/60 bg-bad text-ink",
                    )}
                  >
                    {state === "correct" ? <Check className="size-3.5" strokeWidth={2.5} /> : state === "wrong" ? <X className="size-3.5" strokeWidth={2.5} /> : LETTERS[i]}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>

        {checked && (
          <div className="mt-5 animate-rise rounded-xl border border-line bg-ink-sunken px-4 py-3.5">
            <div className={cx("text-[13px] font-medium", results[index] ? "text-good" : "text-bad")}>
              {results[index] ? "Correct" : `Not quite. The answer is ${LETTERS[q.answer]}.`}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{q.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-line px-5 py-3.5">
        {finished ? (
          <>
            <div className="text-[13px] text-fg-muted">
              You scored <span className="text-fg num">{score}</span> of {questions.length}.{" "}
              {passed ? "Nice work." : `You need ${Math.ceil(PASS_MARK * questions.length)} to pass.`}
            </div>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={restart}>
              <RotateCcw className="size-3.5" /> Retake
            </Button>
            {passed && (
              <Button size="sm" variant="primary" onClick={onPass}>
                Mark complete <Check className="size-3.5" />
              </Button>
            )}
          </>
        ) : checked ? (
          <Button variant="primary" className="ml-auto" onClick={next}>
            Next question <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <Button variant="primary" className="ml-auto" onClick={check} disabled={selected === null}>
            Check answer
          </Button>
        )}
      </div>
    </div>
  );
}
