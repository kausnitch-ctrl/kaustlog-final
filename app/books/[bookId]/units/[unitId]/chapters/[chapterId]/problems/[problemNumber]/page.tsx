import Link from "next/link";
import { getBook, getUnit } from "../../../../../../../../../lib/books";
import ProblemTimer from "./ProblemTimer";
import ProblemHistory from "./ProblemHistory";

type Props = { params: Promise<{ bookId: string; unitId: string; chapterId: string; problemNumber: string }> };

export default async function ProblemPage({ params }: Props) {
  const { bookId, unitId, chapterId, problemNumber } = await params;
  const book = getBook(bookId);
  const unit = getUnit(bookId, unitId);
  const number = Number(problemNumber);
  const validNumber = unit && Number.isInteger(number) && number >= unit.startProblem && number <= unit.endProblem;

  if (!book || !unit || chapterId !== unit.id || !validNumber) {
    return <main className="app-shell"><div className="error-message"><h2>問題が見つかりません</h2></div></main>;
  }

  return <main className="app-shell">
    <header className="page-header"><Link href={`/books/${bookId}/units/${unitId}/chapters/${chapterId}`}>←</Link><div><h1>問題 {problemNumber}</h1><p>{unit.name}</p></div></header>
    <section className="chapter-content"><ProblemTimer bookId={bookId} unitId={unitId} problemNumber={problemNumber} /><ProblemHistory bookId={bookId} unitId={unitId} problemNumber={problemNumber} /></section>
    <BottomNavigation current="books" />
  </main>;
}

function BottomNavigation({ current }: { current: "home" | "records" | "books" }) {
  return <nav className="bottom-nav"><Link className={current === "home" ? "active" : ""} href="/"><span>⌂</span><small>ホーム</small></Link><Link className={current === "records" ? "active" : ""} href="/records"><span>▦</span><small>学習記録</small></Link><Link className={current === "books" ? "active" : ""} href="/books"><span>▤</span><small>本</small></Link></nav>;
}
