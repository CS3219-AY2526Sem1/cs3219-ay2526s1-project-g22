import { Router } from "express";
import {
  getQuestions,
  getRandomQuestion,
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

export default router;
