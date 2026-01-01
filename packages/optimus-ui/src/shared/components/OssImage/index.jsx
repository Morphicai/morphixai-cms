import React from 'react';
import { Image } from 'antd';
import { getFullFileUrl } from '../../utils/fileUtils';

/**
 * OSS 图片组件
 * 自动处理文件 URL 拼接，统一图片加载和错误处理
 * 
 * @param {string} src - 后端返回的文件 key
 * @param {string} alt - 图片描述
 * @param {string} fallback - 默认图片 URL
 * @param {object} props - 其他传递给 antd Image 的属性
 * 
 * @example
 * // 基础使用
 * <OssImage 
 *   src="/OSS_FILE_PROXY/file.png?provider=minio" 
 *   alt="示例图片"
 *   width={200}
 *   height={200}
 * />
 * 
 * @example
 * // 带预览功能
 * <OssImage 
 *   src={product.image}
 *   alt={product.name}
 *   preview={{
 *     src: getFullFileUrl(product.largeImage)
 *   }}
 * />
 * 
 * @example
 * // 图片列表
 * <Image.PreviewGroup>
 *   {images.map((img, index) => (
 *     <OssImage 
 *       key={index}
 *       src={img}
 *       width={200}
 *     />
 *   ))}
 * </Image.PreviewGroup>
 */
const OssImage = ({ src, alt = '', fallback, ...props }) => {
    // 如果没有 src，显示默认图片
    if (!src) {
        return (
            <Image
                src={fallback || '/default-image.png'}
                alt={alt}
                {...props}
            />
        );
    }

    // 转换为完整 URL
    const fullUrl = getFullFileUrl(src);

    return (
        <Image
            src={fullUrl}
            alt={alt}
            fallback={fallback || '/default-image.png'}
            {...props}
        />
    );
};

export default OssImage;
