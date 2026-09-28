"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { completeOnboarding, saveAnswer } from "@/app/(app)/app/actions";
import { Button } from "@/components/ui/button";
import { onboardingCopy as t, QUESTIONS, STAGES, type Question } from "@/content/onboarding";
import { cn } from "@/lib/cn";

export type Answers = Record<string, string | string[]>;

function isAnswered(q: Question, answers: Answers): boolean {
  const value = answers[q.id];
  if (q.kind === "english_test") return answers.english_test !== undefined;
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";
}

/**
 * Carta de Bordo onboarding: one large question per screen, saved on every
 * answer. The route at the bottom fills stage by stage.
 */
export function OnboardingFlow({ initial, completed }: { initial: Answers; completed: boolean }) {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [index, setIndex] = useState(() => {
    if (completed) return 0;
    const first = QUESTIONS.findIndex((q) => !isAnswered(q, initial));
    return first === -1 ? QUESTIONS.length : first;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  const done = index >= QUESTIONS.length;
  const question = QUESTIONS[Math.min(index, QUESTIONS.length - 1)]!;

  function submit(formData: FormData, patch: Answers) {
    setErrors({});
    setMessage(null);
    startTransition(async () => {
      const result = await saveAnswer(question.id, { ok: false }, formData);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? null);
        return;
      }
      setAnswers((prev) => ({ ...prev, ...patch }));
      setIndex((i) => i + 1);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const patch: Answers = {};
    for (const key of new Set(formData.keys())) {
      const all = formData.getAll(key).map(String);
      patch[key] = question.kind === "multi" ? all : (all[0] ?? "");
    }
    submit(formData, patch);
  }

  function choose(value: string) {
    const formData = new FormData();
    formData.set(question.id, value);
    submit(formData, { [question.id]: value });
  }

  const stageProgress = STAGES.map((_, stage) => {
    const inStage = QUESTIONS.filter((q) => q.stage === stage);
    const answered = inStage.filter((q) => isAnswered(q, answers)).length;
    return inStage.length ? answered / inStage.length : 0;
  });

  return (
    <div className="grid min-h-[calc(100svh-12rem)] grid-rows-[1fr_auto] gap-10">
      <div aria-live="polite" className="sr-only">
        {done ? t.doneTitle : `${t.eyebrow}: ${index + 1} ${t.of} ${QUESTIONS.length}`}
      </div>

      {done ? (
        <section className="grid content-center justify-items-start gap-8">
          <p className="type-eyebrow text-green-ink">
            {STAGES.length} {t.of} {STAGES.length}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="type-mega max-w-[12ch] outline-none">
            {t.doneTitle}
          </h1>
          <p className="type-lead">{t.doneBody}</p>
          <div className="flex flex-wrap gap-3">
            <form action={completeOnboarding}>
              <Button type="submit" size="lg" arrow>
                {t.finish}
              </Button>
            </form>
            <Button type="button" variant="ghost" size="lg" onClick={() => setIndex(0)}>
              {t.back}
            </Button>
          </div>
        </section>
      ) : (
        <section
          key={question.id}
          className="grid animate-[fade-up_600ms_var(--ease-out-expo)_both] content-center gap-8"
        >
          <p className="type-mono flex flex-wrap items-center gap-3 text-ink-muted">
            <span className="font-semibold text-green-ink">0{question.stage + 1}</span>
            <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
            <span className="tracking-[0.14em] text-accent uppercase">
              {STAGES[question.stage]}
            </span>
            <span className="ml-auto">
              {index + 1} {t.of} {QUESTIONS.length}
            </span>
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="type-display max-w-[18ch] outline-none">
            {question.title}
          </h1>
          {question.hint && <p className="type-lead -mt-2">{question.hint}</p>}

          <QuestionInput
            question={question}
            answers={answers}
            errors={errors}
            pending={pending}
            onSubmit={onSubmit}
            onChoose={choose}
          />

          {message && (
            <p role="alert" className="font-medium text-(--status-fails)">
              {message}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIndex((i) => i - 1)}
                disabled={pending}
              >
                ← {t.back}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIndex((i) => i + 1)}
              disabled={pending}
            >
              {t.skip}
            </Button>
          </div>
        </section>
      )}

      <StageRoute progress={stageProgress} current={done ? STAGES.length : question.stage} />
    </div>
  );
}

// ------------------------------------------------------------------ inputs --

const bigInput =
  "w-full max-w-xl border-b-2 border-line-strong bg-transparent pb-3 text-[clamp(1.75rem,1.2rem+2.4vw,3rem)] font-semibold tracking-tight text-ink " +
  "placeholder:text-ink-muted/60 transition-colors duration-300 focus:border-route focus:outline-none";

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="font-medium text-(--status-fails)">
      {error}
    </p>
  );
}

function QuestionInput({
  question,
  answers,
  errors,
  pending,
  onSubmit,
  onChoose,
}: {
  question: Question;
  answers: Answers;
  errors: Record<string, string>;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChoose: (value: string) => void;
}) {
  const current = answers[question.id];
  const errorId = `${question.id}-error`;
  const continueButton = (
    <Button type="submit" size="lg" arrow disabled={pending} className="justify-self-start">
      {pending ? t.saving : t.next}
    </Button>
  );

  if (question.kind === "choice") {
    return (
      <div
        role="radiogroup"
        aria-labelledby={undefined}
        aria-describedby={errors[question.id] ? errorId : undefined}
        className="grid max-w-2xl gap-2"
      >
        {question.choices.map((choice, i) => {
          const selected = current === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={pending}
              onClick={() => onChoose(choice.value)}
              className={cn(
                "group flex items-center gap-4 rounded-sm px-4 py-4 text-left transition-[background-color,box-shadow] duration-300",
                "shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]",
                selected && "bg-(--status-meets-bg) shadow-[inset_0_0_0_2px_var(--route)]",
              )}
            >
              <span className="type-mono w-6 shrink-0 text-ink-muted">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="grid gap-0.5">
                <span className="text-lg font-semibold">{choice.label}</span>
                {choice.hint && (
                  <span className="text-[0.9375rem] text-ink-muted">{choice.hint}</span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "ml-auto size-3 shrink-0 rounded-full border-2 transition-colors",
                  selected ? "border-route bg-route" : "border-line-strong",
                )}
              />
            </button>
          );
        })}
        <FieldError id={errorId} error={errors[question.id]} />
      </div>
    );
  }

  if (question.kind === "multi") {
    const selected = new Set(Array.isArray(current) ? current : []);
    return (
      <form onSubmit={onSubmit} className="grid gap-6">
        <fieldset className="flex max-w-2xl flex-wrap gap-2">
          <legend className="sr-only">{question.title}</legend>
          {question.choices.map((choice) => (
            <label
              key={choice.value}
              className="relative flex cursor-pointer items-center gap-3 rounded-sm px-5 py-4 text-lg font-semibold shadow-[inset_0_0_0_1px_var(--line-strong)] transition-shadow duration-300 has-checked:bg-(--status-meets-bg) has-checked:shadow-[inset_0_0_0_2px_var(--route)] has-focus-visible:outline-2 has-focus-visible:outline-(--focus)"
            >
              <input
                type="checkbox"
                name={question.id}
                value={choice.value}
                defaultChecked={selected.has(choice.value)}
                className="sr-only"
              />
              <span className="type-mono text-ink-muted">{choice.value}</span>
              {choice.label}
            </label>
          ))}
        </fieldset>
        <FieldError id={errorId} error={errors[question.id]} />
        {continueButton}
      </form>
    );
  }

  if (question.kind === "english_test") {
    return (
      <EnglishTestInput
        question={question}
        answers={answers}
        errors={errors}
        pending={pending}
        onSubmit={onSubmit}
      />
    );
  }

  const common = {
    id: question.id,
    name: question.id,
    "aria-label": question.title,
    "aria-invalid": errors[question.id] ? true : undefined,
    "aria-describedby": errors[question.id] ? errorId : undefined,
    className: bigInput,
    autoFocus: true,
  } as const;

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {question.kind === "date" && (
        <input
          {...common}
          type="date"
          required
          defaultValue={typeof current === "string" ? current : ""}
        />
      )}
      {question.kind === "text" && (
        <input
          {...common}
          type="text"
          required
          placeholder={question.placeholder}
          defaultValue={typeof current === "string" ? current : ""}
          autoComplete="organization-title"
        />
      )}
      {question.kind === "number" && (
        <div className="flex max-w-xl items-baseline gap-3">
          {question.unit === "R$" && (
            <span className="text-2xl font-semibold text-ink-muted">R$</span>
          )}
          <input
            {...common}
            type="number"
            inputMode="decimal"
            required
            min={question.min}
            max={question.max}
            step={question.step}
            defaultValue={typeof current === "string" ? current : ""}
          />
          {question.unit && question.unit !== "R$" && (
            <span className="text-2xl font-semibold text-ink-muted">{question.unit}</span>
          )}
        </div>
      )}
      <FieldError id={errorId} error={errors[question.id]} />
      {continueButton}
    </form>
  );
}

function EnglishTestInput({
  question,
  answers,
  errors,
  pending,
  onSubmit,
}: {
  question: Extract<Question, { kind: "english_test" }>;
  answers: Answers;
  errors: Record<string, string>;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [test, setTest] = useState(
    typeof answers.english_test === "string" ? answers.english_test : "",
  );
  const scoreClass =
    "h-14 w-full rounded-sm bg-surface px-4 text-2xl font-semibold shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_2px_var(--route)] focus:outline-none";
  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <fieldset className="flex max-w-3xl flex-wrap gap-2">
        <legend className="sr-only">{question.title}</legend>
        {question.choices.map((choice) => (
          <label
            key={choice.value || "none"}
            className="flex cursor-pointer items-center rounded-sm px-5 py-3 text-lg font-semibold shadow-[inset_0_0_0_1px_var(--line-strong)] transition-shadow duration-300 has-checked:bg-(--status-meets-bg) has-checked:shadow-[inset_0_0_0_2px_var(--route)] has-focus-visible:outline-2 has-focus-visible:outline-(--focus)"
          >
            <input
              type="radio"
              name="english_test"
              value={choice.value}
              checked={test === choice.value}
              onChange={() => setTest(choice.value)}
              className="sr-only"
            />
            {choice.label}
          </label>
        ))}
      </fieldset>
      {test && (
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="font-semibold">{t.overall}</span>
            <input
              name="english_score"
              type="text"
              inputMode="decimal"
              required
              defaultValue={typeof answers.english_score === "string" ? answers.english_score : ""}
              aria-invalid={errors.english_score ? true : undefined}
              className={scoreClass}
            />
            <FieldError id="english_score-error" error={errors.english_score} />
          </label>
          <label className="grid gap-2">
            <span className="font-semibold">{t.lowest}</span>
            <input
              name="english_lowest_component"
              type="text"
              inputMode="decimal"
              defaultValue={
                typeof answers.english_lowest_component === "string"
                  ? answers.english_lowest_component
                  : ""
              }
              aria-invalid={errors.english_lowest_component ? true : undefined}
              className={scoreClass}
            />
            <FieldError id="english_lowest-error" error={errors.english_lowest_component} />
          </label>
        </div>
      )}
      <Button type="submit" size="lg" arrow disabled={pending} className="justify-self-start">
        {pending ? t.saving : t.next}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------- route --

/** Five stages on one line; each segment fills as its questions are answered. */
function StageRoute({ progress, current }: { progress: number[]; current: number }) {
  return (
    <ol aria-label="Etapas do perfil" className="grid grid-cols-5 gap-1 border-t border-line pt-5">
      {STAGES.map((stage, i) => {
        const value = progress[i] ?? 0;
        return (
          <li key={stage} className="grid gap-2" aria-current={i === current ? "step" : undefined}>
            <span aria-hidden="true" className="relative block h-0.5 bg-line-strong">
              <span
                className="absolute inset-y-0 left-0 bg-route transition-[width] duration-700 ease-out-expo"
                style={{ width: `${value * 100}%` }}
              />
              <span
                className={cn(
                  "absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full border-2",
                  value > 0 ? "border-route bg-route" : "border-line-strong bg-bg",
                )}
              />
            </span>
            <span
              className={cn(
                "type-mono truncate",
                i === current ? "font-semibold text-ink" : "text-ink-muted",
              )}
            >
              <span className="max-sm:hidden">{stage}</span>
              <span className="sm:hidden">0{i + 1}</span>
              <span className="sr-only">{value >= 1 ? " (concluída)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
