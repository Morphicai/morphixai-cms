import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Button, Space, Modal, Spin, message } from 'antd';
import { SaveOutlined, SendOutlined, ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ArticleForm from '../components/ArticleForm';
import VersionPanel from '../components/VersionPanel';
import useArticleEditor from '../hooks/useArticleEditor';
import useNavigateBack from '../../../shared/hooks/useNavigateBack';
import './ArticleEditor.css';

const { Content, Sider } = Layout;

/**
 * ArticleEditor - 文章编辑器页面
 * 支持创建和编辑两种模式
 */
const ArticleEditor = () => {
  const { id } = useParams();
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const navigationConfirmedRef = useRef(false);

  // 从 URL 参数获取分类 ID
  const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const categoryIdFromUrl = searchParams.get('categoryId');

  // 使用通用返回 hook，兜底到文章列表页
  const navigateBack = useNavigateBack('/articles');

  const {
    article,
    loading,
    saving,
    isDirty,
    loadArticle,
    handleFieldChange,
    handleSaveDraft,
    handlePublish,
    handleVersionRevert,
    handleVersionPublish,
    validateForm
  } = useArticleEditor(id);

  const mode = id ? 'edit' : 'create';

  // 加载文章数据（编辑模式）
  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id, loadArticle]);

  // 设置默认分类（创建模式）- 只在组件挂载时执行一次
  useEffect(() => {
    if (!id && categoryIdFromUrl) {
      // 创建模式下，如果 URL 中有 categoryId，设置为默认值
      handleFieldChange('categoryId', Number(categoryIdFromUrl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 页面离开确认（浏览器刷新/关闭）
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // 返回上一页
  const handleBack = useCallback(() => {
    if (isDirty && !navigationConfirmedRef.current) {
      Modal.confirm({
        title: '确认离开',
        icon: <ExclamationCircleOutlined />,
        content: '您有未保存的更改，确定要离开吗？',
        okText: '离开',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          navigationConfirmedRef.current = true;
          navigateBack();
        }
      });
    } else {
      navigateBack();
    }
  }, [isDirty, navigateBack]);

  // 保存草稿
  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      message.error('请检查表单填写是否完整');
      return;
    }

    const success = await handleSaveDraft();
    if (success) {
      message.success('保存成功');
      if (mode === 'create') {
        // 创建成功后跳转到编辑模式，保留分类参数
        navigationConfirmedRef.current = true;
        const editUrl = categoryIdFromUrl
          ? `#/articles/edit/${success.id}?categoryId=${categoryIdFromUrl}`
          : `#/articles/edit/${success.id}`;
        window.location.href = editUrl;
      }
    }
  };

  // 发布文章
  const handlePublishClick = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      message.error('请检查表单填写是否完整');
      return;
    }

    Modal.confirm({
      title: '确认发布',
      content: '确定要发布这篇文章吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const success = await handlePublish();
        if (success) {
          message.success('发布成功');
          navigationConfirmedRef.current = true;
          navigateBack();
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout className="article-editor-layout">
      {/* 顶部标题栏 */}
      <div className="article-editor-header">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            返回
          </Button>
          <span className="article-editor-title">
            {mode === 'create' ? '创建文章' : '编辑文章'}
          </span>
        </Space>
      </div>

      <Layout className="article-editor-content">
        {/* 主编辑区 */}
        <Content className="article-editor-main">
          <ArticleForm
            article={article}
            mode={mode}
            onChange={handleFieldChange}
            readOnlyFields={categoryIdFromUrl ? ['categoryId'] : []}
          />
          
          {/* 底部操作按钮 */}
          <div className="article-editor-actions">
            <Space size="middle">
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={!isDirty}
                size="large"
              >
                保存草稿
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handlePublishClick}
                loading={saving}
                size="large"
              >
                立即发布
              </Button>
            </Space>
          </div>
        </Content>

        {/* 侧边栏 - 版本管理 */}
        {mode === 'edit' && (
          <Sider
            width={320}
            className="article-editor-sider"
            collapsible
            collapsed={!showVersionPanel}
            onCollapse={setShowVersionPanel}
            collapsedWidth={0}
            trigger={null}
          >
            <div className="version-panel-wrapper">
              <VersionPanel
                articleId={id}
                articleSlug={article?.slug}
                currentVersionId={article?.currentVersionId}
                publishedVersionId={article?.publishedVersionId}
                category={article?.category}
                onRevertSuccess={handleVersionRevert}
                onPublishSuccess={handleVersionPublish}
              />
            </div>
          </Sider>
        )}
      </Layout>

      {/* 版本面板切换按钮 */}
      {mode === 'edit' && (
        <Button
          className="version-panel-toggle"
          onClick={() => setShowVersionPanel(!showVersionPanel)}
        >
          {showVersionPanel ? '隐藏版本' : '显示版本'}
        </Button>
      )}
    </Layout>
  );
};

export default ArticleEditor;
