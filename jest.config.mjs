export default {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  // testTimeout: 10000,
  // testEnvironment: 'node',
  // transform: {
  //   '^.+\\.ts?$': 'ts-jest',
  // },
  // moduleDirectories: ['node_modules', 'src'],
  // coveragePathIgnorePatterns: [
  //   '<rootDir>/src/index.ts',
  // ],
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },
};
