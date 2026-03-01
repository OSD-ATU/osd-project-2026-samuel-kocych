const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  verbose: true,
  clearMocks: true,
  setupFilesAfterEnv: ["./tests/testSetUp.ts"],
};

module.exports = config;
