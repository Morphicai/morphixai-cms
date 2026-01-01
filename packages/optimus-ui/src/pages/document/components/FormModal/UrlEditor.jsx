import React, { useState, useEffect } from 'react';
import { Input, Button, Space, message, theme } from 'antd';
import { LinkOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

/**
 * URL编辑器组件
 * 提供链接验证和预览功能
 */
export default function UrlEditor({ 
  value, 
  onChange, 
  placeholder = "请输入链接地址，如：https://example.com",
  ...otherProps 
}) {
  const { token } = theme.useToken();
  const [url, setUrl] = useState(value || '');
  const [isValid, setIsValid] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setUrl(value || '');
    if (value) {
      validateUrl(value);
    }
  }, [value]);

  const validateUrl = (urlString) => {
    try {
      new URL(urlString);
      setIsValid(true);
      return true;
    } catch (e) {
      setIsValid(false);
      return false;
    }
  };

  const handleChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    onChange(newUrl);
    
    if (newUrl.trim()) {
      validateUrl(newUrl);
    } else {
      setIsValid(null);
    }
  };

  const handleTest = async () => {
    if (!url || !isValid) {
      message.warning('请输入有效的URL地址');
      return;
    }

    setIsChecking(true);
    try {
      // 这里可以添加实际的URL可访问性检查
      // 由于跨域限制，这里只做基本的格式验证
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟检查过程
      message.success('URL格式正确');
    } catch (error) {
      message.error('URL检查失败');
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpen = () => {
    if (url && isValid) {
      window.open(url, '_blank');
    }
  };

  const getStatusIcon = () => {
    if (isValid === null) return null;
    return isValid ? 
      <CheckOutlined /> : 
      <CloseOutlined />;
  };

  return (
    <div>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={url}
          onChange={handleChange}
          placeholder={placeholder}
          prefix={<LinkOutlined />}
          suffix={getStatusIcon()}
          status={isValid === false ? 'error' : undefined}
          {...otherProps}
        />
        <Button 
          type="default" 
          onClick={handleTest}
          loading={isChecking}
          disabled={!url || !isValid}
        >
          检查
        </Button>
        <Button 
          type="primary" 
          onClick={handleOpen}
          disabled={!url || !isValid}
        >
          打开
        </Button>
      </Space.Compact>
      
      {isValid === false && (
        <div style={{ 
          marginTop: 4, 
          fontSize: 12, 
          color: token.colorError
        }}>
          请输入有效的URL地址，必须包含协议（如 https://）
        </div>
      )}
      
      {isValid === true && (
        <div style={{ 
          marginTop: 4, 
          fontSize: 12, 
          color: token.colorSuccess
        }}>
          ✓ URL格式正确
        </div>
      )}
    </div>
  );
}