"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../../../../../lib/supabase";
import type { Result } from "../../../../../../../../../types/database";

type Props = { bookId: string; unitId: string; problemNumber: string };

export default function ProblemTimer({ bookId, unitId, problemNumber }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedResult, setSavedResult] = useState<Result | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    async function loadHistory() {
      const { count, error } = await supabase.from("attempts").select("id", { count: "exact", head: true }).eq("book_id", bookId).eq("unit_id", unitId).eq("problem_number", problemNumber);
      if (error) console.error(error);
      setAttemptCount(count ?? 0);
    }
    loadHistory();
  }, [bookId, unitId, problemNumber]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const remaining = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }

  async function saveResult(result: Result) {
    if (saving || saved) return;
    setRunning(false);
    setSaving(true);
    const { error } = await supabase.from("attempts").insert({
      book_id: bookId,
      unit_id: unitId,
      problem_number: problemNumber,
      result,
      duration_seconds: seconds,
    });
    if (error) {
      console.error(error);
      setRunning(true);
      setSaving(false);
      return;
    }
    setAttemptCount((current) => current + 1);
    setSavedResult(result);
    setSaved(true);
    setSaving(false);
  }

  if (saved) {
    return <section className="problem-screen">
      <div className="save-complete">
        <div className="save-complete-icon">✓</div>
        <h2>記録しました</h2>
        <p>問題 {problemNumber} ・ {resultLabel(savedResult)}</p>
        <strong>{formatTime(seconds)}</strong>
        <p>{attemptCount}回目の記録</p>
        <Link href={`/books/${bookId}/units/${unitId}/chapters/${unitId}`} className="primary-button">問題一覧へ戻る</Link>
      </div>
    </section>;
  }

  return <section className="problem-screen">
    <p className="problem-label">問題 {problemNumber}</p>
    <div className="timer">{formatTime(seconds)}</div>
    <p className="timer-status">{running ? "計測中" : "計測終了"}</p>
    <p className="attempt-count">過去 {attemptCount}回</p>
    <div className="result-buttons">
      <button className="result-button correct" onClick={() => saveResult("correct")} disabled={saving}>正解</button>
      <button className="result-button partial" onClick={() => saveResult("partial")} disabled={saving}>部分正解</button>
      <button className="result-button wrong" onClick={() => saveResult("wrong")} disabled={saving}>不正解</button>
    </div>
  </section>;
}

function resultLabel(result: Result | null) {
  if (result === "correct") return "正解";
  if (result === "partial") return "部分正解";
  return "不正解";
}
