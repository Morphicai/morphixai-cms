// 文件切片信息
export interface IChunk {
    index: number;
    size: number;
    sliceBlob: ArrayBuffer;
}

export interface ISplicer {
    getFileHash: Function;
    getChunkByIndex: Function;
    getTotal: Function;
}
// 文件信息
export interface IFileInfo {
    chunkSize: number;
    name: string;
    file: File;
    splicer: ISplicer;
    hash: string;
    total: number;
}

// 上传的过程信息
export interface IProgress {
    complete: number;
    chunksPool: number[];
    onProgress?: Function;
    onError?: Function;
    onEnd?: Function;
}
export interface ICallBacks {
    onError: Function;
    onEnd: Function;
    onProgress: Function;
}

export interface IUploadTask {
    file: IFileInfo;
    progress: IProgress;
    callbacks: ICallBacks;
}

export type Callback = undefined | Function | null;
