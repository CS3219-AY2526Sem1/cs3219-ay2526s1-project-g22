// Global Jest setup file that runs before all tests
// This file is referenced in jest.config.js setupFilesAfterEnv

// Mock the logger module globally

jest.mock("../logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock console.log to keep test output clean
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

// Restore all mocks after tests
afterAll(() => {
  jest.restoreAllMocks();
});
