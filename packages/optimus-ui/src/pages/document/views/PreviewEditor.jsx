import { useState } from 'react';
import { Card, Input, Button, Space, Typography, Switch, Segmented } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, DesktopOutlined, MobileOutlined, TabletOutlined } from '@ant-design/icons';
import DocumentPreviewEditor from '../../../components/DocumentPreviewEditor';

const { Title, Text } = Typography;

// 从环境变量获取 C 端域名
const DEFAULT_CLIENT_URL = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3101';

// 设备尺寸配置
const DEVICE_SIZES = {
  desktop: { width: '100%', label: '桌面端', icon: <DesktopOutlined /> },
  tablet: { width: '768px', label: '平板', icon: <TabletOutlined /> },
  mobile: { width: '375px', label: '移动端', icon: <MobileOutlined /> }
};

/**
 * 官网编辑器页面
 * 实时预览和编辑官网页面内容
 */
export default function PreviewEditorPage() {
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_CLIENT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_CLIENT_URL);
  const [editMode, setEditMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState('desktop');

  const handleLoadUrl = () => {
    setPreviewUrl(inputUrl);
  };

  const handleDocumentEdit = (payload) => {
    console.log('📝 编辑文档:', payload);
  };

  const handleDocumentSave = (values, payload) => {
    console.log('✅ 保存成功:', values, payload);
  };

  const toggleFullscreen = () => {
    console.log('🖥️ [官网编辑器] 切换全屏模式:', {
      当前状态: isFullscreen ? '全屏' : '正常',
      目标状态: !isFullscreen ? '全屏' : '正常',
      当前编辑模式: editMode
    });
    setIsFullscreen(!isFullscreen);
  };

  const containerStyle = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column'
  } : {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={containerStyle}>
      {!isFullscreen && (
        <Card 
          style={{ marginBottom: 0, borderRadius: 0 }}
          styles={{ body: { padding: '12px 24px' } }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>官网编辑器</Title>
                <Text type="secondary">
                  实时预览官网效果，点击内容即可编辑
                </Text>
              </div>
              <Space>
                <Segmented
                  value={deviceMode}
                  onChange={setDeviceMode}
                  options={[
                    { label: '桌面端', value: 'desktop', icon: <DesktopOutlined /> },
                    { label: '平板', value: 'tablet', icon: <TabletOutlined /> },
                    { label: '移动端', value: 'mobile', icon: <MobileOutlined /> }
                  ]}
                />
                <Space>
                  <Text>编辑模式</Text>
                  <Switch 
                    checked={editMode} 
                    onChange={setEditMode}
                    checkedChildren="开"
                    unCheckedChildren="关"
                  />
                </Space>
                <Button 
                  icon={<FullscreenOutlined />}
                  onClick={toggleFullscreen}
                >
                  全屏
                </Button>
              </Space>
            </div>
            
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder={`输入前台页面 URL（默认: ${DEFAULT_CLIENT_URL}）`}
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onPressEnter={handleLoadUrl}
              />
              <Button type="primary" onClick={handleLoadUrl}>
                加载
              </Button>
            </Space.Compact>
          </Space>
        </Card>
      )}

      {isFullscreen && (
        <Button 
          type="primary"
          icon={<FullscreenExitOutlined />}
          onClick={toggleFullscreen}
          style={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 10000
          }}
        />
      )}

      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: deviceMode !== 'desktop' ? '#f0f0f0' : 'transparent'
      }}>
        <div style={{ 
          width: DEVICE_SIZES[deviceMode].width,
          height: '100%',
          boxShadow: deviceMode !== 'desktop' ? '0 0 20px rgba(0,0,0,0.1)' : 'none',
          backgroundColor: '#fff'
        }}>
          <DocumentPreviewEditor
            previewUrl={previewUrl}
            editMode={editMode}
            onDocumentEdit={handleDocumentEdit}
            onDocumentSave={handleDocumentSave}
          />
        </div>
      </div>
    </div>
  );
}
