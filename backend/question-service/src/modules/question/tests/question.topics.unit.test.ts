/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 12 Oct 2025
Scope: Created tests for edge cases specified by the user.
Author review: I validated correctness by running the tests, clarified assertions where needed, and fixed small issues discovered during testing.
*/
import { getAllTopicsService } from "../domain/question.service";
import { getAllTopics } from "../domain/question.controller";
import * as repo from "../domain/question.repository";

describe("getAllTopicsService", () => {
  it("should call findAllTopics and return topics", async () => {
    const topics = ["Array", "Math", "String"];
    const spy = jest.spyOn(repo, "findAllTopics").mockResolvedValue(topics);

    const result = await getAllTopicsService();

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual(topics);

    spy.mockRestore();
  });
});

describe("getAllTopics controller", () => {
  it("should return topics as json on success", async () => {
    const topics = ["Array", "Math", "String"];
    const spy = jest.spyOn(repo, "findAllTopics").mockResolvedValue(topics);

    const req = {} as any;
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    await getAllTopics(req, res);

    expect(res.json).toHaveBeenCalledWith(topics);

    spy.mockRestore();
  });

  it("should respond with 500 when repository throws", async () => {
    const spy = jest
      .spyOn(repo, "findAllTopics")
      .mockRejectedValue(new Error("DB failure"));

    const req = {} as any;
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    await getAllTopics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch topics" });

    spy.mockRestore();
  });
});
