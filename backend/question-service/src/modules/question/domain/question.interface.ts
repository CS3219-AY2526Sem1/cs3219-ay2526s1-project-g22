import { ObjectId } from "mongodb";
export interface Question {
  _id?: string | ObjectId;
  questionId: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  content: string;
  tags: string[];
  codeSnippets?: any[];
}
