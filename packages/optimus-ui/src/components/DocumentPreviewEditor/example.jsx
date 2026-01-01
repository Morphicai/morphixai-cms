import { useState } from 'react';
import { Card, Input, Button, Space, Typography, message } from 'antd';
import DocumentPreviewEditor from './index';

const { Title, Text } = Typography;

/**
 * DocumentPreviewEditor 使用示例
 */
export default function DocumentPreviewEditorExample() {
  const [previewUrl, setPreviewUrl] = useState('http://localhost:3101');
  const [inputUrl, setInputUrl] = useState('http://localhost:3101');

  const handleLoadUrl = () => {
    setPreviewUrl(inputUrl);
    message.success('已加载页面');
  };

  const handleDocumentEdit = (payload) => {
    console.log('📝 编辑文档:', payload);
    message.info(`正在编辑: ${payload.docKey}`);
  };

  const handleDocumentSave = (values, payload) => {
    console.log('✅ 保存成功:', values);
    console.log('📦 原始信息:', payload);
    message.success(`文档 ${values.docKey} 保存成功`);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <Card 
        style={{ marginBottom: 0, borderRadius: 0 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Title level={4} style={{ margin: 0 }}>文档可视化编辑器示例</Title>
            <Text type="secondary">
              在下方预览中点击任意 DocumentSection 区域进行编辑
            </Text>
          </div>
          
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入前台页面 URL，例如: http://localhost:3101/home"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onPressEnter={handleLoadUrl}
            />
            <Button type="primary" onClick={handleLoadUrl}>
              加载页面
            </Button>
          </Space.Compact>

          <Space direction="vertical" size="small">
            <Text type="secondary">
              💡 提示: 确保前台页面已集成 DocumentSection 组件
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              编辑模式通过 postMessage 自动启用，无需手动配置
            </Text>
          </Space>
        </Space>
      </Card>

      {/* 预览区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DocumentPreviewEditor
          previewUrl={previewUrl}
          onDocumentEdit={handleDocumentEdit}
          onDocumentSave={handleDocumentSave}
        />
      </div>
    </div>
  );
}
