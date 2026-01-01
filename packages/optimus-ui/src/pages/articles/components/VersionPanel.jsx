import { useState, useEffect, useCallback } from 'react';
import { Card, List, Button, Tag, Space, Modal, message, Spin } from 'antd';
import { HistoryOutlined, CheckOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import VersionService from '../../../services/VersionService';
import ArticleService from '../../../services/ArticleService';
import VersionPreview from './VersionPreview';

/**
 * VersionPanel - 版本管理面板
 * 
 * @param {Object} props
 * @param {number} props.articleId - 文章ID
 * @param {string} props.articleSlug - 文章 slug
 * @param {number} props.currentVersionId - 当前版本ID
 * @param {number} props.publishedVersionId - 已发布版本ID
 * @param {Object} props.category - 分类信息
 * @param {Function} props.onRevertSuccess - 回退成功回调
 * @param {Function} props.onPublishSuccess - 发布成功回调
 */
const VersionPanel = ({
  articleId,
  articleSlug,
  currentVersionId,
  publishedVersionId,
  category,
  onRevertSuccess,
  onPublishSuccess
}) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);

  // 加载版本列表
  const loadVersions = useCallback(async () => {
    if (!articleId) return;

    setLoading(true);
    try {
      const response = await VersionService.list(articleId);
      if (response.success && response.data) {
        // 后端返回的是数组，不是 { items: [] } 结构
        const versionList = Array.isArray(response.data) ? response.data : [];
        setVersions(versionList);
      }
    } catch (error) {
      console.error('加载版本列表失败:', error);
      message.error('加载版本列表失败');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // 回退到指定版本
  const handleRevert = (versionId) => {
    Modal.confirm({
      title: '确认回退',
      content: '确定要回退到此版本吗？这将创建一个新版本。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await VersionService.revert(articleId, versionId);
          if (response.success) {
            message.success('回退成功');
            await loadVersions();
            if (onRevertSuccess) {
              onRevertSuccess();
            }
          } else {
            message.error(response.msg || '回退失败');
          }
        } catch (error) {
          console.error('回退失败:', error);
          message.error('回退失败');
        }
      }
    });
  };

  // 发布指定版本
  const handlePublish = (versionId) => {
    Modal.confirm({
      title: '确认发布',
      content: '确定要发布此版本吗？这将把该版本设为当前版本并发布。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 先将版本设为当前版本
          const setCurrentResponse = await VersionService.setCurrent(articleId, versionId);
          if (!setCurrentResponse.success) {
            message.error(setCurrentResponse.msg || '设置当前版本失败');
            return;
          }

          // 然后发布文章（发布当前版本）
          const publishResponse = await ArticleService.publish(articleId);
          if (publishResponse.success) {
            message.success('发布成功');
            await loadVersions();
            if (onPublishSuccess) {
              onPublishSuccess();
            }
          } else {
            message.error(publishResponse.msg || '发布失败');
          }
        } catch (error) {
          console.error('发布失败:', error);
          message.error('发布失败');
        }
      }
    });
  };

  // 预览版本
  const handlePreview = (version) => {
    setPreviewVersion(version);
  };

  // 关闭预览
  const handleClosePreview = () => {
    setPreviewVersion(null);
  };

  // 获取版本状态标签
  const getVersionTag = (version) => {
    const tags = [];

    if (version.id === currentVersionId) {
      tags.push(<Tag color="blue" key="current">当前版本</Tag>);
    }

    if (version.id === publishedVersionId) {
      tags.push(<Tag color="green" key="published">已发布</Tag>);
    }

    if (version.status === 'draft') {
      tags.push(<Tag key="draft">草稿</Tag>);
    }

    return tags;
  };

  return (
    <>
      <Card
        title={
          <Space>
            <HistoryOutlined />
            版本历史
          </Space>
        }
        className="version-panel"
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={versions}
            renderItem={(version) => (
              <List.Item
                key={version.id}
                actions={[
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handlePreview(version)}
                  >
                    预览
                  </Button>,
                  version.id !== currentVersionId && (
                    <Button
                      type="link"
                      size="small"
                      icon={<RollbackOutlined />}
                      onClick={() => handleRevert(version.id)}
                    >
                      回退
                    </Button>
                  ),
                  version.id !== publishedVersionId && (
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handlePublish(version.id)}
                    >
                      发布
                    </Button>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>版本 {version.versionNumber}</span>
                      {getVersionTag(version)}
                    </Space>
                  }
                  description={
                    <div>
                      <div>{version.title}</div>
                      <div style={{ fontSize: '12px', opacity: 0.65 }}>
                        {dayjs(version.createDate).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}

        {category?.config?.maxVersions && (
          <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.65 }}>
            最多保留 {category.config.maxVersions} 个版本
          </div>
        )}
      </Card>

      {/* 版本预览弹窗 */}
      {previewVersion && (
        <VersionPreview
          version={previewVersion}
          articleSlug={articleSlug}
          open={!!previewVersion}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
};

export default VersionPanel;
