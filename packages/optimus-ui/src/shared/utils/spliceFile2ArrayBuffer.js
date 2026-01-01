import SparkMD5 from "spark-md5";
import calcFilesize from "./calcFilesize";

const blobSlice =
    File.prototype.slice ||
    File.prototype.mozSlice ||
    File.prototype.webkitSlice;

export default function spliceFile2ArrayBuffer(file, myChunkSize) {
    return new Promise((resolve, reject) => {
        let currentChunk = 0;
        const chunkSize = myChunkSize;
        const total = Math.ceil(file.size / chunkSize);
        const spark = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();
        const blobDatas = [];
        const defaultFile = Object.assign(
            {
                chunkSize,
                total,
                name: file.name,
                size: file.size,
            },
            calcFilesize(file.size),
        );

        fileReader.onload = function (e) {
            console.log("read chunk nr", currentChunk + 1, "of", total);
            currentChunk++;
            spark.append(e.target.result);
            blobDatas.push({
                ...defaultFile,
                index: currentChunk,
                sliceBlob: e.target.result,
            });

            if (currentChunk < total) {
                loadNext();
            } else {
                let fileHash = spark.end();
                resolve(
                    blobDatas.map((blob) => ({
                        ...blob,
                        hash: fileHash,
                    })),
                );
            }
        };

        fileReader.onerror = function (e) {
            reject(e);
        };
        function loadNext() {
            const start = currentChunk * chunkSize;
            const end = Math.min(file.size, start + chunkSize);
            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }
        loadNext();
    });
}

// async function fileChunkMd5(file, chunkSize) {
//     const blobSlice =
//         File.prototype.slice ||
//         File.prototype.mozSlice ||
//         File.prototype.webkitSlice;
//     const total = Math.ceil(file.size / chunkSize);
//     const fileReader = new FileReader();
//     fileReader.onload = (e) => {};
//     fileReader.error = (e) => {};
//     // 小文件直接读取
//     if (total < 5 || file.size < 1 * 1024 * 1024) {
//     }
// }
