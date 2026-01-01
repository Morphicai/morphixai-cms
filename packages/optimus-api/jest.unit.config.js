module.exports = {
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: "src",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: ["**/*.(t|j)s"],
    coverageDirectory: "../coverage",
    testEnvironment: "node",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    testTimeout: 10000,
    // Run utility tests and article management system tests
    testMatch: [
        "**/utils/storage-path.utils.spec.ts",
        "**/utils/url-signing.utils.spec.ts",
        "**/article/**/*.spec.ts",
        "**/category/**/*.spec.ts",
        "**/article-version/**/*.spec.ts",
        "**/partner/**/*.spec.ts",
        "**/game-management/**/*.spec.ts",
        "**/points-engine/**/*.spec.ts",
    ],
};
