import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class UploadUserInfoDto {
    id: string;
    account: string;
}

export class UploadExtraParamsDto {
    @ApiProperty({ description: "来源", required: true })
    business: string;

    @ApiProperty({ description: "调整图片宽", required: false, default: 0 })
    @Type(() => Number)
    width?: number;

    @ApiProperty({ description: "调整图片高", required: false, default: 0 })
    @Type(() => Number)
    height?: number;

    @ApiProperty({ description: "图片压缩模式", required: false })
    mode?: string;

    @ApiProperty({ description: "图片质量百分比", required: false, default: 0 })
    @Type(() => Number)
    quality?: number;

    @ApiProperty({ description: "是不需要缩略图", required: false, default: false })
    @Type(() => Boolean)
    needThumbnail?: boolean;
}

export class UploadParamsDto {
    files: Express.Multer.File[];
    extra: UploadExtraParamsDto;
    user: UploadUserInfoDto;
}
