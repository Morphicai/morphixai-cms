import { useState, useCallback } from 'react';
import { message } from 'antd';
import ArticleService from '../../../services/ArticleService';
import VersionService from '../../../services/VersionService';

/**
 * useArticleEditor - 文章编辑器自定义Hook
 * 
 * @param {number} articleId - 文章ID（编辑模式）
 * @returns {Object} 编辑器状态和方法
 */
const useArticleEditor = (articleId) => {
  const [article, setArticle] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: null,
    slug: '',
    coverImages: [],
    sortWeight: 0,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    scheduledAt: null
  });

  const [, setOriginalArticle] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // 加载版本列表
  const loadVersions = useCallback(async () => {
    if (!articleId) return;

    try {
      const response = await VersionService.list(articleId);
      if (response.success && response.data) {
        setVersions(response.data.items || []);
      }
    } catch (error) {
      console.error('加载版本列表失败:', error);
    }
  }, [articleId]);

  // 加载文章数据
  const loadArticle = useCallback(async () => {
    if (!articleId) return;

    setLoading(true);
    try {
      const response = await ArticleService.getById(articleId);
      if (response.success && response.data) {
        const articleData = response.data;
        const formData = {
          title: articleData.currentVersion?.title || '',
          summary: articleData.currentVersion?.summary || '',
          content: articleData.currentVersion?.content || '',
          categoryId: articleData.categoryId,
          slug: articleData.slug || '',
          coverImages: articleData.currentVersion?.coverImages || [],
          sortWeight: articleData.currentVersion?.sortWeight || 0,
          seoTitle: articleData.currentVersion?.seoTitle || '',
          seoDescription: articleData.currentVersion?.seoDescription || '',
          seoKeywords: articleData.currentVersion?.seoKeywords || '',
          scheduledAt: articleData.scheduledAt,
          currentVersionId: articleData.currentVersionId,
          publishedVersionId: articleData.publishedVersionId,
          status: articleData.status
        };
        setArticle(formData);
        setOriginalArticle(formData);
        setIsDirty(false);

        // 加载版本列表
        await loadVersions();
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      message.error('加载文章失败');
    } finally {
      setLoading(false);
    }
  }, [articleId, loadVersions]);

  // 处理字段变更
  const handleFieldChange = useCallback((field, value) => {
    setArticle(prev => {
      const newArticle = { ...prev, [field]: value };
      return newArticle;
    });
    setIsDirty(true);
  }, []);

  // 表单验证
  const validateForm = useCallback(() => {
    const errors = {};

    // 必填字段验证
    if (!article.title || article.title.trim().length === 0) {
      errors.title = '请输入文章标题';
    }

    if (!article.content || article.content.trim().length === 0) {
      errors.content = '请输入文章内容';
    }

    if (!article.categoryId) {
      errors.categoryId = '请选择文章分类';
    }

    // 字段长度验证
    if (article.title && article.title.length > 200) {
      errors.title = '标题长度不能超过200个字符';
    }

    if (article.summary && article.summary.length > 500) {
      errors.summary = '摘要长度不能超过500个字符';
    }

    // Slug 格式验证
    if (article.slug) {
      const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!slugPattern.test(article.slug)) {
        errors.slug = 'URL 标识只能包含小写字母、数字和连字符，且不能以连字符开头或结尾';
      }
      if (article.slug.length > 200) {
        errors.slug = 'URL 标识长度不能超过200个字符';
      }
    }

    // 排序权重验证
    if (article.sortWeight < 0 || article.sortWeight > 999) {
      errors.sortWeight = '排序权重必须在0-999之间';
    }

    // 预定发布时间验证
    if (article.scheduledAt) {
      const scheduledTime = new Date(article.scheduledAt);
      const now = new Date();
      if (scheduledTime <= now) {
        errors.scheduledAt = '预定发布时间必须是未来时间';
      }
    }

    return errors;
  }, [article]);

  // 保存草稿
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        categoryId: Number(article.categoryId),
        slug: article.slug?.trim() || undefined,
        title: article.title,
        summary: article.summary?.trim() || undefined,
        content: article.content,
        coverImages: article.coverImages,
        sortWeight: article.sortWeight,
        seoTitle: article.seoTitle?.trim() || undefined,
        seoDescription: article.seoDescription?.trim() || undefined,
        seoKeywords: article.seoKeywords?.trim() || undefined
      };

      let response;
      if (articleId) {
        // 更新文章
        response = await ArticleService.update(articleId, payload);
      } else {
        // 创建文章
        response = await ArticleService.create(payload);
      }

      if (response.success) {
        setIsDirty(false);
        setOriginalArticle(article);
        
        // 如果是创建，重新加载版本列表
        if (articleId) {
          await loadVersions();
        }
        
        return response.data;
      } else {
        // 错误已经在 ArticleService 中通过 handleApiError 显示，这里不需要再次显示
        return null;
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
      return null;
    } finally {
      setSaving(false);
    }
  }, [article, articleId, loadVersions]);

  // 发布文章
  const handlePublish = useCallback(async () => {
    setSaving(true);
    try {
      let targetArticleId = articleId;

      // 如果是新建文章，先保存
      if (!articleId) {
        const savedArticle = await handleSaveDraft();
        if (!savedArticle) {
          setSaving(false);
          return null;
        }
        targetArticleId = savedArticle.id;
      } else {
        // 如果有未保存的更改，先保存（创建新版本）
        if (isDirty) {
          const saved = await handleSaveDraft();
          if (!saved) {
            setSaving(false);
            return null;
          }
        }
      }

      // 发布文章（将当前版本设为已发布版本）
      const response = await ArticleService.publish(targetArticleId);
      if (response.success) {
        setIsDirty(false);
        return response.data;
      } else {
        message.error(response.msg || '发布失败');
        return null;
      }
    } catch (error) {
      console.error('发布失败:', error);
      message.error('发布失败');
      return null;
    } finally {
      setSaving(false);
    }
  }, [articleId, isDirty, handleSaveDraft]);

  // 版本回退成功回调
  const handleVersionRevert = useCallback(async () => {
    // 版本回退成功后，重新加载文章数据
    await loadArticle();
  }, [loadArticle]);

  // 版本发布成功回调
  const handleVersionPublish = useCallback(async () => {
    // 版本发布成功后，重新加载文章数据
    await loadArticle();
  }, [loadArticle]);

  return {
    article,
    loading,
    saving,
    isDirty,
    versions,
    loadArticle,
    handleFieldChange,
    handleSaveDraft,
    handlePublish,
    handleVersionRevert,
    handleVersionPublish,
    validateForm
  };
};

export default useArticleEditor;
