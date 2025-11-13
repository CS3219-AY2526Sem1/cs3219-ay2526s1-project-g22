/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 12 Oct 2025
Scope: Proposed tests for edge cases specified.
Author review: I validated correctness by running the tests, clarified assertions where needed, and fixed small issues discovered during testing.
*/
import {
  getQuestionsService,
  getRandomQuestionService,
} from "../domain/question.service";
import * as repo from "../domain/question.repository";

describe("getQuestionsService", () => {
  it("should call findQuestionsByDifficulty if difficulty is provided", async () => {
    const spy = jest
      .spyOn(repo, "findQuestionsByDifficulty")
      .mockResolvedValue([]);
    await getQuestionsService("Easy");
    expect(spy).toHaveBeenCalledWith("Easy");
  });

  it("should call findQuestionsByTopics if topics are provided", async () => {
    const spy = jest.spyOn(repo, "findQuestionsByTopics").mockResolvedValue([]);
    await getQuestionsService(undefined, ["arrays"]);
    expect(spy).toHaveBeenCalledWith(["arrays"]);
  });

  it("should call findAllQuestions if no params are provided", async () => {
    const spy = jest.spyOn(repo, "findAllQuestions").mockResolvedValue([]);
    await getQuestionsService();
    expect(spy).toHaveBeenCalled();
  });

  it("should call findQuestionsByTopicsAndDifficulty if both difficulty and topics are provided", async () => {
    const spy = jest
      .spyOn(repo, "findQuestionsByTopicsAndDifficulty")
      .mockResolvedValue([]);
    await getQuestionsService("Easy", ["arrays"]);
    expect(spy).toHaveBeenCalledWith(["arrays"], "Easy");
  });
});

describe("getRandomQuestionService", () => {
  it("should call findRandomQuestion with both difficulty and topics", async () => {
    const spy = jest.spyOn(repo, "findRandomQuestion").mockResolvedValue(null);
    await getRandomQuestionService("Easy", ["arrays"]);
    expect(spy).toHaveBeenCalledWith(["arrays"], "Easy");
  });

  it("should call findRandomQuestion with only difficulty", async () => {
    const spy = jest.spyOn(repo, "findRandomQuestion").mockResolvedValue(null);
    await getRandomQuestionService("Easy");
    expect(spy).toHaveBeenCalledWith(undefined, "Easy");
  });

  it("should call findRandomQuestion with only topics", async () => {
    const spy = jest.spyOn(repo, "findRandomQuestion").mockResolvedValue(null);
    await getRandomQuestionService(undefined, ["arrays"]);
    expect(spy).toHaveBeenCalledWith(["arrays"], undefined);
  });

  it("should call findRandomQuestion with no params", async () => {
    const spy = jest.spyOn(repo, "findRandomQuestion").mockResolvedValue(null);
    await getRandomQuestionService();
    expect(spy).toHaveBeenCalledWith(undefined, undefined);
  });
});
