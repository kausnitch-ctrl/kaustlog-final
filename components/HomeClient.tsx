"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getJstDayBounds, getToday } from "../lib/date";

type HomeBook = {
  id: string;
  name: string;
  subject: string;
  cover: string;
  totalProblems: number;
};

type Task = { id: string; content: string; completed: boolean };

type Props = { books: HomeBook[] };

export default function HomeClient({ books }: Props) {
  const [todayCount, setTodayCount] = useState(0);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [task, setTask] = useState<Task | null>(null);
  const [reflectionExists, setReflectionExists] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      const today = getToday();
      const { start, end } = getJstDayBounds(today);

      const { data: attempts, error: attemptsError } = await supabase
        .from("attempts")
        .select("book_id, problem_number, duration_seconds, attempted_at")
        .gte("attempted_at", start)
        .lt("attempted_at", end);

      if (attemptsError) console.error(attemptsError);

      setTodayCount(attempts?.length ?? 0);
      setTodaySeconds(
        (attempts ?? []).reduce(
          (sum, attempt) => sum + Number(attempt.duration_seconds ?? 0),
          0
        )
      );

      const { data: taskData, error: taskError } = await supabase
        .from("daily_tasks")
        .select("id, content, completed")
        .eq("task_date", today)
        .order("completed", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (taskError) console.error(taskError);
      setTask(taskData);

      const { data: reflectionData, error: reflectionError } = await supabase
        .from("reflections")
        .select("id")
        .eq("reflection_date", today)
        .limit(1)
        .maybeSingle();
      if (reflectionError) console.error(reflectionError);
      setReflectionExists(Boolean(reflectionData));

      if (books.length > 0) {
        const { data: allAttempts, error: progressError } = await supabase
          .from("attempts")
          .select("book_id, problem_number, attempted_at")
          .in("book_id", books.map((book) => book.id))
          .order("attempted_at", { ascending: false });
        if (progressError) console.error(progressError);

        const latest = new Map<string, Set<string>>();
        for (const attempt of allAttempts ?? []) {
          if (!attempt.book_id || !attempt.problem_number) continue;
          if (!latest.has(attempt.book_id)) latest.set(attempt.book_id, new Set());
          latest.get(attempt.book_id)!.add(String(attempt.problem_number));
        }

        const nextProgress: Record<string, number> = {};
        for (const book of books) {
          nextProgress[book.id] = Math.round(
            ((latest.get(book.id)?.size ?? 0) / Math.max(book.totalProblems, 1)) * 100
          );
        }
        setProgress(nextProgress);
      }

      setLoading(false);
    }

    loadHomeData();
  }, [books]);

  const minutes = Math.floor(todaySeconds / 60);

  return (
    <main className="app-shell">
      <header className="home-header">
        <h1>学習記録</h1>
        <span className="header-date">{formatHomeDate(getToday())}</span>
      </header>

      <section className="home-content">
        <div className="section-title-row">
          <h2>今日の学習</h2>
          <Link href="/records">記録を見る →</Link>
        </div>

        <div className="today-summary">
          <div className="summary-item">
            <span>学習時間</span>
            <strong>{minutes}<span>分</span></strong>
          </div>
          <div className="summary-item">
            <span>解いた問題</span>
            <strong>{todayCount}<span>問</span></strong>
          </div>
        </div>

        <div className="section-title-row">
          <h2>今日のタスク</h2>
          <Link href="/tasks">すべて見る →</Link>
        </div>

        <Link href="/tasks" className="task-card">
          <div className="task-icon">{task?.completed ? "✓" : "○"}</div>
          <div className="task-info">
            <strong>{task?.content ?? "今日のタスクを追加しよう"}</strong>
            <span>
              {task
                ? task.completed
                  ? "完了しています"
                  : "まだ完了していません"
                : "まだタスクがありません"}
            </span>
          </div>
          <span className="arrow">›</span>
        </Link>

        <div className="section-title-row">
          <h2>振り返り</h2>
          <Link href="/reflection">入力する →</Link>
        </div>

        <Link href="/reflection" className="reflection-card">
          <div className={reflectionExists ? "reflection-done" : "reflection-warning"}>
            {reflectionExists ? "✓" : "!"}
          </div>
          <div>
            <strong>今日の振り返り</strong>
            <span>{reflectionExists ? "振り返りを記録しました" : "今日の学習について記録しましょう"}</span>
          </div>
          <span className="arrow">›</span>
        </Link>

        <div className="section-title-row">
          <h2>最近の本</h2>
          <Link href="/books">すべて見る →</Link>
        </div>

        <section className="recent-books">
          {books.slice(0, 3).map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} className="recent-book-card">
              <div className="recent-book-cover">
                <Image src={book.cover} alt={book.name} width={72} height={100} />
              </div>
              <div className="recent-book-info">
                <strong>{book.name}</strong>
                <span>{book.subject}</span>
                <div className="mini-progress">
                  <div className="mini-progress-fill" style={{ width: `${progress[book.id] ?? 0}%` }} />
                </div>
                <small>{loading ? "読み込み中" : `${progress[book.id] ?? 0}%`}</small>
              </div>
            </Link>
          ))}
        </section>
      </section>

      <BottomNavigation current="home" />
    </main>
  );
}

function formatHomeDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function BottomNavigation({ current }: { current: "home" | "records" | "books" }) {
  return (
    <nav className="bottom-nav">
      <Link className={current === "home" ? "active" : ""} href="/"><span>⌂</span><small>ホーム</small></Link>
      <Link className={current === "records" ? "active" : ""} href="/records"><span>▦</span><small>学習記録</small></Link>
      <Link className={current === "books" ? "active" : ""} href="/books"><span>▤</span><small>本</small></Link>
    </nav>
  );
}
