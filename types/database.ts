export type Result = "correct" | "partial" | "wrong";

export type Attempt = {
  id: string;
  book_id: string | null;
  unit_id: string | null;
  problem_number: string | null;
  result: Result;
  duration_seconds: number;
  attempted_at: string;
};

export type DailyTask = {
  id: string;
  task_date: string;
  content: string;
  completed: boolean;
  created_at: string;
};

export type Reflection = {
  id: string;
  reflection_date: string;
  content: string;
  created_at: string;
};
