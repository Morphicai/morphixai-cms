import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString, MaxLength } from "class-validator";

export const ASSIST_ACTIONS = ["summary", "polish", "continue"] as const;
export type AssistAction = (typeof ASSIST_ACTIONS)[number];

export class AssistDto {
    @ApiProperty({ enum: ASSIST_ACTIONS, description: "辅助动作：摘要/润色/续写" })
    @IsIn(ASSIST_ACTIONS as unknown as string[], { message: "action 只能是 summary/polish/continue" })
    readonly action: AssistAction;

    @ApiProperty({ description: "原文" })
    @IsString()
    @IsNotEmpty({ message: "text 不能为空" })
    // 编辑器场景一篇文章足够了;更长的内容应该分段送,而不是指望一次塞进上下文
    @MaxLength(20000, { message: "text 最长 2 万字" })
    readonly text: string;
}
