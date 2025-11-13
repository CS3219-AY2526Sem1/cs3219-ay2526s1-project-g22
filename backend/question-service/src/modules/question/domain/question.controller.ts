/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 12 Oct 2025
Scope: Helped implement several functions according to the team's requirements and provided focused code cleanups.
Author review: I validated correctness, clarified ambiguous code, and fixed minor implementation issues.
*/
import { Request, Response } from "express";
import {
  findQuestionsByDifficulty,
  findQuestionsByTopics,
  findAllQuestions,
  findRandomQuestion,
  findQuestionById,
  findAllTopics,
  findQuestionsByIds,
} from "./question.repository";
import logger from "../../../logger";

export const getQuestions = async (req: Request, res: Response) => {
  try {
    const { difficulty, topics } = req.query;
    logger.info(
      `Received GET /api/questions with difficulty=${difficulty}, topics=${topics}`
    );
    if (difficulty) {
      const questions = await findQuestionsByDifficulty(
        difficulty as "Easy" | "Medium" | "Hard"
      );
      logger.info(
        `Fetched ${questions.length} questions by difficulty: ${difficulty}`
      );
      return res.json(questions);
    }
    if (topics) {
      const topicsArray = Array.isArray(topics)
        ? topics.map((t) => String(t))
        : String(topics).split(",");
      const questions = await findQuestionsByTopics(topicsArray);
      logger.info(
        `Fetched ${questions.length} questions by topics: ${topicsArray.join(
          ","
        )}`
      );
      return res.json(questions);
    }
    const questions = await findAllQuestions();
    logger.info(`Fetched all questions, count: ${questions.length}`);
    res.json(questions);
  } catch (err) {
    logger.error(`Error fetching questions: ${err}`);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const getRandomQuestion = async (req: Request, res: Response) => {
  try {
    const { difficulty, topics } = req.query;
    logger.info(
      `Received GET /api/questions/random with difficulty=${difficulty}, topics=${topics}`
    );

    const topicsArray = topics
      ? Array.isArray(topics)
        ? topics.map((t) => String(t))
        : String(topics).split(",")
      : undefined;

    const question = await findRandomQuestion(
      topicsArray,
      difficulty as "Easy" | "Medium" | "Hard" | undefined
    );

    if (question) {
      logger.info(`Found random question: ${question.title}`);
      res.json(question);
    } else {
      logger.info(`No questions found matching criteria`);
      res.status(404).json({ error: "No questions found matching criteria" });
    }
  } catch (err) {
    logger.error(`Error fetching random question: ${err}`);
    res.status(500).json({ error: "Failed to fetch random question" });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`Received GET /api/questions/${id}`);
    const question = await findQuestionById(id);
    if (question) {
      logger.info(`Found question by id ${id}: ${question.title}`);
      res.json(question);
    } else {
      logger.info(`No question found with id: ${id}`);
      res.status(404).json({ error: "Question not found" });
    }
  } catch (err) {
    logger.error(`Error fetching question by id: ${err}`);
    res.status(500).json({ error: "Failed to fetch question" });
  }
};

export const getQuestionsByIds = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    logger.info(`Received POST /api/questions/by-ids with ${ids.length} IDs`);

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No question IDs provided" });
    }

    const questions = await findQuestionsByIds(ids);

    if (questions.length > 0) {
      logger.info(`Found ${questions.length} questions`);
      res.json(questions);
    } else {
      logger.info("No questions found for provided IDs");
      res.status(404).json({ error: "No questions found" });
    }
  } catch (err) {
    logger.error(`Error fetching questions by IDs: ${err}`);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const getAllTopics = async (req: Request, res: Response) => {
  try {
    logger.info(`Received GET /api/questions/topics`);
    const topics = await findAllTopics();
    logger.info(`Fetched ${topics.length} unique topics`);
    res.json(topics);
  } catch (err) {
    logger.error(`Error fetching topics: ${err}`);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
};
