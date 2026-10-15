/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(better-auth)/)'
  ],
  moduleNameMapper: {
    '^better-auth$': '<rootDir>/tests/__mocks__/better-auth.ts',
    '^better-auth/plugins$': '<rootDir>/tests/__mocks__/better-auth-plugins.ts',
    '^better-auth/node$': '<rootDir>/tests/__mocks__/better-auth-node.ts'
  },
  testMatch: ['**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node', 'mjs'],
  clearMocks: true,
};
