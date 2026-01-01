import { useState, useCallback } from 'react';
import { message } from 'antd';
import VersionService from '../../../services/VersionService';
import { isSuccess } from '../../../utils/errorHandler';

/**
 * useVersions - 版本管理自定义Hook
 * 
 * @param {number} articleId - 文章ID
 * @returns {Object} 版本管理相关的状态和方法
 */
const useVersions = (articleId) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  /**
   * 加载版本列表
   */
  const fetchVersions = useCallback(async () => {
    if (!articleId) return;

    setLoading(true);
    try {
      const response = await VersionService.list(articleId, {}, { showError: false });
      
      if (isSuccess(response)) {
        setVersions(response.data.items || []);
      } else {
        message.error('获取版本列表失败');
      }
    } catch (error) {
      console.error('获取版本列表失败:', error);
      message.error('获取版本列表失败');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  /**
   * 预览版本
   * @param {number} versionId - 版本ID
   */
  const handlePreview = useCallback(async (versionId) => {
    if (!articleId || !versionId) return;

    setLoading(true);
    try {
      const response = await VersionService.getById(articleId, versionId, { showError: false });
      
      if (isSuccess(response)) {
        setPreviewVersion(response.data);
        setPreviewVisible(true);
      } else {
        message.error('获取版本详情失败');
      }
    } catch (error) {
      console.error('获取版本详情失败:', error);
      message.error('获取版本详情失败');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  /**
   * 关闭预览
   */
  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
    setPreviewVersion(null);
  }, []);

  /**
   * 回退到指定版本
   * @param {number} versionId - 版本ID
   * @param {Function} onSuccess - 成功回调
   */
  const handleRevert = useCallback(async (versionId, onSuccess) => {
    if (!articleId || !versionId) return;

    setLoading(true);
    try {
      const response = await VersionService.revert(articleId, versionId, { showError: false });
      
      if (isSuccess(response)) {
        message.success('版本回退成功');
        // 刷新版本列表
        await fetchVersions();
        // 调用成功回调（用于刷新编辑器内容）
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        message.error(response.msg || '版本回退失败');
      }
    } catch (error) {
      console.error('版本回退失败:', error);
      message.error('版本回退失败');
    } finally {
      setLoading(false);
    }
  }, [articleId, fetchVersions]);

  /**
   * 发布指定版本
   * @param {number} versionId - 版本ID
   * @param {Function} onSuccess - 成功回调
   */
  const handlePublish = useCallback(async (versionId, onSuccess) => {
    if (!articleId || !versionId) return;

    setLoading(true);
    try {
      const response = await VersionService.publish(articleId, versionId, { showError: false });
      
      if (isSuccess(response)) {
        message.success('版本发布成功');
        // 刷新版本列表
        await fetchVersions();
        // 调用成功回调（用于更新文章状态）
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        message.error(response.msg || '版本发布失败');
      }
    } catch (error) {
      console.error('版本发布失败:', error);
      message.error('版本发布失败');
    } finally {
      setLoading(false);
    }
  }, [articleId, fetchVersions]);

  return {
    versions,
    loading,
    previewVersion,
    previewVisible,
    fetchVersions,
    handlePreview,
    handleClosePreview,
    handleRevert,
    handlePublish
  };
};

export default useVersions;
