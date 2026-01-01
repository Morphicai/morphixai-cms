import React from 'react';
import { Modal, Descriptions, Tag, Space, theme } from 'antd';
import QuillEditor from './QuillEditor';
import dayjs from 'dayjs';
import OssImage from '../../../shared/components/OssImage';

/**
 * VersionPreview - 版本预览组件
 * 
 * @param {Object} props
 * @param {boolean} props.visible - 是否显示模态框
 * @param {Object} props.version - 版本数据
 * @param {string} props.articleSlug - 文章 slug
 * @param {Function} props.onClose - 关闭回调
 */
const VersionPreview = ({ visible, version, articleSlug, onClose }) => {
  const { token } = theme.useToken();
  
  if (!version) return null;

  // 状态标签映射
  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    published: { text: '已发布', color: 'success' },
    archived: { text: '已归档', color: 'warning' }
  };

  const statusConfig = statusMap[version.status] || { text: version.status, color: 'default' };

  return (
    <Modal
      title={`版本预览 - V${version.versionNumber}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 版本基本信息 */}
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="版本号">
            V{version.versionNumber}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            {version.isCurrent && <Tag color="blue">当前版本</Tag>}
          </Descriptions.Item>
          {articleSlug && (
            <Descriptions.Item label="URL 标识" span={2}>
              <code style={{ 
                padding: '2px 8px', 
                backgroundColor: token.colorBgLayout,
                borderRadius: '3px',
                fontSize: '13px',
                color: token.colorPrimary
              }}>
                {articleSlug}
              </code>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="创建时间" span={2}>
            {dayjs(version.createDate).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="排序权重">
            {version.sortWeight}
          </Descriptions.Item>
          <Descriptions.Item label="创建者">
            {version.userId || '-'}
          </Descriptions.Item>
        </Descriptions>

        {/* 文章标题 */}
        <div>
          <div style={{ 
            fontSize: 12, 
            opacity: 0.65,
            marginBottom: 8,
            fontWeight: 500 
          }}>
            标题
          </div>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 600,
            lineHeight: 1.4
          }}>
            {version.title}
          </div>
        </div>

        {/* 文章摘要 */}
        <div>
          <div style={{ 
            fontSize: 12, 
            opacity: 0.65,
            marginBottom: 8,
            fontWeight: 500 
          }}>
            摘要
          </div>
          <div style={{ 
            fontSize: 14,
            lineHeight: 1.6,
            padding: '12px',
            backgroundColor: token.colorBgLayout,
            borderRadius: '4px'
          }}>
            {version.summary}
          </div>
        </div>

        {/* 封面图片 */}
        {version.coverImages && version.coverImages.length > 0 && (
          <div>
            <div style={{ 
              fontSize: 12, 
              opacity: 0.65,
              marginBottom: 8,
              fontWeight: 500 
            }}>
              封面图片
            </div>
            <Space size="middle" wrap>
              {version.coverImages.map((url, index) => (
                <OssImage
                  key={index}
                  src={url}
                  alt={`封面${index + 1}`}
                  width={150}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              ))}
            </Space>
          </div>
        )}

        {/* SEO信息 */}
        {(version.seoTitle || version.seoDescription || version.seoKeywords) && (
          <div>
            <div style={{ 
              fontSize: 12, 
              opacity: 0.65,
              marginBottom: 8,
              fontWeight: 500 
            }}>
              SEO信息
            </div>
            <Descriptions column={1} bordered size="small">
              {version.seoTitle && (
                <Descriptions.Item label="SEO标题">
                  {version.seoTitle}
                </Descriptions.Item>
              )}
              {version.seoDescription && (
                <Descriptions.Item label="SEO描述">
                  {version.seoDescription}
                </Descriptions.Item>
              )}
              {version.seoKeywords && (
                <Descriptions.Item label="SEO关键词">
                  {version.seoKeywords}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}

        {/* 文章内容 */}
        <div>
          <div style={{ 
            fontSize: 12, 
            opacity: 0.65,
            marginBottom: 8,
            fontWeight: 500 
          }}>
            内容
          </div>
          <div style={{ 
            border: `1px solid ${token.colorBorder}`,
            borderRadius: '4px',
            padding: '12px',
            backgroundColor: token.colorBgContainer
          }}>
            <QuillEditor
              value={version.content}
              readOnly={true}
              height={300}
            />
          </div>
        </div>
      </Space>
    </Modal>
  );
};

export default VersionPreview;
