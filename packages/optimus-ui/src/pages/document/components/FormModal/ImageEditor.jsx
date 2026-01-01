import React, { useState, useEffect } from 'react';
import { Upload, Image } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import UploadComponent from "../../../../shared/components/Upload";
import { getFullFileUrl } from "../../../../shared/utils/fileUtils";

/**
 * 图片编辑器组件
 * 支持单图和多图上传
 */
export default function ImageEditor({ 
  value, 
  onChange, 
  maxCount = 1,
  multiple = false,
  ...otherProps 
}) {
  const [imageList, setImageList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        // 单图模式
        setImageList([{ url: value, uid: '1' }]);
      } else if (Array.isArray(value)) {
        // 多图模式
        setImageList(value.map((url, index) => ({ url, uid: String(index) })));
      }
    } else {
      setImageList([]);
    }
  }, [value]);

  const handleSingleImageChange = (imageData) => {
    if (imageData && imageData.url) {
      onChange(imageData.url);
    } else {
      onChange('');
    }
  };

  const handleMultipleImageChange = (newImageList) => {
    const urls = newImageList.map(item => item.url).filter(Boolean);
    onChange(urls);
  };

  const handlePreview = (file) => {
    setPreviewImage(file.url);
    setPreviewVisible(true);
  };

  const handleRemove = (file) => {
    const newList = imageList.filter(item => item.uid !== file.uid);
    setImageList(newList);
    handleMultipleImageChange(newList);
  };

  // 单图模式
  if (!multiple) {
    return (
      <div>
        <UploadComponent
          value={value ? { url: value } : {}}
          onChange={handleSingleImageChange}
          {...otherProps}
        />
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
          支持 JPG、PNG 格式，建议尺寸不超过 2MB
        </div>
      </div>
    );
  }

  // 多图模式
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <div>
      <Upload
        listType="picture-card"
        fileList={imageList}
        onPreview={handlePreview}
        onRemove={handleRemove}
        beforeUpload={() => false} // 阻止自动上传
        maxCount={maxCount}
        multiple={multiple}
        {...otherProps}
      >
        {imageList.length >= maxCount ? null : uploadButton}
      </Upload>
      
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
        最多上传 {maxCount} 张图片，支持 JPG、PNG 格式
      </div>

      {/* 预览模态框 */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewImage ? getFullFileUrl(previewImage) : undefined,
          onOpenChange: (visible) => setPreviewVisible(visible),
        }}
      />
    </div>
  );
}