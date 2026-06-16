import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/infrastructure/database/repositories/**',
    '!src/infrastructure/database/connection.ts',
    '!src/infrastructure/cache/**',
    '!src/config/database.ts',
    '!src/config/env.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 68,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
};

export default config;
