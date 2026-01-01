import { useEffect, useRef, useState } from 'react';
import DocumentEditModal from '../../pages/document/components/DocumentEditModal';
import './style.css';

/**
 * 文档预览编辑器组件
 * 用于在管理后台内嵌前台页面，并支持可视化编辑文档内容
 * 
 * 工作原理：
 * 1. iframe 加载完成后，通过 postMessage 发送 OPTIMUS_SET_EDIT_MODE 启用编辑模式
 * 2. 监听来自 iframe 的 OPTIMUS_EDIT_DOCUMENT 事件
 * 3. 打开编辑弹窗，保存后发送 OPTIMUS_DOCUMENT_UPDATED 通知 iframe 刷新
 * 
 * @param {string} previewUrl - 前台页面的 URL
 * @param {boolean} editMode - 是否启用编辑模式
 * @param {function} onDocumentEdit - 编辑事件回调（可选）
 * @param {function} onDocumentSave - 保存成功回调（可选）
 */
const DocumentPreviewEditor = ({ 
  previewUrl, 
  editMode = true,
  onDocumentEdit,
  onDocumentSave 
}) => {
  const iframeRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDocKey, setCurrentDocKey] = useState(null);
  const [editPayload, setEditPayload] = useState(null);

  useEffect(() => {
    console.log('🔄 [DocumentPreviewEditor] useEffect 触发', {
      editMode,
      previewUrl,
      hasOnDocumentEdit: !!onDocumentEdit
    });

    // 监听来自 iframe 的消息
    const handleMessage = async (event) => {
      // 生产环境需要验证 origin
      // const ALLOWED_ORIGINS = ['http://localhost:3101', 'https://yourdomain.com'];
      // if (!ALLOWED_ORIGINS.includes(event.origin)) return;

      // 处理页面准备就绪事件
      if (event.data?.type === 'OPTIMUS_PAGE_READY') {
        const { url, timestamp } = event.data.payload;
        console.log('✅ [DocumentPreviewEditor] 页面已准备就绪:', url, new Date(timestamp).toLocaleString());
        console.log('📤 [DocumentPreviewEditor] 发送编辑模式设置:', { enabled: editMode });
        
        // 页面准备好后，根据 editMode 启用/关闭编辑模式
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'OPTIMUS_SET_EDIT_MODE',
            payload: { enabled: editMode }
          }, '*');
          console.log(editMode ? '✅ [DocumentPreviewEditor] 已启用编辑模式' : '❌ [DocumentPreviewEditor] 已关闭编辑模式');
        }
        return;
      }

      // 处理编辑文档请求
      if (event.data?.type === 'OPTIMUS_EDIT_DOCUMENT') {
        const payload = event.data.payload;
        console.log('📝 [DocumentPreviewEditor] 收到编辑请求:', payload);

        // 保存原始 payload 信息
        setEditPayload(payload);

        // 触发外部回调
        if (onDocumentEdit) {
          onDocumentEdit(payload);
        }

        // 直接使用 docKey 打开弹窗，让弹窗自己加载数据
        setCurrentDocKey(payload.docKey);
        setModalVisible(true);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      console.log('🧹 [DocumentPreviewEditor] 清理 useEffect（不关闭编辑模式）');
      window.removeEventListener('message', handleMessage);
      // 注意：这里不关闭编辑模式，因为这个 cleanup 会在组件重新渲染时执行
      // 真正的卸载清理在下面的 useEffect 中处理
    };
  }, [onDocumentEdit, previewUrl, editMode]);

  // 组件卸载时关闭编辑模式（只在真正卸载时执行）
  useEffect(() => {
    const iframe = iframeRef.current;
    return () => {
      console.log('🧹 [DocumentPreviewEditor] 组件真正卸载，关闭编辑模式');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'OPTIMUS_SET_EDIT_MODE',
          payload: { enabled: false }
        }, '*');
      }
    };
  }, []); // 空依赖数组，只在组件卸载时执行

  // 监听 editMode 变化，动态切换编辑模式
  useEffect(() => {
    console.log('🔄 [DocumentPreviewEditor] editMode 变化触发', { editMode });
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      console.log('📤 [DocumentPreviewEditor] 发送编辑模式切换消息:', { enabled: editMode });
      iframe.contentWindow.postMessage({
        type: 'OPTIMUS_SET_EDIT_MODE',
        payload: { enabled: editMode }
      }, '*');
      console.log(editMode ? '✅ [DocumentPreviewEditor] 已启用编辑模式' : '❌ [DocumentPreviewEditor] 已关闭编辑模式');
    } else {
      console.warn('⚠️ [DocumentPreviewEditor] iframe 不可用', {
        hasIframe: !!iframe,
        hasContentWindow: iframe?.contentWindow
      });
    }
  }, [editMode]);

  // 处理保存成功
  const handleSave = (values) => {
    console.log('✅ [DocumentPreviewEditor] 保存成功:', values);

    // 通知 iframe 刷新
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'OPTIMUS_DOCUMENT_UPDATED',
        payload: {
          docKey: values.docKey || currentDocKey,
        },
      }, '*');
    }

    // 触发外部回调
    if (onDocumentSave) {
      onDocumentSave(values, editPayload);
    }

    // 关闭弹窗
    setModalVisible(false);
    setCurrentDocKey(null);
    setEditPayload(null);
  };

  // 处理取消
  const handleCancel = () => {
    console.log('❌ [DocumentPreviewEditor] 取消编辑');
    setModalVisible(false);
    setCurrentDocKey(null);
    setEditPayload(null);
  };

  return (
    <div className="document-preview-editor">
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="preview-iframe"
        title="文档预览"
      />

      <DocumentEditModal
        open={modalVisible}
        docKey={currentDocKey}
        onOk={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default DocumentPreviewEditor;
