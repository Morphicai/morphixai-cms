import { Module } from "@nestjs/common";
import { LargeUploadfileGateway } from "./large-uploadfile.gateway";

@Module({
    providers: [LargeUploadfileGateway],
})
export class WSModule {}
