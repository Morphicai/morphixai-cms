import path from "path";
import fs from "fs";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    ConnectedSocket,
    MessageBody,
    WebSocketServer,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { streamMerge } from "split-chunk-merge";
import { bufferToStream } from "../../shared/utils/bufferToStream";
import { mkdirsSync } from "../../shared/utils/mkdirsSync";
import { validUploadFile } from "../../shared/utils/validate";
import { deleteFolder } from "../../shared/utils/fs";
import { WSUploadfileDto, WSFileMergeDto } from "./dtos/large-uploadfile.dto";

@WebSocketGateway({
    namespace: "/ws",
    transports: ["websocket"],
    // 10MB
    maxHttpBufferSize: 10 * 1024 * 1024,
    cors: {
        origin: "*",
    },
})
export class LargeUploadfileGateway implements OnGatewayInit {
    @WebSocketServer() private wss: Server;

    private uploadFilePath: string;
    private logger: Logger = new Logger("ws-gateway-ins");

    constructor(private readonly config: ConfigService) {
        this.uploadFilePath = this.config.get<string>("app.file.tempUpload") || "";
    }

    afterInit() {
        this.logger.log("ws-uploadfile-init");
    }

    private createFilePath(hash: string, chunkSize: number): string {
        return path.join(this.uploadFilePath, hash + "-" + chunkSize, "/");
    }

    @SubscribeMessage("file/upload")
    public fileUpload(@MessageBody() dataMsg: WSUploadfileDto, @ConnectedSocket() client: Socket) {
        const { hash, sliceBlob: file, index, name, chunkSize } = dataMsg;
        if (!validUploadFile(name)) {
            return client.emit("file/uploaded", {
                success: false,
                data: dataMsg,
                msg: "请不要上传非法文件",
            });
        }
        try {
            const chunksPath: string = this.createFilePath(hash, chunkSize);

            if (!fs.existsSync(chunksPath)) {
                mkdirsSync(chunksPath);
            }

            const readStream = bufferToStream(file);
            const writeStream = fs.createWriteStream(chunksPath + hash + "-" + index);
            // 管道输送
            readStream.pipe(writeStream);
            readStream.on("end", () => {
                console.log("socket fire success message");
                // ws通知进度
                client.emit("file/uploaded", {
                    success: true,
                    data: dataMsg,
                });
            });
        } catch (error) {
            this.logger.error("ws upload file", error);
        }
    }

    @SubscribeMessage("file/merge")
    public async fileMerge(@MessageBody() dataMsg: WSFileMergeDto, @ConnectedSocket() client: Socket) {
        const { chunkSize, hash, name, total } = dataMsg;
        const wsResult = {
            success: false,
            data: dataMsg,
            msg: "切片文件数量与请求不符，无法合并",
        };
        // 校验文件合法性
        if (validUploadFile(name)) {
            const chunksPath: string = this.createFilePath(hash, chunkSize);
            const filePath = path.join(this.uploadFilePath, `${hash}.${name.split(".").pop()}`);
            const chunks = fs.readdirSync(chunksPath);
            try {
                if (chunks.length === total && chunks.length !== 0) {
                    await streamMerge(
                        chunks.map((chunk) => {
                            return path.join(chunksPath, chunk);
                        }),
                        filePath,
                    );
                    // 清理分片文件
                    deleteFolder(chunksPath, (error) => {
                        console.log("deleted faild", error);
                    });
                    wsResult.success = true;
                    wsResult.msg = "";
                }
            } catch (error) {
                console.log("error", error);
                this.logger.error("ws upload merge", error);
                wsResult.msg = "合并失败，请重试";
            }
        } else {
            wsResult.msg = "请勿上传非法文件";
        }

        client.emit("file/success", wsResult);
    }
}
