export interface Question {
  _id?: string;
  questionId: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  content: string;
  tags: string[];
  codeSnippets?: any[];
}
