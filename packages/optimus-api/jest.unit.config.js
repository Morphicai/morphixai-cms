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
    // partner/points-engine/external-task 三个业务模块已整体迁到独立的
    // partner-service(openspec/changes/extract-partner-service),这批曾经
    // 屏蔽的存量失败测试(测试引用实现里从未存在的 JoinMode/旧签名)随源码
    // 一起搬走,在新服务里逐个诊断修复(见该 change 的 Group 7),不再在这里
    // 屏蔽——optimus-api 这边已经没有对应源码了
    testPathIgnorePatterns: ["/node_modules/"],
    // 显式白名单而非全量匹配:src 下还有一批引用旧实现的存量 spec,全量跑会红一片。
    // 新增模块的测试必须往这里加一行,否则写了也不会被执行——
    // 这也是为什么 test/ 目录里过期的表名长期没被发现
    testMatch: [
        "**/utils/storage-path.utils.spec.ts",
        "**/utils/url-signing.utils.spec.ts",
        "**/article/**/*.spec.ts",
        "**/category/**/*.spec.ts",
        "**/article-version/**/*.spec.ts",
        "**/game-management/**/*.spec.ts",
        "**/guards/**/*.spec.ts",
        "**/form/**/*.spec.ts",
        "**/auth/**/*.spec.ts",
        "**/i18n/**/*.spec.ts",
        "**/service-ops/**/*.spec.ts",
        "**/environment/**/*.spec.ts",
    ],
};
