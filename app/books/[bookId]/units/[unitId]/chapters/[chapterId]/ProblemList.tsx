"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../../../lib/supabase";
import type { Result } from "../../../../../../../types/database";

type Attempt = { problem_number: string; result: Result; attempted_at: string };
type Props = { bookId: string; unitId: string; chapterId: string; problemNumbers: number[] };

export default function ProblemList({ bookId, unitId, chapterId, problemNumbers }: Props) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttempts() {
      const { data, error } = await supabase
        .from("attempts")
        .select("problem_number, result, attempted_at")
        .eq("book_id", bookId)
        .eq("unit_id", unitId)
        .order("attempted_at", { ascending: false });
      if (error) console.error(error);
      setAttempts((data ?? []) as Attempt[]);
      setLoading(false);
    }
    loadAttempts();
  }, [bookId, unitId]);

  function latestResult(problemNumber: number) {
    return attempts.find((attempt) => Number(attempt.problem_number) === problemNumber)?.result ?? null;
  }

  function resultText(result: Result | null) {
    if (result === "correct") return "正解";
    if (result === "partial") return "部分正解";
    if (result === "wrong") return "不正解";
    return "未解答";
  }

  return <section className="problem-list">
    {loading ? <p className="loading-message">読み込み中...</p> : problemNumbers.map((number) => {
      const result = latestResult(number);
      return <Link key={number} href={`/books/${bookId}/units/${unitId}/chapters/${chapterId}/problems/${number}`} className="problem-card">
        <div><strong>問題 {number}</strong><p className={`problem-status ${result ?? "unattempted"}`}>{resultText(result)}</p></div><span>→</span>
      </Link>;
    })}
  </section>;
}
