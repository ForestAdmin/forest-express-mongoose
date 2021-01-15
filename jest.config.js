module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
  ],
  setupFilesAfterEnv: [
    'jest-extended',
  ],
};
