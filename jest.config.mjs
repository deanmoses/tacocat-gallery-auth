/** @type {import('jest').Config} */
export default {
    transform: { '^.+\\.ts$': 'ts-jest' },
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    setupFiles: ['<rootDir>/src/jest.setup.ts'],
    clearMocks: true,
};
