/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/integration/', '_DB\\.test\\.ts$'],
  moduleNameMapper: {
    '^@/lib/prisma$': '<rootDir>/src/lib/__mocks__/prisma.ts',
    '^@/generated/prisma/client$': '<rootDir>/src/generated/prisma/__mocks__/client.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
}

