/**获取图片的base64 */
export function getBase64(img, callback) {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
}

export function getImageSizeByUrl(url) {
    if (!url) {
        return null;
    }
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.src = url;
        image.onload = function () {
            resolve({ width: this.width, height: this.height });
        };
        image.onerror = function (error) {
            reject(error);
        };
    });
}
// 获取图片的尺寸
export function getImageSize(file) {
    if (!file) throw new Error("请传入file");
    if (typeof file === "string") {
        return getImageSizeByUrl(file);
    }
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async function (theFile) {
            resolve(await getImageSizeByUrl(theFile?.target?.result));
        };
        reader.onerror = function (error) {
            reject(error);
        };
    });
}
