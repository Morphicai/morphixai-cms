import React, { useState, useCallback } from 'react';
import { Input, Button, Space, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

/**
 * 图片分辨率输入组件
 * 支持手动输入或通过上传图片自动获取分辨率
 */
const ImageResolutionInput = ({ value = {}, onChange, disabled = false }) => {
  const [uploading, setUploading] = useState(false);

  // 处理宽度变化
  const handleWidthChange = useCallback((e) => {
    const width = parseInt(e.target.value) || undefined;
    onChange?.({ ...value, width });
  }, [value, onChange]);

  // 处理高度变化
  const handleHeightChange = useCallback((e) => {
    const height = parseInt(e.target.value) || undefined;
    onChange?.({ ...value, height });
  }, [value, onChange]);

  // 处理图片上传前的验证
  const beforeUpload = useCallback((file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return Upload.LIST_IGNORE;
    }

    setUploading(true);

    // 读取图片获取分辨率
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onChange?.({
          width: img.width,
          height: img.height
        });
        message.success(`已获取分辨率：${img.width}x${img.height}`);
        setUploading(false);
      };
      img.onerror = () => {
        message.error('无法读取图片分辨率');
        setUploading(false);
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      message.error('读取文件失败');
      setUploading(false);
    };
    reader.readAsDataURL(file);

    // 阻止上传到服务器
    return false;
  }, [onChange]);

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        placeholder="宽度"
        value={value?.width || ''}
        onChange={handleWidthChange}
        disabled={disabled}
        style={{ width: '35%' }}
        type="number"
        min={1}
        addonAfter="px"
      />
      <Input
        placeholder="×"
        disabled
        style={{ 
          width: '10%', 
          textAlign: 'center',
          borderLeft: 0,
          borderRight: 0,
          pointerEvents: 'none'
        }}
      />
      <Input
        placeholder="高度"
        value={value?.height || ''}
        onChange={handleHeightChange}
        disabled={disabled}
        style={{ width: '35%' }}
        type="number"
        min={1}
        addonAfter="px"
      />
      <Upload
        beforeUpload={beforeUpload}
        showUploadList={false}
        accept="image/*"
        disabled={disabled}
      >
        <Button 
          icon={<UploadOutlined />} 
          loading={uploading}
          disabled={disabled}
          style={{ width: '100%' }}
        >
          从图片获取
        </Button>
      </Upload>
    </Space.Compact>
  );
};

ImageResolutionInput.propTypes = {
  value: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  onChange: PropTypes.func,
  disabled: PropTypes.bool
};

export default ImageResolutionInput;
