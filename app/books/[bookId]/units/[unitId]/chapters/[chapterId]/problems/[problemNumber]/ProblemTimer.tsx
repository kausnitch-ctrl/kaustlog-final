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

const CONTINUOUS_MODE_KEY = "kaustlog-continuous-mode";
const AUTO_NEXT_DELAY_KEY = "kaustlog-auto-next-delay";

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

  // 連続モード
  const [continuousMode, setContinuousMode] = useState(false);

  // 自動遷移までの秒数
  const [autoNextDelay, setAutoNextDelay] = useState(2);

  // 初回表示時に設定を読み込む
  useEffect(() => {
    const savedContinuousMode =
      localStorage.getItem(CONTINUOUS_MODE_KEY);

    const savedDelay =
      localStorage.getItem(AUTO_NEXT_DELAY_KEY);

    if (savedContinuousMode !== null) {
      setContinuousMode(savedContinuousMode === "true");
    }

    if (savedDelay !== null) {
      const delay = Number(savedDelay);

      if (Number.isFinite(delay) && delay >= 0 && delay <= 5) {
        setAutoNextDelay(delay);
      }
    }
  }, []);

  // 連続モードの変更を保存
  useEffect(() => {
    localStorage.setItem(
      CONTINUOUS_MODE_KEY,
      String(continuousMode)
    );
  }, [continuousMode]);

  // 自動遷移時間の変更を保存
  useEffect(() => {
    localStorage.setItem(
      AUTO_NEXT_DELAY_KEY,
      String(autoNextDelay)
    );
  }, [autoNextDelay]);

  // 過去の挑戦回数
  useEffect(() => {
    async function loadHistory() {
      const { count, error } = await supabase
        .from("attempts")
        .select("id", { count: "exact", head: true })
        .eq("book_id", bookId)
        .eq("unit_id", unitId)
        .eq("problem_number", problemNumber);

      if (error) {
        console.error(error);
      }

      setAttemptCount(count ?? 0);
    }

    loadHistory();
  }, [bookId, unitId, problemNumber]);

  // ストップウォッチ
  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const remaining = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
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

    // 連続モードなら自動で次へ
    // 一冊完走の場合は自動遷移しない
    if (
      continuousMode &&
      nextProblemHref &&
      !isBookComplete
    ) {
      const delay =
        isChapterClear
          ? Math.max(autoNextDelay, 2.6)
          : autoNextDelay;

      window.setTimeout(() => {
        router.push(nextProblemHref);
      }, delay * 1000);
    }
  }

  function goNext() {
    if (!nextProblemHref) return;
    router.push(nextProblemHref);
  }

  function goBackToProblems() {
    router.push(
      `/books/${bookId}/units/${unitId}/chapters/${unitId}`
    );
  }

  // =========================
  // 結果画面
  // =========================

  if (saved) {
    // 一冊完走
    if (isBookComplete) {
      return (
        <section className="result-screen book-complete">
          <div className="celebration-glow" />

          <div className="confetti confetti-a">✦</div>
          <div className="confetti confetti-b">✦</div>
          <div className="confetti confetti-c">✦</div>
          <div className="confetti confetti-d">✦</div>

          <div className="result-content">
            <p className="result-kicker">
              BOOK COMPLETE
            </p>

            <div className="result-big-icon">
              🏆
            </div>

            <h2>一冊完走！</h2>

            <p className="result-book-name">
              {bookName}
            </p>

            <div className="book-complete-message">
              <strong>
                最後までやり切った！
              </strong>

              <span>
                この一冊を完全制覇しました。
              </span>
            </div>

            <div className="result-stars">
              ✦ ✦ ✦
            </div>

            <p className="next-problem-message">
              おつかれさまでした
            </p>

            <button
              type="button"
              className="result-back-button"
              onClick={goBackToProblems}
            >
              問題一覧へ戻る
            </button>
          </div>
        </section>
      );
    }

    // 章クリア
    if (isChapterClear) {
      return (
        <section className="result-screen chapter-complete">
          <div className="chapter-sparkle sparkle-a">
            ✦
          </div>

          <div className="chapter-sparkle sparkle-b">
            ✦
          </div>

          <div className="chapter-sparkle sparkle-c">
            ✦
          </div>

          <div className="result-content">
            <p className="result-kicker">
              CHAPTER CLEAR
            </p>

            <div className="result-chapter-icon">
              ✓
            </div>

            <h2>章クリア！</h2>

            <p className="result-book-name">
              {unitName}
            </p>

            <div className="chapter-clear-message">
              <strong>
                この章を完走しました
              </strong>

              <span>
                {continuousMode
                  ? "次の章へ進みます"
                  : "おつかれさまでした"}
              </span>
            </div>

            <div className="result-stars">
              ✦ ✦ ✦
            </div>

            {continuousMode ? (
              <p className="next-problem-message">
                {autoNextDelay === 0
                  ? "次の章へ進むボタンを押してください"
                  : "次の章へ…"}
              </p>
            ) : (
              <div className="result-actions">
                <button
                  type="button"
                  className="result-next-button"
                  onClick={goNext}
                >
                  次の章へ →
                </button>

                <button
                  type="button"
                  className="result-back-button"
                  onClick={goBackToProblems}
                >
                  問題一覧へ戻る
                </button>
              </div>
            )}
          </div>
        </section>
      );
    }

    // 通常の問題終了
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
      <section
        className={`result-screen result-${savedResult}`}
      >
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

          {continuousMode &&
          nextProblemHref &&
          autoNextDelay > 0 ? (
            <p className="next-problem-message">
              {autoNextDelay}秒後に次の問題へ…
            </p>
          ) : (
            <div className="result-actions">
              {nextProblemHref && (
                <button
                  type="button"
                  className="result-next-button"
                  onClick={goNext}
                >
                  次の問題へ →
                </button>
              )}

              <button
                type="button"
                className="result-back-button"
                onClick={goBackToProblems}
              >
                問題一覧へ戻る
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // =========================
  // 問題を解いている画面
  // =========================

  return (
    <section className="problem-screen">
      <p className="problem-label">
        問題 {problemNumber}
      </p>

      <div className="timer">
        {formatTime(seconds)}
      </div>

      <p className="timer-status">
        {running ? "計測中" : "計測終了"}
      </p>

      <p className="attempt-count">
        過去 {attemptCount}回
      </p>

      <div className="result-buttons">
        <button
          className="result-button correct"
          onClick={() => saveResult("correct")}
          disabled={saving}
        >
          正解
        </button>

        <button
          className="result-button partial"
          onClick={() => saveResult("partial")}
          disabled={saving}
        >
          部分正解
        </button>

        <button
          className="result-button wrong"
          onClick={() => saveResult("wrong")}
          disabled={saving}
        >
          不正解
        </button>
      </div>

      {/* 連続モード設定 */}
      <div className="continuous-settings">
        <label className="continuous-toggle">
          <input
            type="checkbox"
            checked={continuousMode}
            onChange={(event) =>
              setContinuousMode(event.target.checked)
            }
          />

          <span>
            連続モード
          </span>
        </label>

        {continuousMode && (
          <div className="auto-next-setting">
            <label htmlFor="auto-next-delay">
              自動で次の問題へ
            </label>

            <select
              id="auto-next-delay"
              value={autoNextDelay}
              onChange={(event) =>
                setAutoNextDelay(
                  Number(event.target.value)
                )
              }
            >
              <option value={0}>
                自動遷移しない
              </option>

              <option value={0.5}>
                0.5秒
              </option>

              <option value={1}>
                1秒
              </option>

              <option value={2}>
                2秒
              </option>

              <option value={3}>
                3秒
              </option>

              <option value={4}>
                4秒
              </option>

              <option value={5}>
                5秒
              </option>
            </select>
          </div>
        )}
      </div>
    </section>
  );
}