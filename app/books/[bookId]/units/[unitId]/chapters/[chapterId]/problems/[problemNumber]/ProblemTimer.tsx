"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../../../../../lib/supabase";
import type { Result } from "../../../../../../../../../types/database";


type Props = {
  bookId: string;
  unitId: string;
  problemNumber: string;
  nextProblemHref: string | null;
  isChapterClear: boolean;
  isBookComplete: boolean;
  unitName: string;
  bookName: string;
};
export default function ProblemTimer({
  bookId,
  unitId,
  problemNumber,
  nextProblemHref,
  isChapterClear,
  isBookComplete,
  unitName,
  bookName,
}: Props) {
  const router = useRouter();
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
    if (nextProblemHref) {
  window.setTimeout(() => {
    router.push(nextProblemHref);
  }, isBookComplete ? 3500 : isChapterClear ? 2600 : 1300);
}
  }

  if (saved) {
  if (isBookComplete) {
    return (
      <section className="result-screen book-complete">
        <div className="celebration-glow" />
        <div className="confetti confetti-a">✦</div>
        <div className="confetti confetti-b">✦</div>
        <div className="confetti confetti-c">✦</div>
        <div className="confetti confetti-d">✦</div>

        <div className="result-content">
          <p className="result-kicker">BOOK COMPLETE</p>

          <div className="result-big-icon">🏆</div>

          <h2>一冊完走！</h2>

          <p className="result-book-name">{bookName}</p>

          <div className="book-complete-message">
            <strong>最後までやり切った！</strong>
            <span>この一冊を完全制覇しました。</span>
          </div>

          <div className="result-stars">✦ ✦ ✦</div>

          <p className="next-problem-message">
            おつかれさまでした
          </p>
        </div>
      </section>
    );
  }

  if (isChapterClear) {
    return (
      <section className="result-screen chapter-complete">
        <div className="chapter-sparkle sparkle-a">✦</div>
        <div className="chapter-sparkle sparkle-b">✦</div>
        <div className="chapter-sparkle sparkle-c">✦</div>

        <div className="result-content">
          <p className="result-kicker">CHAPTER CLEAR</p>

          <div className="result-chapter-icon">✓</div>

          <h2>章クリア！</h2>

          <p className="result-book-name">{unitName}</p>

          <div className="chapter-clear-message">
            <strong>この章を完走しました</strong>
            <span>次の章へ進みます</span>
          </div>

          <div className="result-stars">✦ ✦ ✦</div>

          <p className="next-problem-message">
            次の章へ…
          </p>
        </div>
      </section>
    );
  }

  const resultTitle =
    savedResult === "correct"
      ? "正解！"
      : savedResult === "partial"
        ? "あと一歩！"
        : "次で取り返そう";

  const resultMessage =
    savedResult === "correct"
      ? "その調子！"
      : savedResult === "partial"
        ? "考え方はかなり近いです"
        : "記録できたことが大事";

  return (
    <section className={`result-screen result-${savedResult}`}>
      <div className="result-content">
        <div className="result-small-icon">
          {savedResult === "correct"
            ? "✓"
            : savedResult === "partial"
              ? "＋"
              : "↗"}
        </div>

        <h2>{resultTitle}</h2>

        <p>{resultMessage}</p>

        <strong className="result-time">
          {formatTime(seconds)}
        </strong>

        <p className="next-problem-message">
          次の問題へ…
        </p>
      </div>
    </section>
  );
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
