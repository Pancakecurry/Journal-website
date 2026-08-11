"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LocalDateSchema } from "@/domain/shared";
import {
  ReflectionPeriodSchema,
  type ReflectionAnswer,
  type ReflectionPeriod,
} from "@/domain/reflection";
import { REFLECTION_QUESTIONS } from "@/domain/reflection-questions";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./reflection-flow.module.css";

export function ReflectionFlow() {
  const router = useRouter();
  const params = useParams<{ period: string }>();
  const search = useSearchParams();
  const current = useMemo(() => currentDayContext(), []);
  const parsedPeriod = ReflectionPeriodSchema.safeParse(params.period);
  const period: ReflectionPeriod = parsedPeriod.success ? parsedPeriod.data : "morning";
  const parsedDate = LocalDateSchema.safeParse(search.get("date"));
  const localDate = parsedDate.success ? parsedDate.data : current.localDate;
  const questions = REFLECTION_QUESTIONS[period];
  const repository = useMemo(() => new LocalJournalRepository(getApplicationDatabase()), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ReflectionAnswer[]>([]);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("Optional means optional. Promise.");
  const question = questions[index];

  useEffect(() => {
    void repository.getDay(LOCAL_FOUNDATION_USER_ID, localDate).then((bundle) => {
      const saved = bundle.reflections.find((item) => item.period === period);
      if (!saved) return;
      setAnswers(saved.answers);
      const next = Math.min(saved.currentQuestion, questions.length - 1);
      setIndex(next);
      setValue(saved.answers.find((item) => item.questionId === questions[next]?.id)?.answer ?? "");
      setStatus(
        saved.completedAt
          ? "You already wrapped this up. Editing is still allowed."
          : "Picked up where you left off.",
      );
    });
  }, [localDate, period, questions, repository]);

  async function advance(skipped: boolean) {
    if (!question) return;
    const nextAnswers = [
      ...answers.filter((item) => item.questionId !== question.id),
      { questionId: question.id, answer: skipped ? "" : value.trim(), skipped },
    ];
    const final = index === questions.length - 1;
    await repository.saveReflection({
      userId: LOCAL_FOUNDATION_USER_ID,
      localDate,
      timeZone: current.timeZone,
      period,
      answers: nextAnswers,
      currentQuestion: final ? index : index + 1,
      complete: final,
    });
    setAnswers(nextAnswers);
    if (final) {
      router.push(localDate === current.localDate ? "/today" : `/day/${localDate}`);
      return;
    }
    setIndex((position) => position + 1);
    setValue("");
    setStatus(skipped ? "Skipped. Easy." : "Saved. Next one.");
  }

  return (
    <main className={styles.backdrop}>
      <article className={styles.paper}>
        <header>
          <Link href={localDate === current.localDate ? "/today" : `/day/${localDate}`}>
            ← Leave for now
          </Link>
          <span>
            {period === "morning" ? "Morning check-in" : "Evening wrap-up"} ·{" "}
            {readableDate(localDate, { month: "short", day: "numeric" })}
          </span>
        </header>
        <div
          className={styles.progress}
          aria-label={`Question ${index + 1} of ${questions.length}`}
        >
          {questions.map((item, position) => (
            <i key={item.id} data-current={position === index} data-done={position < index} />
          ))}
        </div>
        {question ? (
          <section>
            <p className={styles.count}>
              {index + 1} of {questions.length}
            </p>
            <h1>{question.prompt}</h1>
            <label>
              <span className="sr-only">Your answer</span>
              <textarea
                autoFocus
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={question.placeholder}
                rows={7}
              />
            </label>
            <div className={styles.actions}>
              <button className={styles.skip} onClick={() => void advance(true)}>
                Skip this one
              </button>
              <button className={styles.next} onClick={() => void advance(false)}>
                {index === questions.length - 1
                  ? "That's enough for today"
                  : value.trim()
                    ? "Save & next"
                    : "Nothing to add · next"}
              </button>
            </div>
          </section>
        ) : null}
        <footer role="status" aria-live="polite">
          {status}
        </footer>
      </article>
    </main>
  );
}
