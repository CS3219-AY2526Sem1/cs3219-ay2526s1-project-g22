/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. 
Author review: I validated correctness against the team's requirements, and then used this to run tests whch worked.
*/
// Global Jest setup file that runs before all tests
// This file is referenced in jest.config.js setupFilesAfterEnv

// Mock the logger module globally
import { resetPublicSchema } from "./reset-db";
beforeEach(async () => {
  await resetPublicSchema();
});

jest.mock("../logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../lib/redis", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
}));

// Mock console.log to keep test output clean
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

// Restore all mocks after tests
afterAll(() => {
  jest.restoreAllMocks();
});
