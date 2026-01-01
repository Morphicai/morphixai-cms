import { Image } from "antd";
import { getFullFileUrl } from "../../../utils/fileUtils";

/**
 * @deprecated 请使用 shared/components/OssImage 组件
 */
export default function OssImage({ src, ...props }) {
    console.warn('CommonTable/OssImage is deprecated. Please use shared/components/OssImage');
    
    // 兼容旧的 static/ 路径格式
    let fullSrc = src;
    if (src && src.indexOf("static/") > -1) {
        fullSrc = src;
    } else if (src && !src.startsWith('http') && !src.startsWith('/')) {
        fullSrc = `/static/${src}`;
    }
    
    // 使用新的 URL 转换函数
    const imageUrl = getFullFileUrl(fullSrc);
    
    return <Image src={imageUrl} {...props} />;
}
