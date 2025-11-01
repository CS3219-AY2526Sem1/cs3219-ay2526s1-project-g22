// Unit tests for authenticateUser middleware

// Set SECRET_KEY env before importing middleware
process.env.SECRET_KEY = "test-secret";
process.env.SUPABASE_URL = "https://test.supabase.co";

import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

import { authenticateUser } from "../authorization";

describe("authenticateUser middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("authenticates valid token and sets req.user", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: "user-1" });
    req.headers = { authorization: "Bearer valid-token" } as any;

    await authenticateUser(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
    expect((req as any).user).toEqual({ id: "user-1" });
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when no authorization header", async () => {
    req.headers = {} as any;
    await authenticateUser(req as Request, res as Response, next);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(401);
  });

  it("returns 401 when token invalid", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid");
    });
    req.headers = { authorization: "Bearer bad" } as any;
    await authenticateUser(req as Request, res as Response, next);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(401);
  });
});
