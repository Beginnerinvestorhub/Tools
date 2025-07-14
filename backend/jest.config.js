/**
 * Jest configuration for backend TypeScript tests
 * Enables ts-jest transformer and proper handling of ES modules/imports
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
};
