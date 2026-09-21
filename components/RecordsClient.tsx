"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateKeyFromTimestamp, formatDate, getLastNDates } from "../lib/date";
import type { Attempt } from "../types/database";

type Subject = "全体" | string;
type Daily = { date: string; count: number; seconds: number };
type BookMeta = { id: string; subject: string };

export default function RecordsClient({ books }: { books: BookMeta[] }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject>("全体");
  const [loading, setLoading] = useState(true);
  const subjectByBook = useMemo(() => new Map(books.map((book) => [book.id, book.subject])), [books]);
  const subjects = useMemo(() => Array.from(new Set(books.map((book) => book.subject))), [books]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("attempts").select("id, book_id, unit_id, problem_number, result, duration_seconds, attempted_at").order("attempted_at", { ascending: true });
      if (error) console.error(error);
      setAttempts((data ?? []) as Attempt[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (selectedSubject === "全体") return attempts;
    return attempts.filter((attempt) => attempt.book_id && subjectByBook.get(attempt.book_id) === selectedSubject);
  }, [attempts, selectedSubject, subjectByBook]);

  const totalCount = filtered.length;
  const totalStudySeconds = filtered.reduce((sum, item) => sum + Number(item.duration_seconds ?? 0), 0);
  const firstStudyDate = useMemo(() => {
  if (filtered.length === 0) return null;

  return dateKeyFromTimestamp(
    filtered[0].attempted_at
  );
}, [filtered]);

const progressHistory = useMemo(() => {
  if (!firstStudyDate) return [];

  const start = new Date(`${firstStudyDate}T00:00:00+09:00`);
  const today = new Date();

  const result: Array<{
    date: string;
    cumulativeCount: number;
    cumulativeSeconds: number;
    daysSinceStart: number;
  }> = [];

  const cumulativeByDate = new Map<
    string,
    { count: number; seconds: number }
  >();

  for (const attempt of filtered) {
    const date = dateKeyFromTimestamp(attempt.attempted_at);

    const current = cumulativeByDate.get(date) ?? {
      count: 0,
      seconds: 0,
    };

    current.count += 1;
    current.seconds += Number(attempt.duration_seconds ?? 0);

    cumulativeByDate.set(date, current);
  }

  let cumulativeCount = 0;
  let cumulativeSeconds = 0;

  const current = new Date(start);

  while (current <= today) {
    const date = current.toISOString().slice(0, 10);

    const day = cumulativeByDate.get(date);

    if (day) {
      cumulativeCount += day.count;
      cumulativeSeconds += day.seconds;
    }

    const daysSinceStart =
      Math.floor(
        (current.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    result.push({
      date,
      cumulativeCount,
      cumulativeSeconds,
      daysSinceStart,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}, [filtered, firstStudyDate]);
const correctCount = filtered.filter((item) => item.result === "correct").length;
  const partialCount = filtered.filter((item) => item.result === "partial").length;
  const wrongCount = filtered.filter((item) => item.result === "wrong").length;

  const daily = useMemo(() => {
    const map = new Map<string, Daily>();
    for (const attempt of filtered) {
      const date = dateKeyFromTimestamp(attempt.attempted_at);
      const current = map.get(date) ?? { date, count: 0, seconds: 0 };
      current.count += 1;
      current.seconds += Number(attempt.duration_seconds ?? 0);
      map.set(date, current);
    }
    return map;
  }, [filtered]);

  const last7 = getLastNDates(7).map((date) => daily.get(date) ?? { date, count: 0, seconds: 0 });
  const maxCount = Math.max(...last7.map((item) => item.count), 1);
  const calendarDates = getLastNDates(35);
  const firstWeekday = (new Date(`${calendarDates[0]}T00:00:00+09:00`).getDay() + 6) % 7;
  const calendarCells: Array<string | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...calendarDates,
  ];

  return <main className="app-shell">
    <header className="page-header"><Link href="/">←</Link><div><h1>学習記録</h1><p>これまでの学習状況</p></div></header>
    <section className="records-content">
      <div className="subject-tabs">
        <button type="button" className={selectedSubject === "全体" ? "selected" : ""} onClick={() => setSelectedSubject("全体")}>全体</button>
        {subjects.map((subject) => <button type="button" key={subject} className={selectedSubject === subject ? "selected" : ""} onClick={() => setSelectedSubject(subject)}>{subject}</button>)}
      </div>
      {loading ? <section className="record-card"><p>読み込み中...</p></section> : <>
        <section className="record-summary">
          <div><span>挑戦回数</span><strong>{totalCount}</strong><small>問</small></div>
          <div><span>正解</span><strong>{correctCount}</strong><small>問</small></div>
          <div><span>部分正解</span><strong>{partialCount}</strong><small>問</small></div>
          <div><span>不正解</span><strong>{wrongCount}</strong><small>問</small></div>
          <div><span>学習時間</span><strong>{Math.floor(totalStudySeconds / 60)}</strong><small>分</small></div>
        </section>
        <section className="record-card"><div className="card-title"><h2>直近7日間</h2><span>問題数</span></div><div className="record-chart">{last7.map((item) => <div className="record-chart-column" key={item.date}><span>{item.count}</span><div className="record-chart-bar-area"><div className="record-chart-bar" style={{ height: `${(item.count / maxCount) * 100}%` }} /></div><small>{new Date(`${item.date}T00:00:00+09:00`).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</small></div>)}</div></section>
        <section className="record-card"><div className="card-title"><h2>学習カレンダー</h2><span>問題数</span></div><div className="calendar">{["月","火","水","木","金","土","日"].map((day) => <div className="calendar-day-name" key={day}>{day}</div>)}{calendarCells.map((date, index) => date ? (() => { const count = daily.get(date)?.count ?? 0; const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3; return <div key={date} className={`calendar-cell level-${level}`} title={`${formatDate(date)}：${count}問`}>{new Date(`${date}T00:00:00+09:00`).getDate()}</div>; })() : <div key={`empty-${index}`} className="calendar-cell calendar-empty" />)}</div><div className="calendar-legend"><span><i className="level-0" />0</span><span><i className="level-1" />1–2</span><span><i className="level-2" />3–5</span><span><i className="level-3" />6+</span></div></section>
        <section className="record-card"><div className="card-title"><h2>日別記録</h2></div><div className="daily-record-list">{Array.from(daily.values()).reverse().map((item) => <div className="daily-record-item" key={item.date}><span>{formatDate(item.date)}</span><strong>{item.count}問　{Math.floor(item.seconds / 60)}分</strong></div>)}{daily.size === 0 && <p>まだ学習記録がありません。</p>}</div></section>
        <section className="record-card">
  <div className="card-title">
    <h2>これまでの成長</h2>
    <span>累計</span>
  </div>

  {progressHistory.length === 0 ? (
    <p>学習記録がまだありません。</p>
  ) : (
    <>
      <div className="growth-stats">
        <div>
          <span>累計学習時間</span>
          <strong>
            {Math.floor(totalStudySeconds / 3600)}
            <small>時間</small>
            {Math.floor((totalStudySeconds % 3600) / 60)}
            <small>分</small>
          </strong>
        </div>

        <div>
          <span>累計挑戦</span>
          <strong>
            {totalCount}
            <small>問</small>
          </strong>
        </div>

        <div>
          <span>学習開始から</span>
          <strong>
            {progressHistory[progressHistory.length - 1].daysSinceStart}
            <small>日</small>
          </strong>
        </div>
      </div>

      <div className="growth-chart">
        {progressHistory.map((item) => {
          const max =
            progressHistory[progressHistory.length - 1]
              .cumulativeCount || 1;

          return (
            <div
              key={item.date}
              className="growth-column"
              title={`${formatDate(item.date)}：累計${item.cumulativeCount}問`}
            >
              <div
                className="growth-bar"
                style={{
                  height: `${Math.max(
                    4,
                    (item.cumulativeCount / max) * 100
                  )}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="growth-chart-labels">
        <span>{formatDate(progressHistory[0].date)}</span>
        <span>{formatDate(progressHistory[progressHistory.length - 1].date)}</span>
      </div>
    </>
  )}
</section>
</>}
    </section>
    <nav className="bottom-nav"><Link href="/"><span>⌂</span><small>ホーム</small></Link><Link className="active" href="/records"><span>▦</span><small>学習記録</small></Link><Link href="/books"><span>▤</span><small>本</small></Link></nav>
  </main>;
}
