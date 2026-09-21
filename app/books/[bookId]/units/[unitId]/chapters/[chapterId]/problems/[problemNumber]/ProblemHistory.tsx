"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../../../../../lib/supabase";
import { formatDateTime } from "../../../../../../../../../lib/date";
import type { Result } from "../../../../../../../../../types/database";

type Attempt = { result: Result; duration_seconds: number; attempted_at: string };
type Props = { bookId: string; unitId: string; problemNumber: string };

export default function ProblemHistory({ bookId, unitId, problemNumber }: Props) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("attempts").select("result, duration_seconds, attempted_at").eq("book_id", bookId).eq("unit_id", unitId).eq("problem_number", problemNumber).order("attempted_at", { ascending: false });
      if (error) console.error(error);
      setAttempts((data ?? []) as Attempt[]);
    }
    load();
  }, [bookId, unitId, problemNumber]);

  return <section className="problem-history">
    <h2>過去の挑戦</h2>
    {attempts.length === 0 ? <p>まだ記録がありません。</p> : attempts.map((attempt, index) => <div key={`${attempt.attempted_at}-${index}`} className="history-item">
      <strong className={`history-result ${attempt.result}`}>{resultLabel(attempt.result)}</strong>
      <span>{formatDateTime(attempt.attempted_at)}</span>
      <span>{formatDuration(attempt.duration_seconds)}</span>
    </div>)}
  </section>;
}

function resultLabel(result: Result) {
  if (result === "correct") return "正解";
  if (result === "partial") return "部分正解";
  return "不正解";
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes === 0 ? `${remaining}秒` : `${minutes}分${remaining}秒`;
}
