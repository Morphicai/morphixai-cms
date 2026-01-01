import React, { useCallback } from 'react';
import { Form, Select, InputNumber, Button, Space, Card, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import ImageResolutionInput from '../../../shared/components/ImageResolutionInput';

const { Option } = Select;

/**
 * 封面配置表单组件
 */
const CoverConfigForm = ({ value = {}, onChange, disabled = false }) => {
  const { resolutionType, width, height, aspectRatio, allowedResolutions = [], aspectRatioTolerance = 0.01 } = value;

  // 处理分辨率类型变化
  const handleResolutionTypeChange = useCallback((newType) => {
    onChange?.({
      resolutionType: newType,
      // 清除其他字段
      width: undefined,
      height: undefined,
      aspectRatio: undefined,
      allowedResolutions: newType === 'exact_sizes' ? [] : undefined,
      aspectRatioTolerance: newType === 'aspect_ratio' ? 0.01 : undefined
    });
  }, [onChange]);

  // 处理字段变化
  const handleFieldChange = useCallback((field, val) => {
    onChange?.({
      ...value,
      [field]: val
    });
  }, [value, onChange]);

  // 添加允许的分辨率
  const handleAddResolution = useCallback(() => {
    const newResolutions = [...(allowedResolutions || []), { width: undefined, height: undefined }];
    handleFieldChange('allowedResolutions', newResolutions);
  }, [allowedResolutions, handleFieldChange]);

  // 删除允许的分辨率
  const handleRemoveResolution = useCallback((index) => {
    const newResolutions = allowedResolutions.filter((_, i) => i !== index);
    handleFieldChange('allowedResolutions', newResolutions);
  }, [allowedResolutions, handleFieldChange]);

  // 更新允许的分辨率
  const handleResolutionChange = useCallback((index, resolution) => {
    const newResolutions = [...allowedResolutions];
    newResolutions[index] = resolution;
    handleFieldChange('allowedResolutions', newResolutions);
  }, [allowedResolutions, handleFieldChange]);

  // 计算宽高比
  const calculateAspectRatio = useCallback((w, h) => {
    if (w && h) {
      const ratio = (w / h).toFixed(4);
      handleFieldChange('aspectRatio', parseFloat(ratio));
    }
  }, [handleFieldChange]);

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Form.Item label="分辨率限制类型" style={{ marginBottom: 0 }}>
          <Select
            placeholder="请选择分辨率限制类型"
            value={resolutionType}
            onChange={handleResolutionTypeChange}
            disabled={disabled}
            allowClear
          >
            <Option value="width_only">只限制宽度</Option>
            <Option value="height_only">只限制高度</Option>
            <Option value="aspect_ratio">限制宽高比</Option>
            <Option value="max_size">限制最大尺寸</Option>
            <Option value="exact_sizes">只允许特定分辨率</Option>
          </Select>
        </Form.Item>

        {resolutionType === 'width_only' && (
          <Form.Item label="宽度限制" style={{ marginBottom: 0 }}>
            <InputNumber
              placeholder="请输入宽度"
              value={width}
              onChange={(val) => handleFieldChange('width', val)}
              disabled={disabled}
              min={1}
              style={{ width: '100%' }}
              addonAfter="px"
            />
          </Form.Item>
        )}

        {resolutionType === 'height_only' && (
          <Form.Item label="高度限制" style={{ marginBottom: 0 }}>
            <InputNumber
              placeholder="请输入高度"
              value={height}
              onChange={(val) => handleFieldChange('height', val)}
              disabled={disabled}
              min={1}
              style={{ width: '100%' }}
              addonAfter="px"
            />
          </Form.Item>
        )}

        {resolutionType === 'aspect_ratio' && (
          <>
            <Form.Item label="宽高比" style={{ marginBottom: 0 }}>
              <Row gutter={8}>
                <Col span={16}>
                  <InputNumber
                    placeholder="请输入宽高比（如 1.778 表示 16:9）"
                    value={aspectRatio}
                    onChange={(val) => handleFieldChange('aspectRatio', val)}
                    disabled={disabled}
                    min={0.01}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={8}>
                  <Button
                    onClick={() => {
                      const w = prompt('请输入宽度：');
                      const h = prompt('请输入高度：');
                      if (w && h) {
                        calculateAspectRatio(parseInt(w), parseInt(h));
                      }
                    }}
                    disabled={disabled}
                    style={{ width: '100%' }}
                  >
                    计算
                  </Button>
                </Col>
              </Row>
            </Form.Item>
            <Form.Item label="比例容差" style={{ marginBottom: 0 }} help="允许的宽高比偏差范围（0-1）">
              <InputNumber
                placeholder="请输入容差"
                value={aspectRatioTolerance}
                onChange={(val) => handleFieldChange('aspectRatioTolerance', val)}
                disabled={disabled}
                min={0}
                max={1}
                step={0.01}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        )}

        {resolutionType === 'max_size' && (
          <Form.Item label="最大尺寸" style={{ marginBottom: 0 }} help="可以只设置宽度或高度，或同时设置">
            <Space direction="vertical" style={{ width: '100%' }}>
              <InputNumber
                placeholder="最大宽度（可选）"
                value={width}
                onChange={(val) => handleFieldChange('width', val)}
                disabled={disabled}
                min={1}
                style={{ width: '100%' }}
                addonAfter="px"
              />
              <InputNumber
                placeholder="最大高度（可选）"
                value={height}
                onChange={(val) => handleFieldChange('height', val)}
                disabled={disabled}
                min={1}
                style={{ width: '100%' }}
                addonAfter="px"
              />
            </Space>
          </Form.Item>
        )}

        {resolutionType === 'exact_sizes' && (
          <Form.Item label="允许的分辨率" style={{ marginBottom: 0 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {allowedResolutions.map((resolution, index) => (
                <Space key={index} style={{ width: '100%' }}>
                  <ImageResolutionInput
                    value={resolution}
                    onChange={(val) => handleResolutionChange(index, val)}
                    disabled={disabled}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveResolution(index)}
                    disabled={disabled}
                  />
                </Space>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddResolution}
                disabled={disabled}
                style={{ width: '100%' }}
              >
                添加分辨率
              </Button>
            </Space>
          </Form.Item>
        )}
      </Space>
    </Card>
  );
};

CoverConfigForm.propTypes = {
  value: PropTypes.shape({
    resolutionType: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    aspectRatio: PropTypes.number,
    allowedResolutions: PropTypes.arrayOf(PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number
    })),
    aspectRatioTolerance: PropTypes.number
  }),
  onChange: PropTypes.func,
  disabled: PropTypes.bool
};

export default CoverConfigForm;
