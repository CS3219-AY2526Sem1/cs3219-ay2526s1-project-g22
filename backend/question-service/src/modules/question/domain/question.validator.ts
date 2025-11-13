/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 12 Oct 2025
Scope: Helped implement several functions according to the team's requirements and provided focused code cleanups and clarifying comments.
Author review: I validated correctnesse, clarified  code, and fixed implementation issues because AI doesn't always get it right on first try.
*/
import { Question } from "./question.interface";

export function validateQuestion(question: Question): boolean {
  if (
    !question.title ||
    !question.content ||
    !question.difficulty ||
    !question.tags ||
    !question.questionId
  ) {
    return false;
  }
  if (!["Easy", "Medium", "Hard"].includes(question.difficulty)) {
    return false;
  }
  if (!Array.isArray(question.tags)) {
    return false;
  }
  return true;
}
