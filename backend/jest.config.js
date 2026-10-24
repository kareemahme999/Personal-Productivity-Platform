/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  moduleFileExtensions: ['ts', 'js', 'json'],
};
