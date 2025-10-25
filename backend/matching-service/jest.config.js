/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Specify test file patterns (e.g., .test.ts, .spec.ts)
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)$',
  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  // Module name mapper for ESM modules
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
};