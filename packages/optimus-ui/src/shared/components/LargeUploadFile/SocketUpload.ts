import io from "socket.io-client";
import SpliceFile from "../../utils/spliceFile";
import * as fileApi from "../../../apis/file";
import { WS_ACTION_TYPE } from "./constant/SOCKET_ACTIONS";
import { FILE_STATUS } from "./constant/FILE_STATUS";
import { IFileInfo, IUploadTask } from "./types/File";

/**
 * 获取 WebSocket URL
 * 基于 API_BASE_URL 自动生成 WebSocket 连接地址
 */
function getWebSocketUrl(): string {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    
    if (!apiBaseUrl) {
        // 使用相对路径（同域名）
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }
    
    // 将 HTTP URL 转换为 WebSocket URL
    if (apiBaseUrl.startsWith('http://')) {
        return apiBaseUrl.replace('http://', 'ws://').replace('/api', '') + '/ws';
    } else if (apiBaseUrl.startsWith('https://')) {
        return apiBaseUrl.replace('https://', 'wss://').replace('/api', '') + '/ws';
    }
    
    // 相对路径
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
}

const API_URL = getWebSocketUrl();
const socketParams = {
    query: { room: "upload" },
    transports: ["websocket"],
};

const MB = 1024 * 1024;
const CHUNK_SIZE = 2 * MB;
export class UploadSocket {
    private apiUrl = "";
    private socketParams = {};
    private socket;
    public constructor() {
        this.apiUrl = API_URL;
        this.socketParams = socketParams;
        this.connect();
    }

    connect() {
        this.socket = io(this.apiUrl, this.socketParams);
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    private emit(event, data) {
        this.socket.emit(event, data);
    }

    mergeFile(fileInfo) {
        this.emit(WS_ACTION_TYPE.FILE_MERGE, fileInfo);
    }

    on(event, fn) {
        this.socket && this.socket.on(event, fn);
    }

    uploadFile(file) {
        this.emit(WS_ACTION_TYPE.FILE_UPLOAD, file);
    }
}

/**
 * 上传，单例模式
 */
export class Uploader {
    private static instance: Uploader;
    // 用于上传的 socket
    private socket;
    // 需要上传的文件列表
    private filePool = [];
    // 上传的文件池
    private taskPool: { [hash: string]: IUploadTask } = {};
    private constructor() {}

    connect() {
        if (!this.socket) {
            this.socket = new UploadSocket();
            this.socket.on(WS_ACTION_TYPE.FILE_UPLOADED, (data) => {
                console.log(data);
                this.onUploaded(data);
            });
            this.socket.on(WS_ACTION_TYPE.FILE_DONE, (data) => {
                console.log(data);
                this.onMerged(data);
            });
        }
    }

    remove(fileInfo) {}

    disconnect() {
        if (this.socket) {
            this.socket?.disconnect();
            this.socket = null;
        }
    }

    onUploaded({ success, data, msg }) {
        const hash = data?.hash;
        const taskInfo = this.taskPool[hash];

        if (success) {
            this.checkPercent(taskInfo, true);
        } else {
            console.error(msg);
            taskInfo.callbacks.onError(msg || "文件上传失败");
            this.handlerEnd(taskInfo.file, false);
            delete this.taskPool[hash];
        }
    }

    onMerged({ success = false, data, msg }) {
        const hash = data?.hash;
        const taskInfo = this.taskPool[hash];
        this.handlerEnd(taskInfo.file, Boolean(hash));
        if (!success) {
            console.error(msg);
            taskInfo.callbacks.onError(msg || "文件上传失败");
        }
        delete this.taskPool[hash];
    }

    checkPercent(taskInfo: IUploadTask, isFinishOne = false) {
        const { progress, callbacks, file } = taskInfo;
        const total = file.total;
        isFinishOne && progress.complete++;
        const percent = progress.complete / total;
        const isEnd = progress.complete > total;
        callbacks.onProgress(percent);
        if (isEnd) {
            this.mergeChunks(file);
        } else {
            setTimeout(() => {
                this.uploadNextChunk(file);
            }, 0);
        }
    }
    static getInstance() {
        if (!Uploader.instance) {
            Uploader.instance = new Uploader();
        }
        return Uploader.instance;
    }
    // 上传一个文件
    async upload({
        file,
        onProgress = () => {},
        onEnd = () => {},
        onError = () => {},
    }: {
        file: File;
        onProgress?: Function;
        onEnd?: Function;
        onError?: Function;
    }) {
        this.connect();

        const fileInfo = await this.getFileInfo(file);
        if (this.isUploading(fileInfo)) {
            return onError("文件上传中");
        }

        // 初始化文件相关信息
        this.taskPool[fileInfo.hash] = {
            file: fileInfo,
            progress: { complete: 0, chunksPool: [] },
            callbacks: { onError, onProgress, onEnd },
        };

        const statusOnServer = await this.checkFileOnServer(fileInfo);
        switch (statusOnServer.type) {
            case FILE_STATUS.UPLOAD:
            case FILE_STATUS.PROGRESS:
                this.uploadChunks(fileInfo, statusOnServer.index);
                break;
            case FILE_STATUS.MERGE:
                this.mergeChunks(fileInfo);
                break;
            case FILE_STATUS.EXISTING:
                onProgress(1);
                this.handlerEnd(fileInfo, true);
                break;
            default:
                break;
        }
        return fileInfo;
    }

    handlerEnd(fileInfo, result = true) {
        const { hash } = fileInfo;
        const taskInfo = this.taskPool[hash];
        const { callbacks } = taskInfo;
        callbacks?.onEnd?.(result ? fileInfo : false);
        try {
            delete this.taskPool[hash];
        } catch (error) {
            this.taskPool[hash] = null;
        }
        console.log(this.taskPool);
        if (this.filePool.length === 0) {
            this.disconnect();
        } else {
            this.upload(this.filePool[0]);
            this.filePool.splice(0, 1);
        }
    }

    // 销毁正在上传的
    destroy() {
        this.filePool = [];
        for (var i in this.taskPool) {
            let fileInfo = this.taskPool[i].file;
            this.handlerEnd(fileInfo, false);
        }
    }

    mergeChunks(fileInfo: IFileInfo) {
        this.socket.mergeFile({
            chunkSize: fileInfo.chunkSize,
            name: fileInfo.name,
            total: fileInfo.total,
            hash: fileInfo.hash,
        });
    }

    isUploading(fileInfo: IFileInfo): boolean {
        const { hash } = fileInfo;
        return Boolean(this.taskPool[hash]);
    }

    uploadChunks(fileInfo: IFileInfo, uploadedIndex: Array<number> = []) {
        const { total, hash } = fileInfo;
        const taskInfo = this.taskPool[hash];
        const { progress } = taskInfo;
        for (let i = 0; i < total; i++) {
            let needUpload = !uploadedIndex.includes(i + 1);
            if (needUpload) {
                progress.chunksPool.push(i);
            } else {
                progress.complete++;
            }
        }
        this.checkPercent(taskInfo, true);
    }

    async uploadNextChunk(fileInfo: IFileInfo) {
        const { hash, splicer, chunkSize, total, name, file } = fileInfo;
        const taskInfo = this.taskPool[hash];
        const { progress } = taskInfo;
        const { chunksPool = [] } = progress;
        if (chunksPool.length > 0) {
            let index = chunksPool[0];
            chunksPool.splice(0, 1);
            this.socket.uploadFile({
                chunkSize,
                total,
                name,
                size: file.size,
                index: index + 1,
                hash,
                sliceBlob: await splicer.getChunkByIndex(index),
            });
        }
    }

    // 和服务器文件做比对
    async checkFileOnServer(fileInfo: IFileInfo) {
        const { total, chunkSize, hash, name } = fileInfo;
        const { data = null } = await fileApi.checkFileExisting({
            total,
            chunkSize,
            hash,
            name,
        });
        return data;
    }

    //对file切片
    public async getFileInfo(file: File): Promise<IFileInfo> {
        let chunkSize = CHUNK_SIZE;
        if (file.size > 500 * MB) {
            chunkSize = 10 * MB;
        } else if (file.size > 100 * MB) {
            chunkSize = 5 * MB;
        }
        let spliceFile = SpliceFile(file, chunkSize);
        const hash = await spliceFile.getFileHash();
        return {
            splicer: spliceFile,
            chunkSize,
            name: file.name,
            file: file,
            hash,
            total: spliceFile.getTotal(),
        };
    }
}
