/** @type {import('jest').Config} */
export default {
    transform: { '^.+\\.ts$': 'ts-jest' },
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    clearMocks: true,
};
