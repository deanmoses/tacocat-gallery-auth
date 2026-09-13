const base = {
    transform: { '^.+\\.ts$': 'ts-jest' },
    clearMocks: true,
};

/** @type {import('jest').Config} */
export default {
    projects: [
        {
            ...base,
            displayName: 'unit',
            testMatch: ['<rootDir>/src/**/*.test.ts'],
            testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/test/integration/'],
            setupFiles: ['<rootDir>/src/jest.setup.ts'],
        },
        {
            ...base,
            displayName: 'integration',
            testMatch: ['<rootDir>/src/test/integration/**/*.test.ts'],
            setupFiles: ['<rootDir>/src/test/integration/jest.setup.ts'],
        },
    ],
};
