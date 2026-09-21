"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getToday } from "../../lib/date";
import type { DailyTask } from "../../types/database";

export default function TasksPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    const { data, error } = await supabase.from("daily_tasks").select("id, task_date, content, completed, created_at").eq("task_date", getToday()).order("completed", { ascending: true }).order("created_at", { ascending: true });
    if (error) console.error(error);
    setTasks((data ?? []) as DailyTask[]);
    setLoading(false);
  }

  useEffect(() => { loadTasks(); }, []);

  async function addTask() {
    const content = newTask.trim();
    if (!content) return;
    const { error } = await supabase.from("daily_tasks").insert({ task_date: getToday(), content, completed: false });
    if (error) { console.error(error); return; }
    setNewTask("");
    await loadTasks();
  }

  async function toggleTask(task: DailyTask) {
    const { error } = await supabase.from("daily_tasks").update({ completed: !task.completed }).eq("id", task.id);
    if (error) { console.error(error); return; }
    await loadTasks();
  }

  return <main className="app-shell">
    <header className="page-header"><Link href="/">←</Link><div><h1>今日のタスク</h1><p>今日やること</p></div></header>
    <section className="page-section">
      <div className="task-add"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTask(); }} placeholder="タスクを入力" className="task-input" /><button type="button" onClick={addTask} className="primary-button">追加</button></div>
      {loading ? <p>読み込み中...</p> : tasks.length === 0 ? <p>今日のタスクはありません。</p> : <div className="task-list">{tasks.map((task) => <button key={task.id} type="button" onClick={() => toggleTask(task)} className={`task-item ${task.completed ? "completed" : ""}`}><span className="task-check">{task.completed ? "✓" : "○"}</span><span>{task.content}</span></button>)}</div>}
    </section>
    <BottomNavigation current="home" />
  </main>;
}

function BottomNavigation({ current }: { current: "home" | "records" | "books" }) {
  return <nav className="bottom-nav"><Link className={current === "home" ? "active" : ""} href="/"><span>⌂</span><small>ホーム</small></Link><Link className={current === "records" ? "active" : ""} href="/records"><span>▦</span><small>学習記録</small></Link><Link className={current === "books" ? "active" : ""} href="/books"><span>▤</span><small>本</small></Link></nav>;
}
