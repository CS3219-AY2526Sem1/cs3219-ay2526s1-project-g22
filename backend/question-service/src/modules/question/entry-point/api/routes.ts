import { Router } from "express";
import {
  getQuestionById,
  getQuestions,
  getRandomQuestion,
  getAllTopics,
  getQuestionsByIds,
} from "../../domain/question.controller";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    await getQuestions(req, res);
  } catch (err) {
    next(err);
  }
});

router.get("/random", async (req, res, next) => {
  try {
    await getRandomQuestion(req, res);
  } catch (err) {
    next(err);
  }
});

router.get("/topics", async (req, res, next) => {
  try {
    await getAllTopics(req, res);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    await getQuestionById(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/by-ids", async (req, res, next) => {
  try {
    const { ids } = req.body;
    const questions = await getQuestionsByIds(req, res);
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

export default router;
