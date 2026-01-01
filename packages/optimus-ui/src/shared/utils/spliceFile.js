import SparkMD5 from "spark-md5";

const blobSlice =
    File.prototype.slice ||
    File.prototype.mozSlice ||
    File.prototype.webkitSlice;

// 对文件进行抽样切片
// getSlice 获取文件的切片
const SAMPLE_SIZE = 10;

export default function SpliceFile(file, chunkSize) {
    const total = Math.ceil(file.size / chunkSize);
    // 样本的数量
    const sampleNum = SAMPLE_SIZE;
    return {
        async getChunkByIndex(index) {
            // 获取某一个切片的值
            let fileReader = new FileReader();
            const res = await new Promise((resolve, reject) => {
                fileReader.onload = function (e) {
                    resolve(e.target.result);
                };
                fileReader.onerror = function (err) {
                    reject(err);
                };
                const start = index * chunkSize;
                const end = Math.min(file.size, start + chunkSize);
                fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
            });
            fileReader = null;
            return res;
        },
        async getFileHash() {
            // 获取文件的信息
            const samples = this._getSamples();
            const spark = new SparkMD5.ArrayBuffer();
            const allPromise = samples.map(async (index) => {
                return await this.getChunkByIndex(index);
            });
            const allSampleChunks = await Promise.all(allPromise);
            allSampleChunks.forEach((item) => {
                spark.append(item);
            });
            return spark.end();
        },
        getTotal() {
            return total;
        },
        // 选取样本，同样的文件返回的样本必须一致,offset 表示标准样本的偏移量
        _getSamples() {
            let samples = [];
            if (total <= sampleNum * 2) {
                for (let i = 0; i < total; i++) {
                    samples.push(i);
                }
            } else {
                // 获得10个样本，平均分布
                const gap = total / (sampleNum - 1);
                for (let i = 0; i < total; i += gap) {
                    let index = Math.floor(i);
                    !samples.includes(index) && samples.push(index);
                }
                // 确保尾部一定在样本里
                !samples.includes(total - 1) && samples.push(total - 1);
            }
            console.log(samples);
            return samples;
        },
    };
}
