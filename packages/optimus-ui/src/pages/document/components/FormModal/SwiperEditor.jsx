import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, Radio, Switch, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import UploadComponent from "../../../../shared/components/Upload";
import { getFullFileUrl } from "../../../../shared/utils/fileUtils";

/**
 * 轮播图编辑器组件
 * 支持多张图片上传、配置链接、链接打开方式
 */
export default function SwiperEditor({ value, onChange, ...otherProps }) {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    if (value) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        setSlides(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('解析轮播图数据失败:', e);
        setSlides([]);
      }
    } else {
      setSlides([]);
    }
  }, [value]);

  const handleChange = (newSlides) => {
    setSlides(newSlides);
    onChange(JSON.stringify(newSlides));
  };

  const handleAddSlide = () => {
    const newSlide = {
      id: Date.now(),
      image: '',
      link: '',
      linkEnabled: false,
      target: '_self',
    };
    handleChange([...slides, newSlide]);
  };

  const handleRemoveSlide = (id) => {
    handleChange(slides.filter(slide => slide.id !== id));
  };

  const handleUpdateSlide = (id, field, value) => {
    handleChange(
      slides.map(slide =>
        slide.id === id ? { ...slide, [field]: value } : slide
      )
    );
  };

  const handleMoveSlide = (index, direction) => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    handleChange(newSlides);
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {slides.length === 0 ? (
          <Empty 
            description="暂无轮播图，点击下方按钮添加"
            style={{ padding: '40px 0' }}
          />
        ) : (
          slides.map((slide, index) => (
            <Card
              key={slide.id}
              size="small"
              title={`轮播图 ${index + 1}`}
              extra={
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0}
                    onClick={() => handleMoveSlide(index, 'up')}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={index === slides.length - 1}
                    onClick={() => handleMoveSlide(index, 'down')}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveSlide(slide.id)}
                  />
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 图片上传 */}
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>图片</div>
                  <UploadComponent
                    value={slide.image ? { url: slide.image } : {}}
                    onChange={(imageData) => {
                      handleUpdateSlide(slide.id, 'image', imageData?.url || '');
                    }}
                  />
                  {slide.image && (
                    <div style={{ marginTop: 8 }}>
                      <img 
                        src={getFullFileUrl(slide.image)} 
                        alt="预览" 
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '120px',
                          borderRadius: 4,
                          border: '1px solid #d9d9d9'
                        }} 
                      />
                    </div>
                  )}
                </div>

                {/* 链接配置 */}
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <span style={{ fontWeight: 500 }}>链接</span>
                      <Switch
                        size="small"
                        checked={slide.linkEnabled}
                        onChange={(checked) => handleUpdateSlide(slide.id, 'linkEnabled', checked)}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                      />
                    </Space>
                  </div>
                  
                  {slide.linkEnabled && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Input
                        placeholder="请输入链接地址，如：https://example.com"
                        value={slide.link}
                        onChange={(e) => handleUpdateSlide(slide.id, 'link', e.target.value)}
                      />
                      <Radio.Group
                        value={slide.target}
                        onChange={(e) => handleUpdateSlide(slide.id, 'target', e.target.value)}
                      >
                        <Radio value="_self">当前页打开</Radio>
                        <Radio value="_blank">新页面打开</Radio>
                      </Radio.Group>
                    </Space>
                  )}
                </div>
              </Space>
            </Card>
          ))
        )}

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={handleAddSlide}
        >
          添加轮播图
        </Button>
      </Space>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>
        支持添加多张轮播图，可配置链接和打开方式，支持拖拽排序
      </div>
    </div>
  );
}
