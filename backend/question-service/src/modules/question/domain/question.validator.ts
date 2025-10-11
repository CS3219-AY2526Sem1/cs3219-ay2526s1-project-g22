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
