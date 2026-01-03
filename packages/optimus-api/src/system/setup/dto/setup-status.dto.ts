import { ApiProperty } from "@nestjs/swagger";

export class SetupStatusDto {
    @ApiProperty({ description: "是否已初始化" })
    isInitialized: boolean;

    @ApiProperty({ description: "数据库连接状态" })
    databaseStatus: {
        connected: boolean;
        error?: string;
    };

    @ApiProperty({ description: "API服务器状态" })
    apiStatus: {
        status: string;
        uptime: number;
    };

    @ApiProperty({ description: "应用版本号" })
    appVersion: string;

    @ApiProperty({ description: "系统信息" })
    systemInfo?: {
        schemaVersion?: string;
        seedVersion?: string;
        environment?: string;
        initializedAt?: Date;
    };
}
