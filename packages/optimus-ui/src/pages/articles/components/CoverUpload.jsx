import React, { useState, useCallback } from 'react';
import { Button, Space, Image, message, Alert, Tag } from 'antd';
import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import UploadComponent from '../../../shared/components/Upload';
import { getFullFileUrl } from '../../../shared/utils/fileUtils';

/**
 * CoverUpload - 封面图片上传组件
 * 
 * @param {Object} props
 * @param {Array} props.value - 封面图片URL数组
 * @param {Function} props.onChange - 变更回调
 * @param {number} props.maxCount - 最大上传数量
 * @param {Object} props.coverConfig - 封面配置（分辨率限制）
 * @param {string} props.categoryName - 分类名称
 */
const CoverUpload = ({ value = [], onChange, maxCount = 3, coverConfig, categoryName }) => {
  const [validating, setValidating] = useState(false);
  // 验证图片分辨率
  const validateImageResolution = useCallback((file) => {
    if (!coverConfig || !coverConfig.resolutionType) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const { width, height } = img;
          const { resolutionType } = coverConfig;
          
          try {
            switch (resolutionType) {
              case 'width_only':
                if (width !== coverConfig.width) {
                  reject(`图片宽度必须为 ${coverConfig.width}px，当前为 ${width}px`);
                  return;
                }
                break;
                
              case 'height_only':
                if (height !== coverConfig.height) {
                  reject(`图片高度必须为 ${coverConfig.height}px，当前为 ${height}px`);
                  return;
                }
                break;
                
              case 'aspect_ratio':
                const ratio = width / height;
                const targetRatio = coverConfig.aspectRatio;
                const tolerance = coverConfig.aspectRatioTolerance || 0.01;
                const diff = Math.abs(ratio - targetRatio);
                
                if (diff > tolerance) {
                  reject(`图片宽高比必须为 ${targetRatio.toFixed(2)}（容差 ${tolerance}），当前为 ${ratio.toFixed(2)}`);
                  return;
                }
                break;
                
              case 'max_size':
                if ((coverConfig.width && width > coverConfig.width) ||
                    (coverConfig.height && height > coverConfig.height)) {
                  const maxW = coverConfig.width || '不限';
                  const maxH = coverConfig.height || '不限';
                  reject(`图片尺寸超出限制（最大 ${maxW}x${maxH}px），当前为 ${width}x${height}px`);
                  return;
                }
                break;
                
              case 'exact_sizes':
                const isAllowed = coverConfig.allowedResolutions?.some(
                  r => r.width === width && r.height === height
                );
                
                if (!isAllowed) {
                  const allowedStr = coverConfig.allowedResolutions
                    ?.map(r => `${r.width}x${r.height}`)
                    .join('、') || '';
                  reject(`图片分辨率必须为以下之一：${allowedStr}，当前为 ${width}x${height}px`);
                  return;
                }
                break;
              
              default:
                // 未知的分辨率类型，跳过验证
                break;
            }
            
            resolve({ width, height });
          } catch (error) {
            reject('验证图片分辨率时出错');
          }
        };
        
        img.onerror = () => {
          reject('无法读取图片信息');
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject('读取文件失败');
      };
      
      reader.readAsDataURL(file);
    });
  }, [coverConfig]);

  // 处理上传前验证
  const handleBeforeUpload = useCallback(async (file) => {
    setValidating(true);
    
    try {
      await validateImageResolution(file);
      return true;
    } catch (error) {
      message.error(error);
      return false;
    } finally {
      setValidating(false);
    }
  }, [validateImageResolution]);

  // 处理上传成功
  const handleUploadChange = (index) => (fileData) => {
    if (fileData && fileData.url) {
      const newValue = [...value];
      newValue[index] = fileData.url;
      onChange(newValue.filter(Boolean));
    }
  };

  // 处理删除
  const handleRemove = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  // 生成分辨率要求提示
  const getResolutionTip = () => {
    if (!coverConfig || !coverConfig.resolutionType) {
      return '建议尺寸：1200x630px';
    }

    const { resolutionType } = coverConfig;
    
    switch (resolutionType) {
      case 'width_only':
        return `宽度必须为 ${coverConfig.width}px，高度不限`;
      
      case 'height_only':
        return `高度必须为 ${coverConfig.height}px，宽度不限`;
      
      case 'aspect_ratio':
        const ratio = coverConfig.aspectRatio;
        let ratioDesc = `${ratio.toFixed(2)}`;
        // 常见比例的友好显示
        if (Math.abs(ratio - 1.778) < 0.01) ratioDesc = '16:9';
        else if (Math.abs(ratio - 1.333) < 0.01) ratioDesc = '4:3';
        else if (Math.abs(ratio - 1.0) < 0.01) ratioDesc = '1:1';
        else if (Math.abs(ratio - 0.5625) < 0.01) ratioDesc = '9:16';
        
        return `宽高比必须为 ${ratioDesc}`;
      
      case 'max_size':
        const maxW = coverConfig.width || '不限';
        const maxH = coverConfig.height || '不限';
        return `最大尺寸：${maxW}x${maxH}px`;
      
      case 'exact_sizes':
        const sizes = coverConfig.allowedResolutions
          ?.map(r => `${r.width}x${r.height}`)
          .join('、') || '';
        return `只允许以下分辨率：${sizes}`;
      
      default:
        return '建议尺寸：1200x630px';
    }
  };

  return (
    <div className="cover-upload-wrapper">
      {/* 分辨率限制提示 */}
      {coverConfig && coverConfig.resolutionType && (
        <Alert
          message="封面分辨率要求"
          description={
            <div>
              <div>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                {categoryName && `分类「${categoryName}」要求：`}
                {getResolutionTip()}
              </div>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{coverConfig.resolutionType}</Tag>
                上传前会自动验证图片分辨率
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Space size={16} wrap>
        {/* 已上传的封面 */}
        {value.map((url, index) => (
          <div key={index} className="cover-upload-item">
            <Image
              src={getFullFileUrl(url)}
              alt={`封面${index + 1}`}
              width={104}
              height={104}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={{
                mask: '预览'
              }}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(index)}
              className="cover-upload-delete"
            >
              删除
            </Button>
          </div>
        ))}

        {/* 上传按钮 */}
        {value.length < maxCount && (
          <div className="cover-upload-item">
            <UploadComponent
              onChange={handleUploadChange(value.length)}
              fileType={['image/jpeg', 'image/png', 'image/webp']}
              limit={5}
              business="article-cover"
              thumbnail={{ width: 1200, quality: 80 }}
              beforeUpload={handleBeforeUpload}
              disabled={validating}
            />
          </div>
        )}
      </Space>

      {/* 提示信息 */}
      <div className="cover-upload-tip">
        <div>最多上传 {maxCount} 张封面图片</div>
        <div>{getResolutionTip()}，支持JPG、PNG、WebP格式，单张不超过5MB</div>
        <div>第一张图片将作为主封面显示</div>
      </div>

      <style jsx>{`
        .cover-upload-wrapper {
          width: 100%;
        }

        .cover-upload-item {
          position: relative;
          display: inline-block;
        }

        .cover-upload-delete {
          position: absolute;
          top: 4px;
          right: 4px;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .cover-upload-item:hover .cover-upload-delete {
          opacity: 1;
        }

        .cover-upload-tip {
          margin-top: 12px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
          line-height: 1.8;
        }

        .cover-upload-tip > div {
          margin-bottom: 4px;
        }

        .cover-upload-tip > div:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .cover-upload-item {
            width: 100%;
          }

          .cover-upload-item :global(.ant-image),
          .cover-upload-item :global(.avatar-uploader) {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CoverUpload;
