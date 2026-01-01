import { Test, TestingModule } from "@nestjs/testing";
import { validate } from "class-validator";
import { IsString, IsOptional } from "class-validator";
import { NoSensitiveWord, NoSensitiveWordConstraint } from "../sensitive-word-validation.decorator";
import { ValidationService } from "../../../business/game-management/validation/validation.service";

// 测试用 DTO
class TestGuildDto {
    @IsString()
    @NoSensitiveWord("guild", { message: "公会名包含敏感词" })
    guildName: string;

    @IsOptional()
    @IsString()
    @NoSensitiveWord("guild", { message: "公会宣传语包含敏感词" })
    guildSlogan?: string;
}

describe("NoSensitiveWord Decorator", () => {
    let validationService: ValidationService;
    let constraint: NoSensitiveWordConstraint;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ValidationService, NoSensitiveWordConstraint],
        }).compile();

        validationService = module.get<ValidationService>(ValidationService);
        constraint = module.get<NoSensitiveWordConstraint>(NoSensitiveWordConstraint);

        // 注册约束到 class-validator
        (validate as any).constraintClasses = (validate as any).constraintClasses || [];
        if (!(validate as any).constraintClasses.includes(NoSensitiveWordConstraint)) {
            (validate as any).constraintClasses.push(NoSensitiveWordConstraint);
        }
    });

    describe("公会名验证", () => {
        it("应该通过正常的公会名", async () => {
            const dto = new TestGuildDto();
            dto.guildName = "正常公会名";

            const errors = await validate(dto, { skipMissingProperties: false });
            const sensitiveWordErrors = errors.filter((e) => e.property === "guildName");

            expect(sensitiveWordErrors.length).toBe(0);
        });

        it("应该拒绝包含敏感词的公会名", async () => {
            jest.spyOn(validationService, "checkSensitiveWord").mockResolvedValue(true);

            const dto = new TestGuildDto();
            dto.guildName = "敏感词公会";

            const errors = await validate(dto, { skipMissingProperties: false });
            const sensitiveWordErrors = errors.filter((e) => e.property === "guildName");

            expect(sensitiveWordErrors.length).toBeGreaterThan(0);
            expect(sensitiveWordErrors[0].constraints).toHaveProperty("NoSensitiveWord");
        });
    });

    describe("公会宣传语验证", () => {
        it("应该通过正常的宣传语", async () => {
            const dto = new TestGuildDto();
            dto.guildName = "正常公会";
            dto.guildSlogan = "欢迎加入我们的公会";

            const errors = await validate(dto, { skipMissingProperties: false });
            const sloganErrors = errors.filter((e) => e.property === "guildSlogan");

            expect(sloganErrors.length).toBe(0);
        });

        it("应该拒绝包含敏感词的宣传语", async () => {
            jest.spyOn(validationService, "checkSensitiveWord").mockResolvedValue(true);

            const dto = new TestGuildDto();
            dto.guildName = "正常公会";
            dto.guildSlogan = "包含敏感词的宣传语";

            const errors = await validate(dto, { skipMissingProperties: false });
            const sloganErrors = errors.filter((e) => e.property === "guildSlogan");

            expect(sloganErrors.length).toBeGreaterThan(0);
        });

        it("应该允许空的宣传语", async () => {
            const dto = new TestGuildDto();
            dto.guildName = "正常公会";
            // guildSlogan 未设置

            const errors = await validate(dto, { skipMissingProperties: true });
            const sloganErrors = errors.filter((e) => e.property === "guildSlogan");

            expect(sloganErrors.length).toBe(0);
        });
    });

    describe("约束类直接测试", () => {
        it("应该返回 true 对于正常文本", async () => {
            jest.spyOn(validationService, "checkSensitiveWord").mockResolvedValue(false);

            const result = await constraint.validate("正常文本", {
                constraints: ["guild"],
                property: "testField",
                object: {},
                value: "正常文本",
                targetName: "TestDto",
            });

            expect(result).toBe(true);
        });

        it("应该返回 false 对于包含敏感词的文本", async () => {
            jest.spyOn(validationService, "checkSensitiveWord").mockResolvedValue(true);

            const result = await constraint.validate("敏感词文本", {
                constraints: ["guild"],
                property: "testField",
                object: {},
                value: "敏感词文本",
                targetName: "TestDto",
            });

            expect(result).toBe(false);
        });

        it("应该返回 true 对于空值", async () => {
            const result = await constraint.validate("", {
                constraints: ["guild"],
                property: "testField",
                object: {},
                value: "",
                targetName: "TestDto",
            });

            expect(result).toBe(true);
        });

        it("应该返回 true 对于非字符串值", async () => {
            const result = await constraint.validate(123 as any, {
                constraints: ["guild"],
                property: "testField",
                object: {},
                value: 123,
                targetName: "TestDto",
            });

            expect(result).toBe(true);
        });
    });

    describe("错误消息", () => {
        it("应该返回正确的默认错误消息（公会）", () => {
            const message = constraint.defaultMessage({
                constraints: ["guild"],
                property: "guildName",
                object: {},
                value: "test",
                targetName: "TestDto",
            });

            expect(message).toContain("guildName");
            expect(message).toContain("敏感词");
            expect(message).toContain("公会");
        });

        it("应该返回正确的默认错误消息（角色）", () => {
            const message = constraint.defaultMessage({
                constraints: ["character"],
                property: "characterName",
                object: {},
                value: "test",
                targetName: "TestDto",
            });

            expect(message).toContain("characterName");
            expect(message).toContain("敏感词");
            expect(message).toContain("角色");
        });
    });
});
