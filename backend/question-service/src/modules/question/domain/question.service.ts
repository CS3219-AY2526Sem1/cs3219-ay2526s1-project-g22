/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 12 Oct 2025
Scope: Helped implement several functions according to the team's requirements and provided focused code cleanups and clarifying comments.
Author review: I validated correctnesse, clarified  code, and fixed implementation issues because AI doesn't always get it right on first try.
*/
import { Question } from "./question.interface";
import {
  findQuestionsByDifficulty,
  findQuestionsByTopics,
  findQuestionsByTopicsAndDifficulty,
  findAllQuestions,
  findRandomQuestion,
  findQuestionById,
  findAllTopics,
} from "./question.repository";

export async function getQuestionsService(
  difficulty?: string,
  topics?: string[]
): Promise<Question[]> {
  const validDifficulty = ["Easy", "Medium", "Hard"];
  const hasDifficulty = difficulty && validDifficulty.includes(difficulty);
  const hasTopics = topics && topics.length > 0;

  if (hasDifficulty && hasTopics) {
    return findQuestionsByTopicsAndDifficulty(
      topics as string[],
      difficulty as "Easy" | "Medium" | "Hard"
    );
  }
  if (hasDifficulty) {
    return findQuestionsByDifficulty(difficulty as "Easy" | "Medium" | "Hard");
  }
  if (hasTopics) {
    return findQuestionsByTopics(topics as string[]);
  }
  return findAllQuestions();
}

export async function getRandomQuestionService(
  difficulty?: string,
  topics?: string[]
): Promise<Question | null> {
  const validDifficulty = ["Easy", "Medium", "Hard"];
  const diff = validDifficulty.includes(difficulty || "")
    ? (difficulty as "Easy" | "Medium" | "Hard")
    : undefined;
  const t = topics && topics.length > 0 ? topics : undefined;
  return await findRandomQuestion(t, diff);
}

export async function getQuestionByIdService(
  id: string
): Promise<Question | null> {
  return await findQuestionById(id);
}

export async function getAllTopicsService(): Promise<string[]> {
  return await findAllTopics();
}
