import fs from "fs";
import path from "path";

export function deleteFolder(
    delPath,
    err = (er: string) => {
        // Default error handler - do nothing
    },
) {
    try {
        if (fs.existsSync(delPath)) {
            const delFn = function (address) {
                const files = fs.readdirSync(address);
                for (let i = 0; i < files.length; i++) {
                    const dirPath = path.join(address, files[i]);
                    if (fs.statSync(dirPath).isDirectory()) {
                        delFn(dirPath);
                    } else {
                        deleteFile(dirPath, true);
                    }
                }
                /**
                 * @des 只能删空文件夹
                 */
                fs.rmdirSync(address);
            };
            delFn(delPath);
        } else {
            err(`do not exist: ${delPath}`);
        }
    } catch (error) {
        err(error);
    }
}

/**
 * @param { delPath：String } （需要删除文件的地址）
 * @param { direct：Boolean } （是否需要处理地址）
 */
export function deleteFile(delPath, direct, err?) {
    delPath = direct ? delPath : path.join(__dirname, delPath);
    try {
        /**
         * @des 判断文件或文件夹是否存在
         */
        if (fs.existsSync(delPath)) {
            fs.unlinkSync(delPath);
        } else {
            err && err(`"inexistence path："${delPath}`);
        }
    } catch (error) {
        err && err(error);
    }
}
