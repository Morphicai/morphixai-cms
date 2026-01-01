import { KB, MB, GB } from "../constants/filesize";

export default function calcFilesize(size = 0) {
    const result = {
        sizeForHuman: 0,
        sizeUnit: "KB",
    };
    if (size >= GB) {
        result.sizeForHuman = parseFloat(size / GB).toFixed(2);
        result.sizeUnit = "GB";
    } else if (size >= MB) {
        result.sizeForHuman = parseFloat(size / MB).toFixed(2);
        result.sizeUnit = "MB";
    } else if (size >= KB) {
        result.sizeForHuman = parseFloat(size / KB).toFixed(2);
    }
    return result;
}
