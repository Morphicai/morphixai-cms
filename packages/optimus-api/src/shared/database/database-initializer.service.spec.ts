import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Connection, QueryRunner } from "typeorm";
import { DatabaseInitializerService } from "./database-initializer.service";

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
    console.log = jest.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
});

describe("DatabaseInitializerService", () => {
    let service: DatabaseInitializerService;
    let configService: ConfigService;
    let connection: Connection;
    let queryRunner: QueryRunner;

    beforeEach(async () => {
        const mockQueryRunner = {
            query: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
        };

        const mockConnection = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        };

        const mockConfigService = {
            get: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatabaseInitializerService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<DatabaseInitializerService>(DatabaseInitializerService);
        configService = module.get<ConfigService>(ConfigService);
        connection = mockConnection as any;
        queryRunner = mockQueryRunner as any;
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("shouldInitializeDatabase", () => {
        it("should return true for empty database", async () => {
            jest.spyOn(connection, "createQueryRunner").mockReturnValue(queryRunner);
            jest.spyOn(queryRunner, "query").mockResolvedValueOnce([{ table_count: 0 }]); // Empty database

            const result = await service.shouldInitializeDatabase(connection);
            expect(result).toBe(true);
        });

        it("should return true when sys_database_info table does not exist", async () => {
            jest.spyOn(connection, "createQueryRunner").mockReturnValue(queryRunner);
            jest.spyOn(queryRunner, "query")
                .mockResolvedValueOnce([{ table_count: 5 }]) // Has tables
                .mockResolvedValueOnce([{ exists_count: 0 }]); // No sys_database_info

            const result = await service.shouldInitializeDatabase(connection);
            expect(result).toBe(true);
        });

        it("should return false when database is already initialized", async () => {
            process.env.NODE_ENV = "development";

            jest.spyOn(connection, "createQueryRunner").mockReturnValue(queryRunner);
            jest.spyOn(queryRunner, "query")
                .mockResolvedValueOnce([{ table_count: 5 }]) // Has tables
                .mockResolvedValueOnce([{ exists_count: 1 }]) // Has sys_database_info
                .mockResolvedValueOnce([{ environment: "development" }]); // Already initialized

            const result = await service.shouldInitializeDatabase(connection);
            expect(result).toBe(false);
        });
    });

    describe("validateInitializationSafety", () => {
        it("should return error for e2e environment without _e2e suffix", async () => {
            process.env.NODE_ENV = "e2e";
            jest.spyOn(configService, "get").mockReturnValue("kapok_e2e"); // Wrong name

            const result = await service.validateInitializationSafety();

            expect(result.safe).toBe(false);
            expect(result.errors).toContain('E2E environment requires database name to end with "_e2e"');
        });

        it("should be safe for e2e environment with correct database name", async () => {
            process.env.NODE_ENV = "e2e";
            jest.spyOn(configService, "get").mockReturnValue("kapok_e2e");

            const result = await service.validateInitializationSafety();

            expect(result.safe).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should return error for production environment without force flag", async () => {
            process.env.NODE_ENV = "production";
            delete process.env.ALLOW_PROD_INIT;
            jest.spyOn(configService, "get").mockReturnValue("kapok_production");

            const result = await service.validateInitializationSafety(false);

            expect(result.safe).toBe(false);
            expect(result.errors).toContain(
                "Production database initialization requires ALLOW_PROD_INIT=true or explicit force flag",
            );
        });

        it("should be safe for production environment with force flag", async () => {
            process.env.NODE_ENV = "production";
            delete process.env.ALLOW_PROD_INIT;
            jest.spyOn(configService, "get").mockReturnValue("kapok_production");

            const result = await service.validateInitializationSafety(true);

            expect(result.safe).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should be safe for development environment", async () => {
            process.env.NODE_ENV = "development";
            jest.spyOn(configService, "get").mockReturnValue("kapok_dev");

            const result = await service.validateInitializationSafety();

            expect(result.safe).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });
    });

    describe("getCurrentEnvironment", () => {
        it("should return e2e for NODE_ENV=e2e", () => {
            process.env.NODE_ENV = "e2e";

            // Access private method for testing
            const getCurrentEnvironment = (service as any).getCurrentEnvironment.bind(service);
            const result = getCurrentEnvironment();

            expect(result).toBe("e2e");
        });

        it("should return e2e for TEST_MODE=true", () => {
            process.env.NODE_ENV = "development";
            process.env.TEST_MODE = "true";

            const getCurrentEnvironment = (service as any).getCurrentEnvironment.bind(service);
            const result = getCurrentEnvironment();

            expect(result).toBe("e2e");
        });

        it("should return development by default", () => {
            process.env.NODE_ENV = "development";
            delete process.env.TEST_MODE;

            const getCurrentEnvironment = (service as any).getCurrentEnvironment.bind(service);
            const result = getCurrentEnvironment();

            expect(result).toBe("development");
        });
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.NODE_ENV;
        delete process.env.TEST_MODE;
        delete process.env.ALLOW_PROD_INIT;
    });
});
