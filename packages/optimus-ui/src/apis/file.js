import { request } from "../shared/utils/axios";

export async function checkFileExisting(data) {
    return await request({
        type: "get",
        url: "/oss/checkFileExisting",
        data,
    });
}
