/*
AI Assistance Disclosure:
Tool: Claude Haiku, date: 30 Oct 2025
Scope: Helped debug issues reported during testing, corrected small faults for the tests.
*/

process.env.SECRET_KEY = "test-secret";
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

jest.mock("../authorization", () => ({
  authenticateUser: (req: any, res: any, next: any) => {
    // attach a fake user id
    req.user = { id: "user-1" };
    return next();
  },
}));

jest.mock("../../services/chats.service");

import request from "supertest";
import app from "../../index";
import * as chatsService from "../../services/chats.service";

const mockedFetch = chatsService.fetchChats as jest.MockedFunction<any>;
const mockedPost = chatsService.postChat as jest.MockedFunction<any>;
const mockedIsParticipant =
  chatsService.isParticipant as jest.MockedFunction<any>;

describe("chats routes", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("GET /sessions/:id/chats returns chats when participant", async () => {
    mockedIsParticipant.mockResolvedValue(true);
    mockedFetch.mockResolvedValue([
      {
        id: "m1",
        session_id: "s1",
        sender_id: "user-1",
        content: "hello",
        created_at: new Date().toISOString(),
      },
    ]);

    const res = await request(app).get("/sessions/s1/chats");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].content).toBe("hello");
    expect(mockedFetch).toHaveBeenCalledWith("s1", undefined);
  });

  it("GET /sessions/:id/chats returns 403 when not participant", async () => {
    mockedIsParticipant.mockResolvedValue(false);
    const res = await request(app).get("/sessions/s2/chats");
    expect(res.status).toBe(403);
  });

  it("POST /sessions/:id/chats creates chat when participant", async () => {
    mockedIsParticipant.mockResolvedValue(true);
    mockedPost.mockResolvedValue({ id: "m2", content: "hi" });

    const res = await request(app)
      .post("/sessions/s1/chats")
      .send({ content: "hi" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("m2");
    expect(mockedPost).toHaveBeenCalled();
  });

  it("POST /sessions/:id/chats validates content", async () => {
    mockedIsParticipant.mockResolvedValue(true);
    const res = await request(app).post("/sessions/s1/chats").send({});
    expect(res.status).toBe(400);
  });
});
