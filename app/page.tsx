import { getBooks, getTotalProblems } from "../lib/books";
import HomeClient from "../components/HomeClient";

export default function HomePage() {
  const books = getBooks().map((book) => ({
    id: book.id,
    name: book.name,
    subject: book.subject,
    cover: book.cover,
    totalProblems: getTotalProblems(book),
  }));

  return <HomeClient books={books} />;
}
