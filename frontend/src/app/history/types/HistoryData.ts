export interface HistoryData {
  id: string;
  created_at: string;
  current_code: string | null;
  interviewer: {
    name: string;
  } | null;
  interviewee: {
    name: string;
  };
  question: {
    _id: string;
    questionId: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
  };
}
