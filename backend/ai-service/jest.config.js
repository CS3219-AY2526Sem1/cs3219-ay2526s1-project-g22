/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testMatch: ["**/*.unit.test.ts"],
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/test-utils/jest-setup-unit.ts"],
};
